import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  Plus,
  Minus,
  Trash2,
  Users2,
  Coins,
  X,
  Radio,
  Eye,
  Crosshair,
  Hash,
  Anchor,
  Grid,
  SquareDot,
  CircleDot,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { matchService } from '../../services/matchService';
import type { GameRoom, UserProfile } from '../../types';
import { sound } from '../../services/soundService';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { allUsers, adminUpdateUserCoins, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'rooms' | 'users' | 'overview'>('rooms');
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [inspectedRoom, setInspectedRoom] = useState<GameRoom | null>(null);

  // Poll active rooms from RTDB
  useEffect(() => {
    if (!isOpen) return;
    const fetchRooms = async () => {
      const list = await matchService.fetchAllRoomsFromRTDB();
      setRooms(list);
      // Keep inspected room updated
      if (inspectedRoom) {
        const refreshed = list.find((r) => r.id === inspectedRoom.id);
        if (refreshed) setInspectedRoom(refreshed);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 2000);
    return () => clearInterval(interval);
  }, [isOpen, inspectedRoom?.id]);

  if (!isOpen || currentUser?.role !== 'admin') return null;

  const filteredUsers = allUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.userTag.includes(searchQuery) ||
      u.friendCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdjustCoins = (uid: string, delta: number) => {
    sound.playClick();
    adminUpdateUserCoins(uid, delta);
  };

  const handleForceClose = async (roomId: string) => {
    sound.playClick();
    if (confirm(`確定要強制關閉房間 [${roomId}] 嗎？房間將立即終止並移出系統。`)) {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (inspectedRoom?.id === roomId) {
        setInspectedRoom(null);
      }
      await matchService.forceCloseRoom(roomId);
    }
  };

  const liveRooms = rooms.filter((r) => r.status !== 'closed');
  const totalCoins = allUsers.reduce((acc, u) => acc + (u.coins || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className="w-full max-w-4xl glass-panel rounded-3xl p-6 sm:p-7 border-2 border-white/80 shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/15 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#CF995F] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#2E2925]">
                管理員控制台 (Admin Dashboard)
              </h3>
              <p className="text-[11px] text-[#96897B] font-medium">
                最高權限管理者：terrylie0215@gmail.com
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/60 text-[#96897B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-[#628395] text-white shadow-xs'
                : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>即時房間戰況 ({liveRooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#628395] text-white shadow-xs'
                : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>玩家名單 ({allUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#628395] text-white shadow-xs'
                : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>平台總覽</span>
          </button>
        </div>

        {/* Tab 1: Live Rooms with Detailed Inspector */}
        {activeTab === 'rooms' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {liveRooms.length === 0 ? (
              <div className="text-center py-16 text-xs text-[#96897B]">
                目前無進行中或等待中的房間。
              </div>
            ) : (
              liveRooms.map((room) => (
                <div
                  key={room.id}
                  className="glass-panel-subtle rounded-2xl p-4 border border-white/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-xs bg-[#628395]/15 text-[#628395] px-2 py-0.5 rounded-md">
                        #{room.code}
                      </span>
                      <span className="font-extrabold text-sm text-[#2E2925]">
                        {room.gameId.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                          room.status === 'in_progress'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {room.status === 'in_progress' ? '激戰中' : '等待中'}
                      </span>
                    </div>

                    <div className="text-xs text-[#96897B]">
                      P1: <span className="font-bold text-[#2E2925]">{room.player1.displayName}</span> ✕ P2:{' '}
                      <span className="font-bold text-[#2E2925]">
                        {room.player2?.displayName || '無對手'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setInspectedRoom(room)}
                      className="px-3 py-1.5 rounded-xl bg-[#628395] text-white text-xs font-bold hover:bg-[#526f7f] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>查看即時棋局詳情</span>
                    </button>

                    <button
                      onClick={() => handleForceClose(room.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="強制關閉此異常房間"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>關閉房間</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: All Players Manager */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋玩家姓名、Email 或 4 位數 ID..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/20 text-xs font-bold text-[#2E2925] focus:outline-none focus:border-[#628395]"
              />
              <Search className="w-3.5 h-3.5 text-[#96897B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.uid}
                  className="glass-panel-subtle rounded-2xl p-3 border border-white/70 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.photoURL}
                      alt={u.displayName}
                      className="w-9 h-9 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-[#2E2925] truncate">
                          {u.displayName}
                        </span>
                        <span className="font-mono text-[10px] text-[#628395] font-bold">
                          #{u.userTag}
                        </span>
                        {u.role === 'admin' && (
                          <span className="text-[9px] bg-[#CF995F] text-white font-black px-1.5 py-0.2 rounded-md">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#96897B] truncate">
                        {u.email || u.uid} · {u.wins}勝 {u.losses}敗
                      </div>
                    </div>
                  </div>

                  {/* Coin Controller */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-[#DBAD6A]/40 font-mono font-bold text-xs text-[#2E2925]">
                      <Coins className="w-3 h-3 text-[#DBAD6A]" />
                      <span>{u.coins}</span>
                    </div>

                    <button
                      onClick={() => handleAdjustCoins(u.uid, 50)}
                      className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs cursor-pointer"
                    >
                      +50
                    </button>
                    <button
                      onClick={() => handleAdjustCoins(u.uid, -50)}
                      className="p-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs cursor-pointer"
                    >
                      -50
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Overview */}
        {activeTab === 'overview' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70 text-center">
                <div className="text-[11px] font-bold text-[#96897B]">總註冊玩家數</div>
                <div className="text-2xl font-black text-[#628395] mt-1">
                  {allUsers.length}
                </div>
              </div>

              <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70 text-center">
                <div className="text-[11px] font-bold text-[#96897B]">活躍戰鬥房間</div>
                <div className="text-2xl font-black text-[#CF995F] mt-1">
                  {liveRooms.length}
                </div>
              </div>

              <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70 text-center">
                <div className="text-[11px] font-bold text-[#96897B]">流通總金幣</div>
                <div className="text-2xl font-black text-[#DBAD6A] mt-1">
                  {totalCoins.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Room Inspector Modal */}
        <AnimatePresence>
          {inspectedRoom && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg glass-panel rounded-3xl p-6 border-2 border-white/90 shadow-2xl relative max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/20 mb-3">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-[#CF995F]" />
                    <div>
                      <h4 className="font-extrabold text-sm text-[#2E2925]">
                        房間即時棋局詳情 #{inspectedRoom.code}
                      </h4>
                      <p className="text-[10px] text-[#96897B]">
                        項目：{inspectedRoom.gameId.toUpperCase()} · 狀態：{inspectedRoom.status}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectedRoom(null)}
                    className="p-1 rounded-lg text-[#96897B]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Game Details based on Game Type */}
                <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
                  {/* Players bar */}
                  <div className="bg-white/60 p-3 rounded-xl border border-white/70 flex justify-between">
                    <div>
                      <span className="text-[#628395] font-bold">P1: </span>
                      <span className="font-extrabold text-[#2E2925]">
                        {inspectedRoom.player1.displayName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#CF995F] font-bold">P2: </span>
                      <span className="font-extrabold text-[#2E2925]">
                        {inspectedRoom.player2?.displayName || '尚未加入'}
                      </span>
                    </div>
                  </div>

                  {/* 1A2B Detailed Game State */}
                  {inspectedRoom.gameId === '1a2b' && inspectedRoom.state1a2b && (
                    <div className="space-y-2">
                      <div className="bg-white/70 p-3 rounded-xl border border-white/70">
                        <div className="font-bold text-[#628395] mb-1">雙方出題密碼：</div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            P1 密碼：
                            <span className="font-black text-[#628395] ml-1">
                              {inspectedRoom.state1a2b.secrets[inspectedRoom.player1.uid] || '未鎖定'}
                            </span>
                          </div>
                          <div>
                            P2 密碼：
                            <span className="font-black text-[#CF995F] ml-1">
                              {inspectedRoom.player2
                                ? inspectedRoom.state1a2b.secrets[inspectedRoom.player2.uid] || '未鎖定'
                                : '無'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/70 p-3 rounded-xl border border-white/70">
                        <div className="font-bold text-[#2E2925] mb-1">
                          歷次猜題紀錄 ({inspectedRoom.state1a2b.guesses.length} 次)：
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1 font-mono">
                          {inspectedRoom.state1a2b.guesses.map((g, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center bg-white/60 p-1.5 rounded-lg text-[11px]"
                            >
                              <span>
                                {g.guesserUid === inspectedRoom.player1.uid ? 'P1' : 'P2'} 猜：
                                <strong className="ml-1 text-sm">{g.guess}</strong>
                              </span>
                              <span className="font-bold text-[#DBAD6A]">
                                {g.bulls}A {g.cows}B
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Battleship Detailed Game State */}
                  {inspectedRoom.gameId === 'battleship' && inspectedRoom.stateBattleship && (
                    <div className="space-y-2">
                      <div className="bg-white/70 p-3 rounded-xl border border-white/70">
                        <div className="font-bold text-[#628395] mb-1">艦隊存活情況：</div>
                        <div className="text-[11px]">
                          P1 存活戰艦：
                          {inspectedRoom.stateBattleship.boards[inspectedRoom.player1.uid]?.ships.filter(
                            (s) => !s.sunk
                          ).length || 0}{' '}
                          艘 · 遭受攻擊：
                          {inspectedRoom.stateBattleship.boards[inspectedRoom.player1.uid]?.attacksReceived
                            .length || 0}{' '}
                          次
                        </div>
                        {inspectedRoom.player2 && (
                          <div className="text-[11px] mt-1">
                            P2 存活戰艦：
                            {inspectedRoom.stateBattleship.boards[inspectedRoom.player2.uid]?.ships.filter(
                              (s) => !s.sunk
                            ).length || 0}{' '}
                            艘 · 遭受攻擊：
                            {inspectedRoom.stateBattleship.boards[inspectedRoom.player2.uid]?.attacksReceived
                              .length || 0}{' '}
                            次
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bingo Detailed Game State */}
                  {inspectedRoom.gameId === 'bingo' && inspectedRoom.stateBingo && (
                    <div className="bg-white/70 p-3 rounded-xl border border-white/70 space-y-1">
                      <div className="font-bold text-[#DBAD6A]">賓果喊號進度：</div>
                      <div>已喊出號碼：{inspectedRoom.stateBingo.calledNumbers.join(', ') || '尚未開始'}</div>
                      <div>
                        連線進度：P1 ({inspectedRoom.stateBingo.linesCompleted[inspectedRoom.player1.uid] || 0} 條) ✕
                        P2 ({inspectedRoom.player2 ? inspectedRoom.stateBingo.linesCompleted[inspectedRoom.player2.uid] || 0 : 0} 條)
                      </div>
                    </div>
                  )}

                  {/* Dots Detailed Game State */}
                  {inspectedRoom.gameId === 'dots' && inspectedRoom.stateDots && (
                    <div className="bg-white/70 p-3 rounded-xl border border-white/70 space-y-1">
                      <div className="font-bold text-[#CF995F]">點線棋佔領分數：</div>
                      <div>已佔領方格數：{Object.keys(inspectedRoom.stateDots.boxes).length} / 16</div>
                    </div>
                  )}

                  {/* OOXX Detailed Game State */}
                  {inspectedRoom.gameId === 'ooxx' && inspectedRoom.stateOOXX && (
                    <div className="bg-white/70 p-3 rounded-xl border border-white/70 space-y-1">
                      <div className="font-bold text-[#628395]">三子棋狀態：</div>
                      <div>模式：{inspectedRoom.stateOOXX.infiniteMode ? '無限三子棋' : '傳統模式'}</div>
                      <div>目前落子步數：{inspectedRoom.stateOOXX.movesHistory.length} 步</div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#96897B]/15 mt-3 flex justify-between">
                  <button
                    onClick={() => handleForceClose(inspectedRoom.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>強制關閉此房間</span>
                  </button>

                  <button
                    onClick={() => setInspectedRoom(null)}
                    className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-[#2E2925] border border-[#96897B]/20 text-xs font-bold transition-colors cursor-pointer"
                  >
                    關閉詳情
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
