import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Hash,
  Anchor,
  Grid,
  SquareDot,
  CircleDot,
  ArrowRight,
  LogIn,
  Users2,
  BookOpen,
  RotateCcw,
  Sparkles,
  Keyboard,
  Shirt,
  Award
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { matchService } from '../../services/matchService';
import type { GameId, RoomCreationOptions } from '../../types';
import { sound } from '../../services/soundService';
import { RoomConfigModal } from './RoomConfigModal';
import { RoomCodeKeypadModal } from './RoomCodeKeypadModal';
import { ShowaAvatar } from '../common/ShowaAvatar';

interface LobbyProps {
  onOpenRulesForGame: (gameId: GameId) => void;
  onOpenFriends: () => void;
  onOpenWardrobe?: () => void;
  onOpenExamCard?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onOpenRulesForGame,
  onOpenFriends,
  onOpenWardrobe,
  onOpenExamCard
}) => {
  const { createRoom, activeOngoingRoom, rejoinActiveRoom } = useRoom();
  const { currentUser } = useAuth();
  const [keypadModalOpen, setKeypadModalOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [creatingGame, setCreatingGame] = useState<GameId | null>(null);
  const [configGameId, setConfigGameId] = useState<GameId | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = matchService.subscribeFriendRequests(currentUser.uid, (reqs) => {
      setPendingRequestsCount(reqs.length);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const handleCreateGame = (gameId: GameId) => {
    sound.playPop();
    if (gameId === 'ooxx') {
      // OOXX 什麼都不用問，直接建立房間
      executeCreateRoom('ooxx');
    } else {
      // 1A2B, Bingo, Battleship, Dots 彈出設定視窗詢問對應參數
      setConfigGameId(gameId);
    }
  };

  const executeCreateRoom = async (gameId: GameId, options?: RoomCreationOptions) => {
    setCreatingGame(gameId);
    try {
      await createRoom(gameId, options);
      sound.playSuccess();
    } catch (e) {
      sound.playError();
      console.error(e);
    } finally {
      setCreatingGame(null);
      setConfigGameId(null);
    }
  };

  const games = [
    {
      id: '1a2b' as const,
      title: '1A2B 數字密碼戰',
      desc: '雙人即時競速！推理解析 4 位神秘密碼，搶先破譯 4A0B 者獲勝。（限定 2 人）',
      icon: Hash,
      color: '#628395'
    },
    {
      id: 'battleship' as const,
      title: '海戰棋 艦隊對決',
      desc: '雙人艦隊對決！自選 6x6~10x10 棋盤，佈署艦艇雷達轟炸擊沉敵艦。（限定 2 人）',
      icon: Anchor,
      color: '#628395'
    },
    {
      id: 'bingo' as const,
      title: '賓果 5x5 連線',
      desc: '支援 2-5 人多人連線派對！自訂獲勝條數與輪流喊號，動態 3D 彩球即時進球。（2-5 人）',
      icon: Grid,
      color: '#DBAD6A'
    },
    {
      id: 'dots' as const,
      title: '點線棋 圍地方格',
      desc: '支援 2-3 人圍地對弈！自選 3x3~6x6 點陣，封閉方格佔領並獲得連續回合。（最多 3 人）',
      icon: SquareDot,
      color: '#CF995F'
    },
    {
      id: 'ooxx' as const,
      title: '經典 OOXX',
      desc: '經典 3x3 圈圈叉叉對弈，雙方輪流落子，先連成三點一線者獲勝！（限定 2 人）',
      icon: CircleDot,
      color: '#628395'
    }
  ];

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
      {/* Active Ongoing Match Reconnection Banner */}
      <AnimatePresence>
        {activeOngoingRoom && activeOngoingRoom.status !== 'closed' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel rounded-2xl px-5 py-3.5 border-2 border-[#628395] bg-[#628395]/10 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#628395] text-white flex items-center justify-center shadow-xs shrink-0">
                <RotateCcw className="w-5 h-5 text-white animate-spin-reverse" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#628395]">
                  發現未完成的對戰房間！
                </div>
                <div className="text-sm font-extrabold text-[#2E2925]">
                  {activeOngoingRoom.gameId === '1a2b'
                    ? '1A2B'
                    : activeOngoingRoom.gameId === 'battleship'
                    ? '海戰棋'
                    : activeOngoingRoom.gameId === 'bingo'
                    ? '賓果'
                    : activeOngoingRoom.gameId === 'dots'
                    ? '點線棋'
                    : '經典 OOXX'}{' '}
                  · 房號 #{activeOngoingRoom.code}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={rejoinActiveRoom}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>立即重連返回對戰</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleek Top Action Bar: Friends, Room Code Keypad & Wardrobe Shop */}
      <div className="glass-panel rounded-2xl p-2.5 sm:p-3 shadow-xs border border-white/70">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Button 1: 好友名單 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sound.playClick();
              onOpenFriends();
            }}
            className="relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl bg-white/80 hover:bg-white text-[#2E2925] border border-[#96897B]/20 hover:border-[#628395]/40 font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-[#628395]/15 text-[#628395] flex items-center justify-center shrink-0">
              <Users2 className="w-3.5 h-3.5 text-[#628395]" />
            </div>
            <span className="truncate">好友</span>
            {pendingRequestsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-xs animate-bounce">
                {pendingRequestsCount}
              </span>
            )}
          </motion.button>

          {/* Button 2: 輸入房號進房 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sound.playClick();
              setKeypadModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
              <Hash className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="truncate">輸入房號</span>
          </motion.button>

          {/* Button 3: 昭和町服飾舖 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sound.playClick();
              if (onOpenWardrobe) onOpenWardrobe();
            }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl bg-[#5D3A1A] hover:bg-[#432711] text-[#FFE8D6] font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-[#FFE8D6]/20 text-[#FFE8D6] flex items-center justify-center shrink-0">
              <Shirt className="w-3.5 h-3.5 text-[#FFE8D6]" />
            </div>
            <span className="truncate">服飾舖</span>
          </motion.button>
        </div>
      </div>

      {/* Showa Examinee Passport Banner (Option 3 preview) */}
      {currentUser && (
        <div
          onClick={() => {
            sound.playClick();
            if (onOpenExamCard) onOpenExamCard();
          }}
          className="p-2.5 sm:p-3 rounded-2xl bg-[#F7EBD2]/90 hover:bg-[#F7EBD2] border-2 border-double border-[#8D5B4C]/50 shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]"
          title="點擊翻閱個人《帝國受驗准考證》"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0">
              <ShowaAvatar
                size="sm"
                wardrobe={currentUser.wardrobe}
                photoURL={currentUser.photoURL}
                showPedestal={false}
                animated={false}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-[#8D5B4C]/20 text-[#5D3A1A]">
                  帝國受驗生
                </span>
                <span className="text-xs font-black text-[#3B2211] truncate">
                  {currentUser.displayName}
                </span>
                <span className="font-mono text-[10px] text-[#8D5B4C] font-bold">
                  #{currentUser.userTag}
                </span>
              </div>
              <p className="text-[10px] text-[#8D5B4C] font-bold mt-0.5">
                已認證准考資格・點擊檢視勝率戰績與准考印章
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-[11px] font-black text-[#5D3A1A] bg-[#FFE8D6] px-2.5 py-1 rounded-xl border border-[#D5C0A1]">
            <Award className="w-3.5 h-3.5 text-[#8D5B4C]" />
            <span className="hidden sm:inline">准考證</span>
            <span>→</span>
          </div>
        </div>
      )}

      {/* 5 Game Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.07,
              delayChildren: 0.05
            }
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {games.map((game) => {
          const Icon = game.icon;
          const isBusy = creatingGame === game.id;

          return (
            <motion.div
              key={game.id}
              variants={{
                hidden: { opacity: 0, y: 18, scale: 0.96 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 24
                  }
                }
              }}
              whileHover={{ y: -6, scale: 1.015 }}
              className="glass-panel rounded-2xl p-5 border border-white/70 shadow-xs flex flex-col justify-between hover:shadow-lg transition-shadow group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: game.color }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenRulesForGame(game.id);
                    }}
                    title="玩法說明"
                    className="p-1.5 rounded-lg text-[#96897B] hover:text-[#628395] hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-extrabold text-base text-[#2E2925] mb-1 group-hover:text-[#628395] transition-colors">
                  {game.title}
                </h3>
                <p className="text-xs text-[#96897B] font-medium leading-relaxed mb-5">
                  {game.desc}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                disabled={isBusy}
                onClick={() => handleCreateGame(game.id)}
                className="w-full py-2.5 px-4 rounded-xl bg-white/80 hover:bg-[#628395] text-[#2E2925] hover:text-white border border-[#96897B]/20 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBusy ? '建立中...' : '開房對戰'}</span>
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Room Configuration Dialog (1A2B, Bingo, Battleship, Dots) */}
      <AnimatePresence>
        {configGameId && (
          <RoomConfigModal
            gameId={configGameId}
            onClose={() => setConfigGameId(null)}
            onConfirm={(opts) => executeCreateRoom(configGameId, opts)}
          />
        )}
      </AnimatePresence>

      {/* In-Page Virtual Keypad Modal for Room Code */}
      <RoomCodeKeypadModal
        isOpen={keypadModalOpen}
        onClose={() => setKeypadModalOpen(false)}
      />
    </div>
  );
};
