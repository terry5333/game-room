export interface WardrobeItem {
  id: string;
  category: 'head' | 'outfit' | 'accessory' | 'stamp';
  name: string;
  desc: string;
  price: number;
  icon: string;
  tag?: string;
  rarity?: 'common' | 'rare' | 'epic';
}

export const DEFAULT_WARDROBE = {
  head: 'none',
  outfit: 'default',
  accessory: 'none',
  stamp: 'candidate'
};

export const WARDROBE_CATALOG: WardrobeItem[] = [
  // --- 頭飾帽子 HEAD ---
  {
    id: 'none',
    category: 'head',
    name: '素顏清爽',
    desc: '不佩戴任何頭飾，展現自然風采。',
    price: 0,
    icon: '👤',
    rarity: 'common'
  },
  {
    id: 'student_cap',
    category: 'head',
    name: '帝國高校黑制帽',
    desc: '昭和時代高等學府立領黑制帽，金屬徽章散發書卷莊重氣息。',
    price: 60,
    icon: '🎓',
    tag: '熱門經典',
    rarity: 'common'
  },
  {
    id: 'hachimaki',
    category: 'head',
    name: '必勝紅白布條',
    desc: '受驗生挑燈夜戰必備，額前繡著朱紅「必勝」二字，鬥志滿載！',
    price: 50,
    icon: '🎗️',
    tag: '熱血受驗',
    rarity: 'common'
  },
  {
    id: 'fox_mask',
    category: 'head',
    name: '稻荷神社狐狸面具',
    desc: '斜掛於髮際的朱白彩繪狐狸面具，神秘且自帶神社祭典風情。',
    price: 110,
    icon: '🦊',
    tag: '祭典風雅',
    rarity: 'rare'
  },
  {
    id: 'ronin_band',
    category: 'head',
    name: '大正浪人鋼鐵護額',
    desc: '粗布纏裹金屬護額，歷經對局風霜的孤高浪人標誌。',
    price: 80,
    icon: '⚔️',
    rarity: 'common'
  },
  {
    id: 'fedora',
    category: 'head',
    name: '昭和紳士軟呢禮帽',
    desc: '和洋折衷時期名士風範，深棕氈呢搭配深色緞帶，優雅出眾。',
    price: 120,
    icon: '🎩',
    tag: '和洋洋風',
    rarity: 'rare'
  },
  {
    id: 'ninja_mask',
    category: 'head',
    name: '隱密影忍黑面罩',
    desc: '深邃夜行面罩，只露出銳利的雙眼，專為冷靜破譯者設計。',
    price: 150,
    icon: '🥷',
    tag: '限定稀有',
    rarity: 'epic'
  },

  // --- 服裝戰袍 OUTFIT ---
  {
    id: 'default',
    category: 'outfit',
    name: '初心受驗生白衫',
    desc: '樸素乾淨的白襯衫，初入考場的初心象徵。',
    price: 0,
    icon: '👕',
    rarity: 'common'
  },
  {
    id: 'gakuran',
    category: 'outfit',
    name: '帝國黑學蘭高校服',
    desc: '挺拔硬挺的黑色立領制服，金色鈕扣熠熠生輝，昭和青春靈魂。',
    price: 120,
    icon: '🥋',
    tag: '鎮館之寶',
    rarity: 'rare'
  },
  {
    id: 'sailor',
    category: 'outfit',
    name: '昭和經典海軍水手服',
    desc: '藍白領襟搭配酒紅領巾，復古優雅的昭和校園經典裝束。',
    price: 120,
    icon: '🎀',
    tag: '復古人氣',
    rarity: 'rare'
  },
  {
    id: 'haori',
    category: 'outfit',
    name: '大正浪漫黑金羽織',
    desc: '墨黑底色織染金紋的典雅羽織，披在肩上自帶名門宗師氣派。',
    price: 180,
    icon: '👘',
    tag: '傳奇外觀',
    rarity: 'epic'
  },
  {
    id: 'jinbei',
    category: 'outfit',
    name: '夏日祭典甚平浴衣',
    desc: '藏青條紋純棉甚平，穿著涼爽俐落，散發夏夜花火與彈珠汽水香氣。',
    price: 130,
    icon: '🎆',
    rarity: 'common'
  },
  {
    id: 'dojo',
    category: 'outfit',
    name: '道場名譽黑帶武道服',
    desc: '厚磅白帆布武道服繫上斑駁黑帶，一拳一子皆是不屈意志。',
    price: 150,
    icon: '🥋',
    tag: '極限實力',
    rarity: 'rare'
  },
  {
    id: 'suit',
    category: 'outfit',
    name: '昭和格紋名士西裝',
    desc: '英倫毛呢剪裁復古西服，雙排扣搭配暗紅口袋巾，風度翩翩。',
    price: 200,
    icon: '👔',
    tag: '奢華名仕',
    rarity: 'epic'
  },

  // --- 隨身手持 ACCESSORY ---
  {
    id: 'none',
    category: 'accessory',
    name: '兩袖清風',
    desc: '雙手空空，以純粹智力應戰。',
    price: 0,
    icon: '✋',
    rarity: 'common'
  },
  {
    id: 'brush',
    category: 'accessory',
    name: '特製羊毫落字毛筆',
    desc: '大正老舖手工雕刻毛筆，飽蘸濃墨，落子如鐵劃銀鉤。',
    price: 50,
    icon: '🖌️',
    tag: '文房雅玩',
    rarity: 'common'
  },
  {
    id: 'shinai',
    category: 'accessory',
    name: '劍道修練黑漆竹劍',
    desc: '手持四片真竹組成的修練竹劍，氣刀體一致，壓制對手氣場！',
    price: 80,
    icon: '🗡️',
    rarity: 'common'
  },
  {
    id: 'abacus',
    category: 'accessory',
    name: '十三檔黃銅算盤',
    desc: '紫檀木框鑲嵌十三檔算盤，劈啪珠響之間破解萬般密碼難題。',
    price: 90,
    icon: '🧮',
    tag: '心算破譯',
    rarity: 'rare'
  },
  {
    id: 'fan',
    category: 'accessory',
    name: '泥金折扇【風林火山】',
    desc: '扇面揮毫「風林火山」，輕搖折扇沉思破局，運籌帷幄之中。',
    price: 110,
    icon: '🪭',
    tag: '儒雅軍師',
    rarity: 'rare'
  },
  {
    id: 'katana',
    category: 'accessory',
    name: '侍魂古銅銘刀',
    desc: '刀鞘纏黑繩的無銘太刀，鋒芒內斂，勝負就在拔刀一瞬。',
    price: 160,
    icon: '⚔️',
    tag: '絕世兵器',
    rarity: 'epic'
  },

  // --- 專屬名片戳章 STAMP ---
  {
    id: 'candidate',
    category: 'stamp',
    name: '【准考證印】',
    desc: '「受驗生」初試紅色印泥戳章，見證您的對弈起點。',
    price: 0,
    icon: '💮',
    rarity: 'common'
  },
  {
    id: 'passed',
    category: 'stamp',
    name: '【特許合格】',
    desc: '官方評定准考及格印，蓋在學生手冊上令人肅然起敬。',
    price: 60,
    icon: '㊗️',
    tag: '及格榮譽',
    rarity: 'common'
  },
  {
    id: 'master',
    category: 'stamp',
    name: '【破譯大師】',
    desc: '專屬 1A2B 與戰術推演專家，透析一切數字玄機之印。',
    price: 100,
    icon: '🎖️',
    tag: '智勇兼備',
    rarity: 'rare'
  },
  {
    id: 'undefeated',
    category: 'stamp',
    name: '【常勝不敗】',
    desc: '朱砂重筆刻印「不敗」，對弈等待室令敵手聞風喪膽。',
    price: 150,
    icon: '🏆',
    tag: '棋壇王者',
    rarity: 'rare'
  },
  {
    id: 'pro',
    category: 'stamp',
    name: '【帝國特級國手】',
    desc: '至高榮譽圓形雙圈鋼印，象徵對戰室頂點的極限造詣。',
    price: 220,
    icon: '👑',
    tag: '殿堂級別',
    rarity: 'epic'
  }
];

export const STAMP_DETAILS: Record<
  string,
  { label: string; kanji: string; desc: string; color: string; border: string }
> = {
  candidate: {
    label: '受驗生',
    kanji: '受驗',
    desc: '初入對弈學府的受驗生',
    color: 'text-amber-800',
    border: 'border-amber-800/40 bg-amber-500/10'
  },
  passed: {
    label: '特許及格',
    kanji: '合格',
    desc: '經考官認證對弈合格',
    color: 'text-emerald-800',
    border: 'border-emerald-700 bg-emerald-500/10'
  },
  master: {
    label: '破譯大師',
    kanji: '皆傳',
    desc: '心法大成之破譯皆傳宗師',
    color: 'text-blue-800',
    border: 'border-blue-700 bg-blue-500/10'
  },
  undefeated: {
    label: '常勝不敗',
    kanji: '不敗',
    desc: '百戰不屈，常勝將軍印記',
    color: 'text-rose-800',
    border: 'border-rose-700 bg-rose-500/10'
  },
  pro: {
    label: '特級國手',
    kanji: '特級',
    desc: '最高名譽，帝國特級國手',
    color: 'text-amber-900',
    border: 'border-amber-900 ring-1 ring-amber-700 bg-amber-600/15'
  }
};
