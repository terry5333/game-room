import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Coins, Flame, Sparkles, Edit3, ShieldCheck, BookOpen } from 'lucide-react';
import type { UserProfile, UserPresence, PlayerSlot, FriendRecord } from '../../types';
import { STAMP_DETAILS, DEFAULT_WARDROBE } from '../../data/wardrobeCatalog';
import { LpcAvatarView } from './LpcAvatarView';
import { sound } from '../../services/soundService';
import { getTitleById } from '../../data/titleCatalog';
import { useAuth } from '../../context/AuthContext';
import { rtdb, ref, onValue } from '../../services/firebase';

interface ExamCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | UserPresence | PlayerSlot | FriendRecord | null;
  isSelf?: boolean;
  onOpenEditProfile?: () => void;
  onOpenTitleSelector?: () => void;
}

export const ExamCardModal: React.FC<ExamCardModalProps> = ({
  isOpen,
  onClose,
  user,
  isSelf = false,
  onOpenEditProfile,
  onOpenTitleSelector
}) => {
  const { allUsers, currentUser } = useAuth();
  const [liveUserData, setLiveUserData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !user?.uid || !rtdb) return;
    try {
      const unsub = onValue(
        ref(rtdb, `users/${user.uid}`),
        (snap) => {
          if (snap.exists()) {
            setLiveUserData(snap.val());
          }
        },
        (err) => {
          console.warn('[ExamCard] RTDB onValue error:', err);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('[ExamCard] Failed to attach listener:', e);
    }
  }, [isOpen, user?.uid]);

  if (!isOpen || !user) return null;

  const targetFromAll = (allUsers || []).find((u) => u && user?.uid && u.uid === user.uid);
  const targetSelf = user?.uid && currentUser?.uid && user.uid === currentUser.uid ? currentUser : null;
  const merged: any = { ...(user || {}), ...(targetFromAll || {}), ...(targetSelf || {}), ...(liveUserData || {}) };

  const wardrobe = merged.wardrobe || DEFAULT_WARDROBE || {};
  const stampKey = wardrobe.stamp || 'candidate';
  const stampInfo = STAMP_DETAILS[stampKey] || STAMP_DETAILS['candidate'] || {
    kanji: '受驗',
    label: '受驗生',
    desc: '通過帝國學府初步審查之受驗生憑證'
  };

  const wins = Number(merged.wins ?? merged.stats?.wins ?? 0);
  const losses = Number(merged.losses ?? merged.stats?.losses ?? 0);
  const totalGames = Number(merged.gamesPlayed ?? merged.stats?.totalGames ?? (wins + losses));
  const winRate =
    totalGames > 0
      ? ((wins / totalGames) * 100).toFixed(1)
      : '0.0';

  const coins = Number(merged.coins ?? 0);
  const userTag = merged.userTag || (isSelf ? currentUser?.userTag : '') || (user?.uid ? user.uid.substring(0, 4) : '0215');
  const bio = merged.bio || merged.motto || '';
  const photoUrl =
    merged.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${merged.uid || 'guest'}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          className="relative w-full max-w-lg bg-[#FAF3E0] border-4 border-double border-[#5D3A1A] rounded-2xl p-5 sm:p-7 shadow-2xl overflow-hidden text-[#2E241E]"
          style={{
            backgroundImage:
              'radial-gradient(#D5C0A1 1px, transparent 1px), linear-gradient(to bottom, #FAF3E0, #F4E7C8)',
            backgroundSize: '16px 16px, 100% 100%'
          }}
        >
          {/* Top Vintage Brass Corner Ornaments */}
          <div className="absolute top-2 left-2 text-[#8D5B4C] text-xs font-serif select-none pointer-events-none">
            ╔══
          </div>
          <div className="absolute top-2 right-2 text-[#8D5B4C] text-xs font-serif select-none pointer-events-none">
            ══╗
          </div>
          <div className="absolute bottom-2 left-2 text-[#8D5B4C] text-xs font-serif select-none pointer-events-none">
            ╚══
          </div>
          <div className="absolute bottom-2 right-2 text-[#8D5B4C] text-xs font-serif select-none pointer-events-none">
            ══╝
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full hover:bg-[#8D5B4C]/15 text-[#8D5B4C] hover:text-[#5D3A1A] transition-colors cursor-pointer z-10"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Banner */}
          <div className="text-center pb-3 border-b-2 border-[#8D5B4C]/40 mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#8D5B4C]/10 border border-[#8D5B4C]/30 text-[10px] font-black tracking-widest text-[#8D5B4C] mb-1">
              <ShieldCheck className="w-3 h-3 text-[#A83232]" />
              <span>昭和高等對弈學府・認可受驗憑證</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-widest text-[#5D3A1A] font-serif">
              帝國受驗生准考證
            </h2>
          </div>

          {/* Card Body Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            {/* Left: Classic ID Photo in Vintage Corner Mounts */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#F7EBD2] border-2 border-[#D5C0A1] shadow-inner relative">
              <span className="absolute top-1.5 left-2 text-[9px] font-bold text-[#8D5B4C]/70 tracking-wider">
                【 受驗生肖像 】
              </span>

              {/* Vintage Photo Mounting Card */}
              <div className="mt-3 mb-2 relative p-1.5 bg-[#FAF3E0] rounded-lg border border-[#D5C0A1] shadow-sm">
                {/* 4 Decorative Corner Photo Brackets */}
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#5D3A1A]" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#5D3A1A]" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#5D3A1A]" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#5D3A1A]" />

                <div className="scale-85 origin-center my-[-4px]">
                  <div className="w-[128px] h-[128px] flex items-center justify-center">
                    <LpcAvatarView
                      config={merged.lpcCharacter}
                      size={128}
                      scale={2}
                      direction="down"
                    />
                  </div>
                </div>

                {/* Corner Embossed School Stamp */}
                <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full bg-[#A83232]/90 text-white text-[8px] font-black font-serif tracking-tighter shadow-xs border border-white/80 rotate-[-12deg]">
                  對弈認可
                </div>
              </div>

              {/* Registration Tag */}
              <div className="mt-1 px-3 py-0.5 rounded-md bg-[#5D3A1A] text-[#FFE8D6] text-[11px] font-black tracking-wider shadow-xs">
                #{userTag}
              </div>
            </div>

            {/* Right: Examinee Dossier & Stats */}
            <div className="sm:col-span-7 flex flex-col justify-between space-y-2.5">
              {/* Name & Stamp Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#8D5B4C] tracking-wider">
                    受驗生氏名
                  </div>
                  <div className="text-lg sm:text-xl font-black text-[#3B2211] font-serif tracking-wide truncate max-w-[160px]">
                    {merged.displayName || user.displayName}
                  </div>
                  {/* Equipped Title Badge */}
                  {(() => {
                    const title = getTitleById(
                      typeof merged.equippedTitle === 'string' ? merged.equippedTitle : undefined
                    );
                    if (!title) {
                      return isSelf && onOpenTitleSelector ? (
                        <div className="mt-1">
                          <button
                            onClick={() => {
                              sound.playClick();
                              onOpenTitleSelector();
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-dashed border-[#8D5B4C]/40 text-[#8D5B4C] hover:bg-[#8D5B4C]/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>🎖️</span>
                            <span>佩戴稱號</span>
                          </button>
                        </div>
                      ) : null;
                    }
                    return (
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border shadow-2xs ${title.badgeStyle || ''} ${title.textColor || ''}`}
                        >
                          {title.name}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="text-xs text-[#8D5B4C] font-mono font-bold mt-1">
                    編號：No.{userTag}
                  </div>
                </div>

                {/* Red Vermilion Wax Seal Stamp (朱印) */}
                <div
                  className="w-16 h-16 rounded-lg border-2 border-[#A83232] bg-[#A83232]/10 flex flex-col items-center justify-center shadow-xs transform rotate-6 select-none shrink-0"
                  style={{
                    boxShadow: 'inset 0 0 8px rgba(168, 50, 50, 0.25)'
                  }}
                  title={stampInfo.desc}
                >
                  <span className="text-[10px] font-serif font-black text-[#A83232] tracking-tighter">
                    {stampInfo.kanji}
                  </span>
                  <span className="text-[8px] font-bold text-[#A83232] scale-90">
                    {stampInfo.label}
                  </span>
                </div>
              </div>

              {/* Records dossier table */}
              <div className="p-2.5 rounded-xl bg-white/70 border border-[#D5C0A1] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8D5B4C] font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#5D3A1A]" />
                    總對局數
                  </span>
                  <span className="font-mono font-black text-[#3B2211]">
                    {totalGames} 場
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8D5B4C] font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#C84A31]" />
                    戰績（勝/負）
                  </span>
                  <span className="font-mono font-black text-[#3B2211]">
                    <span className="text-[#2E7D32]">{wins} 勝</span> /{' '}
                    <span className="text-[#C62828]">{losses} 負</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8D5B4C] font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D48800]" />
                    勝率
                  </span>
                  <span className="font-mono font-black text-[#D48800] text-sm">
                    {winRate}%
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#D5C0A1]/50">
                  <span className="text-[#8D5B4C] font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#E09F3E]" />
                    持有資產
                  </span>
                  <span className="font-mono font-black text-[#B26A00] flex items-center gap-1">
                    🪙 {coins} 枚
                  </span>
                </div>
              </div>

              {/* Personal Bio / Motto Card */}
              <div className="p-2.5 rounded-xl bg-white/70 border border-[#D5C0A1] shadow-2xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-[#8D5B4C] flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-[#5D3A1A]" />
                    受驗生個人自介・座右銘
                  </span>
                  {isSelf && onOpenEditProfile && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onClose();
                        onOpenEditProfile();
                      }}
                      className="text-[10px] font-bold text-[#628395] hover:underline cursor-pointer"
                    >
                      編輯自介
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#3B2211] font-serif italic line-clamp-2">
                  {bio ? `"${bio}"` : '「此受驗生專注對弈，暫未留下個人自介。」'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-3.5 border-t-2 border-[#8D5B4C]/30 flex flex-wrap items-center justify-between gap-2">
            {isSelf ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onOpenTitleSelector && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onClose();
                      onOpenTitleSelector();
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>🎖️</span>
                    <span>更換榮譽稱號</span>
                  </button>
                )}
                {onOpenEditProfile && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onClose();
                      onOpenEditProfile();
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-[#5D3A1A] border border-[#8D5B4C]/40 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>編輯暱稱與資料</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#8D5B4C] font-bold">
                可點擊其他玩家頭像隨時查看准考證
              </div>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-[#5D3A1A] hover:bg-[#432711] text-[#FFE8D6] font-bold text-xs transition-colors ml-auto cursor-pointer"
            >
              確認
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
