import {
  isFirebaseConfigured,
  rtdb,
  ref,
  set,
  get,
  child,
  onValue,
  onDisconnect,
  remove,
  rtdbServerTimestamp
} from './firebase';
import type {
  GameRoom,
  GameId,
  UserProfile,
  UserPresence,
  BattleInvite,
  FriendRequest,
  FriendRecord,
  GameSettings,
  RoomCreationOptions
} from '../types';

export const DEFAULT_SETTINGS: GameSettings = {
  multipliers: {
    '1a2b': 1,
    'battleship': 1.2,
    'bingo': 1,
    'dots': 1,
    'ooxx': 1
  }
};

const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('duo_arena_sync_channel')
  : null;

class MatchService {
  private localRooms: Map<string, GameRoom> = new Map();
  private localPresence: Map<string, UserPresence> = new Map();
  private localInvites: Map<string, BattleInvite> = new Map();
  private roomListeners: Map<string, Set<(room: GameRoom) => void>> = new Map();
  private presenceListeners: Set<(presences: UserPresence[]) => void> = new Set();
  private allRoomsListeners: Set<(rooms: GameRoom[]) => void> = new Set();
  private inviteListeners: Map<string, Set<(invite: BattleInvite) => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedRooms = localStorage.getItem('duo_local_rooms');
        if (savedRooms) {
          const list: GameRoom[] = JSON.parse(savedRooms);
          list.forEach(r => this.localRooms.set(r.id, r));
        }
      } catch {}

      if (syncChannel) {
        syncChannel.onmessage = (event) => {
          const { type, payload } = event.data;
          if (type === 'ROOM_UPDATE') {
            const room = payload as GameRoom;
            this.localRooms.set(room.id, room);
            this.notifyRoomListeners(room);
            this.notifyAllRoomsListeners();
          } else if (type === 'PRESENCE_UPDATE') {
            const presence = payload as UserPresence;
            this.localPresence.set(presence.uid, presence);
            this.notifyPresenceListeners();
          } else if (type === 'INVITE_SEND') {
            const invite = payload as BattleInvite;
            this.localInvites.set(invite.id, invite);
            this.notifyInviteListeners(invite);
          }
        };
      }

      // Establish permanent zero-latency WebSocket stream from RTDB on startup
      if (rtdb) {
        try {
          const presencesRef = ref(rtdb, 'presence');
          onValue(presencesRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
              const freshUids = new Set(Object.keys(val));
              for (const uid of Array.from(this.localPresence.keys())) {
                if (!freshUids.has(uid)) {
                  this.localPresence.delete(uid);
                }
              }
              const list: UserPresence[] = Object.values(val);
              list.forEach((p) => this.localPresence.set(p.uid, p));
              this.notifyPresenceListeners();
            } else {
              this.localPresence.clear();
              this.notifyPresenceListeners();
            }
          });
        } catch (e) {
          console.warn('Permanent presence stream init error:', e);
        }


      }
    }
  }

  private saveLocalRoomsTimeout: any = null;
  private saveLocalRooms() {
    if (this.saveLocalRoomsTimeout) clearTimeout(this.saveLocalRoomsTimeout);
    this.saveLocalRoomsTimeout = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            'duo_local_rooms',
            JSON.stringify(Array.from(this.localRooms.values()))
          );
        } catch {}
      }
    }, 400);
  }

  // --- PRESENCE SYSTEM (Realtime Database) ---
  public updatePresence(presence: UserPresence) {
    let safePhotoURL = presence.photoURL;
    if (safePhotoURL && (safePhotoURL.startsWith('data:') || safePhotoURL.length > 500)) {
      safePhotoURL = `https://api.dicebear.com/7.x/bottts/svg?seed=${presence.uid}`;
    }
    const safePresence: UserPresence = { ...presence, photoURL: safePhotoURL };
    this.localPresence.set(safePresence.uid, safePresence);
    this.notifyPresenceListeners();

    if (syncChannel) {
      syncChannel.postMessage({ type: 'PRESENCE_UPDATE', payload: safePresence });
    }

    if (rtdb) {
      try {
        const presenceRef = ref(rtdb, `presence/${safePresence.uid}`);
        const cleaned = this.cleanForRTDB({
          ...safePresence,
          lastActive: Date.now()
        });
        set(presenceRef, cleaned).catch(console.warn);

        const disconnectRef = onDisconnect(presenceRef);
        disconnectRef.set(this.cleanForRTDB({
          ...safePresence,
          status: 'offline',
          lastActive: Date.now(),
          currentRoomId: null,
          currentRoomCode: null,
          currentGameId: null,
          currentGameName: null
        })).catch(console.warn);
      } catch (err) {
        console.warn('Presence sync error:', err);
      }
    }
  }

  public subscribePresence(callback: (presences: UserPresence[]) => void): () => void {
    this.presenceListeners.add(callback);
    callback(Array.from(this.localPresence.values()));

    return () => {
      this.presenceListeners.delete(callback);
    };
  }

  public subscribeAllRooms(callback: (rooms: GameRoom[]) => void): () => void {
    this.allRoomsListeners.add(callback);
    callback(Array.from(this.localRooms.values()));

    let unsubRtdb: (() => void) | null = null;
    if (rtdb) {
      try {
        const roomsRef = ref(rtdb, 'rooms');
        unsubRtdb = onValue(
          roomsRef,
          (snapshot) => {
            const val = snapshot.val();
            if (val && typeof val === 'object') {
              const remoteIds = new Set(Object.keys(val));
              Object.entries(val).forEach(([id, rData]: [string, any]) => {
                if (rData && typeof rData === 'object') {
                  const norm = this.normalizeRoom({ ...rData, id });
                  this.localRooms.set(id, norm);
                }
              });
              // Prune rooms that were permanently removed from RTDB
              for (const localId of Array.from(this.localRooms.keys())) {
                if (!remoteIds.has(localId)) {
                  this.localRooms.delete(localId);
                }
              }
            } else {
              this.localRooms.clear();
            }
            this.notifyAllRoomsListeners();
          },
          (error) => {
            console.warn('subscribeAllRooms RTDB error:', error);
          }
        );
      } catch (err) {
        console.warn('subscribeAllRooms error:', err);
      }
    }

    return () => {
      this.allRoomsListeners.delete(callback);
      if (unsubRtdb) unsubRtdb();
    };
  }

  public async fetchAllRoomsFromRTDB(): Promise<GameRoom[]> {
    if (rtdb) {
      try {
        const snap = await get(child(ref(rtdb), 'rooms'));
        const val = snap.val();
        if (val && typeof val === 'object') {
          Object.entries(val).forEach(([id, rData]: [string, any]) => {
            if (rData && typeof rData === 'object') {
              const norm = this.normalizeRoom({ ...rData, id });
              this.localRooms.set(id, norm);
            }
          });
          this.notifyAllRoomsListeners();
        }
      } catch (err) {
        console.warn('fetchAllRoomsFromRTDB error:', err);
      }
    }
    return Array.from(this.localRooms.values());
  }

  private notifyAllRoomsListeners() {
    const list = Array.from(this.localRooms.values());
    this.allRoomsListeners.forEach(cb => cb(list));
  }

  private notifyPresenceListeners() {
    const list = Array.from(this.localPresence.values());
    this.presenceListeners.forEach(cb => cb(list));
  }

  // --- BATTLE INVITES ---
  public sendBattleInvite(invite: BattleInvite) {
    this.localInvites.set(invite.id, invite);
    this.notifyInviteListeners(invite);

    if (syncChannel) {
      syncChannel.postMessage({ type: 'INVITE_SEND', payload: invite });
    }

    if (rtdb) {
      try {
        set(ref(rtdb, `invites/${invite.toUid}/${invite.id}`), invite);
      } catch (e) {
        console.warn('RTDB invite error:', e);
      }
    }
  }

  public async respondBattleInvite(
    toUid: string,
    inviteId: string,
    _response: 'accepted' | 'declined' | 'expired'
  ) {
    this.localInvites.delete(inviteId);
    if (rtdb) {
      try {
        // Permanently clear from RTDB so it never pops up again
        await set(ref(rtdb, `invites/${toUid}/${inviteId}`), null);
      } catch (e) {
        console.warn('RTDB respondBattleInvite error:', e);
      }
    }
  }

  public async clearAllInvites(myUid: string) {
    if (rtdb) {
      try {
        await set(ref(rtdb, `invites/${myUid}`), null);
      } catch (e) {
        console.warn('RTDB clearAllInvites error:', e);
      }
    }
  }

  public subscribeInvites(myUid: string, callback: (invite: BattleInvite) => void): () => void {
    if (!this.inviteListeners.has(myUid)) {
      this.inviteListeners.set(myUid, new Set());
    }
    this.inviteListeners.get(myUid)!.add(callback);

    let unsubRtdb: (() => void) | null = null;
    const INVITE_TTL_MS = 45 * 1000; // Battle invites expire after 45 seconds

    if (rtdb) {
      try {
        const userInvitesRef = ref(rtdb, `invites/${myUid}`);
        const unsub = onValue(userInvitesRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
            Object.values(val).forEach((inv: any) => {
              if (inv && inv.id) {
                const age = Date.now() - (inv.createdAt || 0);
                if (inv.status !== 'pending' || age > INVITE_TTL_MS) {
                  // Silently purge expired or non-pending stale invite from RTDB
                  set(ref(rtdb!, `invites/${myUid}/${inv.id}`), null).catch(() => {});
                } else {
                  callback(inv);
                }
              }
            });
          }
        });
        unsubRtdb = () => unsub();
      } catch (e) {
        console.warn('Subscribe invite error:', e);
      }
    }

    return () => {
      this.inviteListeners.get(myUid)?.delete(callback);
      if (unsubRtdb) unsubRtdb();
    };
  }

  private notifyInviteListeners(invite: BattleInvite) {
    const listeners = this.inviteListeners.get(invite.toUid);
    if (listeners) {
      listeners.forEach(cb => cb(invite));
    }
  }

  // --- ROOM MANAGEMENT (Instantaneous RTDB) ---
  public async createRoom(
    hostUser: UserProfile,
    gameId: GameId,
    multiplier: number = 1,
    options?: RoomCreationOptions
  ): Promise<GameRoom> {
    const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const hostPlayer = {
      uid: hostUser.uid,
      displayName: hostUser.displayName,
      photoURL: hostUser.photoURL,
      ready: false
    };

    const newRoom: GameRoom = {
      id: roomId,
      code,
      gameId,
      hostUid: hostUser.uid,
      status: 'waiting',
      player1: hostPlayer,
      players: [hostPlayer],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      multiplier,
      maxPlayers: options?.maxPlayers || 2
    };

    this.initGameState(newRoom, options);
    const normalized = this.normalizeRoom(newRoom);

    // 1. Immediately store in local memory for instant zero-latency UI transition
    this.localRooms.set(roomId, normalized);
    this.saveLocalRooms();
    this.broadcastRoom(normalized);

    // 2. Non-blocking parallel write to Firebase RTDB in background (0ms UI lag!)
    if (rtdb) {
      Promise.all([
        set(ref(rtdb, `rooms/${roomId}`), this.cleanForRTDB(normalized)),
        set(ref(rtdb, `room_codes/${newRoom.code}`), roomId)
      ]).catch((err) => console.warn('RTDB createRoom error:', err));
    }

    return normalized;
  }

  public async joinRoomByCode(code: string, user: UserProfile): Promise<GameRoom | null> {
    const cleanCode = code.trim();

    // 1. Instant check in local memory first (0ms if already known)
    for (const room of this.localRooms.values()) {
      if (String(room.code).trim() === cleanCode && room.status !== 'closed') {
        return this.joinRoom(room.id, user);
      }
    }

    // 2. Direct fast O(1) index lookup in RTDB
    if (rtdb) {
      try {
        const codeSnap = await get(child(ref(rtdb), `room_codes/${cleanCode}`));
        if (codeSnap.exists()) {
          const targetRoomId = codeSnap.val();
          if (targetRoomId) {
            return this.joinRoom(targetRoomId, user);
          }
        }
      } catch (err) {
        console.warn('RTDB direct code lookup error:', err);
      }
    }

    return null;
  }

  public async joinRoom(roomId: string, user: UserProfile): Promise<GameRoom | null> {
    let room: GameRoom | null = null;

    // 1. Always query real-time server first to ensure fresh state
    if (rtdb) {
      try {
        const snap = await get(child(ref(rtdb), `rooms/${roomId}`));
        if (snap.exists()) {
          room = this.normalizeRoom(snap.val() as GameRoom);
          this.localRooms.set(roomId, room);
        }
      } catch (e) {
        console.warn('RTDB joinRoom error:', e);
      }
    }

    if (!room) {
      room = this.localRooms.get(roomId) || null;
    }

    if (!room || room.status === 'closed') return null;

    let players: any[] = Array.isArray(room.players)
      ? [...room.players]
      : room.players
      ? Object.values(room.players)
      : [];
    if (players.length === 0) {
      if (room.player1) players.push(room.player1);
      if (room.player2) players.push(room.player2);
    }

    // If already in this room, re-enter seamlessly
    const existingPlayer = players.find((p) => p.uid === user.uid);
    if (existingPlayer) {
      return this.normalizeRoom(room);
    }

    const maxLimit = room.maxPlayers || 2;
    // Join as player if slots remain
    if (players.length < maxLimit) {
      const newPlayer = {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ready: false
      };
      players.push(newPlayer);
      room.players = players;
      room.player1 = players[0];
      room.player2 = players[1];

      // Auto start if room reached maximum players or for standard 2-player duel
      if (players.length >= maxLimit) {
        room.status = 'in_progress';
      } else {
        // Keep waiting for more players
        room.status = 'waiting';
      }
      room.updatedAt = Date.now();

      const normalized = this.normalizeRoom(room);
      this.updateRoom(normalized); // Non-blocking write to avoid UI freeze
      return normalized;
    }

    // Room is full, enter as spectator
    return this.normalizeRoom(room);
  }

  public async getRoom(roomId: string): Promise<GameRoom | null> {
    if (this.localRooms.has(roomId)) {
      return this.normalizeRoom(this.localRooms.get(roomId)!);
    }
    if (rtdb) {
      try {
        const snap = await get(child(ref(rtdb), `rooms/${roomId}`));
        if (snap.exists()) {
          const norm = this.normalizeRoom(snap.val());
          this.localRooms.set(roomId, norm);
          return norm;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    return null;
  }

  public async updateRoom(room: GameRoom) {
    const normalized = this.normalizeRoom(room);
    normalized.updatedAt = Date.now();
    this.localRooms.set(normalized.id, normalized);
    this.saveLocalRooms();
    this.broadcastRoom(normalized);

    if (rtdb) {
      try {
        const payload = this.cleanForRTDB(normalized);
        if (payload?.gameId === 'ooxx' && payload?.stateOOXX) {
          const rawGrid = payload.stateOOXX.grid;
          if (rawGrid && typeof rawGrid === 'object') {
            const safeGrid = [
              ['', '', ''],
              ['', '', ''],
              ['', '', '']
            ];
            for (let r = 0; r < 3; r++) {
              const row = (rawGrid as any)[r];
              if (row && typeof row === 'object') {
                for (let c = 0; c < 3; c++) {
                  const cell = (row as any)[c];
                  if (cell && typeof cell === 'string' && cell.trim() !== '') {
                    safeGrid[r][c] = cell;
                  }
                }
              }
            }
            payload.stateOOXX.grid = safeGrid;
          }
        }
        set(ref(rtdb, `rooms/${normalized.id}`), payload).catch(console.warn);
      } catch (err) {
        console.warn('RTDB update room error:', err);
      }
    }
  }

  public subscribeRoom(roomId: string, callback: (room: GameRoom) => void): () => void {
    if (!this.roomListeners.has(roomId)) {
      this.roomListeners.set(roomId, new Set());
    }
    this.roomListeners.get(roomId)!.add(callback);

    const existing = this.localRooms.get(roomId);
    if (existing) callback(this.normalizeRoom(existing));

    let unsubRtdb: (() => void) | null = null;
    if (rtdb) {
      try {
        const roomRef = ref(rtdb, `rooms/${roomId}`);
        const unsub = onValue(roomRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
            const norm = this.normalizeRoom(val);
            this.localRooms.set(roomId, norm);
            callback(norm);
          } else {
            // Room was removed or closed in RTDB!
            this.localRooms.delete(roomId);
            callback({ id: roomId, status: 'closed' } as any);
          }
        });
        unsubRtdb = () => unsub();
      } catch (err) {
        console.warn('RTDB subscribe room error:', err);
      }
    }

    return () => {
      this.roomListeners.get(roomId)?.delete(callback);
      if (unsubRtdb) unsubRtdb();
    };
  }

  public async deleteRoom(roomId: string): Promise<void> {
    const r = this.localRooms.get(roomId);
    this.localRooms.delete(roomId);
    this.saveLocalRooms();
    if (rtdb) {
      try {
        if (r?.code) {
          await remove(ref(rtdb, `room_codes/${r.code}`));
        }
        await remove(ref(rtdb, `rooms/${roomId}`));
      } catch (err) {
        console.warn('RTDB delete room error:', err);
      }
    }
  }

  public async forceCloseRoom(roomId: string): Promise<void> {
    const r = this.localRooms.get(roomId);
    if (r) {
      r.status = 'closed';
      r.updatedAt = Date.now();
      this.localRooms.set(roomId, r);
      this.broadcastRoom(r);
    }
    if (rtdb) {
      try {
        await set(ref(rtdb, `rooms/${roomId}/status`), 'closed');
        if (r?.code) {
          await remove(ref(rtdb, `room_codes/${r.code}`));
        }
        // Give subscribers time to receive 'closed' status and kick players back to lobby
        setTimeout(() => {
          remove(ref(rtdb, `rooms/${roomId}`)).catch(console.warn);
        }, 1200);
      } catch (e) {
        console.warn('forceCloseRoom error:', e);
      }
    }
  }

  private broadcastRoom(room: GameRoom) {
    this.notifyRoomListeners(room);
    if (syncChannel) {
      syncChannel.postMessage({ type: 'ROOM_UPDATE', payload: room });
    }
  }

  private notifyRoomListeners(room: GameRoom) {
    const listeners = this.roomListeners.get(room.id);
    if (listeners) {
      listeners.forEach(cb => cb(room));
    }
  }

  // --- CLEAN DATA FOR RTDB (strips undefined and huge payloads to prevent lag) ---
  private cleanForRTDB(data: any): any {
    if (data === undefined) return null;
    if (data === null || typeof data !== 'object') {
      if (typeof data === 'string' && (data.startsWith('data:') || data.length > 1000)) {
        return null;
      }
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.cleanForRTDB(item));
    }
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        if (key === 'photoURL' && typeof val === 'string') {
          if (val.startsWith('data:')) {
            clean[key] = `https://api.dicebear.com/7.x/bottts/svg?seed=${data.uid || 'player'}`;
          } else if (val.length > 2000) {
            clean[key] = `https://api.dicebear.com/7.x/bottts/svg?seed=${data.uid || 'player'}`;
          } else {
            clean[key] = val;
          }
        } else {
          clean[key] = this.cleanForRTDB(val);
        }
      }
    }
    return clean;
  }

  // --- NORMALIZE ROOM STATE (Guarantees no missing arrays or objects after RTDB) ---
  public normalizeRoom(raw: any): GameRoom {
    if (!raw) return raw;
    const room: GameRoom = { ...raw };

    let rawPlayers = room.players;
    let players: any[] = Array.isArray(rawPlayers)
      ? [...rawPlayers]
      : rawPlayers
      ? Object.values(rawPlayers)
      : [];

    // Guarantee that both player1 and player2 are always in players array
    if (room.player1 && !players.some((p: any) => p.uid === room.player1.uid)) {
      players.unshift(room.player1);
    }
    if (room.player2 && !players.some((p: any) => p.uid === room.player2.uid)) {
      players.push(room.player2);
    }

    if (players.length === 0 && room.hostUid) {
      players.push({
        uid: room.hostUid,
        displayName: '玩家1',
        photoURL: '',
        ready: false
      });
    }

    room.players = players;
    if (players[0]) room.player1 = players[0];
    if (players[1]) room.player2 = players[1];

    if (!room.player1) {
      room.player1 = {
        uid: room.hostUid || '',
        displayName: '玩家1',
        photoURL: '',
        ready: false
      };
    }
    room.maxPlayers = room.maxPlayers || 2;

    if (room.gameId === '1a2b') {
      const rawGuesses = room.state1a2b?.guesses;
      room.state1a2b = {
        secrets: room.state1a2b?.secrets || {},
        lockedIn: room.state1a2b?.lockedIn || {},
        guesses: Array.isArray(rawGuesses)
          ? rawGuesses
          : rawGuesses
          ? Object.values(rawGuesses)
          : [],
        currentTurnUid: room.state1a2b?.currentTurnUid || room.hostUid,
        turnDeadline: room.state1a2b?.turnDeadline || Date.now() + 30000,
        hintsUsed: room.state1a2b?.hintsUsed || {},
        hintEnabled: room.state1a2b?.hintEnabled !== undefined ? Boolean(room.state1a2b?.hintEnabled) : true,
        hintRound: room.state1a2b?.hintRound || 5,
        maxRounds: room.state1a2b?.maxRounds || 0,
        targetSecret: room.state1a2b?.targetSecret
      };
    } else if (room.gameId === 'battleship') {
      const rawBoards = room.stateBattleship?.boards || {};
      const normalizedBoards: Record<string, any> = {};
      Object.keys(rawBoards).forEach((uid) => {
        const b = rawBoards[uid];
        normalizedBoards[uid] = {
          ships: Array.isArray(b?.ships) ? b.ships : b?.ships ? Object.values(b.ships) : [],
          placed: Boolean(b?.placed),
          attacksReceived: Array.isArray(b?.attacksReceived)
            ? b.attacksReceived
            : b?.attacksReceived
            ? Object.values(b.attacksReceived)
            : []
        };
      });
      room.stateBattleship = {
        boards: normalizedBoards,
        currentTurnUid: room.stateBattleship?.currentTurnUid || room.hostUid,
        gridSize: room.stateBattleship?.gridSize || 8,
        lastAttack: room.stateBattleship?.lastAttack
      };
    } else if (room.gameId === 'bingo') {
      const rawBoards = room.stateBingo?.boards || {};
      const normalizedBoards: Record<string, number[][]> = {};
      Object.keys(rawBoards).forEach((uid) => {
        const b = rawBoards[uid];
        normalizedBoards[uid] = Array.isArray(b)
          ? b.map((row: any) => (Array.isArray(row) ? row : Object.values(row)))
          : [];
      });
      const rawCalled = room.stateBingo?.calledNumbers;
      room.stateBingo = {
        boards: normalizedBoards,
        ready: room.stateBingo?.ready || {},
        calledNumbers: Array.isArray(rawCalled)
          ? rawCalled
          : rawCalled
          ? Object.values(rawCalled)
          : [],
        currentTurnUid: room.stateBingo?.currentTurnUid || room.hostUid,
        linesCompleted: room.stateBingo?.linesCompleted || {},
        targetLines: room.stateBingo?.targetLines || 5
      };
    } else if (room.gameId === 'dots') {
      room.stateDots = {
        lines: room.stateDots?.lines || {},
        boxes: room.stateDots?.boxes || {},
        currentTurnUid: room.stateDots?.currentTurnUid || room.hostUid,
        scores: room.stateDots?.scores || { [room.hostUid]: 0 },
        lastBonusTurn: Boolean(room.stateDots?.lastBonusTurn),
        gridSize: room.stateDots?.gridSize || 4
      };
    } else if (room.gameId === 'ooxx') {
      const normalizedGrid: (string | null)[][] = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ];
      const rawGrid = room.stateOOXX?.grid;
      if (rawGrid && typeof rawGrid === 'object') {
        for (let r = 0; r < 3; r++) {
          const row = (rawGrid as any)[r];
          if (row && typeof row === 'object') {
            for (let c = 0; c < 3; c++) {
              const cell = (row as any)[c];
              if (cell && typeof cell === 'string' && cell.trim() !== '') {
                normalizedGrid[r][c] = cell;
              }
            }
          }
        }
      }
      const rawHistory = room.stateOOXX?.movesHistory;
      const movesHistory = Array.isArray(rawHistory)
        ? (rawHistory as any[])
        : rawHistory
        ? (Object.values(rawHistory) as any[])
        : [];

      const rawWinningLine = room.stateOOXX?.winningLine;
      const winningLine = Array.isArray(rawWinningLine)
        ? rawWinningLine
        : rawWinningLine && typeof rawWinningLine === 'object'
        ? Object.values(rawWinningLine)
        : undefined;

      room.stateOOXX = {
        grid: normalizedGrid,
        movesHistory,
        currentTurnUid: room.stateOOXX?.currentTurnUid || room.hostUid,
        infiniteMode: Boolean(room.stateOOXX?.infiniteMode),
        winningLine: winningLine as any
      };
    }

    return room;
  }

  // --- CONNECTION HEALTH (Accurate Browser & Network Health) ---
  public subscribeConnection(callback: (connected: boolean) => void): () => void {
    if (typeof window !== 'undefined') {
      const checkConnection = () => {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        callback(isOnline);
      };

      checkConnection();
      window.addEventListener('online', checkConnection);
      window.addEventListener('offline', checkConnection);

      return () => {
        window.removeEventListener('online', checkConnection);
        window.removeEventListener('offline', checkConnection);
      };
    }
    return () => {};
  }

  // --- MUTUAL FRIEND REQUEST SYSTEM (RTDB) ---
  public async sendFriendRequest(
    fromUser: UserProfile,
    toUser: UserProfile
  ): Promise<{ success: boolean; message: string }> {
    if (fromUser.uid === toUser.uid) {
      return { success: false, message: '不能加自己為好友！' };
    }

    if (rtdb) {
      try {
        // Check if already friends
        const friendSnap = await get(child(ref(rtdb), `friends/${fromUser.uid}/${toUser.uid}`));
        if (friendSnap.exists()) {
          return { success: false, message: '該玩家已經是您的好友！' };
        }

        const requestId = `${fromUser.uid}_${toUser.uid}`;
        const req: FriendRequest = {
          id: requestId,
          fromUid: fromUser.uid,
          fromDisplayName: fromUser.displayName,
          fromPhotoURL: fromUser.photoURL,
          fromUserTag: fromUser.userTag,
          toUid: toUser.uid,
          createdAt: Date.now(),
          status: 'pending'
        };

        await set(
          ref(rtdb, `friend_requests/${toUser.uid}/${fromUser.uid}`),
          this.cleanForRTDB(req)
        );
        return { success: true, message: `好友邀請已送出給 ${toUser.displayName}！等待對方同意。` };
      } catch (e: any) {
        console.warn('sendFriendRequest error:', e);
        return { success: false, message: '發送好友邀請失敗，請稍後重試。' };
      }
    }
    return { success: false, message: '資料庫尚未就緒。' };
  }

  public subscribeFriendRequests(
    myUid: string,
    callback: (requests: FriendRequest[]) => void
  ): () => void {
    if (!rtdb) return () => {};
    try {
      const requestsRef = ref(rtdb, `friend_requests/${myUid}`);
      const unsub = onValue(requestsRef, (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          const list: FriendRequest[] = Object.values(val);
          callback(list.filter((r) => r.status === 'pending'));
        } else {
          callback([]);
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('subscribeFriendRequests err:', e);
      return () => {};
    }
  }

  public async acceptFriendRequest(
    request: FriendRequest,
    myProfile: UserProfile
  ): Promise<void> {
    if (!rtdb) return;
    try {
      const friendRecordForMe: FriendRecord = {
        uid: request.fromUid,
        displayName: request.fromDisplayName,
        photoURL: request.fromPhotoURL,
        userTag: request.fromUserTag,
        addedAt: Date.now()
      };

      const friendRecordForOther: FriendRecord = {
        uid: myProfile.uid,
        displayName: myProfile.displayName,
        photoURL: myProfile.photoURL,
        userTag: myProfile.userTag,
        addedAt: Date.now()
      };

      // 1. Add to my friends list
      await set(
        ref(rtdb, `friends/${myProfile.uid}/${request.fromUid}`),
        this.cleanForRTDB(friendRecordForMe)
      );
      // 2. Add to sender's friends list
      await set(
        ref(rtdb, `friends/${request.fromUid}/${myProfile.uid}`),
        this.cleanForRTDB(friendRecordForOther)
      );
      // 3. Delete from friend_requests
      await set(ref(rtdb, `friend_requests/${myProfile.uid}/${request.fromUid}`), null);
    } catch (e) {
      console.warn('acceptFriendRequest err:', e);
    }
  }

  public async declineFriendRequest(myUid: string, fromUid: string): Promise<void> {
    if (!rtdb) return;
    try {
      await set(ref(rtdb, `friend_requests/${myUid}/${fromUid}`), null);
    } catch (e) {
      console.warn('declineFriendRequest err:', e);
    }
  }

  public subscribeFriends(
    myUid: string,
    callback: (friends: FriendRecord[]) => void
  ): () => void {
    if (!rtdb) return () => {};
    try {
      const friendsRef = ref(rtdb, `friends/${myUid}`);
      const unsub = onValue(friendsRef, (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          callback(Object.values(val));
        } else {
          callback([]);
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('subscribeFriends err:', e);
      return () => {};
    }
  }

  public async removeFriend(myUid: string, friendUid: string): Promise<void> {
    if (!rtdb) return;
    try {
      await set(ref(rtdb, `friends/${myUid}/${friendUid}`), null);
      await set(ref(rtdb, `friends/${friendUid}/${myUid}`), null);
    } catch (e) {
      console.warn('removeFriend err:', e);
    }
  }

  // Update profile info (photoURL, displayName) across all mutual friends' lists
  public async syncProfileToFriends(user: UserProfile): Promise<void> {
    if (!rtdb) return;
    try {
      const myFriendsSnap = await get(child(ref(rtdb), `friends/${user.uid}`));
      if (myFriendsSnap.exists()) {
        const val = myFriendsSnap.val();
        if (val) {
          const friendUids = Object.keys(val);
          for (const fUid of friendUids) {
            const friendNodeRef = ref(rtdb, `friends/${fUid}/${user.uid}`);
            await set(friendNodeRef, this.cleanForRTDB({
              uid: user.uid,
              displayName: user.displayName,
              photoURL: user.photoURL,
              userTag: user.userTag,
              addedAt: val[fUid]?.addedAt || Date.now()
            })).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn('syncProfileToFriends error:', e);
    }
  }

  // --- REAL-TIME ZERO-LATENCY FRIENDS PRESENCE ---
  public getFriendsLiveStatus(friends: FriendRecord[]): UserPresence[] {
    const gameNames: Record<string, string> = {
      '1a2b': '1A2B',
      'battleship': '海戰棋',
      'bingo': '賓果',
      'dots': '點線棋',
      'ooxx': '經典 OOXX'
    };

    const PRESENCE_TTL_MS = 30 * 1000; // 30 seconds: if no heartbeat received, friend is offline
    const now = Date.now();

    const localActiveRooms = Array.from(this.localRooms.values()).filter(
      (r) => (r.status === 'waiting' || r.status === 'in_progress') && (now - (r.updatedAt || 0) < 180000)
    );

    return friends.map((f) => {
      const presence = this.localPresence.get(f.uid);
      const isPresenceFresh = Boolean(presence && presence.lastActive && (now - presence.lastActive < PRESENCE_TTL_MS));

      // 1. If presence does not exist, or timed out (>30s), or explicitly set to offline -> OFFLINE
      if (!presence || !isPresenceFresh || presence.status === 'offline') {
        return {
          uid: f.uid,
          displayName: presence?.displayName || f.displayName || '好友',
          photoURL: presence?.photoURL || f.photoURL || '',
          userTag: presence?.userTag || f.userTag,
          status: 'offline',
          lastActive: presence?.lastActive || 0
        };
      }

      // 2. Check active room ground truth
      const activeRoom = localActiveRooms.find(
        (r) =>
          (r.players && r.players.some((p) => p.uid === f.uid)) ||
          r.player1?.uid === f.uid ||
          r.player2?.uid === f.uid
      );

      if (activeRoom) {
        const pCount =
          (activeRoom.players && activeRoom.players.length) ||
          (activeRoom.player2 ? 2 : 1);
        const maxLimit = activeRoom.maxPlayers || 2;

        return {
          uid: f.uid,
          displayName: presence.displayName || f.displayName || '好友',
          photoURL: presence.photoURL || f.photoURL || '',
          userTag: presence.userTag || f.userTag,
          status: 'in_game',
          lastActive: presence.lastActive,
          currentRoomId: activeRoom.id,
          currentRoomCode: activeRoom.code,
          currentGameId: activeRoom.gameId,
          currentGameName: gameNames[activeRoom.gameId] || activeRoom.gameId.toUpperCase(),
          currentRoomMaxPlayers: maxLimit,
          currentRoomPlayerCount: pCount
        };
      }

      // 3. Presence in_game fallback (e.g. if room is still syncing)
      if (presence.status === 'in_game' && presence.currentRoomId) {
        return {
          ...presence,
          userTag: presence.userTag || f.userTag,
          displayName: presence.displayName || f.displayName,
          photoURL: presence.photoURL || f.photoURL,
          currentGameName: presence.currentGameId ? (gameNames[presence.currentGameId] || presence.currentGameId) : undefined,
          currentRoomMaxPlayers: presence.currentRoomMaxPlayers || 2,
          currentRoomPlayerCount: presence.currentRoomPlayerCount || 1
        };
      }

      // 4. Online in lobby
      return {
        ...presence,
        userTag: presence.userTag || f.userTag,
        displayName: presence.displayName || f.displayName,
        photoURL: presence.photoURL || f.photoURL,
        status: 'lobby'
      };
    });
  }

  // --- INITIALIZE SPECIFIC GAME STATES ---
  private initGameState(room: GameRoom, options?: RoomCreationOptions) {
    if (room.gameId === '1a2b') {
      let targetSecret: string | undefined = undefined;
      const lockedIn: Record<string, boolean> = {};
      const isMulti = (room.maxPlayers && room.maxPlayers >= 3) || (room.players && room.players.length >= 3);
      if (isMulti) {
        const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        targetSecret = pool.slice(0, 4).join('');
        if (room.players && room.players.length > 0) {
          room.players.forEach(p => { lockedIn[p.uid] = true; });
        } else {
          lockedIn[room.hostUid] = true;
        }
      }
      room.state1a2b = {
        secrets: {},
        lockedIn,
        guesses: [],
        currentTurnUid: room.hostUid,
        turnDeadline: Date.now() + 30000,
        hintsUsed: {},
        hintEnabled: options?.hintEnabled !== undefined ? options.hintEnabled : true,
        hintRound: options?.hintRound || 5,
        maxRounds: options?.maxRounds || 0,
        targetSecret
      };
    } else if (room.gameId === 'battleship') {
      room.stateBattleship = {
        boards: {},
        currentTurnUid: room.hostUid,
        gridSize: options?.gridSize || 8
      };
    } else if (room.gameId === 'bingo') {
      room.stateBingo = {
        boards: {},
        ready: {},
        calledNumbers: [],
        currentTurnUid: room.hostUid,
        linesCompleted: {},
        targetLines: options?.targetLines || 5
      };
    } else if (room.gameId === 'dots') {
      room.stateDots = {
        lines: {},
        boxes: {},
        currentTurnUid: room.hostUid,
        scores: { [room.hostUid]: 0 },
        lastBonusTurn: false,
        gridSize: options?.dotsGridSize || 4
      };
    } else if (room.gameId === 'ooxx') {
      room.stateOOXX = {
        grid: [
          [null, null, null],
          [null, null, null],
          [null, null, null]
        ],
        movesHistory: [],
        currentTurnUid: room.hostUid,
        infiniteMode: false
      };
    }
  }
}

export const matchService = new MatchService();
