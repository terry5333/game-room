import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Coins,
  RotateCcw,
  Home,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { sound } from '../../services/soundService';

interface VictoryCelebrationProps {
  isWinner: boolean;
  isDraw?: boolean;
  baseReward: number;
  multiplier: number;
  onRematch: () => void;
  onLeave: () => void;
  winnerName?: string;
}

export const VictoryCelebration: React.FC<VictoryCelebrationProps> = ({
  isWinner,
  isDraw = false,
  baseReward,
  multiplier,
  onRematch,
  onLeave,
  winnerName
}) => {
  const finalReward = Math.round(baseReward * multiplier);
  const [displayedCoins, setDisplayedCoins] = useState(0);

  useEffect(() => {
    if (isWinner) {
      sound.playVictory();
      // Trigger festive geometric confetti
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#DBAD6A', '#628395', '#CF995F', '#DFD5A5']
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#DBAD6A', '#628395']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#DBAD6A', '#CF995F']
        });
      }, 350);

      return () => clearTimeout(timer);
    } else {
      sound.playCoin();
    }
  }, [isWinner]);

  // Rolling count-up animation for coins
  useEffect(() => {
    let start = 0;
    const duration = 1200; // ms
    const stepTime = 30;
    const totalSteps = duration / stepTime;
    const increment = finalReward / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= finalReward) {
        setDisplayedCoins(finalReward);
        clearInterval(timer);
      } else {
        setDisplayedCoins(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [finalReward]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 text-center border-2 border-white/80 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 ${
            isWinner ? 'bg-[#DBAD6A]' : 'bg-[#96897B]'
          }`}
        />

        {/* Header Icon */}
        <div className="relative mx-auto mb-4 flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 350 }}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl border-4 border-white ${
              isWinner
                ? 'bg-gradient-to-tr from-[#DBAD6A] to-[#CF995F] text-white'
                : isDraw
                ? 'bg-[#96897B] text-white'
                : 'bg-[#96897B]/70 text-white'
            }`}
          >
            {isWinner ? (
              <Trophy className="w-10 h-10 text-white" />
            ) : isDraw ? (
              <ShieldAlert className="w-10 h-10 text-white" />
            ) : (
              <Award className="w-10 h-10 text-white" />
            )}
          </motion.div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2E2925] tracking-tight mb-1">
          {isWinner ? '榮耀獲勝！' : isDraw ? '勢均力敵 平手！' : '惜敗！再接再厲'}
        </h2>
        <p className="text-xs sm:text-sm text-[#96897B] font-medium mb-6">
          {isWinner
            ? '恭喜你技高一籌，擊敗對手贏得對局！'
            : isDraw
            ? '雙方戰成平手，各自獲得獎勵！'
            : `獲勝者為：${winnerName || '對手'}`}
        </p>

        {/* Coin Rolling Increment Card */}
        <div className="glass-panel-subtle rounded-2xl p-4 mb-6 border border-white/60">
          <div className="text-xs font-bold text-[#96897B] mb-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#DBAD6A]" />
            <span>對戰結算金幣入帳</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Coins className="w-7 h-7 text-[#DBAD6A] animate-bounce" />
            <motion.span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#DBAD6A]">
              +{displayedCoins}
            </motion.span>
            <span className="text-xs font-bold text-[#96897B] self-end mb-1">金幣</span>
          </div>

          {multiplier > 1 && (
            <div className="mt-2 text-[11px] font-semibold text-[#628395] bg-[#628395]/10 py-0.5 px-2 rounded-full inline-block">
              包含專屬勝場倍率加成 x{multiplier}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRematch}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-sm shadow-md shadow-[#628395]/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再戰一局</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLeave}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/80 hover:bg-white text-[#2E2925] border border-[#96897B]/30 font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#96897B]" />
            <span>返回大廳</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
