import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Hash,
  Anchor,
  Grid,
  SquareDot,
  CircleDot,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../services/soundService';

export const LandingPage: React.FC = () => {
  const { loginWithGoogle, loginWithNickname, authError } = useAuth();
  const [nickname, setNickname] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const gamesShowcase = [
    { title: '1A2B', icon: Hash },
    { title: '海戰棋', icon: Anchor },
    { title: '賓果', icon: Grid },
    { title: '點線棋', icon: SquareDot },
    { title: '無限三子棋', icon: CircleDot }
  ];

  const handleGoogleLogin = async () => {
    sound.playClick();
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (!nickname.trim()) return;
    loginWithNickname(nickname);
  };

  return (
    <div className="min-h-screen bg-[#DFD5A5] text-[#2E2925] flex flex-col justify-between selection:bg-[#DBAD6A]/30 px-6 py-8 sm:px-12">
      {/* Top bar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#628395] text-white flex items-center justify-center shadow-xs">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-[#2E2925]">
            遊戲室
          </span>
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="max-w-sm mx-auto w-full my-auto text-center py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2E2925] mb-2">
            遊戲室
          </h1>
          <p className="text-xs sm:text-sm text-[#96897B] font-medium">
            雙人即時連線對戰
          </p>
        </motion.div>

        {/* Clean Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-6 sm:p-7 shadow-sm border border-white/80"
        >
          {/* Google Login Button */}
          <motion.button
            whileHover={!isSigningIn ? { scale: 1.02 } : {}}
            whileTap={!isSigningIn ? { scale: 0.98 } : {}}
            disabled={isSigningIn}
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-neutral-50 text-[#2E2925] font-extrabold text-sm shadow-xs border border-[#96897B]/20 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.43 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.99 0 12s.45 3.84 1.24 5.41l4.04-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.57 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
              />
            </svg>
            <span>{isSigningIn ? '正在開啟授權...' : '使用 Google 帳號登入'}</span>
          </motion.button>

          {/* Error Banner if Google sign-in encounters an error */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-tight">{authError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 my-4">
            <div className="h-px bg-[#96897B]/20 flex-1" />
            <span className="text-[11px] text-[#96897B] font-medium">或免授權快速進房</span>
            <div className="h-px bg-[#96897B]/20 flex-1" />
          </div>

          {/* Quick Nickname Entry for seamless fallback */}
          <form onSubmit={handleNicknameSubmit} className="flex gap-2">
            <input
              type="text"
              maxLength={12}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="輸入玩家暱稱"
              className="flex-1 px-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/20 text-xs font-bold text-[#2E2925] focus:outline-none focus:border-[#628395]"
            />
            <button
              type="submit"
              disabled={!nickname.trim()}
              className="px-4 py-2 rounded-xl bg-[#628395] hover:bg-[#526f7f] disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>進入</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>

        {/* 5 Games Pills */}
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          {gamesShowcase.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-full bg-white/40 border border-white/60 text-xs font-semibold text-[#2E2925] flex items-center gap-1.5 shadow-2xs"
              >
                <Icon className="w-3 h-3 text-[#628395]" />
                <span>{g.title}</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-[#96897B] font-medium py-2">
        遊戲室 &copy; 2026
      </footer>
    </div>
  );
};
