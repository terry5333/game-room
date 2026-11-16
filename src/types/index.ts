export type GameId = '1a2b' | 'battleship' | 'bingo' | 'dots' | 'ooxx' | 'connect4';

export interface UserWardrobe {
  gender?: 'male' | 'female';
  head: string;      // 'none' | 'student_cap' | 'hachimaki' | 'fox_mask' | 'ronin_band' | 'fedora' | 'ninja_mask'
  outfit: string;    // 'default' | 'gakuran' | 'sailor' | 'haori' | 'jinbei' | 'dojo' | 'suit'
  accessory: string; // 'none' | 'brush' | 'shinai' | 'abacus' | 'fan' | 'katana'
  stamp: string;     // 'candidate' | 'passed' | 'master' | 'undefeated' | 'pro'
}

export interface PetData {
  id: string; // 'shiba' | 'calico_cat' | 'capybara' | 'penguin' | 'lucky_cat' | 'slime'
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  hunger: number;    // 0 - 100
  intimacy: number;  // 0 - 100
  mood?: number;     // 0 - 100 (心情度)
  cleanliness?: number; // 0 - 100 (潔淨度)
  health?: number;      // 0 - 100 (生命力 / 健康)
  isDead?: boolean;     // 寵物是否罹難離世
  causeOfDeath?: string; // 死因說明
  diedAt?: number;      // 罹難時間戳
  lastFed: number;
  lastPetted: number;
  lastPlayed?: number;
  lastBathed?: number;
  adventure?: {
    isExploring: boolean;
    returnTime: number;
    destination: string;
    rewardCoins?: number;
  };
}

export interface PixelCharacterCustomization {
  gender: 'male' | 'female';
  skinTone: string;
  hairStyle: string; // 'short' | 'twintail' | 'bob' | 'spiky'
  hairColor: string; // hex color
  outfitStyle?: string; // 'gakuran' | 'sailor' | 'trench' | 'hoodie' | 'haori' | 'cyber' | 'tuxedo' | 'kimono' | 'wizard' | 'gold_armor' | 'ninja' | 'tracksuit'
  outfitColor: string; // hex color
  accessory: string; // 'none' | 'glasses' | 'ribbon' | 'cap' | 'tie' (單件向下相容)
  accessories?: string[]; // 支援多件飾品同時穿戴
  chairId: string; // 'wooden_chair' | 'retro_sofa' | 'royal_throne' | 'gaming_chair' | 'beanbag' | 'tatami'
  petId: string; // 'shiba' | 'calico_cat' | 'capybara' | 'penguin' | 'lucky_cat' | 'slime'
}

export interface UserPetProfile {
  character: PixelCharacterCustomization;
  pet: PetData;
  unlockedChairs: string[];
  unlockedPets: string[];
  unlockedOutfits?: string[];
  unlockedAccessories?: string[];
}

export interface LpcCharacterConfig {
  characterId: string;
  gender: 'male' | 'female';
  body: string;          // 'body_male' | 'body_female'
  skinTone: string;      // 'light' | 'amber' | 'olive' | 'bronze' | 'brown' | 'black' | 'zombie'
  hair: string;          // 'hair_bangsshort' | 'hair_bangslong' | 'hair_bedhead' | 'hair_bob' | 'hair_curtains' | 'hair_loose' | 'hair_plain' | 'hair_spiked' | 'none'
  hairColor: string;     // 'blonde' | 'black' | 'dark_brown' | 'light_brown' | 'red' | 'pink' | 'purple' | 'blue' | 'green' | 'white' | 'gray'
  top: string;           // 'top_tshirt' | 'top_formal' | 'top_longsleeve' | 'top_plate' | 'top_jacket_black' | 'top_jacket_red' | 'top_jacket_blue' | 'none'
  bottom: string;        // 'bottom_pants' | 'bottom_cuffed' | 'bottom_formal' | 'none'
  shoes: string;         // 'shoes_shoes' | 'shoes_boots' | 'shoes_sandals' | 'none'
  hat: string;           // 'none' | 'hat_bandana' | 'hat_leather_cap' | 'hat_hood'
  accessories: string[]; // e.g. ['acc_glasses', 'acc_belt_leather']
}

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
  wardrobe?: UserWardrobe;
  unlockedItems?: string[];
  petProfile?: UserPetProfile;
  lpcCharacter?: LpcCharacterConfig;
  equippedTitle?: string;
  unlockedTitles?: string[];
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
  currentRoomMaxPlayers?: number;
  currentRoomPlayerCount?: number;
  wardrobe?: UserWardrobe;
  petProfile?: UserPetProfile;
  lpcCharacter?: LpcCharacterConfig;
  equippedTitle?: string;
}

export interface CoinTransaction {
  id: string;
  uid: string;
  amount: number;
  type: 'win_reward' | 'consolation' | 'admin_grant' | 'admin_deduct' | 'shop_purchase' | 'casino_bet' | 'casino_win';
  description: string;
  timestamp: number;
  gameId?: GameId;
}

export interface BattleInvite {
  id: string;
  fromUid: string;
  fromName: string;
  fromPhotoURL?: string;
  toUid: string;
  gameId: GameId;
  roomId: string;
  roomCode?: string;
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
  wardrobe?: UserWardrobe;
}

export type PlayerRole = 'player1' | 'player2' | 'player3' | 'player4' | 'player5' | 'spectator';

export interface PlayerSlot {
  uid: string;
  displayName: string;
  photoURL: string;
  ready: boolean;
  score?: number;
  wardrobe?: UserWardrobe;
  petProfile?: UserPetProfile;
  lpcCharacter?: LpcCharacterConfig;
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
  hintsUsed?: Record<string, string>; // uid -> hint text
  hintEnabled?: boolean;
  hintRound?: number; // 第幾回合開啟提示 (預設 5)
  maxRounds?: number; // 回合上限 (0 或 undefined 表示無上限)
  targetSecret?: string; // 多人模式題庫密碼 (3-4人模式由全員搶答)
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
  gridSize?: number; // 6, 8 (default), 10
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
  targetLines?: number; // 房主指定獲勝連線數 1-5 (預設 5)
}

// Dots and Boxes Types
export interface StateDots {
  lines: Record<string, string>; // "h_0_0" -> uid
  boxes: Record<string, string>; // "0_0" -> uid
  currentTurnUid: string;
  scores: Record<string, number>; // uid -> boxes count
  lastBonusTurn: boolean;
  gridSize?: number; // 3, 4 (default), 5, 6
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

// Connect Four (四子棋) Types
export interface StateConnect4 {
  grid: (string | null)[][]; // 6 rows x 7 cols (grid[r][c] = uid)
  currentTurnUid: string;
  winningLine?: { r: number; c: number }[];
  lastDrop?: { r: number; c: number; uid: string };
}

// Multiplayer Blackjack (21點多人對決) Types
export interface PlayingCard {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number;
  color: 'red' | 'black';
}

export interface HandScore {
  total: number;
  isSoft: boolean;
  isBlackjack: boolean;
  isBust: boolean;
}

export interface BlackjackPlayerState {
  uid: string;
  chips: number; // 該玩家目前籌碼餘額
  bet: number; // 本局注額
  hand: PlayingCard[];
  status: 'betting' | 'playing' | 'stand' | 'bust' | 'blackjack';
  score: HandScore;
}

export interface StateBlackjack {
  entryFee: 100 | 300 | 500 | 1000;
  totalRounds: 3 | 5 | 10;
  currentRound: number;
  phase: 'betting' | 'player_turns' | 'dealer_turn' | 'round_settled' | 'game_over';
  dealerHand: PlayingCard[];
  dealerScore: HandScore;
  deck: PlayingCard[];
  players: Record<string, BlackjackPlayerState>;
  currentTurnUid?: string;
  eliminatedUids: string[];
  pot: number;
  roundMessage?: string;
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
  players?: PlayerSlot[]; // 多人玩家列表 (2 至 5 人)
  maxPlayers?: number;
  winnerUid?: string | 'draw';
  createdAt: number;
  updatedAt: number;
  version?: number;
  multiplier: number;
  // Specific Game State
  state1a2b?: State1A2B;
  stateBattleship?: StateBattleship;
  stateBingo?: StateBingo;
  stateDots?: StateDots;
  stateOOXX?: StateOOXX;
  stateConnect4?: StateConnect4;
  stateBlackjack?: StateBlackjack;
}

export interface RoomCreationOptions {
  maxPlayers?: number;
  // 1A2B options
  hintEnabled?: boolean;
  hintRound?: number;
  maxRounds?: number;
  // Bingo options
  targetLines?: number;
  // Battleship options
  gridSize?: number;
  // Dots options
  dotsGridSize?: number;
  // Blackjack options
  blackjackRounds?: 3 | 5 | 10;
  entryFee?: 100 | 300 | 500 | 1000;
}

export interface GameSettings {
  multipliers: Record<GameId, number>;
}
