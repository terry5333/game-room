import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Swords, UserCheck } from 'lucide-react';
import { sound } from '../../services/soundService';

interface TurnBannerProps {
  isMyTurn: boolean;
  currentTurnPlayerName: string;
  timeLeft?: number;
  phaseLabel?: string;
}

export const TurnBanner: React.FC<TurnBannerProps> = ({
  isMyTurn,
  currentTurnPlayerName,
  timeLeft,
  phaseLabel
}) => {
  useEffect(() => {
    if (isMyTurn) {
      sound.playTurnChime();
    }
  }, [isMyTurn]);
  return (
    <div className="w-full flex justify-center py-1.5 px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={isMyTurn ? 'my_turn' : 'opponent_turn'}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border shadow-xs backdrop-blur-md text-xs font-bold ${
            isMyTurn
              ? 'bg-[#628395]/15 border-[#628395]/40 text-[#628395]'
              : 'bg-[#CF995F]/15 border-[#CF995F]/40 text-[#CF995F]'
          }`}
        >
          {isMyTurn ? (
            <UserCheck className="w-3.5 h-3.5" />
          ) : (
            <Swords className="w-3.5 h-3.5" />
          )}

          <span>
            {isMyTurn ? '輪到你的回合' : `等待對手 (${currentTurnPlayerName}) 行動`}
          </span>

          {phaseLabel && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/70 text-[#96897B] font-semibold">
              {phaseLabel}
            </span>
          )}

          {typeof timeLeft === 'number' && (
            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-[#2E2925] ml-1 bg-white/60 px-1.5 py-0.2 rounded-md">
              <Clock className="w-3 h-3 text-[#96897B]" />
              <span className={timeLeft <= 5 ? 'text-rose-600 font-extrabold animate-pulse' : ''}>
                {timeLeft}s
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
