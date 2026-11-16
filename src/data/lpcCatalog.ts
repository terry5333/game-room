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

// 髮色色盤 (Base: blonde)
// 髮色色盤 (Base: red / LPC default spritesheet colors)
export const LPC_HAIR_PALETTES: LpcPaletteDef[] = [
  {
    id: 'dark_brown',
    name: '深濃黑褐',
    previewColor: '#4D3121',
    colors: ['#18100B', '#301F15', '#4D3323', '#734C34', '#996746', '#BF8963']
  },
  {
    id: 'black',
    name: '極致烏黑',
    previewColor: '#1C2222',
    colors: ['#0D0F12', '#1A1E24', '#2C323B', '#3F4752', '#5A6370', '#7E8999']
  },
  {
    id: 'blonde',
    name: '璀璨金髮',
    previewColor: '#FCCF56',
    colors: ['#351C06', '#6B4011', '#A66E1D', '#D99827', '#FCCF56', '#FFE794']
  },
  {
    id: 'light_brown',
    name: '溫暖淺棕',
    previewColor: '#8F5338',
    colors: ['#26150C', '#4A2A19', '#784428', '#A8633B', '#C98257', '#E8A77D']
  },
  {
    id: 'red',
    name: '烈焰赤紅 (原版)',
    previewColor: '#D12626',
    colors: ['#260D14', '#6A1108', '#A42600', '#BF4000', '#E55600', '#FF8A00']
  },
  {
    id: 'pink',
    name: '櫻花緋粉',
    previewColor: '#FA6BB7',
    colors: ['#300C1F', '#5E183D', '#992B65', '#D1418D', '#FA6BB7', '#FF9ED0']
  },
  {
    id: 'purple',
    name: '神秘暗紫',
    previewColor: '#8F42DE',
    colors: ['#1E0A30', '#3D1561', '#66249E', '#913BD9', '#BA66FF', '#D79EFF']
  },
  {
    id: 'blue',
    name: '冰川蔚藍',
    previewColor: '#3380DE',
    colors: ['#091A33', '#133566', '#20559E', '#3282DE', '#59A7FA', '#8EC5FF']
  },
  {
    id: 'green',
    name: '精靈翠綠',
    previewColor: '#2EA855',
    colors: ['#082612', '#114D25', '#1C7D3C', '#2AA852', '#52D179', '#85F2A5']
  },
  {
    id: 'white',
    name: '霜雪純白',
    previewColor: '#DEE7F2',
    colors: ['#3A414A', '#5C6673', '#8895A6', '#B5C3D4', '#DEE7F2', '#FFFFFF']
  },
  {
    id: 'gray',
    name: '冷冽灰銀',
    previewColor: '#6E7F8C',
    colors: ['#1E2226', '#333A42', '#4D5864', '#6D7C8C', '#92A3B5', '#B8C7D4']
  }
];

// 部位圖層權重定義 (由小至大渲染，數值小在底層、大在頂層)
export const LPC_LAYER_PRIORITY = {
  body: 10,
  bottom: 20,
  shoes: 30,
  top: 40,
  hair: 50,
  hat: 60,
  accessories: 70
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
    author: 'Stephen Challener (Redshrike), wulax, bluecarrot16, BenCreating, ElizaWy',
    license: 'OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0',
    description: '標準男角色像素骨架與走動動作'
  },
  {
    id: 'body_female',
    name: '女性冒險者體型',
    category: 'body',
    imagePath: 'body/female.png',
    layerOrder: LPC_LAYER_PRIORITY.body,
    genderSupport: 'female',
    author: 'Stephen Challener (Redshrike), wulax, bluecarrot16, makrohn, ElizaWy',
    license: 'OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0',
    description: '標準女角色像素骨架與走動動作'
  },

  // === 髮型 Hair ===
  {
    id: 'hair_bangsshort',
    name: '清爽短瀏海',
    price: 0,
    category: 'hair',
    imagePath: 'hair/bangsshort.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'JaidynReiman, Manuel Riecke (MrBeast)',
    license: 'CC-BY-SA 3.0 / GPL 3.0',
    description: '乾淨俐落的短髮與前瀏海'
  },
  {
    id: 'hair_bangslong',
    name: '古典長瀏海',
    category: 'hair',
    imagePath: 'hair/bangslong.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'JaidynReiman, Manuel Riecke (MrBeast)',
    license: 'CC-BY-SA 3.0 / GPL 3.0',
    description: '典雅的姬髮長髮造型'
  },
  {
    id: 'hair_bedhead',
    name: '微亂短髮',
    category: 'hair',
    imagePath: 'hair/bedhead.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'JaidynReiman, Manuel Riecke (MrBeast)',
    license: 'CC-BY-SA 3.0 / GPL 3.0',
    description: '剛睡醒般的自然蓬鬆短髮'
  },
  {
    id: 'hair_bob',
    name: '經典波波短髮',
    category: 'hair',
    imagePath: 'hair/bob.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'thecilekli, bluecarrot16, ElizaWy',
    license: 'CC0',
    description: '甜美俐落的波波齊肩短髮'
  },
  {
    id: 'hair_curtains',
    name: '復古中分髮',
    category: 'hair',
    imagePath: 'hair/curtains.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Mandi Paugh, bluecarrot16',
    license: 'CC-BY 3.0 / GPL 3.0',
    description: '時尚優雅的八字中分造型'
  },
  {
    id: 'hair_loose',
    name: '浪漫微捲長髮',
    category: 'hair',
    imagePath: 'hair/loose.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'JaidynReiman, Manuel Riecke (MrBeast)',
    license: 'CC-BY-SA 3.0 / GPL 3.0',
    description: '柔美飄逸的自然披肩長髮'
  },
  {
    id: 'hair_plain',
    name: '俐落平頭短髮',
    category: 'hair',
    imagePath: 'hair/plain.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Joe White, JaidynReiman, Manuel Riecke',
    license: 'OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0',
    description: '充滿活力的極簡短髮'
  },
  {
    id: 'hair_spiked',
    name: '刺蝟龐克頭',
    category: 'hair',
    imagePath: 'hair/spiked.png',
    layerOrder: LPC_LAYER_PRIORITY.hair,
    genderSupport: 'both',
    author: 'Fabzy, bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '熱血奔放的刺蝟造型髮'
  },

  // === 上衣 Tops ===
  {
    id: 'top_tshirt',
    name: '休閒圓領T恤',
    category: 'top',
    imagePath: 'tops/tshirt_male.png',
    femaleImagePath: 'tops/tshirt_female.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'ElizaWy, JaidynReiman, Stephen Challener, wulax',
    license: 'OGA-BY 3.0',
    description: '最百搭舒服的日常棉質T恤'
  },
  {
    id: 'top_formal',
    name: '紳士正式襯衫',
    category: 'top',
    imagePath: 'tops/formal_male.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0 / GPL 3.0',
    description: '挺拔修身的白色翻領襯衫'
  },
  {
    id: 'top_longsleeve',
    name: '冒險者長袖衫',
    category: 'top',
    imagePath: 'tops/longsleeve_male.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'ElizaWy, bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '野外探險防風耐磨長袖'
  },
  {
    id: 'top_plate',
    name: '騎士板甲胸甲',
    category: 'top',
    imagePath: 'tops/plate_male.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'Stephen Challener (Redshrike), LPC Artists',
    license: 'CC-BY-SA 3.0 / GPL 3.0',
    description: '閃爍金屬銀光的騎士防護板甲'
  },
  {
    id: 'top_jacket_black',
    name: '曜黑翻領夾克',
    category: 'top',
    imagePath: 'tops/collared_jacket_black.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0 / GPL 3.0',
    description: '酷炫黑色的立領皮革外套'
  },
  {
    id: 'top_jacket_red',
    name: '赤紅翻領夾克',
    category: 'top',
    imagePath: 'tops/collared_jacket_red.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0 / GPL 3.0',
    description: '亮眼酒紅的帥氣夾克外套'
  },
  {
    id: 'top_jacket_blue',
    name: '靛藍翻領夾克',
    category: 'top',
    imagePath: 'tops/collared_jacket_blue.png',
    layerOrder: LPC_LAYER_PRIORITY.top,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0 / GPL 3.0',
    description: '深沉冷峻的靛藍翻領風衣'
  },

  // === 褲子/下著 Bottoms ===
  {
    id: 'bottom_pants',
    name: '經典休閒長褲',
    category: 'bottom',
    imagePath: 'bottoms/pants_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'Stephen Challener (Redshrike), wulax, bluecarrot16',
    license: 'OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0',
    description: '簡約純色直筒工作長褲'
  },
  {
    id: 'bottom_cuffed',
    name: '折口牛仔長褲',
    category: 'bottom',
    imagePath: 'bottoms/cuffed_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'bluecarrot16, ElizaWy',
    license: 'CC-BY-SA 3.0',
    description: '帶有捲邊折口設計的潮流長褲'
  },
  {
    id: 'bottom_formal',
    name: '紳士正裝西裝褲',
    category: 'bottom',
    imagePath: 'bottoms/formal_male.png',
    layerOrder: LPC_LAYER_PRIORITY.bottom,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '俐落筆挺的深色紳士西裝褲'
  },

  // === 鞋子 Shoes ===
  {
    id: 'shoes_shoes',
    name: '輕便休閒鞋',
    category: 'shoes',
    imagePath: 'shoes/shoes_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'Stephen Challener (Redshrike), wulax',
    license: 'OGA-BY 3.0 / CC-BY-SA 3.0',
    description: '輕盈靈活的日常行走布鞋'
  },
  {
    id: 'shoes_boots',
    name: '探險皮革長靴',
    category: 'shoes',
    imagePath: 'shoes/boots_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'Stephen Challener (Redshrike), LPC Artists',
    license: 'OGA-BY 3.0 / CC-BY-SA 3.0',
    description: '適合翻山越嶺的堅固棕色皮靴'
  },
  {
    id: 'shoes_sandals',
    name: '清涼夏日涼鞋',
    category: 'shoes',
    imagePath: 'shoes/sandals_male.png',
    layerOrder: LPC_LAYER_PRIORITY.shoes,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '輕快通風的露趾探險涼鞋'
  },

  // === 帽子 Hats ===
  {
    id: 'hat_bandana',
    name: '遊俠忍道頭巾',
    category: 'hat',
    imagePath: 'hats/bandana.png',
    layerOrder: LPC_LAYER_PRIORITY.hat,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '繫於額前的紅色熱血武者頭巾'
  },
  {
    id: 'hat_leather_cap',
    name: '復古皮革獵帽',
    category: 'hat',
    imagePath: 'hats/leather_cap.png',
    layerOrder: LPC_LAYER_PRIORITY.hat,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '獵人與冒險者喜愛的皮革貝雷帽'
  },
  {
    id: 'hat_hood',
    name: '暗影匿蹤兜帽',
    category: 'hat',
    imagePath: 'hats/hood.png',
    layerOrder: LPC_LAYER_PRIORITY.hat,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '遮掩面容的神祕刺客連身兜帽'
  },

  // === 配件 Accessories ===
  {
    id: 'acc_glasses',
    name: '知性黑框眼鏡',
    category: 'accessories',
    imagePath: 'accessories/glasses.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '書卷氣息的經典黑色方框眼鏡'
  },
  {
    id: 'acc_glasses_round',
    name: '復古圓框眼鏡',
    category: 'accessories',
    imagePath: 'accessories/glasses_round.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '文藝氣質的細金屬邊圓框眼鏡'
  },
  {
    id: 'acc_glasses_sunglasses',
    name: '摩登潮流墨鏡',
    category: 'accessories',
    imagePath: 'accessories/glasses_sunglasses.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '帥氣防眩光的黑色太陽眼鏡'
  },
  {
    id: 'acc_belt_leather',
    name: '冒險者皮革腰帶',
    price: 100,
    category: 'accessories',
    imagePath: 'accessories/belt_leather.png',
    layerOrder: LPC_LAYER_PRIORITY.accessories,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '帶有精緻金屬扣頭的牛皮腰帶'
  },
  {
    id: 'top_chainmail',
    name: '鎖子甲戰袍',
    category: 'top',
    imagePath: 'tops/chainmail_male.png',
    layerOrder: 4,
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
    layerOrder: 4,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '結實耐穿的工匠職人背帶長衣',
    price: 180
  },
  {
    id: 'top_polo',
    name: '學院風 Polo 衫',
    category: 'top',
    imagePath: 'tops/polo_male.png',
    layerOrder: 4,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '清爽俐落的純棉短袖領口 Polo 衫',
    price: 120
  },
  {
    id: 'bottom_plate',
    name: '鐵壁戰鎧腿甲',
    category: 'bottom',
    imagePath: 'bottoms/plate_male.png',
    layerOrder: 3,
    genderSupport: 'both',
    author: 'Stephen Challener, Matthew Krohn',
    license: 'CC-BY-SA 3.0',
    description: '覆蓋厚鋼甲片的精悍戰士腿甲',
    price: 380
  },
  {
    id: 'bottom_shorts',
    name: '俐落休閒短褲',
    category: 'bottom',
    imagePath: 'bottoms/shorts_male.png',
    layerOrder: 3,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '活動自如的輕便純棉短褲',
    price: 100
  },
  {
    id: 'bottom_skirt',
    name: '百褶及膝短裙',
    category: 'bottom',
    imagePath: 'bottoms/skirt_male.png',
    layerOrder: 3,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '飄逸優雅的學院風百褶裙',
    price: 150
  },
  {
    id: 'bottom_pantaloons',
    name: '復古燈籠褲',
    category: 'bottom',
    imagePath: 'bottoms/pantaloons_male.png',
    layerOrder: 3,
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
    layerOrder: 3,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '緊緻俐落的黑色彈性戰鬥皮褲',
    price: 160
  },
  {
    id: 'shoes_plate',
    name: '騎士重裝鐵靴',
    category: 'shoes',
    imagePath: 'shoes/plate_male.png',
    layerOrder: 2,
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
    layerOrder: 2,
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
    layerOrder: 2,
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
    layerOrder: 2,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '透氣彈性佳的細繩十字綁帶舞鞋',
    price: 150
  },
  {
    id: 'hat_pirate',
    name: '霸氣海盜提督帽',
    category: 'hat',
    imagePath: 'hats/pirate_admiral.png',
    layerOrder: 6,
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
    layerOrder: 6,
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
    layerOrder: 6,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '印有冷酷白骷髏標誌的黑色街頭頭巾',
    price: 260
  },
  {
    id: 'hair_afro',
    name: '復古爆炸頭',
    category: 'hair',
    imagePath: 'hair/afro.png',
    layerOrder: 5,
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
    layerOrder: 5,
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
    layerOrder: 5,
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
    layerOrder: 5,
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
    layerOrder: 5,
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
    layerOrder: 5,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '精緻典雅、浪漫垂肩的長編織麻花辮',
    price: 250
  },
  {
    id: 'acc_gloves',
    name: '鐵衛護手拳套',
    category: 'accessories',
    imagePath: 'accessories/gloves_male.png',
    layerOrder: 5,
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
    layerOrder: 5,
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
    layerOrder: 5,
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
    layerOrder: 5,
    genderSupport: 'both',
    author: 'Stephen Challener, bluecarrot16',
    license: 'CC-BY-SA 3.0',
    description: '保護手腕與小臂的刻紋鋼鐵護手護腕',
    price: 160
  },
  {
    id: 'acc_belt_double',
    name: '雙環冒險家腰帶',
    category: 'accessories',
    imagePath: 'accessories/belt_double_male.png',
    layerOrder: 5,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '配有雙層扣環與多功能快扣的野外冒險腰帶',
    price: 180
  },
  {
    id: 'acc_cape',
    name: '英雄赤紅披風',
    category: 'accessories',
    imagePath: 'accessories/cape_solid.png',
    layerOrder: 1,
    genderSupport: 'both',
    author: 'bluecarrot16, LPC Artists',
    license: 'CC-BY-SA 3.0',
    description: '迎風飄揚、王者之氣四溢的赤紅英雄長披風',
    price: 500
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
