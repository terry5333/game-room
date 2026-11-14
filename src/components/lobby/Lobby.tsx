import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  BookOpen
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { matchService } from '../../services/matchService';
import type { GameId, GameRoom } from '../../types';
import { sound } from '../../services/soundService';

interface LobbyProps {
  onOpenRulesForGame: (gameId: GameId) => void;
  onToggleFriends: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onOpenRulesForGame,
  onToggleFriends
}) => {
  const { createRoom, joinRoomByCode, joinRoomById } = useRoom();
  const { currentUser } = useAuth();

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [creatingGame, setCreatingGame] = useState<GameId | null>(null);

  useEffect(() => {
    const update = () => {
      setActiveRooms(matchService.getActiveRooms());
    };
    update();
    const interval = setInterval(update, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const code = roomCodeInput.trim();
    if (code.length < 6) return;
    const success = await joinRoomByCode(code);
    if (!success) {
      alert('找不到該房號之房間，或房間已滿員！');
    }
  };

  const handleCreateGame = async (gameId: GameId) => {
    sound.playClick();
    setCreatingGame(gameId);
    try {
      await createRoom(gameId);
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingGame(null);
    }
  };

  const games = [
    {
      id: '1a2b' as const,
      title: '1A2B 數字密碼戰',
      desc: '雙方互相為對手設定 4 位秘密密碼，輪流邏輯推理。',
      icon: Hash,
      color: '#628395'
    },
    {
      id: 'battleship' as const,
      title: '海戰棋 8x8 艦隊',
      desc: '佈署旗艦、驅逐艦與潛艇，雷達轟炸擊沉敵艦。',
      icon: Anchor,
      color: '#628395'
    },
    {
      id: 'bingo' as const,
      title: '賓果 5x5 連線',
      desc: '自由排列 1-25 號碼，雙方輪流喊號，搶先連成五條線。',
      icon: Grid,
      color: '#DBAD6A'
    },
    {
      id: 'dots' as const,
      title: '點線棋 圍地方格',
      desc: '在 5x5 點陣劃線，封閉方格即刻佔領並獲得連續回合。',
      icon: SquareDot,
      color: '#CF995F'
    },
    {
      id: 'ooxx' as const,
      title: '無限三子棋',
      desc: '每方上限 3 顆棋，下第 4 顆時最早棋子消逝，打破和局。',
      icon: CircleDot,
      color: '#628395'
    }
  ];

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 space-y-6">
      {/* Sleek Top Join Bar */}
      <div className="glass-panel rounded-2xl px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs border border-white/70">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-[#2E2925]">
            快速加入房間
          </span>
          <span className="text-xs text-[#96897B] hidden md:inline">
            輸入 6 碼對戰代碼
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
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/80 border border-[#96897B]/20 focus:outline-none focus:border-[#628395] text-xs font-mono font-bold tracking-widest text-[#2E2925]"
            />
            <LogIn className="w-3.5 h-3.5 text-[#96897B] absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            disabled={roomCodeInput.length < 6}
            className="px-3 py-1.5 rounded-xl bg-[#628395] hover:bg-[#526f7f] disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>進入</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onToggleFriends}
            className="lg:hidden p-1.5 rounded-xl bg-white/70 text-[#628395] border border-[#628395]/30 ml-1"
            title="好友名單"
          >
            <Users2 className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 5 Game Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => {
          const Icon = game.icon;
          const isBusy = creatingGame === game.id;

          return (
            <motion.div
              key={game.id}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-panel rounded-2xl p-5 border border-white/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: game.color }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenRulesForGame(game.id);
                    }}
                    title="玩法說明"
                    className="p-1 rounded-lg text-[#96897B] hover:text-[#628395] hover:bg-white/60 transition-colors"
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

              <button
                disabled={isBusy}
                onClick={() => handleCreateGame(game.id)}
                className="w-full py-2.5 px-4 rounded-xl bg-white/80 hover:bg-[#628395] text-[#2E2925] hover:text-white border border-[#96897B]/20 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBusy ? '建立中...' : '開房對戰'}</span>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Active Public Rooms (Minimalist) */}
      {activeRooms.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 border border-white/70 shadow-xs">
          <div className="text-xs font-bold text-[#96897B] mb-2 px-1">
            進行中的對局 ({activeRooms.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {activeRooms.map((room) => {
              const isMyRoom = room.player1.uid === currentUser?.uid || room.player2?.uid === currentUser?.uid;

              return (
                <div
                  key={room.id}
                  className="bg-white/50 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#628395] mr-1.5">
                      #{room.code}
                    </span>
                    <span className="font-bold text-[#2E2925]">
                      {room.gameId.toUpperCase()}
                    </span>
                  </div>

                  <button
                    onClick={() => joinRoomById(room.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#628395] text-white font-semibold text-[11px] hover:bg-[#526f7f] transition-colors cursor-pointer"
                  >
                    {isMyRoom ? '重回' : '加入'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
