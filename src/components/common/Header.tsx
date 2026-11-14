import React, { useState, useRef, useEffect } from 'react';
import {
  Coins,
  BookOpen,
  Volume2,
  VolumeX,
  LogOut,
  Copy,
  Check,
  Shield,
  Gamepad2,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../services/soundService';

interface HeaderProps {
  onOpenRules: () => void;
  onOpenAdmin: () => void;
  inGame?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRules,
  onOpenAdmin,
  inGame = false
}) => {
  const { currentUser, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const copyFriendCode = () => {
    navigator.clipboard.writeText(currentUser.friendCode);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
    if (next) sound.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3">
      <div className="max-w-5xl mx-auto glass-panel rounded-2xl px-5 py-2.5 flex items-center justify-between shadow-xs border border-white/60">
        {/* Brand */}
        <div className="flex items-center gap-2 select-none">
          <div className="w-8 h-8 rounded-xl bg-[#628395] text-white flex items-center justify-center shadow-xs">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-[#2E2925]">
            遊戲室
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Minimal Coin Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 border border-[#DBAD6A]/40 text-[#2E2925] font-mono font-bold text-xs">
            <Coins className="w-3.5 h-3.5 text-[#DBAD6A]" />
            <span>{currentUser.coins.toLocaleString()}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-xl text-[#96897B] hover:text-[#2E2925] hover:bg-white/60 transition-colors"
            title={soundEnabled ? '靜音' : '開啟音效'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#628395]" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Rules Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#2E2925] hover:bg-white/60 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#628395]" />
            <span className="hidden sm:inline">規則</span>
          </button>

          {/* User Profile & Minimal Popover Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 p-1 pr-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
            >
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-7 h-7 rounded-lg object-cover border border-white shadow-xs"
              />
              <span className="text-xs font-bold text-[#2E2925] max-w-[90px] truncate hidden sm:inline">
                {currentUser.displayName}
              </span>
              <ChevronDown className="w-3 h-3 text-[#96897B]" />
            </button>

            {/* Clean Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 glass-panel rounded-2xl p-2 shadow-xl border border-white/80 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#96897B]/15 mb-1">
                  <div className="text-xs font-extrabold text-[#2E2925] truncate">
                    {currentUser.displayName}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-[#96897B]">
                    <span>好友碼: {currentUser.friendCode}</span>
                    <button
                      onClick={copyFriendCode}
                      className="text-[#628395] hover:underline flex items-center gap-0.5"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#96897B]" />}
                      <span>{copied ? '已複製' : '複製'}</span>
                    </button>
                  </div>
                </div>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#CF995F] hover:bg-white/70 rounded-xl transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>管理員後台</span>
                  </button>
                )}

                <div className="h-px bg-[#96897B]/15 my-1" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>登出帳號</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
