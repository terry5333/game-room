import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = '連線載入對戰大廳中...',
  subMessage = '正在即時同步雲端房間與個人戰績，稍候片刻即刻開戰',
  fullscreen = true
}) => {
  const content = (
    <div className="relative flex flex-col items-center">
      {/* Ambient glowing backdrop glow */}
      <div className="absolute -inset-10 bg-radial from-[#DBAD6A]/25 via-[#628395]/15 to-transparent blur-2xl pointer-events-none rounded-full" />

      {/* Main Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative z-10 glass-panel rounded-3xl p-8 sm:p-10 max-w-sm w-full mx-4 border-2 border-white/80 shadow-2xl flex flex-col items-center text-center backdrop-blur-xl"
      >
        {/* Orbital Multi-Tier Spinner */}
        <div className="relative w-24 h-24 flex items-center justify-center my-2">
          {/* Outer Pulsing Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-[#628395]/10 animate-ping opacity-40" />

          {/* Outer Ring: Rotating Clockwise */}
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#628395] border-r-[#628395]/40 animate-spin" />

          {/* Middle Ring: Counter-rotating Golden Arc */}
          <div className="absolute inset-2 rounded-full border-3 border-transparent border-b-[#DBAD6A] border-l-[#DBAD6A]/40 animate-spin-reverse" />

          {/* Inner Accent Ring */}
          <div className="absolute inset-4 rounded-full border-2 border-dashed border-[#CF995F]/35 animate-spin" />

          {/* Center Glowing Game Core Icon */}
          <motion.div
            animate={{
              scale: [1, 1.12, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 2.4,
              ease: 'easeInOut'
            }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-[#FAF8F5] shadow-md border border-white flex items-center justify-center text-[#628395]"
          >
            <Gamepad2 className="w-5 h-5 text-[#628395]" />
          </motion.div>

          {/* Tiny sparkling satellite */}
          <div className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-[#DBAD6A] shadow-[0_0_8px_#DBAD6A] animate-pulse" />
        </div>

        {/* Title & Brand */}
        <div className="mt-5 space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-mono text-[11px] font-black tracking-widest text-[#628395] uppercase">
              DUO ARENA
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DBAD6A]/15 border border-[#DBAD6A]/30 text-[10px] font-extrabold text-[#DBAD6A]">
              <Sparkles className="w-2.5 h-2.5" />
              <span>LIVE</span>
            </span>
          </div>

          <h3 className="text-base font-extrabold text-[#2E2925] tracking-tight">
            {message}
          </h3>

          <p className="text-xs text-[#96897B] font-medium leading-relaxed max-w-[240px] mx-auto pt-1">
            {subMessage}
          </p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-full mt-6 space-y-2">
          <div className="relative w-full h-1.5 bg-neutral-200/60 rounded-full overflow-hidden">
            <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-[#628395] to-transparent rounded-full animate-shimmer" />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#96897B]">
            <span>雲端就緒</span>
            <span className="animate-pulse text-[#628395]">同步中...</span>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-[#DFD5A5] flex items-center justify-center p-4 selection:bg-[#DBAD6A]/30">
        {content}
      </div>
    );
  }

  return content;
};

// Compact inline spinner for buttons or small containers
export const CompactSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({
  size = 'md',
  color = 'text-[#628395]'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-transparent border-t-current border-r-current rounded-full animate-spin ${color}`}
      />
    </div>
  );
};
