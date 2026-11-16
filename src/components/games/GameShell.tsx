import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Copy,
  Check,
  Flag,
  Users2,
  UserPlus,
  WifiOff,
  Wifi,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sliders,
  Award
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { VictoryCelebration } from '../common/VictoryCelebration';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { InviteFriendsModal } from '../lobby/InviteFriendsModal';
import { RoomConfigModal } from '../lobby/RoomConfigModal';
import { ExamCardModal } from '../profile/ExamCardModal';
import { LpcAvatarView } from '../profile/LpcAvatarView';
import { DEFAULT_LPC_CHARACTER } from '../../data/lpcCatalog';
import { sound } from '../../services/soundService';
import type { PlayerSlot, RoomCreationOptions } from '../../types';

interface GameShellProps {
  title: string;
  gameId: string;
  onOpenRules: () => void;
  children: React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = ({
  title,
  gameId,
  onOpenRules,
  children
}) => {
  const {
    currentRoom,
    leaveRoom,
    surrender,
    restartGame,
    startGame,
    updateRoomState,
    myRole,
    isHost,
    players,
    isConnected,
    isOpponentConnected,
    reconnecting
  } = useRoom();
  const { currentUser, recordGameResult } = useAuth();
  const [copied, setCopied] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [inviteFriendsOpen, setInviteFriendsOpen] = useState(false);
  const [configRulesOpen, setConfigRulesOpen] = useState(false);
  const [inspectUser, setInspectUser] = useState<any>(null);

  if (!currentRoom || !currentUser) return null;

  const handleUpdateRoomConfig = async (options: RoomCreationOptions) => {
    try {
      await updateRoomState((draft) => {
        if (options.maxPlayers) {
          draft.maxPlayers = options.maxPlayers;
        }
        if (draft.gameId === '1a2b' && draft.state1a2b) {
          if (options.hintEnabled !== undefined) draft.state1a2b.hintEnabled = options.hintEnabled;
          if (options.hintRound !== undefined) draft.state1a2b.hintRound = options.hintRound;
          if (options.maxRounds !== undefined) draft.state1a2b.maxRounds = options.maxRounds;
        } else if (draft.gameId === 'bingo' && draft.stateBingo) {
          if (options.targetLines !== undefined) draft.stateBingo.targetLines = options.targetLines;
          if (options.maxPlayers !== undefined) draft.maxPlayers = options.maxPlayers;
        } else if (draft.gameId === 'battleship' && draft.stateBattleship) {
          if (options.gridSize !== undefined) draft.stateBattleship.gridSize = options.gridSize as 6 | 8 | 10;
        } else if (draft.gameId === 'dots' && draft.stateDots) {
          if (options.dotsGridSize !== undefined) draft.stateDots.gridSize = options.dotsGridSize as 3 | 4 | 5;
          if (options.maxPlayers !== undefined) draft.maxPlayers = options.maxPlayers;
        } else if (draft.gameId === 'blackjack' && draft.stateBlackjack) {
          if (options.blackjackRounds !== undefined) draft.stateBlackjack.totalRounds = options.blackjackRounds;
          if (options.entryFee !== undefined) draft.stateBlackjack.entryFee = options.entryFee;
          if (options.maxPlayers !== undefined) draft.maxPlayers = options.maxPlayers;
        }
      });
      setConfigRulesOpen(false);
    } catch (err) {
      console.error('Failed to update room config:', err);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSurrender = () => {
    sound.playClick();
    if (confirm('確定要認輸投降嗎？本局將結算為對手獲勝。')) {
      surrender();
    }
  };

  const handleBackToLobby = () => {
    sound.playClick();
    if (currentRoom.status === 'in_progress') {
      if (confirm('確定要退出房間返回大廳嗎？對戰進行中退出將判定為認輸，由對手獲勝！')) {
        leaveRoom();
      }
    } else {
      leaveRoom();
    }
  };

  const PLAYER_THEMES = [
    { bg: 'bg-[#628395]/15', border: 'border-[#628395]/40', text: 'text-[#628395]', name: 'P1' },
    { bg: 'bg-[#CF995F]/15', border: 'border-[#CF995F]/40', text: 'text-[#CF995F]', name: 'P2' },
    { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-700', name: 'P3' },
    { bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-700', name: 'P4' },
    { bg: 'bg-rose-500/15', border: 'border-rose-500/40', text: 'text-rose-700', name: 'P5' }
  ];

  const p1 = currentRoom.player1 || {
    uid: currentRoom.hostUid,
    displayName: '玩家1',
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${currentRoom.hostUid}`,
    ready: false
  };
  const p2 = currentRoom.player2;
  const maxSlots = currentRoom.maxPlayers || 2;

  const displayPlayers: PlayerSlot[] = (() => {
    const map = new Map<string, PlayerSlot>();

    // 1. Add all from players array
    (players || []).forEach((p, idx) => {
      const key = p.uid || `player_${idx}`;
      if (!map.has(key)) map.set(key, p);
    });

    // 2. Ensure player1 is present
    if (currentRoom.player1) {
      const key = currentRoom.player1.uid || 'p1';
      if (!map.has(key)) map.set(key, currentRoom.player1);
    }

    // 3. Ensure player2 is present
    if (currentRoom.player2) {
      const key = currentRoom.player2.uid || 'p2';
      if (!map.has(key)) map.set(key, currentRoom.player2);
    }

    // 4. Fallback: if empty, create host slot
    if (map.size === 0 && currentRoom.hostUid) {
      map.set(currentRoom.hostUid, {
        uid: currentRoom.hostUid,
        displayName: '玩家1',
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${currentRoom.hostUid}`,
        ready: false
      });
    }

    return Array.from(map.values());
  })();

  const isSettled = currentRoom.status === 'settled';
  const isWinner = Boolean(currentRoom.winnerUid && currentRoom.winnerUid === currentUser.uid);
  const isDraw = currentRoom.winnerUid === 'draw';

  if (isSettled && !recorded) {
    setRecorded(true);
    recordGameResult(isWinner, currentRoom.multiplier, currentRoom.gameId);
  }

  const winnerPlayer = (displayPlayers || []).find((p) => p.uid === currentRoom.winnerUid) || p1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-1 max-w-4xl mx-auto w-full px-2.5 sm:px-4 py-2 sm:py-3 flex flex-col justify-between min-w-0"
    >
      {/* Reconnection & Offline Alerts */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-900 text-xs font-bold flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-700 animate-pulse" />
              <span>網路連線中斷，系統正在自動嘗試重新連線中...</span>
            </div>
            <span className="text-[10px] text-amber-800 font-mono">自動重試中</span>
          </motion.div>
        )}

        {isConnected && !isOpponentConnected && p2 && currentRoom.status === 'in_progress' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 px-4 py-2 rounded-xl bg-[#CF995F]/20 border border-[#CF995F]/40 text-[#2E2925] text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-[#CF995F] shrink-0" />
            <span>對手暫時離線中，保留戰局中，等待對手重新連線...</span>
          </motion.div>
        )}

        {reconnecting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 px-4 py-2 rounded-xl bg-[#628395]/20 border border-[#628395]/40 text-[#628395] text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-[#628395] animate-spin shrink-0" />
            <span>已偵測到先前對戰，正在為您重連對戰房間...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleek Top Room Bar */}
      <div className="glass-panel rounded-2xl px-4 py-2 flex items-center justify-between gap-3 shadow-xs border border-white/70 mb-3">
        {/* Left: Back & Room info */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleBackToLobby}
            className="p-1.5 rounded-xl hover:bg-white/60 text-[#2E2925] transition-colors cursor-pointer"
            title="退出房間返回大廳"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="font-extrabold text-sm text-[#2E2925]">
            {title}
          </span>

          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/70 hover:bg-white text-[#628395] font-mono font-bold text-xs border border-[#96897B]/20 transition-colors cursor-pointer"
            title="複製房號"
          >
            <span>#{currentRoom.code}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#96897B]" />}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Invite friends into this room button */}
          <button
            onClick={() => {
              sound.playClick();
              setInviteFriendsOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#628395]/15 hover:bg-[#628395] text-[#628395] hover:text-white transition-colors text-xs font-bold cursor-pointer"
            title="邀請好友加入"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">邀請好友</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            className="p-1.5 rounded-xl text-[#96897B] hover:text-[#2E2925] hover:bg-white/60 transition-colors cursor-pointer"
            title="規則說明"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {currentRoom.status === 'in_progress' && (
            <button
              onClick={handleSurrender}
              className="px-2.5 py-1 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
              title="認輸投降"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sleek Dynamic Players Bar (Supports 2-5 Players) */}
      <div
        className={`grid gap-2 mb-3 ${
          (currentRoom.maxPlayers || 2) <= 2
            ? 'grid-cols-2'
            : (currentRoom.maxPlayers || 2) === 3
            ? 'grid-cols-3'
            : (currentRoom.maxPlayers || 2) === 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
        }`}
      >
        {displayPlayers.map((p, idx) => {
          const theme = PLAYER_THEMES[idx] || PLAYER_THEMES[0];
          const isMe = p.uid === currentUser.uid;

          return (
            <motion.div
              key={p.uid || `player-${idx}`}
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25, delay: idx * 0.05 }}
              className={`rounded-xl px-2.5 py-1.5 flex items-center gap-2 border transition-all ${
                isMe
                  ? `${theme.bg} ${theme.border} shadow-xs`
                  : 'bg-white/60 border-white/70 shadow-2xs'
              }`}
            >
              <div
                onClick={() => {
                  sound.playClick();
                  setInspectUser(p);
                }}
                className="w-8 h-8 rounded-lg bg-[#FAF3E0] border border-[#8D5B4C]/30 flex items-center justify-center shrink-0 overflow-hidden relative cursor-pointer hover:scale-105 transition-transform"
                title="點擊查看受驗准考證名片"
              >
                <img
                  src={p.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.uid}`}
                  alt={p.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-extrabold text-[#2E2925] truncate">
                  {p.displayName}
                </div>
                <div className={`text-[10px] font-bold ${theme.text}`}>
                  {isMe ? `我方 (${theme.name})` : `對手 (${theme.name})`}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* If fewer players than maxPlayers, fill remaining slots with dashed waiting indicators */}
        {Array.from({
          length: Math.max(0, (currentRoom.maxPlayers || 2) - displayPlayers.length)
        }).map((_, i) => (
          <div
            key={`empty-waiting-slot-${i}`}
            className="rounded-xl px-2.5 py-1.5 flex items-center justify-center gap-2 border-2 border-dashed border-[#96897B]/30 bg-white/30 text-xs text-[#96897B] font-bold"
          >
            <span className="animate-pulse">等待對手加入房間...</span>
          </div>
        ))}
      </div>

      {/* Main Game Stage or Waiting Screen wrapped in ErrorBoundary */}
      <div className="flex-1 flex flex-col justify-center">
        {currentRoom.status === 'waiting' ? (
          /* Multi-player Waiting Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto glass-panel rounded-3xl p-6 text-center my-6 shadow-md border border-white/80"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#628395]/10 text-[#628395] flex items-center justify-center mx-auto mb-3">
              <Users2 className="w-6 h-6 text-[#628395] animate-pulse" />
            </div>

            <h3 className="text-base font-extrabold text-[#2E2925] mb-1">
              房間等待大廳（{players.length} / {currentRoom.maxPlayers || 2} 人）
            </h3>
            <p className="text-xs text-[#96897B] mb-4">
              好友輸入下方 6 位數房號即可立即進房對戰
            </p>

            <div className="bg-white/80 rounded-2xl p-3 border border-white flex items-center justify-center gap-3 mb-3 shadow-xs">
              <span className="font-mono text-2xl font-black text-[#628395] tracking-widest">
                {currentRoom.code}
              </span>
              <button
                onClick={copyRoomCode}
                className="p-1.5 rounded-lg text-[#628395] hover:bg-white transition-colors cursor-pointer"
                title="複製房號"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Action Buttons: Invite Friends, Custom Rules & Wardrobe Shop */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setInviteFriendsOpen(true);
                }}
                className="flex-1 py-2 px-3 rounded-2xl bg-[#628395] hover:bg-[#526f7f] text-white font-extrabold text-xs shadow-md shadow-[#628395]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>邀請好友</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setInspectUser(currentUser);
                }}
                className="py-2 px-3 rounded-2xl bg-[#5D3A1A] hover:bg-[#432711] text-[#FFE8D6] font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="檢視個人帝國准考證名片"
              >
                <Award className="w-4 h-4 text-[#FFE8D6]" />
                <span>准考證名片</span>
              </button>

              {isHost && (
                <button
                  onClick={() => {
                    sound.playClick();
                    setConfigRulesOpen(true);
                  }}
                  className="py-2 px-3 rounded-2xl bg-[#DDBEAA]/30 hover:bg-[#DDBEAA]/50 text-[#5D4037] font-extrabold text-xs border border-[#5D4037]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="調整此房間遊戲規則"
                >
                  <Sliders className="w-4 h-4 text-[#5D4037]" />
                  <span>調整規則</span>
                </button>
              )}
            </div>

            {/* 全體參戰玩家・站一排等待開戰 (All Players Stand in a Row) */}
            <div className="relative my-4 p-4 rounded-3xl bg-gradient-to-b from-[#F7EBD2] to-[#EFE1C3] border-2 border-[#D5C0A1] shadow-inner overflow-hidden">
              <div className="text-center mb-3">
                <span className="text-[10px] font-black tracking-widest text-[#8D5B4C] px-3 py-1 rounded-full bg-[#8D5B4C]/10 border border-[#8D5B4C]/20 inline-block shadow-xs">
                  ⚔️ 全體參戰受驗生（站一排等待開戰）({displayPlayers.length}/{maxSlots} 人)
                </span>
              </div>

              {/* Wooden Flooring Stage Platform */}
              <div className="relative bg-[#E6D4B8]/70 rounded-2xl p-3 border border-[#CBB393] shadow-inner">
                {/* Horizontal lineup row: all players stand side-by-side */}
                <div className="flex items-end justify-center gap-3 sm:gap-6 overflow-x-auto py-2 px-1">
                  {Array.from({ length: maxSlots }).map((_, slotIdx) => {
                    const slotPlayer = displayPlayers[slotIdx];
                    const isHostSlot = slotIdx === 0;
                    const charConfig =
                      slotPlayer?.lpcCharacter ||
                      (slotPlayer?.uid === currentUser.uid ? currentUser.lpcCharacter : DEFAULT_LPC_CHARACTER);

                    return slotPlayer ? (
                      <div
                        key={slotPlayer.uid || `slot-${slotIdx}`}
                        onClick={() => {
                          sound.playClick();
                          setInspectUser(slotPlayer);
                        }}
                        className="flex flex-col items-center cursor-pointer group shrink-0 transition-transform hover:scale-105"
                        title="點擊檢視帝國准考證（名片）"
                      >
                        {/* Status / Role Tag */}
                        <div className="mb-1">
                          {isHostSlot ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#5D3A1A] text-[#FFE8D6] shadow-xs flex items-center gap-1">
                              <span>👑</span> 房主
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#2E7D32] text-white shadow-xs flex items-center gap-1">
                              <span>●</span> P{slotIdx + 1} 就緒
                            </span>
                          )}
                        </div>

                        {/* LPC Standing Character with Animated Walk Cycle */}
                        <div className="relative flex flex-col items-center">
                          <LpcAvatarView
                            config={charConfig}
                            size={112}
                            scale={2}
                            direction="down"
                            animate={true}
                          />
                          {/* Floor Shadow Under Feet */}
                          <div className="w-14 h-2.5 bg-[#5D3A1A]/25 rounded-full blur-[2px] -mt-2" />
                        </div>

                        {/* Player Photo + Name Capsule */}
                        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 border border-[#D5C0A1] shadow-xs max-w-[120px]">
                          <img
                            src={slotPlayer.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${slotPlayer.uid}`}
                            alt={slotPlayer.displayName}
                            className="w-5 h-5 rounded-full object-cover border border-[#8D5B4C]/30 shrink-0"
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <div className="text-[11px] font-black text-[#3B2211] truncate leading-tight">
                              {slotPlayer.displayName}
                            </div>
                            <div className="text-[8px] text-[#8D5B4C] font-mono font-bold leading-none">
                              No.{(slotPlayer as any)?.userTag || slotPlayer?.uid?.substring(0, 4) || (slotIdx + 1) * 1000}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Empty Slot Standing Placeholder */
                      <div
                        key={`empty-slot-${slotIdx}`}
                        className="flex flex-col items-center justify-end shrink-0"
                      >
                        <div className="w-20 h-32 rounded-2xl border-2 border-dashed border-[#8D5B4C]/40 bg-white/40 flex flex-col items-center justify-center p-2 text-center">
                          <div className="w-8 h-8 rounded-full bg-[#8D5B4C]/10 text-[#8D5B4C] flex items-center justify-center mb-1 animate-pulse">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black text-[#5D3A1A]">
                            席位 {slotIdx + 1}
                          </span>
                          <span className="text-[9px] text-[#8D5B4C] font-bold mt-0.5">
                            等待加入...
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setInviteFriendsOpen(true);
                          }}
                          className="mt-2 text-[10px] text-[#628395] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>邀請</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2.5 text-center text-[10px] text-[#8D5B4C] font-bold">
                💡 點擊站台上的受驗生可翻閱《帝國受驗准考證》
              </div>
            </div>

            {/* Host or Guest Status */}
            {isHost ? (
              players.length >= 2 ? (
                <button
                  onClick={startGame}
                  className="w-full py-3 px-6 rounded-2xl bg-[#628395] hover:bg-[#526f7f] text-white font-black text-sm shadow-md shadow-[#628395]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    立即開始遊戲（已加入 {players.length}/{maxSlots} 人
                    {players.length >= maxSlots ? '・全員到齊' : ''}）
                  </span>
                </button>
              ) : (
                <div className="text-xs text-[#96897B] font-bold py-2">
                  等待至少 1 位好友加入後即可開戰
                </div>
              )
            ) : (
              <div className="text-xs text-[#628395] font-black py-2 animate-pulse">
                已成功進房！等待房主點擊開始遊戲...
              </div>
            )}
          </motion.div>
        ) : (
          <ErrorBoundary fallbackTitle="遊戲棋盤渲染異常">
            {children}
          </ErrorBoundary>
        )}
      </div>

      {/* Settlement Celebration Modal */}
      {isSettled && (
        <VictoryCelebration
          isWinner={isWinner}
          isDraw={isDraw}
          baseReward={isWinner ? 50 : 10}
          multiplier={currentRoom.multiplier}
          winnerName={winnerPlayer?.displayName}
          onRematch={() => {
            setRecorded(false);
            restartGame();
          }}
          onLeave={() => {
            leaveRoom();
          }}
        />
      )}

      {/* Invite Friends into this room Modal */}
      <InviteFriendsModal
        isOpen={inviteFriendsOpen}
        onClose={() => setInviteFriendsOpen(false)}
        currentRoom={currentRoom}
      />

      {/* Room Rule Adjustment Modal */}
      {configRulesOpen && (
        <RoomConfigModal
          gameId={currentRoom.gameId}
          onClose={() => setConfigRulesOpen(false)}
          onConfirm={handleUpdateRoomConfig}
          confirmText="儲存房間規則"
          subTitle="房主可在對戰開始前隨時自訂此房間各項進階規則與人數"
          initialOptions={{
            maxPlayers: currentRoom.maxPlayers || 2,
            hintEnabled: currentRoom.state1a2b?.hintEnabled ?? true,
            hintRound: currentRoom.state1a2b?.hintRound ?? 5,
            maxRounds: currentRoom.state1a2b?.maxRounds ?? 0,
            targetLines: currentRoom.stateBingo?.targetLines ?? 5,
            gridSize: currentRoom.stateBattleship?.gridSize ?? 8,
            dotsGridSize: currentRoom.stateDots?.gridSize ?? 4,
          }}
        />
      )}

      {/* Showa Exam Card Modal (Business Card) */}
      <ExamCardModal
        isOpen={Boolean(inspectUser)}
        onClose={() => setInspectUser(null)}
        user={inspectUser}
        isSelf={inspectUser?.uid === currentUser?.uid}
      />
    </motion.div>
  );
};
