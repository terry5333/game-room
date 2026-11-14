import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Hash,
  Anchor,
  Grid,
  SquareDot,
  CircleDot,
  Coins,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import type { GameId } from '../../types';

interface RuleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialGameId?: GameId;
}

export const RuleDrawer: React.FC<RuleDrawerProps> = ({
  isOpen,
  onClose,
  initialGameId = '1a2b'
}) => {
  const [activeTab, setActiveTab] = useState<GameId | 'general'>(initialGameId);

  const tabs = [
    { id: '1a2b' as const, label: '1A2B', icon: Hash },
    { id: 'battleship' as const, label: '海戰棋', icon: Anchor },
    { id: 'bingo' as const, label: '賓果 5x5', icon: Grid },
    { id: 'dots' as const, label: '點線棋', icon: SquareDot },
    { id: 'ooxx' as const, label: '無限三子棋', icon: CircleDot },
    { id: 'general' as const, label: '金幣與系統', icon: Coins }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg glass-panel bg-[#DFD5A5]/95 backdrop-blur-2xl p-6 shadow-2xl flex flex-col border-l border-white/80 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#96897B]/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#628395] text-white flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#2E2925]">遊戲圖文規則手冊</h3>
                  <p className="text-xs text-[#96897B]">對戰技巧與回合機制指南</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/60 hover:bg-white text-[#2E2925] border border-[#96897B]/20 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Game Selector Tabs */}
            <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar border-b border-[#96897B]/15">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#628395] text-white shadow-sm'
                        : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Rules Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-[#2E2925]">
              {/* 1A2B */}
              {activeTab === '1a2b' && (
                <div className="space-y-4">
                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/60">
                    <div className="flex items-center gap-2 font-bold text-base text-[#628395] mb-2">
                      <Hash className="w-4 h-4" />
                      <span>1A2B 相互出題對抗機制</span>
                    </div>
                    <p className="text-xs text-[#2E2925]/80 leading-relaxed mb-3">
                      雙方各自為對手秘密設定一組由 0 到 9 組成、4 位數字完全不重複的密碼。出題鎖定後進入輪流猜題階段。
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <span className="font-extrabold text-[#628395] bg-[#628395]/15 px-2 py-0.5 rounded-md">
                          幾 A
                        </span>
                        <span>數字正確，且擺放的位置完全吻合。</span>
                      </div>
                      <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <span className="font-extrabold text-[#CF995F] bg-[#CF995F]/15 px-2 py-0.5 rounded-md">
                          幾 B
                        </span>
                        <span>數字包含在密碼中，但所在的位置不同。</span>
                      </div>
                      <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <span className="font-extrabold text-[#DBAD6A] bg-[#DBAD6A]/15 px-2 py-0.5 rounded-md">
                          4A0B
                        </span>
                        <span>最先達成 4A0B 完全解碼對手數字者直接奪得勝利！</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/60">
                    <h4 className="font-bold text-xs text-[#96897B] mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#DBAD6A]" />
                      <span>計時與操作細節</span>
                    </h4>
                    <p className="text-xs text-[#2E2925]/80 leading-relaxed">
                      每個回合提供 30 秒思考倒數。請使用螢幕虛擬數字鍵盤或實體鍵盤輸入，右方即時紀錄面板會同步顯示雙方每一回合的猜測軌跡與 A/B 判定。
                    </p>
                  </div>
                </div>
              )}

              {/* Battleship */}
              {activeTab === 'battleship' && (
                <div className="space-y-4">
                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/60">
                    <div className="flex items-center gap-2 font-bold text-base text-[#628395] mb-2">
                      <Anchor className="w-4 h-4" />
                      <span>海戰棋 8x8 艦隊對抗規約</span>
                    </div>
                    <p className="text-xs text-[#2E2925]/80 leading-relaxed mb-3">
                      經典雙人策略棋盤。在 8x8 的迷霧海域中，透過雷達與直覺尋找並擊沉對手艦隊。
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#628395] mb-1">第一階段：艦艇佈署</div>
                        <p className="text-[#2E2925]/80">
                          雙方各自擁有 4 艘戰艦（長度分別為 4 格旗艦、3 格巡洋艦、3 格驅逐艦、2 格潛艇）。點選艦艇並點擊網格即可擺放，支援「旋轉方向」與「隨機自動擺放」。雙方確認佈署後開戰。
                        </p>
                      </div>
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#CF995F] mb-1">第二階段：輪流轟炸</div>
                        <p className="text-[#2E2925]/80">
                          輪流點擊對方的海域座標發射導彈：
                          未命中時顯示水花漣漪動畫；命中時引爆火光並標記擊中部位。當一艘艦艇全部格子皆被擊中時，觸發「擊沉提示」。
                        </p>
                      </div>
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#DBAD6A] mb-1">勝利條件</div>
                        <p className="text-[#2E2925]/80">率先擊沉對手全數 4 艘艦隊者贏得比賽！</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bingo */}
              {activeTab === 'bingo' && (
                <div className="space-y-4">
                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/60">
                    <div className="flex items-center gap-2 font-bold text-base text-[#628395] mb-2">
                      <Grid className="w-4 h-4" />
                      <span>賓果 5x5 連線激戰法則</span>
                    </div>
                    <p className="text-xs text-[#2E2925]/80 leading-relaxed mb-3">
                      記憶與佈局的對決。在 5x5 的 25 格盤面中，雙方輪流喊號，最先串起 5 條線者勝出。
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#628395] mb-1">準備階段</div>
                        <p className="text-[#2E2925]/80">
                          將數字 1 至 25 填入 25 個空格中。可以手動點擊填入，亦可使用「隨機排列」一鍵洗牌生成，雙方確認後進入戰局。
                        </p>
                      </div>
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#CF995F] mb-1">對戰喊號</div>
                        <p className="text-[#2E2925]/80">
                          雙方輪流點擊自己盤面尚未被喊過的數字。一旦某號碼被喊出，雙方盤面上的對應號碼會同步標記高亮！
                        </p>
                      </div>
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#DBAD6A] mb-1">動態連線光條與計分</div>
                        <p className="text-[#2E2925]/80">
                          橫線、直線、兩條大對角線湊滿 5 格即成一條線，盤面會繪製霓虹連線光條，頂部即時顯示 0 至 5 條進度，先湊齊 5 條線者獲得榮耀勝場。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dots and Boxes */}
              {activeTab === 'dots' && (
                <div className="space-y-4">
                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/60">
                    <div className="flex items-center gap-2 font-bold text-base text-[#628395] mb-2">
                      <SquareDot className="w-4 h-4" />
                      <span>點線棋 5x5 圍地佔領機制</span>
                    </div>
                    <p className="text-xs text-[#2E2925]/80 leading-relaxed mb-3">
                      5x5 的點陣構成了 4x4 共 16 個方格。雙方輪流在相鄰點之間畫線，爭奪方格主權。
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#628395] mb-1">畫線機制</div>
                        <p className="text-[#2E2925]/80">
                          點選相鄰兩點間的虛線即可塗上屬於你代表色的實線。
                        </p>
                      </div>
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#CF995F] mb-1">完成封閉與連環額外回合</div>
                        <p className="text-[#2E2925]/80">
                          當你劃下的線恰好封閉了某個 1x1 方格的最後一條邊時，該格即被你佔領，格內填入你的代表色與標記，並立即獲得「額外再畫一筆」的連動回合！
                        </p>
                      </div>
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#DBAD6A] mb-1">勝負裁定</div>
                        <p className="text-[#2E2925]/80">
                          16 格全數被佔領時遊戲結束，擁有最多佔領格數的玩家獲勝！
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* OOXX */}
              {activeTab === 'ooxx' && (
                <div className="space-y-4">
                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/60">
                    <div className="flex items-center gap-2 font-bold text-base text-[#628395] mb-2">
                      <CircleDot className="w-4 h-4" />
                      <span>無限三子棋（防平手專利架構）</span>
                    </div>
                    <p className="text-xs text-[#2E2925]/80 leading-relaxed mb-3">
                      徹底終結傳統 3x3 OOXX 必和局的痛點！預設啟用動態無限三子棋模式，亦可在房內切換為經典模式。
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#628395] mb-1">3 顆棋子上限</div>
                        <p className="text-[#2E2925]/80">
                          每位玩家在棋盤上最多只能同時保留 3 顆棋子。
                        </p>
                      </div>
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#CF995F] mb-1">預警呼吸與自動消逝</div>
                        <p className="text-[#2E2925]/80">
                          當你準備下第 4 顆棋時，你最早落下的第 1 顆棋子會出現半透明呼吸閃爍預警動畫。一旦第 4 顆棋落下，第 1 顆棋子將瞬間化作星芒消失！
                        </p>
                      </div>
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#DBAD6A] mb-1">三連線直接奪冠</div>
                        <p className="text-[#2E2925]/80">
                          直到任意一方透過動態換位成功串成橫、直或斜的三連線為止，戰鬥永遠緊張刺激！
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General / Economy */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/60">
                    <div className="flex items-center gap-2 font-bold text-base text-[#DBAD6A] mb-2">
                      <Coins className="w-4 h-4" />
                      <span>金幣經濟與好友邀請系統</span>
                    </div>
                    <p className="text-xs text-[#2E2925]/80 leading-relaxed mb-3">
                      公平競技，局局有獎。金幣將可用於未來即將推出的自訂棋盤、專屬頭像框與擊沉特寫商城！
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#628395] mb-1">結算獎勵機制</div>
                        <p className="text-[#2E2925]/80">
                          勝方獲得 50 枚金幣（受管理員倍率加成），敗方獲得 10 枚金幣安慰獎。所有收支皆詳細記錄於個人交易歷程。
                        </p>
                      </div>
                      <div className="bg-white/70 p-2.5 rounded-xl border border-[#96897B]/15">
                        <div className="font-bold text-[#CF995F] mb-1">好友邀請與 Presence 即時燈號</div>
                        <p className="text-[#2E2925]/80">
                          右側邊欄可輸入朋友的 6 位邀請碼互加好友。透過 Realtime Database 連線感測，隨時掌握好友是在「大廳閒晃」或「激戰中」，一鍵直接投送戰帖！
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer close */}
            <div className="pt-4 border-t border-[#96897B]/20">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                了解，回到遊戲
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
