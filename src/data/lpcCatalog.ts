import { LpcCharacterConfig } from '../types';

export interface LpcPaletteDef {
  id: string;
  name: string;
  previewColor: string; // for UI color dots
  colors: string[];     // Hex array
}

export interface LpcItemDef {
  id: string;
  name: string;
  category: 'body' | 'hair' | 'top' | 'bottom' | 'shoes' | 'hat' | 'accessories';
  imagePath: string; // relative to /assets/lpc/
  femaleImagePath?: string; // alternate image for female body if applicable
  layerOrder: number; // Z-Index sorting: lower = back, higher = front
  genderSupport: 'male' | 'female' | 'both';
  author: string;
  license: string;
  description?: string;
  price?: number;
}

// 身體膚色色盤 (Base: light)
export const LPC_SKIN_PALETTES: LpcPaletteDef[] = [
  {
    id: 'light',
    name: '白皙象牙',
    previewColor: '#F9D5BA',
    colors: ['#271920', '#99423c', '#cc8665', '#E4A47C', '#F9D5BA', '#FAECE7']
  },
  {
    id: 'amber',
    name: '暖色蜜桃',
    previewColor: '#E6A56E',
    colors: ['#271920', '#85332E', '#B86542', '#DE8B59', '#F5BC93', '#FCE0CE']
  },
  {
    id: 'olive',
    name: '健康小麥',
    previewColor: '#C49168',
    colors: ['#21151B', '#70382B', '#995B3D', '#BD7E55', '#D49D75', '#E8C5AA']
  },
  {
    id: 'bronze',
    name: '陽光古銅',
    previewColor: '#A86C44',
    colors: ['#1C1217', '#5C2D23', '#80482F', '#A36846', '#BA805D', '#D9A989']
  },
  {
    id: 'brown',
    name: '深褐可可',
    previewColor: '#78462A',
    colors: ['#140D10', '#422019', '#5E3321', '#7A472E', '#965E42', '#B88165']
  },
  {
    id: 'black',
    name: '黝黑深曜',
    previewColor: '#4A2E1F',
    colors: ['#0A0608', '#26120E', '#3B1F14', '#4F2D1E', '#663E2B', '#85563E']
  },
  {
    id: 'zombie',
    name: '殭屍死靈',
    previewColor: '#8AA878',
    colors: ['#151C15', '#2E472E', '#486E48', '#689468', '#8AA878', '#B0CCA0']
  }
];

// 髮色色盤 (Base: red / LPC default spritesheet colors)
export const LPC_HAIR_PALETTES: LpcPaletteDef[] = [
  {
    id: 'dark_brown',
    name: '深濃黑褐',
    previewColor: '#422920',
    colors: ['#1a0f0d', '#2c1914', '#422920', '#633d30', '#8c5b48', '#ad7760']
  },
  {
    id: 'black',
    name: '漆黑曜石',
    previewColor: '#1F1F1F',
    colors: ['#0d0d0d', '#181818', '#252525', '#383838', '#545454', '#787878']
  },
  {
    id: 'blonde',
    name: '璀璨金燦',
    previewColor: '#E6C065',
    colors: ['#593c17', '#8a6224', '#b88937', '#deb354', '#f0cf78', '#fae5a0']
  },
  {
    id: 'light_brown',
    name: '淺栗亞麻',
    previewColor: '#8C5A37',
    colors: ['#2e190e', '#4f2e1a', '#734628', '#99633c', '#bf8254', '#dba476']
  },
  {
    id: 'red',
    name: '赤焰緋紅',
    previewColor: '#B83227',
    colors: ['#3b110e', '#661914', '#94261f', '#bf382f', '#de554b', '#f28379']
  },
  {
    id: 'pink',
    name: '櫻落粉嫩',
    previewColor: '#E87A90',
    colors: ['#521e28', '#803241', '#b04a5e', '#d96c82', '#f092a5', '#fac0cc']
  },
  {
    id: 'purple',
    name: '紫羅幻境',
    previewColor: '#7E4E9E',
    colors: ['#281438', '#42215c', '#64348a', '#864cb5', '#a56dd6', '#c99cf0']
  },
  {
    id: 'blue',
    name: '澄澈湛藍',
    previewColor: '#3478C6',
    colors: ['#0f2240', '#183c6e', '#245ca3', '#397fd4', '#5da1f2', '#8ec1fa']
  },
  {
    id: 'green',
    name: '翡翠森綠',
    previewColor: '#3E8E41',
    colors: ['#102912', '#1b471f', '#2a6e30', '#3e9c47', '#5ec268', '#8fe097']
  },
  {
    id: 'white',
    name: '銀霜素白',
    previewColor: '#E8ECF0',
    colors: ['#4d5359', '#707880', '#959ea6', '#bcc5cc', '#dce3e8', '#f5f7fa']
  },
  {
    id: 'gray',
    name: '煙燻灰階',
    previewColor: '#7D858C',
    colors: ['#242729', '#3b4045', '#575f66', '#76808a', '#98a2ad', '#bdc6cf']
  }
];

// 部位圖層權重定義 (由小至大渲染，數值小在底層、大在頂層)
export const LPC_LAYER_PRIORITY = {
  behind_body: 5,     // 披風後身 (acc_cape)
  body: 10,           // 身體素體
  head: 15,           // 人臉／頭部基底
  bottom: 20,         // 褲子、短褲、裙子
  shoes: 25,          // 鞋子 (在褲子之上，覆蓋長褲腳)
  top: 30,            // 內著、T恤、長袖、POLO
  jacket: 35,         // 外套、夾克、鎖子甲、吊帶衣、鎧甲 (在T恤與褲子之上)
  hair: 50,           // 髮型
  hat: 60,            // 帽子、頭飾
  accessories: 70     // 眼鏡、手套、肩甲、腰帶、護腕
};

// 完整 LPC 素材清單
export const LPC_ITEMS: LpcItemDef[] = [
  // === 身體 Body ===
  {
    id: 'body_male',
    name: '男性冒險者體型',
    category: 'body',
    imagePath: 'body/male.png',
    layerOrder: LPC_LAYER_PRIORITY.body,
    genderSupport: 'male',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '標準 LPC 健美男性身軀'
  },
  {
    id: 'body_female',
    name: '女性冒險者體型',
    category: 'body',
    imagePath: 'body/female.png',
    layerOrder: LPC_LAYER_PRIORITY.body,
    genderSupport: 'female',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '標準 LPC 柔美女性身軀'
  },

  // === 髮型 Hair ===
  {
    id: 'hair_bangsshort',
    name: '俐落齊瀏海短髮',
    category: 'hair',
    imagePath: 'hair/bangsshort.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '乾淨有精神的俐落短髮',
    price: 100
  },
  {
    id: 'hair_bangslong',
    name: '柔順長直髮',
    category: 'hair',
    imagePath: 'hair/bangslong.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '及腰飄逸的典雅長直髮',
    price: 150
  },
  {
    id: 'hair_bedhead',
    name: '慵懶微捲髮',
    category: 'hair',
    imagePath: 'hair/bedhead.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '自然隨興的蓬鬆微捲造型',
    price: 120
  },
  {
    id: 'hair_bob',
    name: '經典波波頭',
    category: 'hair',
    imagePath: 'hair/bob.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '弧度完美的俏麗波波短髮',
    price: 130
  },
  {
    id: 'hair_curtains',
    name: '復古中分髮',
    category: 'hair',
    imagePath: 'hair/curtains.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '90年代日系美男經典中分髮型',
    price: 110
  },
  {
    id: 'hair_loose',
    name: '狂野隨性長髮',
    category: 'hair',
    imagePath: 'hair/loose.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '不拘小節的浪漫流浪冒險者長髮',
    price: 140
  },
  {
    id: 'hair_plain',
    name: '樸素短碎髮',
    category: 'hair',
    imagePath: 'hair/plain.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '好整理的基本款日常短髮',
    price: 80
  },
  {
    id: 'hair_spiked',
    name: '熱血刺蝟頭',
    category: 'hair',
    imagePath: 'hair/spiked.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '帥氣俐落、充滿活力的刺蝟立體造型',
    price: 160
  },
  {
    id: 'hair_afro',
    name: '復古爆炸頭',
    category: 'hair',
    imagePath: 'hair/afro.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '蓬鬆飽滿、搖滾迪斯可風格的經典爆炸頭',
    price: 150
  },
  {
    id: 'hair_buzzcut',
    name: '俐落平頭',
    category: 'hair',
    imagePath: 'hair/buzzcut.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '硬派乾淨俐落的極短士兵平頭',
    price: 60
  },
  {
    id: 'hair_bob_part',
    name: '側分鮑伯短髮',
    category: 'hair',
    imagePath: 'hair/bob_side_part.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '知性俐落、線條分明的側分鮑伯頭',
    price: 180
  },
  {
    id: 'hair_bun',
    name: '俏皮包包頭',
    category: 'hair',
    imagePath: 'hair/bangs_bun.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '齊瀏海配可愛小包包髻的日系髮型',
    price: 200
  },
  {
    id: 'hair_ponytail',
    name: '活力高馬尾',
    category: 'hair',
    imagePath: 'hair/high_ponytail.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '清爽躍動、元氣滿滿的高束長馬尾',
    price: 220
  },
  {
    id: 'hair_braid',
    name: '仙氣長麻花辮',
    category: 'hair',
    imagePath: 'hair/braid.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '精緻典雅、浪漫垂肩的長編織麻花辮',
    price: 250
  },

  // === 上衣 Top (T恤/襯衫/外套/鎧甲) ===
  {
    id: 'top_tshirt',
    name: '休閒純棉短 T',
    category: 'top',
    imagePath: 'tops/tshirt_male.png',
    femaleImagePath: 'tops/tshirt_female.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '舒適透氣的百搭純棉短袖上衣',
    price: 80
  },
  {
    id: 'top_tshirt_gold',
    name: '金曜王者短 T',
    category: 'top',
    imagePath: 'tops/tshirt_gold.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '燦金光澤的帝國榮譽紀念短袖上衣',
    price: 260
  },
  {
    id: 'top_tshirt_black',
    name: '極黑街潮短 T',
    category: 'top',
    imagePath: 'tops/tshirt_black.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '深邃純黑、簡約俐落的街頭短袖上衣',
    price: 150
  },
  {
    id: 'top_polo',
    name: '學院風 Polo 衫',
    category: 'top',
    imagePath: 'tops/polo_male.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '清爽俐落的純棉領口 Polo 衫',
    price: 120
  },
  {
    id: 'top_polo_wine',
    name: '勃根地酒紅 Polo 衫',
    category: 'top',
    imagePath: 'tops/polo_wine.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '尊爵奢華深酒紅色的學院 Polo 衫',
    price: 240
  },
  {
    id: 'top_longsleeve',
    name: '修身休閒長袖',
    category: 'top',
    imagePath: 'tops/longsleeve_male.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '合身保暖的簡約長袖針織衫',
    price: 140
  },
  {
    id: 'top_longsleeve_navy',
    name: '海軍深藍針織長袖',
    category: 'top',
    imagePath: 'tops/longsleeve_navy.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '沉穩內斂的海軍蔚藍修身長袖衫',
    price: 220
  },
  {
    id: 'top_longsleeve_forest',
    name: '森林遊俠長袖衫',
    category: 'top',
    imagePath: 'tops/longsleeve_forest.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '叢林迷彩風墨綠獵人活動長袖',
    price: 220
  },
  {
    id: 'top_formal',
    name: '紳士正式襯衫',
    category: 'top',
    imagePath: 'tops/formal_male.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '貴族社交場合必備的優雅扣領長袖襯衫',
    price: 250
  },
  {
    id: 'top_formal_black',
    name: '黑曜燕尾禮服襯衫',
    category: 'top',
    imagePath: 'tops/formal_black.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '黑金配色的高級燕尾服正裝上衣',
    price: 480
  },
  {
    id: 'top_formal_crimson',
    name: '公爵緋紅盛裝禮服',
    category: 'top',
    imagePath: 'tops/formal_crimson.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '帝國公爵在受驗盛典穿著的血紅刺繡長上裝',
    price: 520
  },
  {
    id: 'top_jacket_black',
    name: '暗曜立領夾克',
    category: 'top',
    imagePath: 'tops/collared_jacket_black.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '俐落挺拔的經典黑曜立領休閒外套',
    price: 320
  },
  {
    id: 'top_jacket_red',
    name: '赤炎立領夾克',
    category: 'top',
    imagePath: 'tops/collared_jacket_red.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '熱情似火的烈焰紅色立領休閒外套',
    price: 320
  },
  {
    id: 'top_jacket_blue',
    name: '蔚藍立領夾克',
    category: 'top',
    imagePath: 'tops/collared_jacket_blue.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '沉穩優雅的皇家湛藍立領休閒外套',
    price: 320
  },
  {
    id: 'top_jacket_emerald',
    name: '翡翠獵裝風衣',
    category: 'top',
    imagePath: 'tops/collared_jacket_emerald.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '翡翠深綠的金屬排扣立領貴族大衣',
    price: 380
  },
  {
    id: 'top_jacket_white',
    name: '純白貴族大衣',
    category: 'top',
    imagePath: 'tops/collared_jacket_white.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '雪白無暇、銀絲鑲邊的帝國近衛風衣',
    price: 450
  },
  {
    id: 'top_jacket_purple',
    name: '幽紫魔導風衣',
    category: 'top',
    imagePath: 'tops/collared_jacket_purple.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '散發神秘氣息的深紫色鍊金魔術風衣',
    price: 420
  },
  {
    id: 'top_plate',
    name: '鋼鐵騎士重鎧',
    category: 'top',
    imagePath: 'tops/plate_male.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'Stephen Challener, Matthew Krohn',
    license: 'CC-BY-SA 3.0',
    description: '厚重堅固、能抵禦強大衝擊的騎士全身板甲',
    price: 450
  },
  {
    id: 'top_plate_gold',
    name: '黃金聖殿重鎧',
    category: 'top',
    imagePath: 'tops/plate_gold.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '金光璀璨、刻有聖殿銘文的傳奇黃金胸甲',
    price: 880
  },
  {
    id: 'top_plate_dark',
    name: '黑曜夜煞胸甲',
    category: 'top',
    imagePath: 'tops/plate_dark.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '消光深曜玄鐵鑄造、不留一絲反光的暗夜重甲',
    price: 680
  },
  {
    id: 'top_chainmail',
    name: '鎖子甲戰袍',
    category: 'top',
    imagePath: 'tops/chainmail_male.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'LPC Community, Matthew Krohn',
    license: 'CC-BY-SA 3.0',
    description: '密織精鋼環鍊的防護戰甲上衣',
    price: 350
  },
  {
    id: 'top_overalls',
    name: '工裝吊帶襯衫',
    category: 'top',
    imagePath: 'tops/overalls_male.png',
    layerOrder: LPC_LAYER_PRIORITY.jacket,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '結實耐穿的工匠職人背帶長衣',
    price: 180
  },

  // === 褲子/下著 Bottom ===
  {
    id: 'bottom_pants',
    name: '經典直筒長褲',
    category: 'bottom',
    imagePath: 'bottoms/pants_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '舒適俐落的基本款長褲',
    price: 90
  },
  {
    id: 'bottom_pants_black',
    name: '曜黑修身西裝褲',
    category: 'bottom',
    imagePath: 'bottoms/pants_black.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '剪裁得體、百搭萬能的純黑修身長褲',
    price: 160
  },
  {
    id: 'bottom_pants_khaki',
    name: '卡其休閒工裝長褲',
    category: 'bottom',
    imagePath: 'bottoms/pants_khaki.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '耐磨透氣的經典大地卡其色休閒褲',
    price: 150
  },
  {
    id: 'bottom_pants_navy',
    name: '海軍深藍學院長褲',
    category: 'bottom',
    imagePath: 'bottoms/pants_navy.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '昭和高校受驗生的標準藏青色長褲',
    price: 180
  },
  {
    id: 'bottom_pants_white',
    name: '象牙白貴族西褲',
    category: 'bottom',
    imagePath: 'bottoms/pants_white.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '雍容華貴的純白綢緞修身長褲',
    price: 240
  },
  {
    id: 'bottom_cuffed',
    name: '反摺束口工裝褲',
    category: 'bottom',
    imagePath: 'bottoms/cuffed_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '戶外探險必備的耐磨束口褲',
    price: 120
  },
  {
    id: 'bottom_cuffed_dark',
    name: '墨黑街頭反摺褲',
    category: 'bottom',
    imagePath: 'bottoms/cuffed_dark.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '街頭滑板潮流風格的純黑束口褲',
    price: 180
  },
  {
    id: 'bottom_cuffed_olive',
    name: '軍綠戶外機能束口褲',
    category: 'bottom',
    imagePath: 'bottoms/cuffed_olive.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '野外求生專用、具備防水塗層的軍綠褲',
    price: 200
  },
  {
    id: 'bottom_formal',
    name: '禮服合身長褲',
    category: 'bottom',
    imagePath: 'bottoms/formal_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '垂墜感極佳的宴會西裝長褲',
    price: 160
  },
  {
    id: 'bottom_shorts',
    name: '俐落休閒短褲',
    category: 'bottom',
    imagePath: 'bottoms/shorts_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '活動自如的輕便純棉短褲',
    price: 100
  },
  {
    id: 'bottom_shorts_denim',
    name: '單寧刷色牛仔短褲',
    category: 'bottom',
    imagePath: 'bottoms/shorts_denim.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '美式復古刷色丹寧牛仔五分短褲',
    price: 160
  },
  {
    id: 'bottom_shorts_black',
    name: '曜黑運動速乾短褲',
    category: 'bottom',
    imagePath: 'bottoms/shorts_black.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '極致輕量、透氣速乾的黑曜運動短褲',
    price: 130
  },
  {
    id: 'bottom_skirt',
    name: '百褶及膝短裙',
    category: 'bottom',
    imagePath: 'bottoms/skirt_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '飄逸優雅的學院風百褶裙',
    price: 150
  },
  {
    id: 'bottom_skirt_navy',
    name: '海軍水手百褶裙',
    category: 'bottom',
    imagePath: 'bottoms/skirt_navy.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '昭和女子高等學校定番海軍藍制服裙',
    price: 210
  },
  {
    id: 'bottom_skirt_crimson',
    name: '蘇格蘭緋紅格紋裙',
    category: 'bottom',
    imagePath: 'bottoms/skirt_crimson.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '經典貴族學院風格的英倫紅黑百褶短裙',
    price: 260
  },
  {
    id: 'bottom_pantaloons',
    name: '復古燈籠褲',
    category: 'bottom',
    imagePath: 'bottoms/pantaloons_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '寬鬆透氣的歐式宮廷燈籠長褲',
    price: 220
  },
  {
    id: 'bottom_leggings',
    name: '貼身戰術皮褲',
    category: 'bottom',
    imagePath: 'bottoms/leggings_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '緊緻俐落的黑色彈性戰鬥皮褲',
    price: 160
  },
  {
    id: 'bottom_plate',
    name: '鐵壁戰鎧腿甲',
    category: 'bottom',
    imagePath: 'bottoms/plate_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'Stephen Challener, Matthew Krohn',
    license: 'CC-BY-SA 3.0',
    description: '覆蓋厚鋼甲片的精悍戰士腿甲',
    price: 380
  },
  {
    id: 'bottom_plate_gold',
    name: '聖殿黃金甲胄腿甲',
    category: 'bottom',
    imagePath: 'bottoms/plate_gold.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '黃金護膝與雕花護甲片的聖殿騎士戰裙',
    price: 750
  },
  {
    id: 'bottom_plate_dark',
    name: '黑曜夜曜重裝腿甲',
    category: 'bottom',
    imagePath: 'bottoms/plate_dark.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'LPC Community, Re-graded',
    license: 'CC-BY-SA 3.0',
    description: '深曜玄鐵重型護腿，防禦固若金湯',
    price: 580
  },

  // === 鞋子 Shoes ===
  {
    id: 'shoes_shoes',
    name: '皮質漫步鞋',
    category: 'shoes',
    imagePath: 'shoes/shoes_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'Johannes Sjölund (wulax)',
    license: 'CC-BY-SA 3.0',
    description: '輕巧柔軟的牛皮便鞋',
    price: 80
  },
  {
    id: 'shoes_boots',
    name: '硬派冒險長靴',
    category: 'shoes',
    imagePath: 'shoes/boots_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'Johannes Sjölund (wulax)',
    license: 'CC-BY-SA 3.0',
    description: '跋山涉水必備的加厚皮靴',
    price: 160
  },
  {
    id: 'shoes_sandals',
    name: '清爽綁帶涼鞋',
    category: 'shoes',
    imagePath: 'shoes/sandals_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'Manuel S., bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '夏日悠閒微風涼鞋',
    price: 60
  },
  {
    id: 'shoes_plate',
    name: '騎士重裝鐵靴',
    category: 'shoes',
    imagePath: 'shoes/plate_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'Stephen Challener, Matthew Krohn',
    license: 'CC-BY-SA 3.0',
    description: '沉穩厚重並能格擋猛烈攻擊的鋼鐵戰靴',
    price: 320
  },
  {
    id: 'shoes_slippers',
    name: '輕盈宮廷便鞋',
    category: 'shoes',
    imagePath: 'shoes/slippers_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '絲絨柔軟且無聲無息的室內軟鞋',
    price: 90
  },
  {
    id: 'shoes_rimmed',
    name: '精靈翻邊長皮靴',
    category: 'shoes',
    imagePath: 'shoes/rimmed_boots_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '經典翻邊設計的森林遊俠長筒靴',
    price: 200
  },
  {
    id: 'shoes_ghillies',
    name: '綁帶舞鞋',
    category: 'shoes',
    imagePath: 'shoes/ghillies_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '透氣彈性佳的細繩十字綁帶舞鞋',
    price: 150
  },

  // === 帽子 Hat ===
  {
    id: 'hat_bandana',
    name: '冒險家方巾',
    category: 'hat',
    imagePath: 'hats/bandana.png',
    layerOrder: LPC_LAYER_PRIORITY.hat,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '俐落率性的純棉綁巾',
    price: 70
  },
  {
    id: 'hat_leather_cap',
    name: '獵人皮革軟帽',
    category: 'hat',
    imagePath: 'hats/leather_cap.png',
    layerOrder: LPC_LAYER_PRIORITY.hat,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '林間穿梭必備的防風保暖皮帽',
    price: 120
  },
  {
    id: 'hat_hood',
    name: '刺客暗影兜帽',
    category: 'hat',
    imagePath: 'hats/hood.png',
    layerOrder: LPC_LAYER_PRIORITY.hat,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '遮掩面容、融入夜色的神秘連身兜帽',
    price: 280
  },
  {
    id: 'hat_pirate',
    name: '霸氣海盜提督帽',
    category: 'hat',
    imagePath: 'hats/pirate_admiral.png',
    layerOrder: LPC_LAYER_PRIORITY.hat,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '金邊鑲邊、威風凜凜的七海霸主提督帽',
    price: 450
  },
  {
    id: 'hat_headband',
    name: '熱血運動頭帶',
    category: 'hat',
    imagePath: 'hats/headband_thick.png',
    layerOrder: LPC_LAYER_PRIORITY.hat,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '吸汗透氣、展現無限鬥志的寬版運動頭帶',
    price: 80
  },
  {
    id: 'hat_skull_bandana',
    name: '狂暴骷髏頭巾',
    category: 'hat',
    imagePath: 'hats/bandana_skull.png',
    layerOrder: LPC_LAYER_PRIORITY.hat,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '印有冷酷白骷髏標誌的黑色街頭頭巾',
    price: 260
  },

  // === 配件 Accessories ===
  {
    id: 'acc_cape',
    name: '英雄赤紅披風',
    category: 'accessories',
    imagePath: 'accessories/cape_solid.png',
    layerOrder: LPC_LAYER_PRIORITY.behind_body,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '迎風飄揚、王者之氣四溢的赤紅英雄長披風',
    price: 500
  },
  {
    id: 'acc_glasses',
    name: '知性黑框眼鏡',
    category: 'accessories',
    imagePath: 'accessories/glasses.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '充滿書卷氣息的文青經典黑框鏡架',
    price: 90
  },
  {
    id: 'acc_glasses_round',
    name: '復古圓框金鏡',
    category: 'accessories',
    imagePath: 'accessories/glasses_round.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '優雅斯文的細金屬絲復古圓框眼鏡',
    price: 150
  },
  {
    id: 'acc_glasses_sunglasses',
    name: '極黑街頭墨鏡',
    category: 'accessories',
    imagePath: 'accessories/glasses_sunglasses.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '冷酷神秘的防炫光遮陽太陽眼鏡',
    price: 180
  },
  {
    id: 'acc_belt_leather',
    name: '復古黃銅皮帶',
    category: 'accessories',
    imagePath: 'accessories/belt_leather.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '帶有精緻金屬扣頭的牛皮腰帶',
    price: 100
  },
  {
    id: 'acc_belt_double',
    name: '雙環冒險家腰帶',
    category: 'accessories',
    imagePath: 'accessories/belt_double_male.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '配有雙層扣環與多功能快扣的野外冒險腰帶',
    price: 180
  },
  {
    id: 'acc_gloves',
    name: '鐵衛護手拳套',
    category: 'accessories',
    imagePath: 'accessories/gloves_male.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'Stephen Challener, bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '加固指關節與掌心的專業搏擊皮手套',
    price: 130
  },
  {
    id: 'acc_pauldrons',
    name: '獅鷲重裝雙肩甲',
    category: 'accessories',
    imagePath: 'accessories/pauldrons_male.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'Stephen Challener, bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '威武雄壯的重裝騎士金屬肩鎧',
    price: 300
  },
  {
    id: 'acc_epaulets',
    name: '皇家金穗肩章',
    category: 'accessories',
    imagePath: 'accessories/epaulets_male.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '閃耀金色流蘇的近衛軍提督儀仗肩飾',
    price: 280
  },
  {
    id: 'acc_bracers',
    name: '獵人精鋼護腕',
    category: 'accessories',
    imagePath: 'accessories/bracers_male.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'Stephen Challener, bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '保護手腕與小臂的刻紋鋼鐵護手護腕',
    price: 160
  }
];

// 預設冒險者角色配置
export const DEFAULT_LPC_CHARACTER: LpcCharacterConfig = {
  characterId: 'char_default',
  gender: 'male',
  body: 'body_male',
  skinTone: 'light',
  hair: 'hair_bangsshort',
  hairColor: 'dark_brown',
  top: 'top_tshirt',
  bottom: 'bottom_pants',
  shoes: 'shoes_shoes',
  hat: 'none',
  accessories: ['acc_glasses']
};
