import {
  isFirebaseConfigured,
  rtdb,
  ref,
  set,
  get,
  child,
  onValue,
  onDisconnect,
  rtdbServerTimestamp
} from './firebase';
import type {
  GameRoom,
  GameId,
  UserProfile,
  UserPresence,
  BattleInvite,
  GameSettings
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
    }
  }

  private saveLocalRooms() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'duo_local_rooms',
          JSON.stringify(Array.from(this.localRooms.values()))
        );
      } catch {}
    }
  }

  // --- PRESENCE SYSTEM (Realtime Database) ---
  public updatePresence(presence: UserPresence) {
    this.localPresence.set(presence.uid, presence);
    this.notifyPresenceListeners();

    if (syncChannel) {
      syncChannel.postMessage({ type: 'PRESENCE_UPDATE', payload: presence });
    }

    if (rtdb) {
      try {
        const presenceRef = ref(rtdb, `presence/${presence.uid}`);
        set(presenceRef, {
          ...presence,
          lastActive: rtdbServerTimestamp()
        });
        const disconnectRef = onDisconnect(presenceRef);
        disconnectRef.set({
          ...presence,
          status: 'offline',
          lastActive: rtdbServerTimestamp()
        });
      } catch (err) {
        console.warn('Presence sync error:', err);
      }
    }
  }

  public subscribePresence(callback: (presences: UserPresence[]) => void): () => void {
    this.presenceListeners.add(callback);
    callback(Array.from(this.localPresence.values()));

    let unsubRtdb: (() => void) | null = null;
    if (rtdb) {
      try {
        const presencesRef = ref(rtdb, 'presence');
        const unsub = onValue(presencesRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
            const list: UserPresence[] = Object.values(val);
            list.forEach(p => this.localPresence.set(p.uid, p));
            callback(Array.from(this.localPresence.values()));
          }
        });
        unsubRtdb = () => unsub();
      } catch (err) {
        console.warn('Presence listen error:', err);
      }
    }

    return () => {
      this.presenceListeners.delete(callback);
      if (unsubRtdb) unsubRtdb();
    };
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

  public subscribeInvites(myUid: string, callback: (invite: BattleInvite) => void): () => void {
    if (!this.inviteListeners.has(myUid)) {
      this.inviteListeners.set(myUid, new Set());
    }
    this.inviteListeners.get(myUid)!.add(callback);

    let unsubRtdb: (() => void) | null = null;
    if (rtdb) {
      try {
        const userInvitesRef = ref(rtdb, `invites/${myUid}`);
        const unsub = onValue(userInvitesRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
            Object.values(val).forEach((inv: any) => {
              if (inv.status === 'pending') {
                callback(inv);
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
    multiplier: number = 1
  ): Promise<GameRoom> {
    const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const newRoom: GameRoom = {
      id: roomId,
      code,
      gameId,
      hostUid: hostUser.uid,
      status: 'waiting',
      player1: {
        uid: hostUser.uid,
        displayName: hostUser.displayName,
        photoURL: hostUser.photoURL,
        ready: false
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      multiplier
    };

    this.initGameState(newRoom);

    // 1. Immediately store in local memory for instant zero-latency UI transition
    this.localRooms.set(roomId, newRoom);
    this.saveLocalRooms();
    this.broadcastRoom(newRoom);

    // 2. Write to Firebase RTDB in parallel
    if (rtdb) {
      try {
        set(ref(rtdb, `rooms/${roomId}`), newRoom).catch(console.warn);
      } catch (err) {
        console.warn('RTDB createRoom error:', err);
      }
    }

    return newRoom;
  }

  public async joinRoomByCode(code: string, user: UserProfile): Promise<GameRoom | null> {
    const cleanCode = code.trim();

    // 1. Check local rooms first
    for (const room of this.localRooms.values()) {
      if (room.code === cleanCode && room.status !== 'closed') {
        return this.joinRoom(room.id, user);
      }
    }

    // 2. Search in Firebase Realtime Database
    if (rtdb) {
      try {
        const snap = await get(child(ref(rtdb), 'rooms'));
        if (snap.exists()) {
          const all = snap.val();
          for (const [id, r] of Object.entries<any>(all)) {
            if (r.code === cleanCode && r.status !== 'closed') {
              this.localRooms.set(id, r);
              return this.joinRoom(id, user);
            }
          }
        }
      } catch (err) {
        console.warn('RTDB search room error:', err);
      }
    }

    return null;
  }

  public async joinRoom(roomId: string, user: UserProfile): Promise<GameRoom | null> {
    let room = this.localRooms.get(roomId);

    if (!room && rtdb) {
      try {
        const snap = await get(child(ref(rtdb), `rooms/${roomId}`));
        if (snap.exists()) {
          room = snap.val() as GameRoom;
          this.localRooms.set(roomId, room);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    if (!room) return null;

    if (room.player1.uid === user.uid) {
      return room;
    }

    // Join as player 2
    room.player2 = {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      ready: false
    };
    room.status = 'in_progress';
    room.updatedAt = Date.now();

    await this.updateRoom(room);
    return room;
  }

  public async updateRoom(room: GameRoom) {
    room.updatedAt = Date.now();
    this.localRooms.set(room.id, room);
    this.saveLocalRooms();
    this.broadcastRoom(room);

    if (rtdb) {
      try {
        set(ref(rtdb, `rooms/${room.id}`), room).catch(console.warn);
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
    if (existing) callback(existing);

    let unsubRtdb: (() => void) | null = null;
    if (rtdb) {
      try {
        const roomRef = ref(rtdb, `rooms/${roomId}`);
        const unsub = onValue(roomRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
            this.localRooms.set(roomId, val);
            callback(val);
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

  public async fetchAllRoomsFromRTDB(): Promise<GameRoom[]> {
    if (rtdb) {
      try {
        const snap = await get(child(ref(rtdb), 'rooms'));
        if (snap.exists()) {
          const val = snap.val();
          return Object.values(val);
        }
      } catch (e) {
        console.warn('fetchAllRoomsFromRTDB err:', e);
      }
    }
    return Array.from(this.localRooms.values());
  }

  public async forceCloseRoom(roomId: string): Promise<void> {
    const r = this.localRooms.get(roomId);
    if (r) {
      r.status = 'closed';
      r.updatedAt = Date.now();
      await this.updateRoom(r);
    } else if (rtdb) {
      set(ref(rtdb, `rooms/${roomId}/status`), 'closed').catch(console.warn);
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

  // --- INITIALIZE SPECIFIC GAME STATES ---
  private initGameState(room: GameRoom) {
    if (room.gameId === '1a2b') {
      room.state1a2b = {
        secrets: {},
        lockedIn: {},
        guesses: [],
        currentTurnUid: room.hostUid,
        turnDeadline: Date.now() + 30000
      };
    } else if (room.gameId === 'battleship') {
      room.stateBattleship = {
        boards: {},
        currentTurnUid: room.hostUid
      };
    } else if (room.gameId === 'bingo') {
      room.stateBingo = {
        boards: {},
        ready: {},
        calledNumbers: [],
        currentTurnUid: room.hostUid,
        linesCompleted: {}
      };
    } else if (room.gameId === 'dots') {
      room.stateDots = {
        lines: {},
        boxes: {},
        currentTurnUid: room.hostUid,
        scores: { [room.hostUid]: 0 },
        lastBonusTurn: false
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
        infiniteMode: true
      };
    }
  }
}

export const matchService = new MatchService();
