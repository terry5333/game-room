# 遊戲室 (Game Room)

專為雙人即時連線對弈設計的現代毛玻璃風格 Web App。

## 🎮 內建五款雙人經典對戰小遊戲
1. **1A2B（互相出題模式）**：互相設定 4 位秘密密碼，30 秒輪流推理猜題，率先 4A0B 者獲勝。
2. **海戰棋（Battleship）**：8x8 迷霧海域佈署四大戰艦，雷達轟炸、擊沉特效，率先全殲對方艦隊獲勝。
3. **賓果 5x5（Bingo）**：自由佈局或一鍵洗牌 1 至 25 號碼，輪流喊號同步劃記，搶先串聯 5 條動態光條連線獲勝。
4. **點線棋（Dots and Boxes）**：5x5 點陣構建 16 個領地方格，輪流劃線，封閉方格即刻佔領並獲得連續回合（Bonus Turn）。
5. **無限三子棋（OOXX）**：每方在場最多 3 顆棋，落第 4 顆時最早棋子呼吸預警並自動消逝，徹底打破傳統和局魔咒。

## 🛠 技術架構
- **Frontend**：React (Vite) + TypeScript
- **Styling**：Tailwind CSS (Vanilla Custard `#DFD5A5` 毛玻璃視覺規範)
- **Animation**：Framer Motion + Canvas Confetti
- **Icons**：Lucide React (嚴格零 Emoji 原則，純 SVG 圖示)
- **Backend & Cloud**：Firebase (Authentication, Realtime Database, Firestore)
- **Audio**：Web Audio API 合成音效（落子、爆炸、擊沉、開獎、金幣音效）

## 🚀 本地開發
```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 建置正式版本
pnpm build
```
