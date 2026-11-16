export interface PlayerTitle {
  id: string;
  name: string;
  category: 'adventure' | 'battle' | 'casino' | 'wealth' | 'fashion' | 'special';
  badgeStyle: string; // Tailwind background gradient & border
  textColor: string;
  description: string;
  requirement: string;
  unlockedByDefault?: boolean;
}

export const TITLE_CATALOG: PlayerTitle[] = [
  // 🔰 冒險歷練
  {
    id: 'title_novice',
    name: '初出茅廬的受驗生',
    category: 'adventure',
    badgeStyle: 'bg-gradient-to-r from-stone-600 to-stone-700 border-stone-500/40',
    textColor: 'text-stone-100',
    description: '剛踏入帝國受驗競技場的新生代挑戰者。',
    requirement: '創角即刻擁有',
    unlockedByDefault: true
  },
  {
    id: 'title_showa',
    name: '昭和學堂優等生',
    category: 'adventure',
    badgeStyle: 'bg-gradient-to-r from-amber-700 to-amber-800 border-amber-500/40',
    textColor: 'text-amber-100',
    description: '秉持昭和求知精神，於名片題下赫赫志向。',
    requirement: '創角即刻擁有',
    unlockedByDefault: true
  },
  {
    id: 'title_first_blood',
    name: '首戰告捷・旗開得勝',
    category: 'adventure',
    badgeStyle: 'bg-gradient-to-r from-blue-600 to-cyan-700 border-cyan-400/40',
    textColor: 'text-cyan-100',
    description: '在對戰擂台中迎來生涯首場痛快勝利！',
    requirement: '贏得 1 場任一競技對決'
  },

  // ⚔️ 擂台戰神
  {
    id: 'title_strategist',
    name: '算無遺策・百戰軍師',
    category: 'battle',
    badgeStyle: 'bg-gradient-to-r from-indigo-700 to-purple-800 border-indigo-400/50',
    textColor: 'text-indigo-100',
    description: '深諳數字解碼與艦隊佈陣，智取群雄。',
    requirement: '累計勝場達到 10 場'
  },
  {
    id: 'title_undefeated',
    name: '常勝・不敗傳說',
    category: 'battle',
    badgeStyle: 'bg-gradient-to-r from-rose-700 to-red-800 border-rose-400/50',
    textColor: 'text-rose-100',
    description: '立於擂台頂端的巔峰棋聖，令對手聞風喪膽。',
    requirement: '累計勝場達到 25 場'
  },
  {
    id: 'title_overlord',
    name: '帝國終極霸主',
    category: 'battle',
    badgeStyle: 'bg-gradient-to-r from-red-900 via-orange-800 to-yellow-600 border-amber-300 shadow-amber-500/20 shadow-md',
    textColor: 'text-amber-100',
    description: '橫掃所有遊戲項目的至高無上擂台王者。',
    requirement: '累計勝場達到 50 場'
  },

  // 🎰 遊技場大師
  {
    id: 'title_gambler',
    name: '一賭成神・豪傑',
    category: 'casino',
    badgeStyle: 'bg-gradient-to-r from-amber-500 to-yellow-600 border-yellow-300 text-neutral-950 font-black',
    textColor: 'text-neutral-950',
    description: '在拉霸機拉出雙7/777或在俄羅斯輪盤笑到最後。',
    requirement: '於帝國遊技場贏得超過 500 金幣大獎'
  },
  {
    id: 'title_abyss',
    name: '深淵博弈狂徒',
    category: 'casino',
    badgeStyle: 'bg-gradient-to-r from-purple-900 to-slate-900 border-purple-500/40',
    textColor: 'text-purple-200',
    description: '享受與命運之神扣動扳機的刺激快感。',
    requirement: '於帝國遊技場遊玩超過 15 次'
  },
  {
    id: 'title_chosen',
    name: '天選之子・大獎得主',
    category: 'casino',
    badgeStyle: 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 border-emerald-300 shadow-emerald-500/20 shadow-md',
    textColor: 'text-white',
    description: '擊穿拉霸機 777 或通過輪盤第 5 關奪得全場獎池！',
    requirement: '奪取累積金幣大獎池'
  },

  // 💰 財富大亨
  {
    id: 'title_millionaire',
    name: '金幣百萬富翁',
    category: 'wealth',
    badgeStyle: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 border-yellow-200 text-neutral-900',
    textColor: 'text-neutral-900',
    description: '腰纏萬貫，金幣叮噹作響的帝國富商。',
    requirement: '個人持幣數達到 10,000 金幣'
  },
  {
    id: 'title_tycoon',
    name: '富可敵國・金金大亨',
    category: 'wealth',
    badgeStyle: 'bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-700 border-yellow-100 shadow-yellow-500/30 shadow-lg text-neutral-950',
    textColor: 'text-neutral-950',
    description: '帝國金融的幕後巨擘，揮金如土。',
    requirement: '個人持幣數達到 30,000 金幣'
  },

  // 👗 潮流時尚
  {
    id: 'title_trend',
    name: '潮流先鋒・新星',
    category: 'fashion',
    badgeStyle: 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-400/40',
    textColor: 'text-pink-100',
    description: '衣櫃裡擁有琳瑯滿目的服飾與飾品，引領穿搭風潮。',
    requirement: '解鎖並擁有 5 件以上自訂外觀'
  },
  {
    id: 'title_fashion_master',
    name: '百變千幻・千面星宿',
    category: 'fashion',
    badgeStyle: 'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-purple-600 border-pink-300 shadow-pink-500/20 shadow-md',
    textColor: 'text-white',
    description: '全套裝備、髮型、帽子、配件無所不包的頂級設計師。',
    requirement: '解鎖並擁有 12 件以上自訂外觀'
  },

  // 👑 特殊與管理員
  {
    id: 'title_boss',
    name: '黑金大掌櫃 (Boss)',
    category: 'special',
    badgeStyle: 'bg-gradient-to-r from-neutral-900 via-amber-900 to-neutral-950 border-amber-500 shadow-lg text-amber-300',
    textColor: 'text-amber-300',
    description: '帝國遊技場幕後掌舵人，統轄所有莊家牌桌與賠率機關。',
    requirement: '管理員 (Admin) 專屬尊爵稱號'
  },
  {
    id: 'title_overseer',
    name: '帝國首席典獄長',
    category: 'special',
    badgeStyle: 'bg-gradient-to-r from-red-950 via-zinc-900 to-black border-red-600 shadow-red-900/50 shadow-lg text-rose-300',
    textColor: 'text-rose-300',
    description: '維持受驗競技場絕對秩序的高階執行官。',
    requirement: '管理員 (Admin) 專屬尊爵稱號'
  }
];

export const DEFAULT_TITLE = TITLE_CATALOG[0];

export function getTitleById(id?: string): PlayerTitle {
  if (!id) return TITLE_CATALOG[0];
  return TITLE_CATALOG.find((t) => t.id === id) || TITLE_CATALOG[0];
}

export function isTitleUnlocked(title: PlayerTitle, user: any): boolean {
  if (title.unlockedByDefault) return true;
  if (user?.role === 'admin' && title.category === 'special') return true;
  if (user?.unlockedTitles?.includes(title.id)) return true;

  // Dynamic automatic checks
  if (title.id === 'title_first_blood' && (user?.wins ?? 0) >= 1) return true;
  if (title.id === 'title_strategist' && (user?.wins ?? 0) >= 5) return true;
  if (title.id === 'title_undefeated' && (user?.wins ?? 0) >= 15) return true;
  if (title.id === 'title_overlord' && (user?.wins ?? 0) >= 30) return true;
  if (title.id === 'title_millionaire' && (user?.coins ?? 0) >= 1000) return true;
  if (title.id === 'title_tycoon' && (user?.coins ?? 0) >= 5000) return true;
  if (title.id === 'title_trend' && (user?.unlockedItems?.length ?? 0) >= 3) return true;
  if (title.id === 'title_fashion_master' && (user?.unlockedItems?.length ?? 0) >= 8) return true;

  return false;
}
