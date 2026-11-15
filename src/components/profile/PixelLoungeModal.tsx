import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Sparkles,
  Coins,
  Utensils,
  Smile,
  Edit2,
  Check,
  Lock,
  ArrowRight,
  User,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../services/soundService';
import {
  CHAIR_CATALOG,
  PET_CATALOG,
  DEFAULT_PET_PROFILE
} from '../../data/petAndChairCatalog';
import { PixelStage } from './PixelStage';
import type { UserPetProfile } from '../../types';

interface PixelLoungeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PixelLoungeModal: React.FC<PixelLoungeModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    petProfile = DEFAULT_PET_PROFILE,
    updatePetProfile,
    feedPet,
    petThePet,
    purchaseChair,
    purchasePet
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'pet' | 'chair' | 'character'>('pet');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const currentPetData = petProfile.pet || DEFAULT_PET_PROFILE.pet;
  const currentCharacter = petProfile.character || DEFAULT_PET_PROFILE.character;
  const unlockedChairs = petProfile.unlockedChairs || ['wooden_chair'];
  const unlockedPets = petProfile.unlockedPets || ['shiba'];

  const petSpecies =
    PET_CATALOG.find((p) => p.id === currentPetData.id) || PET_CATALOG[0];
  const chairItem =
    CHAIR_CATALOG.find((c) => c.id === currentCharacter.chairId) || CHAIR_CATALOG[0];

  const showToast = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  // Feed pet handler
  const handleFeed = async () => {
    if (currentUser.coins < 10) {
      sound.playError();
      showToast('金幣不足 10 枚，快去遊技場或連勝賺取金幣吧！');
      return;
    }
    const success = await feedPet();
    if (success) {
      sound.playSuccess();
      showToast(`餵食了【${petSpecies.favoriteFood}】！飽食度+30，親密度+10，EXP+25！`);
    }
  };

  // Pet pet handler
  const handlePet = async () => {
    const success = await petThePet();
    if (success) {
      sound.playPop();
      showToast(`輕輕撫摸了【${currentPetData.name}】～心情無比幸福！親密度+5！`);
    }
  };

  // Rename pet handler
  const handleSaveName = async () => {
    if (!newName.trim()) {
      setEditingName(false);
      return;
    }
    sound.playClick();
    const updated: UserPetProfile = {
      ...petProfile,
      pet: {
        ...currentPetData,
        name: newName.trim().slice(0, 8)
      }
    };
    await updatePetProfile(updated);
    setEditingName(false);
    showToast(`寵物暱稱已成功變更為【${newName.trim()}】！`);
  };

  // Select or buy chair
  const handleSelectChair = async (chairId: string) => {
    const chair = CHAIR_CATALOG.find((c) => c.id === chairId);
    if (!chair) return;

    if (unlockedChairs.includes(chairId)) {
      sound.playPop();
      const updated: UserPetProfile = {
        ...petProfile,
        character: {
          ...currentCharacter,
          chairId
        }
      };
      await updatePetProfile(updated);
      showToast(`已入座【${chair.name}】！`);
    } else {
      // Need to purchase
      if (currentUser.coins < chair.price) {
        sound.playError();
        showToast(`金幣不足！購買【${chair.name}】需要 ${chair.price} 金幣。`);
        return;
      }
      sound.playWin();
      const ok = await purchaseChair(chairId, chair.price, chair.name);
      if (ok) {
        showToast(`🎉 成功解鎖並入座【${chair.name}】！已扣除 ${chair.price} 金幣。`);
      }
    }
  };

  // Select or buy pet
  const handleSelectPet = async (petId: string) => {
    const petSpec = PET_CATALOG.find((p) => p.id === petId);
    if (!petSpec) return;

    if (unlockedPets.includes(petId)) {
      sound.playPop();
      const updated: UserPetProfile = {
        ...petProfile,
        character: {
          ...currentCharacter,
          petId
        },
        pet: {
          ...currentPetData,
          id: petId,
          name: currentPetData.id === petId ? currentPetData.name : petSpec.name
        }
      };
      await updatePetProfile(updated);
      showToast(`已更換隨行萌寵為【${petSpec.speciesName}】！`);
    } else {
      if (currentUser.coins < petSpec.price) {
        sound.playError();
        showToast(`金幣不足！領養【${petSpec.speciesName}】需要 ${petSpec.price} 金幣。`);
        return;
      }
      sound.playWin();
      const ok = await purchasePet(petId, petSpec.price, petSpec.name);
      if (ok) {
        showToast(`🎉 成功領養【${petSpec.speciesName}】！已扣除 ${petSpec.price} 金幣。`);
      }
    }
  };

  // Update character custom style
  const handleUpdateCharacter = async (partial: Partial<typeof currentCharacter>) => {
    sound.playClick();
    const updated: UserPetProfile = {
      ...petProfile,
      character: {
        ...currentCharacter,
        ...partial
      }
    };
    await updatePetProfile(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-[#FAF8F5] border-2 border-white/80 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Floating Notification Toast */}
        <AnimatePresence>
          {feedbackNotice && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-[#5D3A1A] text-[#FFE8D6] font-black text-xs shadow-xl border border-[#D5C0A1] flex items-center gap-2 pointer-events-none"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{feedbackNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#8D5B4C]/15 text-[#8D5B4C] flex items-center justify-center border border-[#8D5B4C]/25 shadow-xs">
              <span className="text-xl">🛋️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#2E2925]">
                  受驗茶水間・寵物與座椅工坊
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8D5B4C]/10 text-[#5D3A1A] font-bold">
                  像素小人 & 養寵物
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#96897B]">
                養成專屬萌寵夥伴，解鎖各式特色名椅，打造最溫馨的對戰小窩
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coins balance pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-mono font-black text-xs shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentUser.coins.toLocaleString()}</span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl hover:bg-neutral-200/50 text-[#96897B] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Pixel Preview Center Stage */}
        <div className="my-3 p-3 rounded-2xl bg-gradient-to-b from-[#F7EBD2] to-[#EFE1C3] border-2 border-[#D5C0A1] shadow-inner flex flex-col items-center justify-center relative shrink-0">
          <PixelStage profile={petProfile} size="md" interactive={true} />

          {/* Quick Info Bar below preview */}
          <div className="w-full flex items-center justify-between px-3 py-1.5 mt-1 rounded-xl bg-white/70 border border-[#D5C0A1]/60 text-xs font-bold text-[#5D3A1A]">
            <div className="flex items-center gap-2">
              <span>🪑 御用座椅：<strong>{chairItem.name}</strong></span>
              <span>•</span>
              <span>🐾 隨行萌寵：<strong>{currentPetData.name}</strong> ({petSpecies.speciesName})</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#8D5B4C]">
              <span>Lv.{currentPetData.level}</span>
              <span>(親密 {currentPetData.intimacy}%)</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <button
            onClick={() => {
              sound.playPop();
              setActiveTab('pet');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pet'
                ? 'bg-[#8D5B4C] text-white shadow-xs'
                : 'bg-white/70 text-[#96897B] hover:text-[#2E2925] border border-[#96897B]/20'
            }`}
          >
            <span>🐾 萌寵養成與領養</span>
          </button>

          <button
            onClick={() => {
              sound.playPop();
              setActiveTab('chair');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'chair'
                ? 'bg-[#8D5B4C] text-white shadow-xs'
                : 'bg-white/70 text-[#96897B] hover:text-[#2E2925] border border-[#96897B]/20'
            }`}
          >
            <span>🪑 座椅家具工坊</span>
          </button>

          <button
            onClick={() => {
              sound.playPop();
              setActiveTab('character');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'character'
                ? 'bg-[#8D5B4C] text-white shadow-xs'
                : 'bg-white/70 text-[#96897B] hover:text-[#2E2925] border border-[#96897B]/20'
            }`}
          >
            <span>👤 像素形象裝扮</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: 萌寵養成與領養 */}
          {activeTab === 'pet' && (
            <div className="space-y-4">
              {/* Pet Current Status Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#96897B]/20 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {petSpecies.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {editingName ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={currentPetData.name}
                            maxLength={8}
                            className="w-24 px-2 py-0.5 rounded border border-[#8D5B4C] text-xs font-black text-[#2E2925] focus:outline-none"
                          />
                          <button
                            onClick={handleSaveName}
                            className="p-1 rounded bg-[#8D5B4C] text-white text-[10px]"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-black text-sm text-[#2E2925]">
                            {currentPetData.name}
                          </h4>
                          <button
                            onClick={() => {
                              setNewName(currentPetData.name);
                              setEditingName(true);
                            }}
                            className="text-[#96897B] hover:text-[#2E2925] cursor-pointer"
                            title="修改暱稱"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-black">
                        Lv.{currentPetData.level}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#96897B] font-bold mt-0.5">
                      {petSpecies.speciesName}・喜愛【{petSpecies.favoriteFood}】
                    </div>
                  </div>
                </div>

                {/* Status Gauges: Hunger & Intimacy */}
                <div className="grid grid-cols-2 gap-2 w-full sm:w-64">
                  {/* Hunger */}
                  <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="flex items-center justify-between text-[10px] font-black text-[#5D3A1A] mb-1">
                      <span>飽食度 🍖</span>
                      <span>{currentPetData.hunger}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, currentPetData.hunger)}%` }}
                      />
                    </div>
                  </div>

                  {/* Intimacy */}
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="flex items-center justify-between text-[10px] font-black text-rose-800 mb-1">
                      <span>親密度 ❤️</span>
                      <span>{currentPetData.intimacy}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-rose-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, currentPetData.intimacy)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Feed & Pet */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleFeed}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>餵食點心（消耗 10 金幣）</span>
                </button>

                <button
                  onClick={handlePet}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-xs shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>溫柔撫摸（親密 +5）</span>
                </button>
              </div>

              {/* Pet Adoption Catalog */}
              <div>
                <h4 className="text-xs font-black text-[#2E2925] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8D5B4C]" />
                  <span>帝國萌寵收容所（所有可領養品種）</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PET_CATALOG.map((p) => {
                    const isUnlocked = unlockedPets.includes(p.id);
                    const isEquipped = currentPetData.id === p.id;

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                          isEquipped
                            ? 'bg-[#8D5B4C]/10 border-[#8D5B4C] shadow-xs'
                            : isUnlocked
                            ? 'bg-white border-[#96897B]/25 hover:border-[#8D5B4C]/50'
                            : 'bg-neutral-50 border-neutral-200 opacity-90'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0 border border-amber-200">
                            {p.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-[#2E2925] truncate">
                                {p.speciesName}
                              </span>
                              {isEquipped && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#8D5B4C] text-white">
                                  隨行中
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#96897B] truncate max-w-[150px]">
                              {p.description}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isEquipped ? (
                            <span className="text-xs font-bold text-[#8D5B4C] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> 已跟隨
                            </span>
                          ) : isUnlocked ? (
                            <button
                              onClick={() => handleSelectPet(p.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#8D5B4C] hover:bg-[#6e463b] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              隨行
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSelectPet(p.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Coins className="w-3 h-3" />
                              <span>{p.price} 幣領養</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 座椅家具工坊 */}
          {activeTab === 'chair' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-[#2E2925] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8D5B4C]" />
                <span>受驗座席系列（選擇椅子讓像素小人安坐）</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHAIR_CATALOG.map((c) => {
                  const isUnlocked = unlockedChairs.includes(c.id);
                  const isEquipped = currentCharacter.chairId === c.id;

                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isEquipped
                          ? 'bg-[#8D5B4C]/10 border-[#8D5B4C] shadow-xs'
                          : isUnlocked
                          ? 'bg-white border-[#96897B]/25 hover:border-[#8D5B4C]/50'
                          : 'bg-neutral-50 border-neutral-200 opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] flex items-center justify-center text-xl shrink-0 border border-[#D5C0A1]">
                          {c.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-[#2E2925] truncate">
                              {c.name}
                            </span>
                            {isEquipped && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#8D5B4C] text-white">
                                當前入座
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#96897B] truncate max-w-[150px]">
                            {c.description}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isEquipped ? (
                          <span className="text-xs font-bold text-[#8D5B4C] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> 正坐中
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => handleSelectChair(c.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#8D5B4C] hover:bg-[#6e463b] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            入座
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectChair(c.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Coins className="w-3 h-3" />
                            <span>{c.price} 幣解鎖</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 像素形象裝扮 */}
          {activeTab === 'character' && (
            <div className="space-y-4">
              {/* Gender selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#2E2925]">
                  性別形象
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateCharacter({ gender: 'male', hairStyle: 'short' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      currentCharacter.gender === 'male'
                        ? 'bg-[#8D5B4C] text-white border-[#8D5B4C] shadow-xs'
                        : 'bg-white text-[#2E2925] border-neutral-200'
                    }`}
                  >
                    <span>👦 男受驗生（昭和高校短髮）</span>
                  </button>

                  <button
                    onClick={() => handleUpdateCharacter({ gender: 'female', hairStyle: 'twintail' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      currentCharacter.gender === 'female'
                        ? 'bg-[#8D5B4C] text-white border-[#8D5B4C] shadow-xs'
                        : 'bg-white text-[#2E2925] border-neutral-200'
                    }`}
                  >
                    <span>👧 女受驗生（雙馬尾髮型）</span>
                  </button>
                </div>
              </div>

              {/* Hair color selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#2E2925]">
                  髮色選擇
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { label: '自然深黑', color: '#2C3E50' },
                    { label: '栗木深棕', color: '#6E2C00' },
                    { label: '暖陽淺褐', color: '#B9770E' },
                    { label: '星夜深藍', color: '#1B2631' }
                  ].map((h) => (
                    <button
                      key={h.color}
                      onClick={() => handleUpdateCharacter({ hairColor: h.color })}
                      className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        currentCharacter.hairColor === h.color
                          ? 'border-[#8D5B4C] bg-[#8D5B4C]/10 text-[#8D5B4C] font-black'
                          : 'border-neutral-200 bg-white text-[#5D4037]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                      <span>{h.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Uniform jacket color */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#2E2925]">
                  制服色系
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '學院紺藍', color: '#628395' },
                    { label: '硃砂赤紅', color: '#A83232' },
                    { label: '常磐若綠', color: '#2E7D32' },
                    { label: '帝國曜黑', color: '#2C3E50' }
                  ].map((o) => (
                    <button
                      key={o.color}
                      onClick={() => handleUpdateCharacter({ outfitColor: o.color })}
                      className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        currentCharacter.outfitColor === o.color
                          ? 'border-[#8D5B4C] bg-[#8D5B4C]/10 text-[#8D5B4C] font-black'
                          : 'border-neutral-200 bg-white text-[#5D4037]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: o.color }} />
                      <span>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessories */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#2E2925]">
                  隨身配飾
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: '簡潔無配飾', icon: '✨' },
                    { id: 'glasses', label: '知性黑框眼鏡', icon: '👓' },
                    { id: 'ribbon', label: '熱情紅緞帶', icon: '🎀' },
                    { id: 'cap', label: '受驗學士帽', icon: '🎓' },
                    { id: 'tie', label: '紳士領帶', icon: '👔' }
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => handleUpdateCharacter({ accessory: acc.id })}
                      className={`py-2 px-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        currentCharacter.accessory === acc.id
                          ? 'border-[#8D5B4C] bg-[#8D5B4C]/10 text-[#8D5B4C] font-black'
                          : 'border-neutral-200 bg-white text-[#5D4037]'
                      }`}
                    >
                      <span className="text-base">{acc.icon}</span>
                      <span className="truncate">{acc.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
