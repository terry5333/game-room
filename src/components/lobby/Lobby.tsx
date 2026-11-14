import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import type { GameId, RoomCreationOptions } from '../../types';
import { sound } from '../../services/soundService';
import { RoomConfigModal } from './RoomConfigModal';

interface LobbyProps {
  onOpenRulesForGame: (gameId: GameId) => void;
  onOpenFriends: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onOpenRulesForGame,
  onOpenFriends
}) => {
  const { createRoom, joinRoomByCode, activeOngoingRoom, rejoinActiveRoom } = useRoom();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [creatingGame, setCreatingGame] = useState<GameId | null>(null);
  const [configGameId, setConfigGameId] = useState<GameId | null>(null);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const code = roomCodeInput.trim();
    if (code.length < 6) return;
    const success = await joinRoomByCode(code);
    if (!success) {
      sound.playError();
      alert('找不到該房號之房間，或房間已滿員！');
    } else {
      sound.playJoin();
    }
  };

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

      {/* Sleek Top Join & Friends Bar */}
      <div className="glass-panel rounded-2xl px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs border border-white/70">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sound.playClick();
              onOpenFriends();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Users2 className="w-4 h-4" />
            <span>好友與對戰</span>
          </motion.button>

          <span className="text-xs text-[#96897B] font-medium hidden sm:inline">
            或輸入 6 碼代碼進房
          </span>
        </div>

        <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-44">
            <input
              type="text"
              maxLength={6}
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
              placeholder="輸入 6 碼房號"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/80 border border-[#96897B]/20 focus:outline-none focus:border-[#628395] text-xs font-mono font-bold tracking-widest text-[#2E2925] transition-all"
            />
            <LogIn className="w-3.5 h-3.5 text-[#96897B] absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={roomCodeInput.length < 6}
            className="px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[#2E2925] border border-[#96897B]/20 disabled:opacity-40 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>進入</span>
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </form>
      </div>

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
    </div>
  );
};
