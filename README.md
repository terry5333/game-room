# 遊戲室 (Game Room) 🎮

> 昭和摩登與復古毛玻璃風格的線上多人即時對戰遊藝平台。  
> 融合經典棋盤對弈、自研 2D 像素全身換裝引擎、帝國受驗准考證社交體系與地下遊技場經營。

🌐 **線上正式網址**：[https://game-room.terry0215.com](https://game-room.terry0215.com)  
🎯 **1A2B 單人專用版**：[https://1a2b.terry0215.com](https://1a2b.terry0215.com)

---

## 🌟 核心特色一覽

- **⚔️ 六款經典對戰小遊戲**：1A2B、海戰棋、賓果 5x5、點線棋、無限 OOXX、四子棋。
- **👗 Universal LPC 2D 像素自訂換裝室**：40+ 款服裝、髮型、帽子與飾品即時換裝，像素調色盤即時換色，金幣購買解鎖。
- **👥 雙重肖像雙軌並行 (Dual Portrait)**：排行榜、名片准考證、房間等待隊列同時呈現「**真人相片頭像**」與「**自訂 2D 全身像素角色**」。
- **📜 帝國受驗生准考證（名片系統）**：復古四角黃銅扣證件相框、官方「對弈認可」朱印、真實對弈勝率與戰績、個人座右銘自介。
- **🆔 4 碼純數字玩家編號**：全面告別雜亂的英文 UID，統一採用乾淨俐落的 4 位數專屬代碼（如 `#0215`）。
- **🥇 帝國財富排行榜 TOP 3**：首頁正方形獨立卡片，即時排定金幣最多的受驗生（金座・榜首、銀座・次席、銅座・季席）。
- **🎰 帝國地下遊技場 & 老闆後台**：復古拉霸機、九宮格刮刮樂，搭配管理員查帳日誌（Audit Log）、即時賠率調控與服飾商城定價面板。
- **🎖️ 達成條件榮譽稱號系統**：嚴格依對局數、勝場、金幣門檻解鎖佩戴，附帶金銀銅專屬流光徽章。
- **⚡ 超低延遲與邊緣加速**：Cloudflare R2 自動遷移圖片、Firebase RTDB 毫秒級雙向同步、Web Audio API 純程式合成音效。
- **📱 PWA 漸進式應用支援**：一鍵安裝至手機與桌面，獨立全螢幕流暢運行。

---

## 🕹️ 內建六大經典對戰棋局

| 遊戲名稱 | 支援人數 | 核心玩法特色 |
| :--- | :---: | :--- |
| **1A2B 數字密碼戰** | 2 ~ 5 人 | 雙人相互出題攻防或多人競猜！30 秒推理倒數、即時 A/B 判定。<br>※ 提供獨立單人解題挑戰版（[1a2b.terry0215.com](https://1a2b.terry0215.com)）。 |
| **海戰棋 艦隊對決 (Battleship)** | 2 人 | 自選 6x6 ~ 10x10 海域！四大艦艇自由佈署、雷達聲納掃描、迷霧轟炸與擊沉特效。 |
| **賓果 5x5 連線 (Bingo)** | 2 ~ 5 人 | 自由佈局或一鍵隨機洗牌 1 至 25 號！輪流開球、多人即時劃線，先達標條數者獲勝。 |
| **點線棋 圍地方格 (Dots & Boxes)** | 2 ~ 3 人 | 3x3 ~ 6x6 點陣對弈！輪流連線封閉方格，成功佔地即刻獲得額外連續回合（Bonus Turn）。 |
| **經典無限 OOXX** | 2 人 | 盤面上每方最多維持 3 顆棋子，落第 4 顆時最早棋子呼吸預警並自動消逝，徹底終結傳統和局魔咒。 |
| **四子棋 連線爭霸 (Connect 4)** | 2 人 | 7x6 垂直重力棋盤！預判敵方落子，率先連成四顆一線者奪勝。 |

---

## 🎨 Universal LPC 像素全身換裝系統

本專案拒絕外部 iframe 嵌入，完全基於 [Universal LPC Spritesheet](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) 開源素材標準，在客戶端使用 HTML5 Canvas 獨立開發像素渲染引擎：
- **精準圖層架構**：`斗篷 (5)` → `身體 (10)` → `頭部 (15)` → `褲子 (20)` → `鞋子 (25)` → `上衣 (30)` → `夾克 (35)` → `髮型 (50)` → `帽子 (60)` → `飾品 (70)`，杜絕破圖與遮擋。
- **即時調色盤替換**：4 種膚色與 8 種髮色在離線畫布動態比對替換，並具備記憶體快取。
- **平滑像素縮放**：強制關閉圖像平滑化（`image-rendering: pixelated`），放大 2x ~ 4x 依然保有銳利清晰的點陣美感。
- **授權合規**：所有素材遵循 CC0, CC-BY, CC-BY-SA, GPL 規範，並詳實記錄於 [CREDITS.md](CREDITS.md)。

---

## 👑 帝國地下遊技場與管理員老闆控制台

- **遊技場娛樂**：
  - **復古拉霸機 (Slots)**：單局 10 ~ 100 枚金幣，動態滾輪音效，櫻桃、檸檬、金幣、BAR 與最高 777 大獎。
  - **九宮格刮刮樂 (Scratch Card)**：支援滑鼠與手機觸控真實刮除銀漆，對中三個相同圖標即刻派彩。
- **賭場老闆後台 (`AdminDashboard.tsx`)**：
  - **即時查帳 (Audit Log)**：即時流水記錄每筆下注時間、玩家姓名與代碼、遊戲種類、押注額度、賠率與損益。
  - **動態賠率調控**：管理員可直接在線上調整拉霸中獎率（%）與刮刮樂大獎機率。
  - **服飾商城定價**：管理員可動態自訂各件衣服、褲子、配件之金幣售價，即時同步至全體玩家換裝室。

---

## 🛠️ 技術棧一覽

- **前端框架**：React 18 / Vite 8 / TypeScript
- **樣式與主題**：Tailwind CSS（專屬 Vanilla Custard `#DFD5A5` 暖金奶油色調、雙重滾邊框、毛玻璃面板）
- **動畫渲染**：Framer Motion 14, Canvas Confetti
- **後端與雲端**：Firebase (Authentication, Realtime Database, Firestore)
- **邊緣雲端存儲**：Cloudflare R2（自動遷移相片，阻斷巨型 Base64 封包）
- **音效系統**：Web Audio API 自研純程式合成音效（落子、爆炸、拉霸轉輪、金幣清脆聲）
- **行動端支援**：PWA Service Worker 快取機制 (v14)

---

## 🚀 本地開發與建置

### 1. 安裝環境需求
- Node.js 18+ 或 20+
- pnpm (推薦) 或 npm / yarn

### 2. 下載並安裝依賴
```bash
git clone https://github.com/terry5333/game-room.git
cd game-room
pnpm install
```

### 3. 設定環境變數
在專案根目錄建立 `.env`：
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. 啟動本機開發伺服器
```bash
pnpm dev
```
瀏覽器開啟 `http://localhost:5173` 即可進入遊戲室。

### 5. 建置正式生產版本
```bash
pnpm build
```
產出檔案位於 `dist/`，可直接部署至 Vercel, Cloudflare Pages 或任何靜態託管空間。

---

## 📄 授權與感謝名單

- **角色與服飾素材**：感謝 [Liberated Pixel Cup (LPC)](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) 社群藝術家們無私貢獻之像素精靈圖。詳細作者、授權協議與來源請參閱 [CREDITS.md](CREDITS.md)。
- **遊戲原始碼**：本專案程式架構遵循 MIT License 開源。
