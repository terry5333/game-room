import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Coins, ShoppingBag, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../services/soundService';
import type { UserWardrobe } from '../../types';
import {
  WARDROBE_CATALOG,
  DEFAULT_WARDROBE,
  WardrobeItem,
  STAMP_DETAILS
} from '../../data/wardrobeCatalog';
import { ShowaAvatar } from '../common/ShowaAvatar';

interface WardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'head' | 'outfit' | 'accessory' | 'stamp';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'head', label: '帽子頭飾', icon: '🎓' },
  { id: 'outfit', label: '戰袍服飾', icon: '👘' },
  { id: 'accessory', label: '隨身手持', icon: '🖋️' },
  { id: 'stamp', label: '考證朱印', icon: '💮' }
];

export const WardrobeModal: React.FC<WardrobeModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateWardrobe, updateCoins } = useAuth();

  const currentEquipped: UserWardrobe = currentUser?.wardrobe || DEFAULT_WARDROBE;
  const unlockedItems: string[] = currentUser?.unlockedItems || [
    'none',
    'default',
    'candidate'
  ];

  const [activeTab, setActiveTab] = useState<TabType>('head');
  const [preview, setPreview] = useState<UserWardrobe>(currentEquipped);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen || !currentUser) return null;

  const currentCoins = currentUser.coins ?? 0;
  const filteredCatalog = WARDROBE_CATALOG.filter((item) => item.category === activeTab);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Preview an item
  const handleSelectPreview = (item: WardrobeItem) => {
    sound.playClick();
    setPreview((prev) => ({
      ...prev,
      [item.category]: item.id
    }));
  };

  // Equip already unlocked item directly
  const handleEquipUnlocked = async (item: WardrobeItem) => {
    sound.playClick();
    const newWardrobe = {
      ...preview,
      [item.category]: item.id
    };
    setPreview(newWardrobe);
    await updateWardrobe(newWardrobe);
    showToast(`已更換為【${item.name}】！`, 'success');
  };

  // Purchase locked item
  const handlePurchase = async (item: WardrobeItem) => {
    if (purchasing) return;
    if (currentCoins < item.price) {
      sound.playError();
      showToast('持有的帝國金幣不足！', 'error');
      return;
    }

    setPurchasing(true);
    try {
      // Deduct coins
      if (item.price > 0) {
        await updateCoins(-item.price, 'shop_purchase', `購買服飾：${item.name}`);
      }

      const newWardrobe = {
        ...preview,
        [item.category]: item.id
      };
      setPreview(newWardrobe);
      await updateWardrobe(newWardrobe, item.id);

      sound.playSuccess();
      showToast(`成功解鎖並穿戴【${item.name}】！`, 'success');
    } catch (e) {
      console.error(e);
      sound.playError();
      showToast('購買過程發生錯誤，請稍後重試。', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  // Reset preview back to currently equipped outfit
  const handleResetPreview = () => {
    sound.playClick();
    setPreview(currentEquipped);
  };

  // Save current preview outfit if multiple changes made
  const handleSavePreview = async () => {
    sound.playSuccess();
    await updateWardrobe(preview);
    showToast('已保存穿搭！', 'success');
  };

  const hasUnsavedChanges = JSON.stringify(preview) !== JSON.stringify(currentEquipped);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 14 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          className="relative w-full max-w-4xl bg-[#FAF3E0] border-4 border-double border-[#5D3A1A] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#2E241E]"
          style={{
            backgroundImage:
              'radial-gradient(#D5C0A1 1px, transparent 1px), linear-gradient(to bottom, #FAF3E0, #F3E6C7)',
            backgroundSize: '16px 16px, 100% 100%'
          }}
        >
          {/* Top header bar */}
          <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#8D5B4C]/40 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5D3A1A] text-[#FFE8D6] flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#5D3A1A] font-serif tracking-wider flex items-center gap-2">
                  <span>昭和町服飾舖・試衣間</span>
                  <span className="text-[11px] font-sans px-2 py-0.5 rounded-md bg-[#8D5B4C]/15 border border-[#8D5B4C]/30 text-[#8D5B4C]">
                    對弈擂台換裝
                  </span>
                </h2>
                <p className="text-[11px] text-[#8D5B4C] font-bold">
                  打造專屬受驗生立繪，於房間等待對峙席與准考證威風亮相！
                </p>
              </div>
            </div>

            {/* Current user coins pill */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] border-2 border-[#D5C0A1] shadow-xs">
                <Coins className="w-4 h-4 text-[#D48800] animate-bounce" />
                <span className="font-mono font-black text-sm text-[#B26A00]">
                  {currentCoins}
                </span>
                <span className="text-[10px] text-[#8D5B4C] font-bold">枚</span>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="p-1.5 rounded-full hover:bg-[#8D5B4C]/15 text-[#8D5B4C] hover:text-[#5D3A1A] transition-colors cursor-pointer"
                title="離開服飾舖"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toast message inside modal */}
          {feedbackMsg && (
            <div
              className={`mb-3 py-1.5 px-3 rounded-xl text-xs font-bold text-center border animate-fade-in ${
                feedbackMsg.type === 'success'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-red-100 text-red-800 border-red-300'
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
            {/* LEFT: Mirror Preview Panel (姿見鏡) */}
            <div className="md:col-span-5 flex flex-col items-center justify-between p-4 rounded-2xl bg-[#F7EBD2] border-2 border-[#D5C0A1] shadow-inner relative">
              <div className="w-full flex items-center justify-between text-[11px] font-bold text-[#8D5B4C]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#D48800]" />
                  姿見鏡（穿搭預覽）
                </span>
                {hasUnsavedChanges && (
                  <button
                    onClick={handleResetPreview}
                    className="flex items-center gap-1 text-[10px] text-[#C62828] hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    重置為穿戴中
                  </button>
                )}
              </div>

              {/* Character Standee on Pedestal */}
              <div className="my-auto py-2">
                <ShowaAvatar
                  size="xl"
                  wardrobe={preview}
                  photoURL={currentUser.photoURL}
                  showPedestal={true}
                  animated={true}
                />
              </div>

              {/* Stamp preview badge */}
              <div className="w-full flex items-center justify-between p-2 rounded-xl bg-white/70 border border-[#D5C0A1] text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md border border-[#A83232] bg-[#A83232]/10 flex items-center justify-center text-[10px] font-black text-[#A83232] font-serif">
                    {STAMP_DETAILS[preview.stamp || 'candidate']?.kanji || '受驗'}
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8D5B4C] font-bold">名片朱印</div>
                    <div className="text-xs font-black text-[#3B2211]">
                      {STAMP_DETAILS[preview.stamp || 'candidate']?.label || '受驗生'}
                    </div>
                  </div>
                </div>

                {hasUnsavedChanges && (
                  <button
                    onClick={handleSavePreview}
                    className="px-3 py-1 rounded-lg bg-[#5D3A1A] hover:bg-[#432711] text-[#FFE8D6] font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
                  >
                    保存更換
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: Shop Catalog Tabs & Items */}
            <div className="md:col-span-7 flex flex-col min-h-0">
              {/* Category Tabs */}
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#EAD9BE] border border-[#D5C0A1] mb-3">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveTab(tab.id);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-[#5D3A1A] text-[#FFE8D6] shadow-sm'
                        : 'text-[#8D5B4C] hover:bg-white/50'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Items List (Scrollable) */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                {filteredCatalog.map((item) => {
                  const isEquipped = currentEquipped[item.category] === item.id;
                  const isPreviewing = preview[item.category] === item.id;
                  const isUnlocked = unlockedItems.includes(item.id) || item.price === 0;
                  const canAfford = currentCoins >= item.price;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectPreview(item)}
                      className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isPreviewing
                          ? 'bg-[#FFF9EE] border-[#8D5B4C] shadow-md scale-[1.01]'
                          : 'bg-white/75 border-[#D5C0A1] hover:bg-white hover:border-[#8D5B4C]/50'
                      }`}
                    >
                      {/* Left: Icon & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${
                            item.rarity === 'epic'
                              ? 'bg-purple-100 border-purple-300'
                              : item.rarity === 'rare'
                              ? 'bg-amber-100 border-amber-300'
                              : 'bg-stone-100 border-stone-200'
                          }`}
                        >
                          {item.icon}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-[#3B2211] truncate">
                              {item.name}
                            </span>
                            {item.tag && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-[#8D5B4C]/15 text-[#8D5B4C]">
                                {item.tag}
                              </span>
                            )}
                            {item.rarity === 'epic' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-600 text-white">
                                傳奇
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8D5B4C] line-clamp-1 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="shrink-0 flex items-center gap-2">
                        {isEquipped ? (
                          <div className="px-3 py-1.5 rounded-xl bg-[#2E7D32]/15 border border-[#2E7D32]/40 text-[#2E7D32] text-xs font-black flex items-center gap-1 select-none">
                            <Check className="w-3.5 h-3.5" />
                            <span>穿戴中</span>
                          </div>
                        ) : isUnlocked ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquipUnlocked(item);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#5D3A1A] hover:bg-[#432711] text-[#FFE8D6] font-black text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            穿戴
                          </button>
                        ) : (
                          <button
                            disabled={!canAfford || purchasing}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchase(item);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer ${
                              canAfford
                                ? 'bg-[#D48800] hover:bg-[#B37300] text-white'
                                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>{item.price} 購買</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
