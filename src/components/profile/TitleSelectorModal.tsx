import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Check, Lock, Sparkles, Shield, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TITLE_CATALOG, PlayerTitle, getTitleById, isTitleUnlocked } from '../../data/titleCatalog';
import { sound } from '../../services/soundService';

interface TitleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TitleSelectorModal: React.FC<TitleSelectorModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, equipTitle } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentEquippedId = currentUser?.equippedTitle || 'title_novice';

  const categories = [
    { id: 'all', label: '全部稱號' },
    { id: 'adventure', label: '🔰 歷練' },
    { id: 'battle', label: '⚔️ 對戰' },
    { id: 'casino', label: '🎲 賭場' },
    { id: 'wealth', label: '🪙 財富' },
    { id: 'fashion', label: '👗 風尚' },
    { id: 'special', label: '👑 特殊' }
  ];

  const filteredTitles = TITLE_CATALOG.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const handleEquip = async (title: PlayerTitle) => {
    const unlocked = isTitleUnlocked(title, currentUser);
    if (!unlocked) {
      sound.playError();
      return;
    }

    sound.playTitleUnlock();
    await equipTitle(title.id);
    setSuccessToast(`✨ 已佩戴稱號「${title.name}」！`);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#FAF8F5] border-3 border-[#2E2925] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden text-[#2E2925]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#F0EBE1] border-b-2 border-[#E5DEC9]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎖️</span>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                玩家稱號榮譽殿堂
                <span className="text-[10px] bg-amber-500/20 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  稱號系統
                </span>
              </h2>
              <p className="text-xs text-[#786F66]">
                解鎖並佩戴個人榮譽稱號，即刻展示於大廳、准考證名片與等待室列隊
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-[#FAF8F5] border-2 border-[#2E2925] flex items-center justify-center text-[#5C5346] hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 提示訊息 */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-2 text-xs font-black text-center flex items-center justify-center gap-2 bg-emerald-500 text-white border-b-2 border-emerald-700"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{successToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 當前佩戴中稱號大卡片 */}
        {(() => {
          const equipped = getTitleById(currentEquippedId);
          return (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-[#E5DEC9] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border-2 border-[#2E2925] flex items-center justify-center text-xl shadow-xs">
                  👑
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#786F66]">目前配戴稱號</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black border shadow-xs ${equipped.badgeStyle} ${equipped.textColor}`}
                    >
                      {equipped.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-[#786F66] max-w-xs text-right hidden sm:block">
                {equipped.description}
              </div>
            </div>
          );
        })()}

        {/* 分類導航 */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FAF8F5] border-b border-[#E5DEC9] overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(c.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border-2 cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[#2E2925] text-white border-[#2E2925] shadow-sm'
                  : 'bg-white text-[#5C5346] border-[#E5DEC9] hover:border-[#2E2925]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 稱號列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredTitles.map((title) => {
            const isEquipped = title.id === currentEquippedId;
            const unlocked = isTitleUnlocked(title, currentUser);

            return (
              <div
                key={title.id}
                onClick={() => unlocked && handleEquip(title)}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                  isEquipped
                    ? 'bg-amber-50/80 border-amber-600 shadow-sm scale-101'
                    : unlocked
                    ? 'bg-white border-[#E5DEC9] hover:border-[#2E2925] cursor-pointer hover:shadow-xs'
                    : 'bg-stone-100/60 border-stone-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-black/10 bg-white">
                    {unlocked ? (
                      <Award className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-stone-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black border shadow-2xs ${title.badgeStyle} ${title.textColor}`}
                      >
                        {title.name}
                      </span>
                      {isEquipped && (
                        <span className="text-[10px] bg-amber-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs">
                          佩戴中
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5C5346] mt-1 line-clamp-1">{title.description}</p>
                    <div className="text-[10px] text-[#96897B] font-mono mt-0.5">
                      解鎖條件：{title.requirement}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isEquipped ? (
                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : unlocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEquip(title);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#2E2925] hover:bg-[#433C36] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      佩戴
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-500 text-xs font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>未解鎖</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F0EBE1] border-t-2 border-[#E5DEC9] flex items-center justify-between text-xs text-[#786F66]">
          <span>已解鎖 {TITLE_CATALOG.filter((t) => isTitleUnlocked(t, currentUser)).length} / {TITLE_CATALOG.length} 個稱號</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border-2 border-[#2E2925] text-xs font-bold text-[#2E2925] hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
          >
            關閉
          </button>
        </div>
      </motion.div>
    </div>
  );
};
