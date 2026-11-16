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
  Clock,
  Flame,
  Droplets,
  Trophy,
  Sparkles,
  Check,
  Zap,
  BarChart3,
  Activity,
  Filter,
  Layers,
  ArrowRight,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { matchService } from '../../services/matchService';
import type { GameRoom, UserProfile, UserPresence } from '../../types';
import { sound } from '../../services/soundService';
import { casinoSettings, CasinoSettings, CasinoHistoryRecord } from '../../services/casinoSettingsService';
import { itemPricing, ItemPriceMap } from '../../services/itemPricingService';
import { LPC_ITEMS, LpcItemDef } from '../../data/lpcCatalog';
import { Dices, ShoppingBag, Sliders, History, DollarSign } from 'lucide-react';
import { calculateLines } from '../games/bingo/GameBingo';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { allUsers, adminUpdateUserCoins, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState<'all' | 'in_progress' | 'waiting' | 'settled' | 'closed'>('all');
  const [isRefreshingRooms, setIsRefreshingRooms] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'users' | 'casino_boss' | 'shop_pricing' | 'overview'>('rooms');
  const [casinoSettingsState, setCasinoSettingsState] = useState<CasinoSettings>(casinoSettings.getSettings());
  const [casinoHistory, setCasinoHistory] = useState<CasinoHistoryRecord[]>(casinoSettings.getHistory());
  const [casinoHistoryFilter, setCasinoHistoryFilter] = useState<'all' | 'slot' | 'scratch' | 'roulette'>('all');
  const [casinoSaveSuccess, setCasinoSaveSuccess] = useState(false);
  const [customPrices, setCustomPrices] = useState<ItemPriceMap>(itemPricing.getAllCustomPrices());
  const [priceCategoryFilter, setPriceCategoryFilter] = useState<'all' | 'top' | 'bottom' | 'shoes' | 'hat' | 'hair' | 'accessories'>('all');
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [pricingSaveSuccess, setPricingSaveSuccess] = useState(false);
  const [userFilter, setUserFilter] = useState<'all' | 'online' | 'in_game' | 'admin'>('all');
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [inspectedRoom, setInspectedRoom] = useState<GameRoom | null>(null);

  // 0. Subscribe to Casino Boss Settings & Item Pricing
  useEffect(() => {
    const unsubCasino = casinoSettings.subscribe((s) => setCasinoSettingsState(s));
    const unsubHist = casinoSettings.subscribeHistory((h) => setCasinoHistory(h));
    const unsubPrices = itemPricing.subscribe((p) => setCustomPrices(p));
    return () => {
      unsubCasino();
      unsubHist();
      unsubPrices();
    };
  }, []);

  // 1. Real-time zero-latency room stream & immediate RTDB pull
  useEffect(() => {
    if (!isOpen) return;
    matchService.fetchAllRoomsFromRTDB().then((all) => {
      if (all && all.length > 0) setRooms(all);
    });
    const unsubRooms = matchService.subscribeAllRooms((all) => {
      setRooms(all);
    });
    const unsubPresences = matchService.subscribePresence((list) => {
      setPresences(list);
    });
    return () => {
      unsubRooms();
      unsubPresences();
    };
  }, [isOpen]);

  // Keep inspected room updated in real time as actions occur
  useEffect(() => {
    if (!inspectedRoom) return;
    const refreshed = rooms.find((r) => r.id === inspectedRoom.id);
    if (refreshed) {
      setInspectedRoom(refreshed);
    }
  }, [rooms]);

  if (!isOpen || currentUser?.role !== 'admin') return null;

  const handleRefreshRooms = async () => {
    sound.playClick();
    setIsRefreshingRooms(true);
    try {
      const all = await matchService.fetchAllRoomsFromRTDB();
      setRooms(all);
      sound.playSuccess();
    } catch (e) {
      console.warn('refresh rooms err:', e);
    } finally {
      setIsRefreshingRooms(false);
    }
  };

  // Filtered rooms for Room Monitoring
  const filteredRooms = rooms.filter((r) => {
    if (roomStatusFilter === 'in_progress' && r.status !== 'in_progress') return false;
    if (roomStatusFilter === 'waiting' && r.status !== 'waiting') return false;
    if (roomStatusFilter === 'settled' && r.status !== 'settled') return false;
    if (roomStatusFilter === 'closed' && r.status !== 'closed') return false;

    if (!roomSearchQuery.trim()) return true;
    const q = roomSearchQuery.toLowerCase().trim();
    const gameNames: Record<string, string> = {
      '1a2b': '1a2b 數字密碼戰',
      'battleship': '海戰棋 艦隊對決 battleship',
      'bingo': '賓果 5x5 連線 bingo',
      'dots': '點線棋 圍地方格 dots',
      'ooxx': '經典 ooxx',
      'connect4': '四子棋 connect4',
      'blackjack': '21點 莊家對決 blackjack'
    };
    const gameName = (gameNames[r.gameId] || r.gameId).toLowerCase();
    const matchesCode = String(r.code || '').includes(q);
    const matchesId = String(r.id || '').toLowerCase().includes(q);
    const matchesGame = gameName.includes(q);
    const playerList = r.players && r.players.length > 0
      ? r.players
      : [r.player1, r.player2].filter(Boolean);
    const matchesPlayer = playerList.some(
      (p: any) =>
        p?.displayName?.toLowerCase().includes(q) ||
        p?.uid?.toLowerCase().includes(q)
    );
    return matchesCode || matchesId || matchesGame || matchesPlayer;
  });

  // Filtered users for User Management
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.userTag.includes(searchQuery) ||
      u.friendCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const p = presences.find((p) => p.uid === u.uid);
    const isOnline = p && (p.status === 'online' || p.status === 'lobby' || p.status === 'in_game');
    const isInGame = p && p.status === 'in_game';

    if (userFilter === 'online') return isOnline;
    if (userFilter === 'in_game') return isInGame;
    if (userFilter === 'admin') return u.role === 'admin';
    return true;
  });

  const handleAdjustCoins = (uid: string, delta: number) => {
    sound.playClick();
    adminUpdateUserCoins(uid, delta);
  };

  const handleCustomCoins = (uid: string, currentCoins: number) => {
    sound.playClick();
    const input = prompt(`請輸入要增加（如 500）或減少（如 -300）的金幣數量：`, '100');
    if (!input) return;
    const delta = parseInt(input, 10);
    if (isNaN(delta) || delta === 0) return;
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

  const handleCleanDeadRooms = async () => {
    sound.playClick();
    const closedRooms = rooms.filter((r) => r.status === 'closed');
    if (closedRooms.length === 0) {
      alert('目前沒有異常或已關閉的閒置房間。');
      return;
    }
    if (confirm(`發現 ${closedRooms.length} 間已結束房間，是否確認全數清理？`)) {
      for (const r of closedRooms) {
        await matchService.forceCloseRoom(r.id);
      }
      alert('已成功清空所有閒置房間！');
    }
  };

  const liveRooms = rooms.filter((r) => r.status !== 'closed');
  const totalCoins = allUsers.reduce((acc, u) => acc + (u.coins || 0), 0);
  const onlineCount = presences.filter(
    (p) => p.status === 'online' || p.status === 'lobby' || p.status === 'in_game'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        className="w-full max-w-5xl glass-panel rounded-3xl p-5 sm:p-7 border-2 border-white/80 shadow-2xl relative max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/15 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#CF995F] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-[#2E2925]">
                  管理員全方位控制台 (Admin Central)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  0ms 即時同步
                </span>
              </div>
              <p className="text-[11px] text-[#96897B] font-medium">
                最高管理者：{currentUser.displayName} ({currentUser.email || 'terrylie0215@gmail.com'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/60 text-[#96897B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between gap-2 mb-4 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-[#628395] text-white shadow-xs'
                  : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>即時房間戰況 ({rooms.length})</span>
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
              <span>玩家管理與明細 ({allUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#628395] text-white shadow-xs'
                  : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>平台總覽與數據監控</span>
            </button>
          </div>

          {activeTab === 'rooms' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshRooms}
                disabled={isRefreshingRooms}
                className="text-[11px] font-bold text-[#628395] hover:text-[#526f7f] flex items-center gap-1 cursor-pointer transition-colors bg-white/70 px-2.5 py-1 rounded-lg border border-[#628395]/30 shadow-2xs"
                title="強制向雲端 Firebase 重新整理全部房間"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRefreshingRooms ? 'animate-spin' : ''}`} />
                <span>{isRefreshingRooms ? '同步中...' : '同步雲端房間'}</span>
              </button>

              <button
                onClick={handleCleanDeadRooms}
                className="text-[11px] font-bold text-[#96897B] hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除無效房間</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Live Rooms with Detailed Real-time Monitoring */}
        {activeTab === 'rooms' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 flex flex-col">
            {/* Room Search & Status Filters */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder="搜尋房號 #8291、遊戲名稱、玩家暱稱或 UID..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/20 text-xs font-bold text-[#2E2925] focus:outline-none focus:border-[#628395]"
                />
                <Search className="w-3.5 h-3.5 text-[#96897B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-1 bg-white/60 p-1 rounded-xl border border-[#96897B]/20 shrink-0 overflow-x-auto">
                {(
                  [
                    { id: 'all', label: `全部 (${rooms.length})` },
                    { id: 'in_progress', label: `進行中 (${rooms.filter((r) => r.status === 'in_progress').length})` },
                    { id: 'waiting', label: `等待中 (${rooms.filter((r) => r.status === 'waiting').length})` },
                    { id: 'settled', label: `已結算 (${rooms.filter((r) => r.status === 'settled').length})` },
                    { id: 'closed', label: `已關閉 (${rooms.filter((r) => r.status === 'closed').length})` }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playPop();
                      setRoomStatusFilter(tab.id as any);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      roomStatusFilter === tab.id
                        ? 'bg-[#628395] text-white shadow-2xs'
                        : 'text-[#96897B] hover:text-[#2E2925]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Room List Content */}
            <div className="flex-1 space-y-3">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-20 text-xs text-[#96897B] font-medium">
                  {roomSearchQuery || roomStatusFilter !== 'all'
                    ? '查無符合搜尋條件的房間。'
                    : '目前尚無房間紀錄。點擊上方「同步雲端房間」可強制重整。'}
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const gameNames: Record<string, string> = {
                    '1a2b': '1A2B 數字密碼戰',
                    'battleship': '海戰棋 艦隊對決',
                    'bingo': '賓果 5x5 連線',
                    'dots': '點線棋 圍地方格',
                    'ooxx': '經典 OOXX',
                    'connect4': '四子棋 連線爭霸',
                    'blackjack': '21點 莊家對決'
                  };
                  const roomPlayers = room.players && room.players.length > 0
                    ? room.players
                    : [room.player1, room.player2].filter(Boolean) as any[];

                  return (
                    <div
                      key={room.id}
                      className="glass-panel-subtle rounded-2xl p-4 border border-white/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-[#628395]/15 text-[#628395] px-2 py-0.5 rounded-md">
                            #{room.code}
                          </span>
                          <span className="font-extrabold text-sm text-[#2E2925]">
                            {gameNames[room.gameId] || room.gameId.toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              room.status === 'in_progress'
                                ? 'bg-emerald-100 text-emerald-800'
                                : room.status === 'settled'
                                ? 'bg-purple-100 text-purple-800'
                                : room.status === 'closed'
                                ? 'bg-neutral-200 text-neutral-600'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {room.status === 'in_progress'
                              ? '對戰激戰中'
                              : room.status === 'settled'
                              ? '對局已結算'
                              : room.status === 'closed'
                              ? '房間已關閉'
                              : '等待玩家加入'}
                          </span>
                          <span className="text-[10px] font-mono text-[#96897B]">
                            容納人數：{roomPlayers.length} / {room.maxPlayers || 2} 人
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            ID: {room.id.slice(0, 8)}...
                          </span>
                        </div>

                        <div className="text-xs text-[#96897B] flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {roomPlayers.map((p, idx) => (
                              <span key={p.uid} className="font-bold text-[#2E2925] flex items-center gap-1">
                                <span className="text-[10px] text-[#628395]">P{idx + 1}:</span>
                                <span>{p.displayName}</span>
                              </span>
                            ))}
                            {roomPlayers.length === 1 && (
                              <span className="text-neutral-400 italic text-[11px]">(等待對手)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => setInspectedRoom(room)}
                          className="px-3 py-1.5 rounded-xl bg-[#628395] text-white text-xs font-bold hover:bg-[#526f7f] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>即時監看完整棋局</span>
                        </button>

                        {room.status !== 'closed' ? (
                          <button
                            onClick={() => handleForceClose(room.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="強制關閉房間"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>關閉</span>
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              sound.playClick();
                              await matchService.deleteRoom(room.id);
                              setRooms((prev) => prev.filter((r) => r.id !== room.id));
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="從雲端徹底移除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>徹底刪除</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Detailed Player Management */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋玩家暱稱、Email、#UserTag 或 邀請碼..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/20 text-xs font-bold text-[#2E2925] focus:outline-none focus:border-[#628395]"
                />
                <Search className="w-3.5 h-3.5 text-[#96897B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-1 bg-white/60 p-1 rounded-xl border border-[#96897B]/20 shrink-0">
                {(['all', 'online', 'in_game', 'admin'] as const).map((filterType) => {
                  const labels = {
                    all: '全部玩家',
                    online: '在線中',
                    in_game: '戰鬥中',
                    admin: '管理員'
                  };
                  return (
                    <button
                      key={filterType}
                      onClick={() => setUserFilter(filterType)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        userFilter === filterType
                          ? 'bg-[#628395] text-white shadow-2xs'
                          : 'text-[#96897B] hover:text-[#2E2925]'
                      }`}
                    >
                      {labels[filterType]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Cards List */}
            <div className="space-y-2.5">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-xs text-[#96897B]">
                  未找到符合條件的玩家。
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const presence = presences.find((p) => p.uid === u.uid);
                  const isOnline =
                    presence && (presence.status === 'online' || presence.status === 'lobby' || presence.status === 'in_game');
                  const isInGame = presence && presence.status === 'in_game';
                  const totalGames = (u.wins || 0) + (u.losses || 0);
                  const winRate = totalGames > 0 ? Math.round(((u.wins || 0) / totalGames) * 100) : 0;

                  return (
                    <div
                      key={u.uid}
                      className="glass-panel-subtle rounded-2xl p-3.5 border border-white/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs"
                    >
                      {/* Left: User Profile & Status */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`}
                            alt={u.displayName}
                            className="w-10 h-10 rounded-xl object-cover border border-[#96897B]/20"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                              isInGame
                                ? 'bg-[#CF995F] animate-pulse'
                                : isOnline
                                ? 'bg-emerald-500'
                                : 'bg-[#96897B]'
                            }`}
                            title={isInGame ? '戰鬥中' : isOnline ? '在線' : '離線'}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-sm text-[#2E2925] truncate">
                              {u.displayName}
                            </span>
                            <span className="font-mono text-xs text-[#628395] font-bold">
                              #{u.userTag}
                            </span>
                            <span className="text-[10px] font-mono bg-neutral-100 text-[#96897B] px-1.5 py-0.5 rounded">
                              邀請碼: {u.friendCode}
                            </span>
                            {u.role === 'admin' && (
                              <span className="text-[9px] bg-[#CF995F] text-white font-black px-1.5 py-0.5 rounded-md">
                                ADMIN
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-[#96897B] mt-0.5 truncate flex items-center gap-2">
                            <span>{u.email || u.uid}</span>
                            {isInGame && presence.currentRoomId && (
                              <span className="text-[#CF995F] font-bold flex items-center gap-1">
                                <Gamepad2 className="w-3 h-3" />
                                <span>在房間 #{presence.currentRoomCode}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Game Stats with Visual Progress Bar */}
                      <div className="flex items-center gap-4 text-xs shrink-0 self-start md:self-center">
                        <div>
                          <div className="text-[10px] text-[#96897B] font-bold">對戰勝率</div>
                          <div className="font-mono font-extrabold text-xs text-[#2E2925] flex items-center gap-1">
                            <span>{winRate}%</span>
                            <span className="text-[10px] text-[#96897B]">({u.wins}勝 {u.losses}敗)</span>
                          </div>
                          <div className="w-24 h-1.5 bg-neutral-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${winRate}%` }}
                            />
                          </div>
                        </div>

                        {/* Right: Coin Operations */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-[#DBAD6A]/40 font-mono font-black text-xs text-[#2E2925] shadow-2xs">
                            <Coins className="w-3.5 h-3.5 text-[#DBAD6A]" />
                            <span>{(u.coins || 0).toLocaleString()}</span>
                          </div>

                          <button
                            onClick={() => handleAdjustCoins(u.uid, 50)}
                            className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs cursor-pointer transition-colors"
                            title="增加 50 金幣"
                          >
                            +50
                          </button>
                          <button
                            onClick={() => handleAdjustCoins(u.uid, -50)}
                            className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs cursor-pointer transition-colors"
                            title="扣除 50 金幣"
                          >
                            -50
                          </button>
                          <button
                            onClick={() => handleCustomCoins(u.uid, u.coins || 0)}
                            className="px-2 py-1 rounded-lg bg-white/80 hover:bg-white border border-[#96897B]/20 text-[#2E2925] font-bold text-xs cursor-pointer transition-colors"
                            title="自訂金額"
                          >
                            自訂
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Overview & System Health Dashboard */}
        {activeTab === 'overview' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70">
                <div className="text-[11px] font-bold text-[#96897B] flex items-center gap-1">
                  <Users2 className="w-3.5 h-3.5 text-[#628395]" />
                  <span>總註冊玩家數</span>
                </div>
                <div className="text-2xl font-black text-[#628395] mt-1 font-mono">
                  {allUsers.length}
                </div>
              </div>

              <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70">
                <div className="text-[11px] font-bold text-[#96897B] flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>即時在線玩家數</span>
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                  {onlineCount}
                </div>
              </div>

              <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70">
                <div className="text-[11px] font-bold text-[#96897B] flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-[#CF995F]" />
                  <span>活躍對戰房間</span>
                </div>
                <div className="text-2xl font-black text-[#CF995F] mt-1 font-mono">
                  {liveRooms.length}
                </div>
              </div>

              <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70">
                <div className="text-[11px] font-bold text-[#96897B] flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-[#DBAD6A]" />
                  <span>流通總金幣量</span>
                </div>
                <div className="text-2xl font-black text-[#DBAD6A] mt-1 font-mono">
                  {totalCoins.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Game Activity Breakdown */}
            <div className="glass-panel-subtle rounded-3xl p-5 border border-white/70">
              <h4 className="font-extrabold text-sm text-[#2E2925] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#628395]" />
                <span>各款遊戲即時熱門活躍度分佈</span>
              </h4>

              <div className="space-y-2.5">
                {[
                  { id: '1a2b', name: '1A2B 數字密碼戰', color: '#628395' },
                  { id: 'battleship', name: '海戰棋 艦隊對決', color: '#628395' },
                  { id: 'bingo', name: '賓果 5x5 連線', color: '#DBAD6A' },
                  { id: 'dots', name: '點線棋 圍地方格', color: '#CF995F' },
                  { id: 'ooxx', name: '經典 OOXX', color: '#628395' },
                  { id: 'connect4', name: '四子棋 連線爭霸', color: '#C85A32' }
                ].map((game) => {
                  const count = liveRooms.filter((r) => r.gameId === game.id).length;
                  const percent = liveRooms.length > 0 ? (count / liveRooms.length) * 100 : 0;

                  return (
                    <div key={game.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#2E2925]">{game.name}</span>
                        <span className="font-mono text-[#96897B]">{count} 間房 ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%`, backgroundColor: game.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real-time System Latency & Architecture Status */}
            <div className="glass-panel-subtle rounded-3xl p-5 border border-white/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-sm text-[#2E2925]">
                    全域系統通訊架構：0ms 低延遲同步狀態
                  </span>
                </div>
                <p className="text-xs text-[#96897B] font-medium leading-relaxed">
                  Firebase RTDB WebSocket 常駐連線、BroadcastChannel 跨頁雙向分發、單調版本時序防回跳機制全面運作中。
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>RTDB WebSocket 正常</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: 🎲 賭場老闆後台 (CASINO BOSS DESK & PROBABILITY AUDIT)  */}
        {/* ============================================================== */}
        {activeTab === 'casino_boss' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Header Banner */}
            <div className="glass-panel-subtle rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-neutral-900/10 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
                    🎲
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#2E2925] flex items-center gap-2">
                      <span>地下賭場老闆管理中心</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                        莊家後台
                      </span>
                    </h3>
                    <p className="text-xs text-[#96897B] font-medium">
                      即時調整拉霸、刮刮樂、俄羅斯輪盤的精確中獎數學機率與獎池分成，並查閱即時下注稽核流水
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      sound.playClick();
                      if (window.confirm('確定要將賭場所有遊戲機率恢復為官方預設值嗎？')) {
                        await casinoSettings.resetSettings();
                        setCasinoSaveSuccess(true);
                        setTimeout(() => setCasinoSaveSuccess(false), 2000);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white text-xs font-bold text-[#5C5346] border border-[#96897B]/30 transition-all cursor-pointer"
                  >
                    🔄 還原官方平衡機率
                  </button>

                  <button
                    onClick={async () => {
                      sound.playSuccess();
                      await casinoSettings.updateSettings(casinoSettingsState, currentUser?.displayName);
                      setCasinoSaveSuccess(true);
                      setTimeout(() => setCasinoSaveSuccess(false), 2000);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{casinoSaveSuccess ? '已成功同步全伺服器！' : '儲存機率配置'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 賭場總營業額與莊家損益 KPI 看板 */}
            {(() => {
              const totalBet = casinoHistory.reduce((sum, r) => sum + (r.bet || 0), 0);
              const totalPayout = casinoHistory.reduce((sum, r) => sum + (r.payout || 0), 0);
              const houseProfit = totalBet - totalPayout;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70">
                    <div className="text-[11px] font-bold text-[#96897B] flex items-center gap-1">
                      <span>🪙</span>
                      <span>玩家歷史總押注</span>
                    </div>
                    <div className="text-xl font-black text-[#2E2925] mt-1 font-mono">
                      🪙 {totalBet.toLocaleString()}
                    </div>
                  </div>

                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70">
                    <div className="text-[11px] font-bold text-[#96897B] flex items-center gap-1">
                      <span>🏆</span>
                      <span>賭場總派彩金幣</span>
                    </div>
                    <div className="text-xl font-black text-amber-600 mt-1 font-mono">
                      🪙 {totalPayout.toLocaleString()}
                    </div>
                  </div>

                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70">
                    <div className="text-[11px] font-bold text-[#96897B] flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>莊家歷史淨收益</span>
                    </div>
                    <div className={`text-xl font-black mt-1 font-mono ${
                      houseProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {houseProfit >= 0 ? '+' : ''}🪙 {houseProfit.toLocaleString()}
                    </div>
                  </div>

                  <div className="glass-panel-subtle rounded-2xl p-4 border border-white/70">
                    <div className="text-[11px] font-bold text-[#96897B] flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      <span>累計稽核流水局數</span>
                    </div>
                    <div className="text-xl font-black text-indigo-600 mt-1 font-mono">
                      {casinoHistory.length} 局
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3 大賭博遊戲詳細機率微調面板 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. 🎰 幸運拉霸機設定 */}
              <div className="glass-panel-subtle rounded-3xl p-4 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#96897B]/20">
                  <span className="text-lg">🎰</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#2E2925]">幸運拉霸機詳細機率</h4>
                    <p className="text-[10px] text-[#96897B]">控制 777 爆擊、雙 7 與連線返還</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">👑 777 爆擊大獎機率</span>
                      <span className="text-amber-600 font-mono font-black">{casinoSettingsState.slotJackpot777Chance}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      value={casinoSettingsState.slotJackpot777Chance}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, slotJackpot777Chance: parseFloat(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">✨ 雙星 77 中獎機率</span>
                      <span className="text-amber-600 font-mono font-black">{casinoSettingsState.slotTwin77Chance}%</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="20.0"
                      step="0.5"
                      value={casinoSettingsState.slotTwin77Chance}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, slotTwin77Chance: parseFloat(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">🔔 3 圖標連線普通機率</span>
                      <span className="text-amber-600 font-mono font-black">{casinoSettingsState.slotNormalMatchChance}%</span>
                    </div>
                    <input
                      type="range"
                      min="5.0"
                      max="40.0"
                      step="1.0"
                      value={casinoSettingsState.slotNormalMatchChance}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, slotNormalMatchChance: parseFloat(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">🏆 77/777 奪取大獎池比例</span>
                      <span className="text-emerald-600 font-mono font-black">{casinoSettingsState.slotJackpotPayoutPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={casinoSettingsState.slotJackpotPayoutPct}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, slotJackpotPayoutPct: parseInt(e.target.value, 10) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">🎯 目標返獎率 RTP</span>
                      <span className="text-indigo-600 font-mono font-black">{casinoSettingsState.slotRtpTarget}%</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="98"
                      step="1"
                      value={casinoSettingsState.slotRtpTarget}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, slotRtpTarget: parseInt(e.target.value, 10) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 2. 🎟️ 黃金刮刮樂設定 */}
              <div className="glass-panel-subtle rounded-3xl p-4 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#96897B]/20">
                  <span className="text-lg">🎟️</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#2E2925]">黃金刮刮樂獎項機率</h4>
                    <p className="text-[10px] text-[#96897B]">調整特獎、二獎、三獎與保本率</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">👑 特等頭獎中獎機率</span>
                      <span className="text-amber-600 font-mono font-black">{casinoSettingsState.scratchJackpotChance}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="8.0"
                      step="0.5"
                      value={casinoSettingsState.scratchJackpotChance}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, scratchJackpotChance: parseFloat(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">💎 二獎中獎機率</span>
                      <span className="text-amber-600 font-mono font-black">{casinoSettingsState.scratchSecondChance}%</span>
                    </div>
                    <input
                      type="range"
                      min="2.0"
                      max="15.0"
                      step="0.5"
                      value={casinoSettingsState.scratchSecondChance}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, scratchSecondChance: parseFloat(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">🔔 三獎中獎機率</span>
                      <span className="text-amber-600 font-mono font-black">{casinoSettingsState.scratchThirdChance}%</span>
                    </div>
                    <input
                      type="range"
                      min="5.0"
                      max="25.0"
                      step="1.0"
                      value={casinoSettingsState.scratchThirdChance}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, scratchThirdChance: parseFloat(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">🪙 保本獎中獎機率</span>
                      <span className="text-indigo-600 font-mono font-black">{casinoSettingsState.scratchBreakevenChance}%</span>
                    </div>
                    <input
                      type="range"
                      min="10.0"
                      max="40.0"
                      step="1.0"
                      value={casinoSettingsState.scratchBreakevenChance}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, scratchBreakevenChance: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 3. 🎯 俄羅斯輪盤生還率設定 */}
              <div className="glass-panel-subtle rounded-3xl p-4 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#96897B]/20">
                  <span className="text-lg">🎯</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#2E2925]">俄羅斯輪盤生還機率</h4>
                    <p className="text-[10px] text-[#96897B]">細緻微調第 1 至 5 輪生還比例</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">第 1 輪生還率 (1.5x)</span>
                      <span className="text-emerald-600 font-mono font-black">{casinoSettingsState.rouletteRound1Survival}%</span>
                    </div>
                    <input
                      type="range"
                      min="50.0"
                      max="95.0"
                      step="0.5"
                      value={casinoSettingsState.rouletteRound1Survival}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, rouletteRound1Survival: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">第 2 輪生還率 (2.5x)</span>
                      <span className="text-emerald-600 font-mono font-black">{casinoSettingsState.rouletteRound2Survival}%</span>
                    </div>
                    <input
                      type="range"
                      min="40.0"
                      max="90.0"
                      step="0.5"
                      value={casinoSettingsState.rouletteRound2Survival}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, rouletteRound2Survival: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">第 3 輪生還率 (4.5x)</span>
                      <span className="text-emerald-600 font-mono font-black">{casinoSettingsState.rouletteRound3Survival}%</span>
                    </div>
                    <input
                      type="range"
                      min="30.0"
                      max="85.0"
                      step="0.5"
                      value={casinoSettingsState.rouletteRound3Survival}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, rouletteRound3Survival: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">第 4 輪生還率 (9.0x)</span>
                      <span className="text-emerald-600 font-mono font-black">{casinoSettingsState.rouletteRound4Survival}%</span>
                    </div>
                    <input
                      type="range"
                      min="20.0"
                      max="80.0"
                      step="0.5"
                      value={casinoSettingsState.rouletteRound4Survival}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, rouletteRound4Survival: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">第 5 輪通關生還率 (20x)</span>
                      <span className="text-rose-600 font-mono font-black">{casinoSettingsState.rouletteRound5Survival}%</span>
                    </div>
                    <input
                      type="range"
                      min="10.0"
                      max="70.0"
                      step="0.5"
                      value={casinoSettingsState.rouletteRound5Survival}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, rouletteRound5Survival: parseFloat(e.target.value) })}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#5C5346]">第 5 輪奪取大獎池比例</span>
                      <span className="text-amber-600 font-mono font-black">{casinoSettingsState.rouletteJackpotPayoutPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={casinoSettingsState.rouletteJackpotPayoutPct}
                      onChange={(e) => setCasinoSettingsState({ ...casinoSettingsState, rouletteJackpotPayoutPct: parseInt(e.target.value, 10) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 賭場即時下注與損益稽核流水表 (Audit Trail Table) */}
            <div className="glass-panel-subtle rounded-3xl p-5 border border-white/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-600" />
                  <h4 className="font-extrabold text-sm text-[#2E2925]">即時賭博下注與派彩詳細稽核紀錄</h4>
                </div>

                {/* 篩選標籤 */}
                <div className="flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-[#96897B]/20 text-xs">
                  {(['all', 'slot', 'scratch', 'roulette'] as const).map((filterId) => (
                    <button
                      key={filterId}
                      onClick={() => setCasinoHistoryFilter(filterId)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        casinoHistoryFilter === filterId
                          ? 'bg-[#2E2925] text-white shadow-xs'
                          : 'text-[#786F66] hover:text-[#2E2925]'
                      }`}
                    >
                      {filterId === 'all' && '全部紀錄'}
                      {filterId === 'slot' && '🎰 拉霸機'}
                      {filterId === 'scratch' && '🎫 刮刮樂'}
                      {filterId === 'roulette' && '🎯 輪盤'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 紀錄列表 */}
              <div className="overflow-x-auto rounded-2xl border border-[#96897B]/20 bg-white/50">
                <table className="w-full text-left text-xs text-[#2E2925]">
                  <thead className="bg-[#F0EBE1] text-[#786F66] font-bold border-b border-[#96897B]/20">
                    <tr>
                      <th className="p-3">時間</th>
                      <th className="p-3">玩家</th>
                      <th className="p-3">遊戲</th>
                      <th className="p-3">下注額</th>
                      <th className="p-3">返獎額</th>
                      <th className="p-3">莊家淨損益</th>
                      <th className="p-3">結果詳情</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#96897B]/15">
                    {casinoHistory
                      .filter((r) => casinoHistoryFilter === 'all' || r.game === casinoHistoryFilter)
                      .slice(0, 50)
                      .map((record) => {
                        const houseNet = (record.bet || 0) - (record.payout || 0);
                        const isWin = houseNet > 0;
                        const isEven = houseNet === 0;
                        return (
                          <tr key={record.id} className="hover:bg-white/80 transition-colors">
                            <td className="p-3 font-mono text-[11px] text-[#786F66]">
                              {new Date(record.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="p-3 font-bold">
                              {record.displayName}
                              <span className="text-[10px] text-[#96897B] font-mono ml-1">#{record.userTag}</span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#628395]/15 text-[#628395]">
                                {record.game === 'slot' && '🎰 幸運拉霸'}
                                {record.game === 'scratch' && '🎫 黃金刮刮樂'}
                                {record.game === 'roulette' && '🎯 俄羅斯輪盤'}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-amber-700">
                              🪙 {record.bet}
                            </td>
                            <td className="p-3 font-mono font-bold text-amber-600">
                              🪙 {record.payout}
                            </td>
                            <td className="p-3 font-mono font-black">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] ${
                                  isWin
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isEven
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {houseNet > 0 ? `+🪙 ${houseNet}` : houseNet < 0 ? `-🪙 ${Math.abs(houseNet)}` : '平手'}
                              </span>
                            </td>
                            <td className="p-3 text-[11px] text-[#5C5346] font-medium">
                              {record.detail}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: 👗 服裝商城定價管理 (LPC WARDROBE PRICING ADMIN)         */}
        {/* ============================================================== */}
        {activeTab === 'shop_pricing' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Header Banner */}
            <div className="glass-panel-subtle rounded-3xl p-5 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/20 via-neutral-900/10 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center text-2xl shadow-inner">
                    👗
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#2E2925] flex items-center gap-2">
                      <span>2D 像素服裝商城定價管理</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                        Universal LPC
                      </span>
                    </h3>
                    <p className="text-xs text-[#96897B] font-medium">
                      隨時自訂上衣、長褲、鞋子、髮型、帽子與飾品的金幣售價，設為 0 即代表新手免費發放
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      sound.playSuccess();
                      await itemPricing.setBatchPrices(customPrices);
                      setPricingSaveSuccess(true);
                      setTimeout(() => setPricingSaveSuccess(false), 2000);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{pricingSaveSuccess ? '已成功同步全服價格！' : '一鍵儲存全商城定價'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 篩選與搜尋列 */}
            <div className="glass-panel-subtle rounded-2xl p-3 border border-white/70 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: 'all', label: '全部' },
                    { id: 'top', label: '上衣' },
                    { id: 'bottom', label: '褲子' },
                    { id: 'shoes', label: '鞋子' },
                    { id: 'hat', label: '帽子' },
                    { id: 'hair', label: '髮型' },
                    { id: 'accessories', label: '配件' }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPriceCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      priceCategoryFilter === tab.id
                        ? 'bg-[#2E2925] text-white shadow-xs'
                        : 'bg-white/70 text-[#5C5346] hover:bg-white border border-[#96897B]/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#96897B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="搜尋服裝名稱..."
                    value={priceSearchQuery}
                    onChange={(e) => setPriceSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-white/80 border border-[#96897B]/20 text-xs text-[#2E2925] focus:outline-none focus:border-indigo-500 w-40 sm:w-52"
                  />
                </div>
              </div>
            </div>

            {/* 商品定價卡片清單 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LPC_ITEMS.filter((item) => {
                if (priceCategoryFilter !== 'all' && item.category !== priceCategoryFilter) return false;
                if (priceSearchQuery.trim()) {
                  return item.name.toLowerCase().includes(priceSearchQuery.toLowerCase());
                }
                return true;
              }).map((item) => {
                const currentPrice = customPrices[item.id] !== undefined ? customPrices[item.id] : (item.price ?? 100);
                return (
                  <div
                    key={item.id}
                    className="glass-panel-subtle rounded-2xl p-3 border border-white/80 flex items-center gap-3 hover:border-indigo-400/50 transition-all shadow-xs"
                  >
                    <div className="w-14 h-14 bg-[#F5EFE6] rounded-xl flex items-center justify-center p-1 border border-[#E5DEC9] shrink-0 overflow-hidden shadow-inner">
                      <img
                        src={`/assets/lpc/thumbnails/${item.id}.png`}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[#2E2925] truncate">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bold shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#786F66] truncate mt-0.5">
                        {item.description || item.license}
                      </div>

                      {/* 價格調整區 */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-[#96897B]/30 shadow-inner">
                          <span className="text-xs">🪙</span>
                          <input
                            type="number"
                            min="0"
                            max="99999"
                            step="10"
                            value={currentPrice}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setCustomPrices((prev) => ({ ...prev, [item.id]: val }));
                            }}
                            className="w-16 text-xs font-mono font-black text-[#2E2925] focus:outline-none"
                          />
                        </div>

                        <button
                          onClick={async () => {
                            sound.playClick();
                            await itemPricing.setPrice(item.id, currentPrice);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          儲存
                        </button>

                        <button
                          onClick={async () => {
                            sound.playClick();
                            setCustomPrices((prev) => ({ ...prev, [item.id]: 0 }));
                            await itemPricing.setPrice(item.id, 0);
                          }}
                          className="px-2 py-1 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold transition-all cursor-pointer"
                          title="設為免費"
                        >
                          免費
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* COMPREHENSIVE DETAILED ROOM INSPECTOR MODAL                    */}
        {/* ============================================================== */}
        <AnimatePresence>
          {inspectedRoom && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="w-full max-w-4xl glass-panel rounded-3xl p-5 sm:p-6 border-2 border-white/90 shadow-2xl relative max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/20 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-[#CF995F]" />
                    <div>
                      <h4 className="font-extrabold text-base text-[#2E2925] flex items-center gap-2">
                        <span>房間即時棋局全貌監看 #{inspectedRoom.code}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#628395]/15 text-[#628395]">
                          {inspectedRoom.gameId.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                          {inspectedRoom.status === 'in_progress' ? '激戰中' : '等待中'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#96897B]">
                        房主 UID：{inspectedRoom.hostUid} · 模式：{inspectedRoom.maxPlayers || 2} 人
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectedRoom(null)}
                    className="p-1.5 rounded-xl hover:bg-white/60 text-[#96897B] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Scrollable Body */}
                <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                  {/* Players bar */}
                  <div className="bg-white/70 p-3 rounded-2xl border border-white/80 shadow-2xs flex items-center justify-around gap-2 flex-wrap">
                    {inspectedRoom.players && inspectedRoom.players.length > 0 ? (
                      inspectedRoom.players.map((p, idx) => (
                        <div key={p.uid} className="flex items-center gap-2">
                          <img
                            src={p.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.uid}`}
                            alt={p.displayName}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-bold text-[#2E2925]">{p.displayName}</div>
                            <div className="text-[10px] text-[#628395] font-extrabold">玩家 P{idx + 1}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="font-bold text-[#628395]">P1: {inspectedRoom.player1.displayName}</div>
                        <div className="font-bold text-[#CF995F]">P2: {inspectedRoom.player2?.displayName || '未進房'}</div>
                      </>
                    )}
                  </div>

                  {/* ============================================================== */}
                  {/* 1. 1A2B 數字密碼戰：查看雙方出題密碼與完整答題狀況            */}
                  {/* ============================================================== */}
                  {inspectedRoom.gameId === '1a2b' && inspectedRoom.state1a2b && (
                    <div className="space-y-3">
                      {/* Secrets & Config Card */}
                      <div className="bg-white/80 p-4 rounded-2xl border border-white/80 shadow-xs">
                        <div className="font-extrabold text-[#628395] text-xs mb-2 flex items-center gap-1.5">
                          <Hash className="w-4 h-4" />
                          <span>雙方設定秘密密碼與鎖定狀態</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                          <div className="bg-[#628395]/10 p-3 rounded-xl border border-[#628395]/20">
                            <div className="text-[11px] text-[#628395] font-bold">
                              {inspectedRoom.player1.displayName} (P1) 密碼：
                            </div>
                            <div className="text-xl font-black text-[#628395] tracking-widest mt-1">
                              {inspectedRoom.state1a2b.secrets[inspectedRoom.player1.uid] || '尚未鎖定'}
                            </div>
                          </div>

                          <div className="bg-[#CF995F]/10 p-3 rounded-xl border border-[#CF995F]/20">
                            <div className="text-[11px] text-[#CF995F] font-bold">
                              {inspectedRoom.player2?.displayName || 'P2'} 密碼：
                            </div>
                            <div className="text-xl font-black text-[#CF995F] tracking-widest mt-1">
                              {inspectedRoom.player2
                                ? inspectedRoom.state1a2b.secrets[inspectedRoom.player2.uid] || '尚未鎖定'
                                : '等待對手加入'}
                            </div>
                          </div>
                        </div>

                        {inspectedRoom.state1a2b.targetSecret && (
                          <div className="mt-2 text-center text-xs font-mono text-purple-700 bg-purple-50 p-2 rounded-xl">
                            多人派對公共目標謎底：<strong>{inspectedRoom.state1a2b.targetSecret}</strong>
                          </div>
                        )}
                      </div>

                      {/* Guesses Log Table */}
                      <div className="bg-white/80 p-4 rounded-2xl border border-white/80 shadow-xs">
                        <div className="font-extrabold text-[#2E2925] text-xs mb-2">
                          歷次攻防猜題紀錄 ({inspectedRoom.state1a2b.guesses.length} 次猜測)：
                        </div>

                        {inspectedRoom.state1a2b.guesses.length === 0 ? (
                          <div className="text-center py-8 text-[#96897B] font-medium">尚未開始猜題。</div>
                        ) : (
                          <div className="max-h-56 overflow-y-auto space-y-1.5 font-mono">
                            {inspectedRoom.state1a2b.guesses.map((g, idx) => {
                              const isP1 = g.guesserUid === inspectedRoom.player1.uid;
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#96897B]/15 text-xs shadow-2xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                        isP1 ? 'bg-[#628395] text-white' : 'bg-[#CF995F] text-white'
                                      }`}
                                    >
                                      {isP1 ? 'P1' : 'P2'}
                                    </span>
                                    <span className="font-bold text-sm tracking-widest text-[#2E2925]">
                                      {g.guess}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm text-[#DBAD6A] bg-[#DBAD6A]/15 px-2 py-0.5 rounded-lg border border-[#DBAD6A]/30">
                                      {g.bulls}A {g.cows}B
                                    </span>
                                    {g.timestamp && (
                                      <span className="text-[10px] text-[#96897B]">
                                        {new Date(g.timestamp).toLocaleTimeString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* 2. 海戰棋：查看兩個人的棋盤 (雙方佈陣與雷達轟炸即時圖)        */}
                  {/* ============================================================== */}
                  {inspectedRoom.gameId === 'battleship' && inspectedRoom.stateBattleship && (() => {
                    const bState = inspectedRoom.stateBattleship;
                    const gSize = bState.gridSize || 8;
                    const p1Uid = inspectedRoom.player1.uid;
                    const p2Uid = inspectedRoom.player2?.uid || '';
                    const b1 = bState.boards[p1Uid];
                    const b2 = bState.boards[p2Uid];

                    const renderOceanGrid = (board: any, label: string, pName: string, color: string) => {
                      const ships = board?.ships || [];
                      const attacks = board?.attacksReceived || [];

                      return (
                        <div className="bg-white/80 p-3.5 rounded-2xl border border-white shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-xs" style={{ color }}>
                              {pName} 的海域戰艦佈署
                            </span>
                            <span className="text-[10px] font-mono text-[#96897B]">
                              存活：{ships.filter((s: any) => !s.sunk).length} / {ships.length} 艘
                            </span>
                          </div>

                          {/* Grid */}
                          <div
                            className="aspect-square max-w-[260px] mx-auto bg-[#628395]/10 p-1.5 rounded-xl border border-[#628395]/20 select-none"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: `18px repeat(${gSize}, minmax(0, 1fr))`,
                              gridTemplateRows: `18px repeat(${gSize}, minmax(0, 1fr))`,
                              gap: '2px'
                            }}
                          >
                            <div className="flex items-center justify-center font-mono font-bold text-[9px] text-[#96897B]">
                              #
                            </div>
                            {Array.from({ length: gSize }).map((_, c) => (
                              <div key={`c-${c}`} className="flex items-center justify-center font-mono font-bold text-[9px] text-[#628395]">
                                {c + 1}
                              </div>
                            ))}
                            {Array.from({ length: gSize }).map((_, r) => (
                              <React.Fragment key={`r-${r}`}>
                                <div className="flex items-center justify-center font-mono font-bold text-[9px] text-[#628395]">
                                  {String.fromCharCode(65 + r)}
                                </div>
                                {Array.from({ length: gSize }).map((_, c) => {
                                  const hasShip = ships.some((s: any) =>
                                    s.coords && s.coords.some((pt: any) => pt.r === r && pt.c === c)
                                  );
                                  const attack = attacks.find((a: any) => a.r === r && a.c === c);
                                  const isHit = Boolean(attack?.hit);
                                  const isMiss = attack && !attack.hit;

                                  return (
                                    <div
                                      key={`${r}-${c}`}
                                      className={`rounded flex items-center justify-center font-mono text-[9px] ${
                                        isHit
                                          ? 'bg-rose-500 text-white'
                                          : isMiss
                                          ? 'bg-sky-200 text-sky-800'
                                          : hasShip
                                          ? 'bg-[#628395] text-white'
                                          : 'bg-white/60 text-[#96897B]/30'
                                      }`}
                                    >
                                      {isHit ? '🔥' : isMiss ? '💧' : hasShip ? '⚓' : ''}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-[#628395] flex items-center gap-1.5">
                          <Anchor className="w-4 h-4" />
                          <span>雙方海域戰況並排檢視（{gSize}x{gSize} 海域規格）</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {renderOceanGrid(b1, 'P1', inspectedRoom.player1.displayName, '#628395')}
                          {renderOceanGrid(b2, 'P2', inspectedRoom.player2?.displayName || 'P2', '#CF995F')}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* 3. 賓果 5x5：查看 1~25 所有數字出球狀態與所有人的牌            */}
                  {/* ============================================================== */}
                  {inspectedRoom.gameId === 'bingo' && inspectedRoom.stateBingo && (() => {
                    const bState = inspectedRoom.stateBingo;
                    const called = Array.isArray(bState.calledNumbers) ? bState.calledNumbers : [];
                    const calledSet = new Set(called);
                    const boards = bState.boards || {};
                    const lines = bState.linesCompleted || {};
                    const targetLines = bState.targetLines || 5;
                    const roomPlayers = inspectedRoom.players && inspectedRoom.players.length > 0
                      ? inspectedRoom.players
                      : [inspectedRoom.player1, inspectedRoom.player2].filter(Boolean) as any[];

                    return (
                      <div className="space-y-3">
                        {/* 1~25 All Numbers Live State Grid */}
                        <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-xs text-[#DBAD6A] flex items-center gap-1.5">
                              <Grid className="w-4 h-4" />
                              <span>1～25 號碼完整開球狀態矩陣</span>
                            </span>
                            <span className="text-[11px] font-mono font-bold text-[#2E2925]">
                              已開出：{called.length} / 25 球
                            </span>
                          </div>

                          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                            {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
                              const isNumCalled = calledSet.has(num);
                              const callOrder = called.indexOf(num);

                              return (
                                <div
                                  key={`num-${num}`}
                                  className={`p-1.5 rounded-xl flex flex-col items-center justify-center font-mono transition-all ${
                                    isNumCalled
                                      ? 'bg-[#DBAD6A] text-white shadow-xs font-black'
                                      : 'bg-white/60 text-[#96897B] border border-[#96897B]/20 font-bold'
                                  }`}
                                >
                                  <span className="text-xs">{num}</span>
                                  {isNumCalled && (
                                    <span className="text-[8px] opacity-80">#{callOrder + 1}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* All Players' 5x5 Boards Side-by-Side */}
                        <div className="space-y-2">
                          <div className="font-extrabold text-xs text-[#2E2925] flex items-center gap-1.5">
                            <Users2 className="w-4 h-4 text-[#628395]" />
                            <span>所有玩家 5x5 賓果卡實況</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {roomPlayers.map((p, idx) => {
                              const pBoard = boards[p.uid] || [];
                              const pLines = lines[p.uid] || 0;
                              const lineStats = calculateLines(pBoard, called);

                              return (
                                <div key={p.uid} className="bg-white/80 p-3.5 rounded-2xl border border-white shadow-xs">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-bold text-xs text-[#2E2925] truncate">
                                      P{idx + 1}: {p.displayName}
                                    </div>
                                    <div className="text-[11px] font-mono font-black text-[#DBAD6A]">
                                      {pLines} / {targetLines} 條線
                                    </div>
                                  </div>

                                  {/* 5x5 Grid */}
                                  {pBoard.length === 5 ? (
                                    <div className="grid grid-cols-5 gap-1 aspect-square max-w-[200px] mx-auto bg-neutral-100 p-1 rounded-xl">
                                      {pBoard.map((row: number[], r: number) =>
                                        row.map((val: number, c: number) => {
                                          const isMarked = val > 0 && calledSet.has(val);
                                          return (
                                            <div
                                              key={`${r}-${c}`}
                                              className={`rounded flex items-center justify-center font-mono font-black text-xs ${
                                                isMarked
                                                  ? 'bg-[#DBAD6A] text-white shadow-xs'
                                                  : 'bg-white text-[#2E2925]'
                                              }`}
                                            >
                                              {val || '•'}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-center py-10 text-neutral-400 text-xs">
                                      尚未完成棋盤佈陣
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* 4. 點線棋：查看整個棋盤畫面 (完整劃線與方格佔領分數)            */}
                  {/* ============================================================== */}
                  {inspectedRoom.gameId === 'dots' && inspectedRoom.stateDots && (() => {
                    const dState = inspectedRoom.stateDots;
                    const bCount = dState.gridSize || 4;
                    const gDots = bCount + 1;
                    const stepPercent = 100 / bCount;
                    const lines = dState.lines || {};
                    const boxes = dState.boxes || {};
                    const totalBoxes = bCount * bCount;

                    return (
                      <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[#CF995F] flex items-center gap-1.5">
                            <SquareDot className="w-4 h-4" />
                            <span>點線棋整局實時畫面 ({bCount}x{bCount})</span>
                          </span>
                          <span className="text-[11px] font-mono text-[#96897B]">
                            已佔領方格：{Object.keys(boxes).length} / {totalBoxes}
                          </span>
                        </div>

                        {/* Interactive Board Reproduction */}
                        <div className="relative w-full max-w-[260px] aspect-square mx-auto bg-[#CF995F]/10 p-3 rounded-2xl border border-[#CF995F]/30 select-none">
                          {/* Boxes */}
                          {Array.from({ length: bCount }).map((_, r) =>
                            Array.from({ length: bCount }).map((_, c) => {
                              const owner = boxes[`${r}_${c}`];
                              const isP1 = owner === inspectedRoom.player1.uid;
                              return (
                                <div
                                  key={`abox-${r}-${c}`}
                                  className="absolute flex items-center justify-center rounded-lg font-mono font-black text-xs text-white"
                                  style={{
                                    top: `${r * stepPercent}%`,
                                    left: `${c * stepPercent}%`,
                                    width: `${stepPercent}%`,
                                    height: `${stepPercent}%`,
                                    padding: '4px'
                                  }}
                                >
                                  {owner && (
                                    <div
                                      className={`w-full h-full rounded flex items-center justify-center ${
                                        isP1 ? 'bg-[#628395]' : 'bg-[#CF995F]'
                                      }`}
                                    >
                                      {isP1 ? 'P1' : 'P2'}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}

                          {/* Horizontal Lines */}
                          {Array.from({ length: gDots }).map((_, r) =>
                            Array.from({ length: gDots - 1 }).map((_, c) => {
                              const owner = lines[`h_${r}_${c}`];
                              const isP1 = owner === inspectedRoom.player1.uid;
                              return (
                                <div
                                  key={`ah-${r}-${c}`}
                                  className={`absolute h-1.5 -translate-y-0.5 rounded-full ${
                                    owner ? (isP1 ? 'bg-[#628395]' : 'bg-[#CF995F]') : 'bg-neutral-300'
                                  }`}
                                  style={{
                                    top: `${r * stepPercent}%`,
                                    left: `${c * stepPercent}%`,
                                    width: `${stepPercent}%`
                                  }}
                                />
                              );
                            })
                          )}

                          {/* Vertical Lines */}
                          {Array.from({ length: gDots - 1 }).map((_, r) =>
                            Array.from({ length: gDots }).map((_, c) => {
                              const owner = lines[`v_${r}_${c}`];
                              const isP1 = owner === inspectedRoom.player1.uid;
                              return (
                                <div
                                  key={`av-${r}-${c}`}
                                  className={`absolute w-1.5 -translate-x-0.5 rounded-full ${
                                    owner ? (isP1 ? 'bg-[#628395]' : 'bg-[#CF995F]') : 'bg-neutral-300'
                                  }`}
                                  style={{
                                    top: `${r * stepPercent}%`,
                                    left: `${c * stepPercent}%`,
                                    height: `${stepPercent}%`
                                  }}
                                />
                              );
                            })
                          )}

                          {/* Dots */}
                          {Array.from({ length: gDots }).map((_, r) =>
                            Array.from({ length: gDots }).map((_, c) => (
                              <div
                                key={`adot-${r}-${c}`}
                                className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2E2925] z-10"
                                style={{
                                  top: `${r * stepPercent}%`,
                                  left: `${c * stepPercent}%`
                                }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* 5. 經典 OOXX：查看整局畫面 (3x3 棋盤落子與連線詳情)            */}
                  {/* ============================================================== */}
                  {inspectedRoom.gameId === 'ooxx' && inspectedRoom.stateOOXX && (() => {
                    const oxState = inspectedRoom.stateOOXX;
                    const grid = oxState.grid || [
                      [null, null, null],
                      [null, null, null],
                      [null, null, null]
                    ];
                    const moves = oxState.movesHistory || [];
                    const p1Uid = inspectedRoom.player1.uid;

                    return (
                      <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[#628395] flex items-center gap-1.5">
                            <CircleDot className="w-4 h-4" />
                            <span>經典 OOXX 3x3 棋盤實況</span>
                          </span>
                          <span className="text-[11px] font-mono text-[#96897B]">
                            累計落子：{moves.length} 步
                          </span>
                        </div>

                        {/* 3x3 Grid */}
                        <div className="grid grid-cols-3 gap-2 aspect-square max-w-[200px] mx-auto bg-neutral-100 p-2 rounded-2xl">
                          {grid.map((row: any[], r: number) =>
                            row.map((cellUid: string | null, c: number) => {
                              const isP1 = cellUid === p1Uid;
                              const isWinning = oxState.winningLine?.some(
                                (pt: any) => pt.r === r && pt.c === c
                              );
                              return (
                                <div
                                  key={`${r}-${c}`}
                                  className={`rounded-xl flex items-center justify-center font-black text-2xl ${
                                    isWinning
                                      ? 'bg-[#DBAD6A] text-white shadow-md'
                                      : cellUid
                                      ? isP1
                                        ? 'bg-[#628395] text-white'
                                        : 'bg-[#CF995F] text-white'
                                      : 'bg-white text-neutral-300'
                                  }`}
                                >
                                  {cellUid ? (isP1 ? 'O' : 'X') : ''}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 6. 四子棋 Connect Four 盤面實況 */}
                  {inspectedRoom.gameId === 'connect4' && inspectedRoom.stateConnect4 && (() => {
                    const c4State = inspectedRoom.stateConnect4;
                    const grid = c4State.grid || Array(6).fill(null).map(() => Array(7).fill(null));
                    const p1Uid = inspectedRoom.player1.uid;

                    return (
                      <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[#C85A32] flex items-center gap-1.5">
                            <Layers className="w-4 h-4" />
                            <span>四子棋 7x6 垂直重力棋盤實況</span>
                          </span>
                          <span className="text-[11px] font-mono text-[#96897B]">
                            當前輪到：{c4State.currentTurnUid === p1Uid ? inspectedRoom.player1.displayName : inspectedRoom.player2?.displayName || 'P2'}
                          </span>
                        </div>

                        {/* 6x7 Grid */}
                        <div className="grid grid-cols-7 gap-1.5 max-w-[280px] mx-auto bg-[#1C3550] p-2.5 rounded-2xl">
                          {grid.map((row: any[], r: number) =>
                            row.map((cellUid: string | null, c: number) => {
                              const isP1 = cellUid === p1Uid;
                              const isWinning = c4State.winningLine?.some(
                                (pt: any) => pt.r === r && pt.c === c
                              );
                              return (
                                <div
                                  key={`${r}-${c}`}
                                  className={`aspect-square rounded-full flex items-center justify-center font-black text-xs ${
                                    isWinning
                                      ? 'ring-2 ring-yellow-400 bg-yellow-400 text-neutral-900 animate-pulse'
                                      : cellUid
                                      ? isP1
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-amber-400 text-white'
                                      : 'bg-[#132233]'
                                  }`}
                                />
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-[#96897B]/15 mt-3 flex justify-between shrink-0">
                  <button
                    onClick={() => handleForceClose(inspectedRoom.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>強制關閉房間</span>
                  </button>

                  <button
                    onClick={() => setInspectedRoom(null)}
                    className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-[#2E2925] border border-[#96897B]/20 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
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
