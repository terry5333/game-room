import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  Plus,
  Minus,
  Settings,
  Trash2,
  Users2,
  Coins,
  X,
  Check,
  Radio,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { matchService, DEFAULT_SETTINGS } from '../../services/matchService';
import type { GameId, GameRoom } from '../../types';
import { sound } from '../../services/soundService';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { allUsers, adminUpdateUserCoins } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [multipliers, setMultipliers] = useState<Record<GameId, number>>({
    ...DEFAULT_SETTINGS.multipliers
  });
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>(matchService.getActiveRooms());
  const [activeTab, setActiveTab] = useState<'users' | 'multipliers' | 'rooms'>('users');

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.friendCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdjustCoins = (uid: string, delta: number) => {
    sound.playClick();
    adminUpdateUserCoins(uid, delta);
  };

  const handleUpdateMultiplier = (gameId: GameId, val: number) => {
    sound.playClick();
    const updated = { ...multipliers, [gameId]: Math.max(0.1, Number(val.toFixed(1))) };
    setMultipliers(updated);
    DEFAULT_SETTINGS.multipliers[gameId] = updated[gameId];
  };

  const handleForceCloseRoom = async (roomId: string) => {
    sound.playClick();
    if (confirm(`確定要強制關閉房間 [${roomId}] 嗎？`)) {
      const room = activeRooms.find((r) => r.id === roomId);
      if (room) {
        room.status = 'closed';
        await matchService.updateRoom(room);
        setActiveRooms(matchService.getActiveRooms());
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-4xl glass-panel rounded-3xl p-6 sm:p-8 border-2 border-white/80 shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#96897B]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#CF995F] text-white flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-[#2E2925] tracking-tight">
                管理員控制台 (Admin Dashboard)
              </h3>
              <p className="text-xs text-[#96897B] font-medium">
                玩家名單管理、金幣發放、賠率倍率調控與即時戰局監控
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/70 hover:bg-white text-[#2E2925] border border-[#96897B]/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 py-3 border-b border-[#96897B]/15">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#628395] text-white shadow-sm'
                : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
            }`}
          >
            <Users2 className="w-4 h-4" />
            <span>玩家名單 ({allUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('multipliers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'multipliers'
                ? 'bg-[#628395] text-white shadow-sm'
                : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>各遊戲勝場金幣倍率</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-[#628395] text-white shadow-sm'
                : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>進行中房間 ({activeRooms.length})</span>
          </button>
        </div>

        {/* Tab 1: Users Manager */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋玩家姓名、邀請碼或 Email..."
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white/80 border border-[#96897B]/30 focus:outline-none focus:border-[#628395] text-xs font-medium text-[#2E2925]"
              />
              <Search className="w-4 h-4 text-[#96897B] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Users Table */}
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.uid}
                  className="glass-panel-subtle rounded-2xl p-3 sm:p-4 border border-white/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.photoURL}
                      alt={u.displayName}
                      className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#2E2925]">
                          {u.displayName}
                        </span>
                        <span className="text-[10px] font-mono bg-[#628395]/15 text-[#628395] font-bold px-1.5 py-0.5 rounded-md">
                          代碼: {u.friendCode}
                        </span>
                        {u.role === 'admin' && (
                          <span className="text-[10px] bg-[#CF995F] text-white font-bold px-1.5 py-0.5 rounded-md">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#96897B]">
                        戰績：{u.wins} 勝 {u.losses} 敗 (共 {u.gamesPlayed} 場)
                      </div>
                    </div>
                  </div>

                  {/* Coin Controller */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5 bg-[#DBAD6A]/20 px-3 py-1.5 rounded-xl border border-[#DBAD6A]/40 font-mono font-bold text-xs text-[#2E2925]">
                      <Coins className="w-3.5 h-3.5 text-[#DBAD6A]" />
                      <span>{u.coins.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustCoins(u.uid, 50)}
                        className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-all font-bold text-xs"
                        title="增加 50 金幣"
                      >
                        +50
                      </button>
                      <button
                        onClick={() => handleAdjustCoins(u.uid, -50)}
                        className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 transition-all font-bold text-xs"
                        title="扣除 50 金幣"
                      >
                        -50
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Game Win Multipliers */}
        {activeTab === 'multipliers' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="glass-panel-subtle rounded-2xl p-4 border border-white/60 mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-[#628395] mb-1">
                <Sliders className="w-4 h-4" />
                <span>勝場獎勵金幣倍率設定</span>
              </div>
              <p className="text-xs text-[#96897B]">
                基礎勝場金幣為 50 枚。修改倍率後，新建立的遊戲房間將自動套用對應的獎勵係數。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  { id: '1a2b', name: '1A2B 數字密碼戰' },
                  { id: 'battleship', name: '海戰棋 8x8 艦隊' },
                  { id: 'bingo', name: '賓果 5x5 連線' },
                  { id: 'dots', name: '點線棋 圍地方格' },
                  { id: 'ooxx', name: '無限三子棋' }
                ] as { id: GameId; name: string }[]
              ).map((g) => (
                <div
                  key={g.id}
                  className="glass-panel-subtle rounded-2xl p-4 border border-white/70 flex items-center justify-between"
                >
                  <div>
                    <div className="font-extrabold text-sm text-[#2E2925]">{g.name}</div>
                    <div className="text-[11px] text-[#96897B]">
                      當前獲勝：{Math.round(50 * (multipliers[g.id] || 1))} 金幣
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleUpdateMultiplier(g.id, (multipliers[g.id] || 1) - 0.2)
                      }
                      className="p-1 rounded-lg bg-white/80 hover:bg-white text-[#2E2925] border border-[#96897B]/20"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-extrabold text-sm text-[#628395] w-12 text-center">
                      x{(multipliers[g.id] || 1).toFixed(1)}
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateMultiplier(g.id, (multipliers[g.id] || 1) + 0.2)
                      }
                      className="p-1 rounded-lg bg-white/80 hover:bg-white text-[#2E2925] border border-[#96897B]/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Active Rooms */}
        {activeTab === 'rooms' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {activeRooms.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#96897B] font-medium">
                目前尚無進行中的對戰房間。
              </div>
            ) : (
              activeRooms.map((room) => (
                <div
                  key={room.id}
                  className="glass-panel-subtle rounded-2xl p-4 border border-white/70 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-xs bg-[#628395]/15 text-[#628395] px-2 py-0.5 rounded-md">
                        #{room.code}
                      </span>
                      <span className="font-extrabold text-sm text-[#2E2925]">
                        {room.gameId.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-[#96897B]">
                        {room.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#96897B]">
                      房主：{room.player1.displayName} ✕ 對手：
                      {room.player2?.displayName || '等待加入中'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleForceCloseRoom(room.id)}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>強制關閉</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
