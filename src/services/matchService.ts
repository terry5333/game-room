import {
  isFirebaseConfigured,
  db,
  rtdb,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  getDocs,
  ref,
  set,
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
  CoinTransaction,
  GameSettings
} from '../types';

// Default global settings
export const DEFAULT_SETTINGS: GameSettings = {
  multipliers: {
    '1a2b': 1,
    'battleship': 1.2,
    'bingo': 1,
    'dots': 1,
    'ooxx': 1
  }
};

// Cross-tab broadcast channel for local / instant multi-tab sync
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
      // Load saved state from localStorage
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

  // --- PRESENCE SYSTEM ---
  public updatePresence(presence: UserPresence) {
    this.localPresence.set(presence.uid, presence);
    this.notifyPresenceListeners();

    if (syncChannel) {
      syncChannel.postMessage({ type: 'PRESENCE_UPDATE', payload: presence });
    }

    if (isFirebaseConfigured() && rtdb) {
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
        console.warn('Firebase presence sync error:', err);
      }
    }
  }

  public subscribePresence(callback: (presences: UserPresence[]) => void): () => void {
    this.presenceListeners.add(callback);
    callback(Array.from(this.localPresence.values()));

    let unsubscribeFirebase: (() => void) | null = null;
    if (isFirebaseConfigured() && rtdb) {
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
        unsubscribeFirebase = () => unsub();
      } catch (err) {
        console.warn('Firebase presence listen error:', err);
      }
    }

    return () => {
      this.presenceListeners.delete(callback);
      if (unsubscribeFirebase) unsubscribeFirebase();
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

    if (isFirebaseConfigured() && rtdb) {
      try {
        set(ref(rtdb, `invites/${invite.toUid}/${invite.id}`), invite);
      } catch (e) {
        console.warn('Firebase invite error:', e);
      }
    }
  }

  public subscribeInvites(myUid: string, callback: (invite: BattleInvite) => void): () => void {
    if (!this.inviteListeners.has(myUid)) {
      this.inviteListeners.set(myUid, new Set());
    }
    this.inviteListeners.get(myUid)!.add(callback);

    let unsubRtdb: (() => void) | null = null;
    if (isFirebaseConfigured() && rtdb) {
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
        console.warn('Firebase subscribe invite error:', e);
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

  // --- ROOM MANAGEMENT ---
  public async createRoom(
    hostUser: UserProfile,
    gameId: GameId,
    multiplier: number = 1
  ): Promise<GameRoom> {
    const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
    // 6-digit room code
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

    // Initialize game specific state
    this.initGameState(newRoom);

    this.localRooms.set(roomId, newRoom);
    this.saveLocalRooms();
    this.broadcastRoom(newRoom);

    if (isFirebaseConfigured() && db && rtdb) {
      try {
        // Save to RTDB for real-time play
        await set(ref(rtdb, `rooms/${roomId}`), newRoom);
        // And record to Firestore
        await setDoc(doc(db, 'rooms', roomId), newRoom);
      } catch (err) {
        console.warn('Firebase createRoom error:', err);
      }
    }

    return newRoom;
  }

  public async joinRoomByCode(code: string, user: UserProfile): Promise<GameRoom | null> {
    // Search in local rooms first
    for (const room of this.localRooms.values()) {
      if (room.code === code && room.status !== 'closed') {
        return this.joinRoom(room.id, user);
      }
    }

    // Search in Realtime Database (RTDB)
    if (isFirebaseConfigured() && rtdb) {
      try {
        const snap = await new Promise<any>((resolve) => {
          onValue(ref(rtdb, 'rooms'), (s) => resolve(s.val()), { onlyOnce: true });
        });
        if (snap) {
          for (const [id, r] of Object.entries<any>(snap)) {
            if (r.code === code && r.status !== 'closed') {
              return this.joinRoom(id, user);
            }
          }
        }
      } catch (err) {
        console.warn('RTDB search room error:', err);
      }
    }

    // Search in Firestore
    if (isFirebaseConfigured() && db) {
      try {
        const q = collection(db, 'rooms');
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          const r = docSnap.data() as GameRoom;
          if (r.code === code && r.status !== 'closed') {
            return this.joinRoom(r.id, user);
          }
        }
      } catch (err) {
        console.warn('Firebase search room error:', err);
      }
    }

    return null;
  }

  public async joinRoom(roomId: string, user: UserProfile): Promise<GameRoom | null> {
    let room = this.localRooms.get(roomId);

    if (!room && isFirebaseConfigured() && rtdb) {
      try {
        const snap = await new Promise<any>((resolve) => {
          onValue(ref(rtdb, `rooms/${roomId}`), (s) => resolve(s.val()), { onlyOnce: true });
        });
        if (snap) {
          room = snap as GameRoom;
        }
      } catch (e) {
        console.warn(e);
      }
    }

    if (!room && isFirebaseConfigured() && db) {
      try {
        const docSnap = await getDoc(doc(db, 'rooms', roomId));
        if (docSnap.exists()) {
          room = docSnap.data() as GameRoom;
        }
      } catch (e) {
        console.warn(e);
      }
    }

    if (!room) return null;

    // Check if user is already player 1
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

    if (isFirebaseConfigured() && rtdb) {
      try {
        await set(ref(rtdb, `rooms/${room.id}`), room);
        if (db) {
          await updateDoc(doc(db, 'rooms', room.id), { ...room });
        }
      } catch (err) {
        console.warn('Firebase update room error:', err);
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
    if (isFirebaseConfigured() && rtdb) {
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
        console.warn('Firebase subscribe room error:', err);
      }
    }

    return () => {
      this.roomListeners.get(roomId)?.delete(callback);
      if (unsubRtdb) unsubRtdb();
    };
  }

  public getActiveRooms(): GameRoom[] {
    return Array.from(this.localRooms.values()).filter(r => r.status !== 'closed');
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
