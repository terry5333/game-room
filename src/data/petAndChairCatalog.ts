import type { UserPetProfile } from '../types';

export interface ChairItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  rarity: 'normal' | 'rare' | 'epic' | 'legendary';
}

export interface PetSpecies {
  id: string;
  name: string;
  speciesName: string;
  description: string;
  price: number;
  icon: string;
  favoriteFood: string;
  foodIcon: string;
  catchphrase: string;
  rarity: 'normal' | 'rare' | 'epic' | 'legendary';
}

export const CHAIR_CATALOG: ChairItem[] = [
  {
    id: 'wooden_chair',
    name: '昭和學堂木椅',
    description: '經典古樸的昭和學堂木椅，帶有溫潤厚實的木紋與懷舊刻痕，安心端坐解密。',
    price: 0,
    icon: '🪑',
    rarity: 'normal'
  },
  {
    id: 'retro_sofa',
    name: '復古牛皮單人沙發',
    description: '深酒紅色真皮軟墊，搭配古典銅質鉚釘與木雕扶手，受驗名仕的沉穩之選。',
    price: 120,
    icon: '🛋️',
    rarity: 'rare'
  },
  {
    id: 'royal_throne',
    name: '帝國黃金御座',
    description: '燦金獅首浮雕頂飾與深紅天鵝絨靠墊，散發出獨步天下的破譯王者霸氣！',
    price: 300,
    icon: '👑',
    rarity: 'legendary'
  },
  {
    id: 'gaming_chair',
    name: '極光霓虹電競椅',
    description: '人體工學賽車桶椅，流光溢彩的 RGB 霓虹燈條，專為極限秒答而生！',
    price: 200,
    icon: '⚡',
    rarity: 'epic'
  },
  {
    id: 'beanbag',
    name: '綿柔舒壓懶骨頭',
    description: '超軟微粒棉花填充，陷進去就像被雲朵擁抱，一邊擼寵物一邊下棋的極致享受。',
    price: 150,
    icon: '☁️',
    rarity: 'rare'
  },
  {
    id: 'tatami',
    name: '櫻花和風座蒲團',
    description: '天然藺草編織坐墊，散發青草清香，綴有淡粉櫻花織錦滾邊，心境澄澈。',
    price: 100,
    icon: '🌸',
    rarity: 'normal'
  }
];

export const PET_CATALOG: PetSpecies[] = [
  {
    id: 'shiba',
    name: '柴柴',
    speciesName: '元氣赤柴犬',
    description: '元氣滿滿的赤柴，喜歡狂搖尾巴吐舌頭，是受驗生最忠誠可靠的開運夥伴。',
    price: 0,
    icon: '🐕',
    favoriteFood: '香脆骨頭餅乾',
    foodIcon: '🍖',
    catchphrase: '汪汪！主人今天也是連勝王！汪！',
    rarity: 'normal'
  },
  {
    id: 'calico_cat',
    name: '花花',
    speciesName: '慵懶三花貓',
    description: '溫順愛撒嬌的三花貓，喜歡趴在主人腳邊打呼嚕，時不時伸出粉紅小肉球。',
    price: 150,
    icon: '🐈',
    favoriteFood: '鮮甜小魚乾',
    foodIcon: '🐟',
    catchphrase: '喵嗚～呼嚕呼嚕...zzz（蹭蹭主人的腳）',
    rarity: 'rare'
  },
  {
    id: 'capybara',
    name: '豚豚',
    speciesName: '溫泉水豚君',
    description: '頂著一顆金黃柚子、情緒無比平靜的水豚，擁有穩定心神、化解焦慮的神奇魔力。',
    price: 200,
    icon: '🦫',
    favoriteFood: '翠綠鮮高麗菜',
    foodIcon: '🥬',
    catchphrase: '呼嚕...（頭上的橘子微微晃動，表情極度祥和）',
    rarity: 'epic'
  },
  {
    id: 'penguin',
    name: '波波',
    speciesName: '南極小企鵝',
    description: '圓滾滾穿著燕尾服的小紳士，走起路來左右搖搖晃晃，興奮時會猛拍小翅膀！',
    price: 180,
    icon: '🐧',
    favoriteFood: '極地晶亮小磷蝦',
    foodIcon: '🦐',
    catchphrase: '嘎！嘎！（努力拍動小翅膀為主人鼓掌！）',
    rarity: 'rare'
  },
  {
    id: 'lucky_cat',
    name: '招財',
    speciesName: '金運招財貓',
    description: '繫著朱紅緞帶與金鈴鐺的招財靈貓，右手招財、左手招勝，據說能帶來驚天逆轉運！',
    price: 250,
    icon: '🐱',
    favoriteFood: '頂級海苔肉泥條',
    foodIcon: '🍙',
    catchphrase: '喵～金幣與連勝好運，通通湧進來吧！',
    rarity: 'epic'
  },
  {
    id: 'slime',
    name: '啾啾',
    speciesName: '彈力果凍史萊姆',
    description: '晶瑩剔透的水藍色凝膠精靈，富彈性且熱愛跳動，會在椅子旁邊啵啵啵地變形。',
    price: 120,
    icon: '💧',
    favoriteFood: '彩虹水果星糖',
    foodIcon: '🍬',
    catchphrase: '啵啵～啵啵！（彈跳出一顆閃亮小愛心！）',
    rarity: 'normal'
  }
];

export interface OutfitItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  rarity: 'normal' | 'rare' | 'epic' | 'legendary';
}

export const OUTFIT_CATALOG: OutfitItem[] = [
  {
    id: 'gakuran',
    name: '昭和帝國制服',
    description: '挺拔修身的深藍立領黑金制服，經典黃銅鈕扣，受驗精英的標準正裝。',
    price: 0,
    icon: '👔',
    rarity: 'normal'
  },
  {
    id: 'sailor',
    name: '學院水手風制服',
    description: '純白滾邊水手大翻領與胸前紅絲帶領結，青春活力、清爽俐落。',
    price: 100,
    icon: '🎀',
    rarity: 'rare'
  },
  {
    id: 'trench',
    name: '復古厚呢風衣',
    description: '福爾摩斯雙排扣英倫風衣，寬腰帶與翻折領口，散發名偵探的銳利氣場。',
    price: 150,
    icon: '🧥',
    rarity: 'epic'
  },
  {
    id: 'hoodie',
    name: '街頭連帽休閒衫',
    description: '運動潮流拼接連帽T恤，大容量前置口袋，下棋喝茶最放鬆的隨興穿搭。',
    price: 120,
    icon: '👕',
    rarity: 'normal'
  },
  {
    id: 'haori',
    name: '日式傳統羽織甚平',
    description: '和風浮世繪寬袖羽織，胸前交叉交領與繫繩，典雅端莊、沉穩自得。',
    price: 180,
    icon: '👘',
    rarity: 'rare'
  },
  {
    id: 'cyber',
    name: '賽博霓虹特工裝',
    description: '未來賽博高領防風夾克，鑲嵌動態青藍流光飾邊，專為極速破譯打造。',
    price: 220,
    icon: '⚡',
    rarity: 'legendary'
  },
  {
    id: 'tuxedo',
    name: '昭和洋風執事燕尾服',
    description: '典雅黑色雙開衩修身燕尾西裝，純白硬領襯衫與酒紅領結，奢華名仕風範。',
    price: 250,
    icon: '🤵',
    rarity: 'epic'
  },
  {
    id: 'kimono',
    name: '櫻吹雪大正振袖和服',
    description: '淡粉櫻瓣印花華美和服，配以金紋朱紅寬腰封與振袖長擺，風姿卓絕。',
    price: 260,
    icon: '🌸',
    rarity: 'legendary'
  },
  {
    id: 'wizard',
    name: '星空占星大魔導長袍',
    description: '深邃夜藍星空法袍，繡有金絲星宿符文，散發神祕莫測的預知靈光。',
    price: 280,
    icon: '🧙',
    rarity: 'epic'
  },
  {
    id: 'gold_armor',
    name: '帝國黃金重裝鎧甲',
    description: '百戰不殞的純金鍛造胸甲與肩甲，光芒耀眼，專屬於連勝霸主的無上榮耀。',
    price: 350,
    icon: '🛡️',
    rarity: 'legendary'
  },
  {
    id: 'ninja',
    name: '暗夜影忍隱密裝束',
    description: '全黑緊身夜行忍裝，交叉朱紅束腰，身手敏捷、如影隨形。',
    price: 200,
    icon: '🥷',
    rarity: 'rare'
  },
  {
    id: 'tracksuit',
    name: '昭和熱血必勝運動衫',
    description: '紅白經典雙槓體育合宿運動夾克，胸前印有必勝二字，青春滿溢！',
    price: 130,
    icon: '🏃',
    rarity: 'normal'
  }
];

export interface AccessoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: 'head' | 'face' | 'neck' | 'back';
  rarity: 'normal' | 'rare' | 'epic' | 'legendary';
}

export const ACCESSORY_CATALOG: AccessoryItem[] = [
  {
    id: 'glasses',
    name: '昭和黑框文士眼鏡',
    description: '沉穩知性的復古黑框眼鏡，戴上後智力與洞察力似乎翻倍！',
    price: 50,
    icon: '👓',
    category: 'face',
    rarity: 'normal'
  },
  {
    id: 'monocle',
    name: '帝國名仕金絲單片鏡',
    description: '懸垂細金鏈的右眼單片鏡，貴族推理名偵探的標配行頭。',
    price: 80,
    icon: '🧐',
    category: 'face',
    rarity: 'rare'
  },
  {
    id: 'cap',
    name: '高校黑金學生制帽',
    description: '挺拔的金屬徽章大簷黑制帽，散發高等學府精英氣質。',
    price: 70,
    icon: '🎓',
    category: 'head',
    rarity: 'normal'
  },
  {
    id: 'fox_mask',
    name: '稻荷神社白紅狐狸面具',
    description: '斜掛於髮際的朱紅花紋白狐面具，神秘悠遠的神社祭典風情。',
    price: 110,
    icon: '🦊',
    category: 'head',
    rarity: 'rare'
  },
  {
    id: 'cat_ears',
    name: '萌萌軟毛貓耳髮箍',
    description: '絨毛粉嫩的小貓雙耳髮箍，隨主人的心情俏皮晃動。',
    price: 90,
    icon: '🐱',
    category: 'head',
    rarity: 'normal'
  },
  {
    id: 'devil_horns',
    name: '頑皮黑曜石惡魔雙角',
    description: '頭頂微微彎曲的深紅小惡魔尖犄角，狡黠俏皮。',
    price: 100,
    icon: '😈',
    category: 'head',
    rarity: 'rare'
  },
  {
    id: 'halo',
    name: '天界耀金聖潔光環',
    description: '懸浮於頭頂的金光神聖天使光環，彷彿自帶開運祈福護罩。',
    price: 140,
    icon: '😇',
    category: 'head',
    rarity: 'epic'
  },
  {
    id: 'crown',
    name: '迷你純金帝國王冠',
    description: '鑲嵌藍紅寶石的小巧純金王冠，棋盤之王專屬桂冠！',
    price: 180,
    icon: '👑',
    category: 'head',
    rarity: 'legendary'
  },
  {
    id: 'tie',
    name: '受驗生深紅修身長領帶',
    description: '一絲不苟的端正深紅領帶，展現沉著穩健的受驗姿態。',
    price: 40,
    icon: '👔',
    category: 'neck',
    rarity: 'normal'
  },
  {
    id: 'ribbon',
    name: '昭和水手紅緞蝴蝶結',
    description: '胸前俏麗的鮮紅絲綢蝴蝶結，靈動飄逸。',
    price: 40,
    icon: '🎀',
    category: 'neck',
    rarity: 'normal'
  },
  {
    id: 'scarf',
    name: '冬日流蘇暖陽圍巾',
    description: '厚實溫暖的深紅針織圍巾，寒冬對弈時的最佳守護。',
    price: 60,
    icon: '🧣',
    category: 'neck',
    rarity: 'normal'
  },
  {
    id: 'wings',
    name: '聖潔天界羽翼',
    description: '背後徐徐展開的純白羽毛翅膀，夢幻聖潔。',
    price: 160,
    icon: '🪽',
    category: 'back',
    rarity: 'epic'
  },
  {
    id: 'bat_wings',
    name: '暗夜蝙蝠惡魔雙翼',
    description: '背後張開的深紫黑色夜魔雙翅，氣場十足！',
    price: 160,
    icon: '🦇',
    category: 'back',
    rarity: 'epic'
  },
  {
    id: 'hachimaki',
    name: '熱血必勝紅白頭帶',
    description: '挑燈夜戰必備布條，額前朱紅大字「必勝」！',
    price: 50,
    icon: '🎗️',
    category: 'head',
    rarity: 'normal'
  }
];

export const DEFAULT_PET_PROFILE: UserPetProfile = {
  character: {
    gender: 'male',
    skinTone: '#FDDCB5',
    hairStyle: 'short',
    hairColor: '#2C3E50',
    outfitStyle: 'gakuran',
    outfitColor: '#628395',
    accessory: 'none',
    accessories: [],
    chairId: 'wooden_chair',
    petId: 'shiba'
  },
  pet: {
    id: 'shiba',
    name: '柴柴',
    level: 1,
    exp: 0,
    maxExp: 50,
    hunger: 80,
    intimacy: 60,
    mood: 90,
    cleanliness: 95,
    health: 100,
    isDead: false,
    lastFed: Date.now(),
    lastPetted: Date.now(),
    lastPlayed: Date.now(),
    lastBathed: Date.now()
  },
  unlockedChairs: ['wooden_chair'],
  unlockedPets: ['shiba'],
  unlockedOutfits: ['gakuran'],
  unlockedAccessories: ['none']
};
