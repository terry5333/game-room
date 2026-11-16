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
  ChevronDown,
  User,
  Award,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../services/soundService';

interface HeaderProps {
  onOpenRules: () => void;
  onOpenAdmin: () => void;
  onOpenFriends?: () => void;
  onOpenEditProfile: () => void;
  onOpenCasino?: () => void;
  onOpenExamCard?: () => void;
  onOpenLpcWardrobe?: () => void;
  inGame?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRules,
  onOpenAdmin,
  onOpenEditProfile,
  onOpenCasino,
  onOpenExamCard,
  onOpenLpcWardrobe,
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

  const copyId = () => {
    navigator.clipboard.writeText(`${currentUser.displayName}#${currentUser.userTag}`);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
    if (next) sound.playSuccess();
  };

  return (
    <header className="sticky top-0 z-40 w-full px-2.5 sm:px-8 py-2 sm:py-3">
      <div className="max-w-5xl mx-auto glass-panel rounded-2xl px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shadow-xs border border-white/60">
        {/* Brand */}
        <div className="flex items-center gap-2 select-none shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#628395] text-white flex items-center justify-center shadow-xs">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#2E2925]">
            遊戲室
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Minimal Coin Chip */}
          <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/60 border border-[#DBAD6A]/40 text-[#2E2925] font-mono font-bold text-xs shrink-0">
            <Coins className="w-3.5 h-3.5 text-[#DBAD6A]" />
            <span>{currentUser.coins.toLocaleString()}</span>
          </div>

          {/* Casino / Gaming Hall Shortcut */}
          {onOpenCasino && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenCasino();
              }}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:brightness-110 text-[#231710] font-black text-xs shadow-xs transition-all cursor-pointer shrink-0 border border-[#FDF6C7]/50"
              title="前往帝國地下遊技場（拉霸機・刮刮樂・骰寶）"
            >
              <span className="text-sm">🎰</span>
              <span className="hidden sm:inline">遊技場</span>
            </button>
          )}

          {/* 2D Full-body LPC Wardrobe Shortcut */}
          {onOpenLpcWardrobe && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenLpcWardrobe();
              }}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2E2925] to-[#433C36] hover:brightness-110 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 border border-white/20"
              title="開啟 2D 全身像素自訂換裝室"
            >
              <span className="text-sm">🪞</span>
              <span className="hidden sm:inline">換裝室</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-xl text-[#96897B] hover:text-[#2E2925] hover:bg-white/60 transition-colors cursor-pointer"
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
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-[#2E2925] hover:bg-white/60 transition-colors cursor-pointer"
            title="規則說明"
          >
            <BookOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#628395]" />
            <span className="hidden sm:inline">規則</span>
          </button>

          {/* User Profile & Minimal Popover Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 sm:gap-1.5 p-1 pr-1.5 sm:pr-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
            >
              <img
                src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`}
                alt={currentUser.displayName}
                className="w-7 h-7 rounded-lg object-cover border border-white shadow-xs shrink-0"
              />
              <span className="text-xs font-bold text-[#2E2925] max-w-[80px] sm:max-w-[100px] truncate hidden sm:inline">
                {currentUser.displayName}
              </span>
              <span className="font-mono text-[10px] text-[#628395] font-bold hidden md:inline">
                #{currentUser.userTag}
              </span>
              <ChevronDown className="w-3 h-3 text-[#96897B]" />
            </button>

            {/* Clean Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 shadow-xl border border-white/80 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#96897B]/15 mb-1">
                  <div className="text-xs font-extrabold text-[#2E2925] truncate">
                    {currentUser.displayName}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-[#96897B]">
                    <span>ID: #{currentUser.userTag}</span>
                    <button
                      onClick={copyId}
                      className="text-[#628395] hover:underline flex items-center gap-0.5"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#96897B]" />}
                      <span>{copied ? '已複製' : '複製'}</span>
                    </button>
                  </div>
                </div>

                {/* Showa Exam Card Option */}
                {onOpenExamCard && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenExamCard();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#5D3A1A] hover:bg-[#8D5B4C]/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-[#8D5B4C]" />
                    <span>帝國受驗准考證（名片）</span>
                  </button>
                )}

                {/* 2D Full-body LPC Wardrobe Option */}
                {onOpenLpcWardrobe && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenLpcWardrobe();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#2E2925] hover:bg-black/5 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>🪞</span>
                    <span>2D 全身像素自訂換裝室</span>
                  </button>
                )}

                {/* Casino Option */}
                {onOpenCasino && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenCasino();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#8C6D1F] hover:bg-[#D4AF37]/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>🎰</span>
                    <span>帝國地下遊技場 (拉霸・刮刮樂)</span>
                  </button>
                )}

                {/* PWA Mobile App Install Shortcut */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('open-pwa-install'));
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#8D5B4C] hover:bg-[#8D5B4C]/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#8D5B4C]" />
                  <span>安裝手機應用程式 (PWA)</span>
                </button>

                {/* Edit Profile Option */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenEditProfile();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#2E2925] hover:bg-white/70 rounded-xl transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#628395]" />
                  <span>編輯個人資料</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#CF995F] hover:bg-white/70 rounded-xl transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>管理員後台 (Admin)</span>
                  </button>
                )}

                <div className="h-px bg-[#96897B]/15 my-1" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
