export type GameId = '1a2b' | 'battleship' | 'bingo' | 'dots' | 'ooxx';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  userTag: string; // 4-digit ID (e.g. "8823")
  coins: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  profileCompleted: boolean;
  tutorialCompleted: boolean;
  role: 'user' | 'admin';
  friendCode: string;
  createdAt: number;
}

export type PresenceStatus = 'online' | 'lobby' | 'in_game' | 'offline';

export interface UserPresence {
  uid: string;
  displayName: string;
  photoURL: string;
  userTag?: string;
  status: PresenceStatus;
  lastActive: number;
  currentRoomId?: string;
  currentRoomCode?: string;
  currentGameId?: GameId;
  currentGameName?: string;
}

export interface CoinTransaction {
  id: string;
  uid: string;
  amount: number;
  type: 'win_reward' | 'consolation' | 'admin_grant' | 'admin_deduct' | 'shop_purchase';
  description: string;
  timestamp: number;
  gameId?: GameId;
}

export interface BattleInvite {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  gameId: GameId;
  roomId: string;
  createdAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface FriendRequest {
  id: string; // `${fromUid}_${toUid}`
  fromUid: string;
  fromDisplayName: string;
  fromPhotoURL: string;
  fromUserTag: string;
  toUid: string;
  createdAt: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface FriendRecord {
  uid: string;
  displayName: string;
  photoURL: string;
  userTag: string;
  addedAt: number;
}

export interface PlayerSlot {
  uid: string;
  displayName: string;
  photoURL: string;
  ready: boolean;
  score?: number;
}

// 1A2B Game Types
export interface GuessRecord {
  guesserUid: string;
  guess: string;
  bulls: number; // A
  cows: number;  // B
  timestamp: number;
}

export interface State1A2B {
  secrets: Record<string, string>; // uid -> 4-digit secret
  lockedIn: Record<string, boolean>; // uid -> ready
  guesses: GuessRecord[];
  currentTurnUid: string;
  turnDeadline: number;
}

// Battleship Types
export type ShipOrientation = 'horizontal' | 'vertical';
export interface Ship {
  id: string;
  name: string;
  length: number;
  coords: { r: number; c: number }[];
  sunk: boolean;
}

export interface BattleshipPlayerBoard {
  ships: Ship[];
  placed: boolean;
  attacksReceived: { r: number; c: number; hit: boolean }[];
}

export interface StateBattleship {
  boards: Record<string, BattleshipPlayerBoard>;
  currentTurnUid: string;
  lastAttack?: {
    attackerUid: string;
    r: number;
    c: number;
    hit: boolean;
    sunkShipName?: string;
  };
}

// Bingo Types
export interface StateBingo {
  boards: Record<string, number[][]>; // 5x5
  ready: Record<string, boolean>;
  calledNumbers: number[];
  currentTurnUid: string;
  linesCompleted: Record<string, number>; // uid -> count 0-5
}

// Dots and Boxes Types
export interface StateDots {
  lines: Record<string, string>; // "h_0_0" -> uid
  boxes: Record<string, string>; // "0_0" -> uid
  currentTurnUid: string;
  scores: Record<string, number>; // uid -> boxes count
  lastBonusTurn: boolean;
}

// OOXX Types
export interface PiecePlaced {
  r: number;
  c: number;
  uid: string;
  moveIndex: number;
}

export interface StateOOXX {
  grid: (string | null)[][]; // 3x3 array of uids
  movesHistory: PiecePlaced[];
  currentTurnUid: string;
  infiniteMode: boolean;
  winningLine?: { r: number; c: number }[];
}

// Unified Game Room
export interface GameRoom {
  id: string;
  code: string; // 6-digit room code
  gameId: GameId;
  hostUid: string;
  status: 'waiting' | 'in_progress' | 'settled' | 'closed';
  player1: PlayerSlot;
  player2?: PlayerSlot;
  winnerUid?: string | 'draw';
  createdAt: number;
  updatedAt: number;
  multiplier: number;
  // Specific Game State
  state1a2b?: State1A2B;
  stateBattleship?: StateBattleship;
  stateBingo?: StateBingo;
  stateDots?: StateDots;
  stateOOXX?: StateOOXX;
}

export interface GameSettings {
  multipliers: Record<GameId, number>;
}
