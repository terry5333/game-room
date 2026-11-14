import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Copy,
  Check,
  Flag,
  Users2,
  WifiOff,
  Wifi,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { VictoryCelebration } from '../common/VictoryCelebration';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { sound } from '../../services/soundService';

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

  if (!currentRoom || !currentUser) return null;

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

  const displayPlayers: PlayerSlot[] = (() => {
    const list: PlayerSlot[] = [...players];
    if (currentRoom.player1 && !list.some((p) => p.uid === currentRoom.player1.uid)) {
      list.unshift(currentRoom.player1);
    }
    if (currentRoom.player2 && !list.some((p) => p.uid === currentRoom.player2.uid)) {
      list.push(currentRoom.player2);
    }
    return list;
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
        <div className="flex items-center gap-2">
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
          displayPlayers.length <= 2
            ? 'grid-cols-2'
            : displayPlayers.length === 3
            ? 'grid-cols-3'
            : displayPlayers.length === 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
        }`}
      >
        {displayPlayers.map((p, idx) => {
          const theme = PLAYER_THEMES[idx] || PLAYER_THEMES[0];
          const isMe = p.uid === currentUser.uid;

          return (
            <motion.div
              key={p.uid}
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25, delay: idx * 0.05 }}
              className={`rounded-xl px-2.5 py-1.5 flex items-center gap-2 border transition-all ${
                isMe
                  ? `${theme.bg} ${theme.border} shadow-xs`
                  : 'bg-white/60 border-white/70 shadow-2xs'
              }`}
            >
              <img
                src={p.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.uid}`}
                alt={p.displayName}
                className="w-7 h-7 rounded-lg object-cover border border-[#96897B]/20 shrink-0"
              />
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

        {/* If 2-player duel and opponent has not yet connected */}
        {displayPlayers.length === 1 && (currentRoom.maxPlayers || 2) === 2 && (
          <div className="rounded-xl px-2.5 py-1.5 flex items-center justify-center gap-2 border-2 border-dashed border-[#96897B]/30 bg-white/30 text-xs text-[#96897B] font-bold">
            <span className="animate-pulse">等待對手加入房間...</span>
          </div>
        )}
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

            <div className="bg-white/80 rounded-2xl p-3 border border-white flex items-center justify-center gap-3 mb-5 shadow-xs">
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

            {/* Slots Grid */}
            <div
              className={`grid gap-2 mb-5 ${
                (currentRoom.maxPlayers || 2) >= 5
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-2'
              }`}
            >
              {Array.from({ length: currentRoom.maxPlayers || 2 }).map((_, slotIdx) => {
                const slotPlayer = players[slotIdx];
                const theme = PLAYER_THEMES[slotIdx] || PLAYER_THEMES[0];

                return slotPlayer ? (
                  <div
                    key={slotPlayer.uid}
                    className={`p-2.5 rounded-2xl border flex items-center gap-2.5 ${theme.bg} ${theme.border} text-left`}
                  >
                    <img
                      src={slotPlayer.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${slotPlayer.uid}`}
                      alt={slotPlayer.displayName}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#2E2925] truncate">
                        {slotPlayer.displayName}
                      </div>
                      <span className={`text-[10px] font-black ${theme.text}`}>
                        {theme.name} 已加入
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`empty-${slotIdx}`}
                    className="p-2.5 rounded-2xl border-2 border-dashed border-[#96897B]/30 bg-white/30 flex items-center justify-center text-xs text-[#96897B] font-bold"
                  >
                    等待玩家 {slotIdx + 1} 加入...
                  </div>
                );
              })}
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
    </motion.div>
  );
};
