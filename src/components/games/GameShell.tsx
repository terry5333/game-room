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
  RotateCcw
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
    myRole,
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

  const p1 = currentRoom.player1 || {
    uid: currentRoom.hostUid,
    displayName: '玩家1',
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${currentRoom.hostUid}`,
    ready: false
  };
  const p2 = currentRoom.player2;

  const isSettled = currentRoom.status === 'settled';
  const isWinner = Boolean(currentRoom.winnerUid && currentRoom.winnerUid === currentUser.uid);
  const isDraw = currentRoom.winnerUid === 'draw';

  if (isSettled && !recorded) {
    setRecorded(true);
    recordGameResult(isWinner, currentRoom.multiplier, currentRoom.gameId);
  }

  const winnerPlayer = currentRoom.winnerUid === p1.uid ? p1 : p2;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-2.5 sm:px-4 py-2 sm:py-3 flex flex-col justify-between min-w-0">
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
            onClick={() => {
              sound.playClick();
              leaveRoom();
            }}
            className="p-1.5 rounded-xl hover:bg-white/60 text-[#2E2925] transition-colors cursor-pointer"
            title="離開房間"
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

      {/* Sleek Minimalist Players Bar */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Player 1 */}
        <div
          className={`rounded-xl px-3 py-2 flex items-center gap-2.5 transition-all ${
            myRole === 'player1'
              ? 'bg-[#628395]/15 border border-[#628395]/30'
              : 'bg-white/40 border border-white/50'
          }`}
        >
          <img
            src={p1.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${p1.uid}`}
            alt={p1.displayName}
            className="w-7 h-7 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-extrabold text-[#2E2925] truncate">
              {p1.displayName}
            </div>
            <div className="text-[10px] text-[#628395] font-semibold">
              {myRole === 'player1' ? '我方 (P1)' : '對手 (P1)'}
            </div>
          </div>
        </div>

        {/* Player 2 */}
        <div
          className={`rounded-xl px-3 py-2 flex items-center gap-2.5 transition-all ${
            myRole === 'player2'
              ? 'bg-[#CF995F]/15 border border-[#CF995F]/30'
              : 'bg-white/40 border border-white/50'
          }`}
        >
          {p2 ? (
            <>
              <img
                src={p2.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${p2.uid}`}
                alt={p2.displayName}
                className="w-7 h-7 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-[#2E2925] truncate">
                  {p2.displayName}
                </div>
                <div className="text-[10px] text-[#CF995F] font-semibold">
                  {myRole === 'player2' ? '我方 (P2)' : '對手 (P2)'}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#96897B] font-medium py-1">
              <Users2 className="w-4 h-4 animate-pulse" />
              <span>等待對手加入...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Game Stage or Waiting Screen wrapped in ErrorBoundary */}
      <div className="flex-1 flex flex-col justify-center">
        {!p2 ? (
          /* Sleek Waiting Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm mx-auto glass-panel rounded-3xl p-6 text-center my-6 shadow-sm border border-white/80"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#628395]/10 text-[#628395] flex items-center justify-center mx-auto mb-3">
              <Users2 className="w-6 h-6 text-[#628395] animate-pulse" />
            </div>

            <h3 className="text-base font-extrabold text-[#2E2925] mb-1">
              等待挑戰者加入
            </h3>
            <p className="text-xs text-[#96897B] mb-5">
              好友輸入下方房號即可立即進房對戰
            </p>

            <div className="bg-white/70 rounded-2xl p-3 border border-white flex items-center justify-center gap-3 mb-2">
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
    </div>
  );
};
