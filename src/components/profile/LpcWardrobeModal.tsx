import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  RotateCw,
  RotateCcw,
  Footprints,
  User,
  ZoomIn,
  Check,
  RotateCcw as RevertIcon,
  RefreshCw,
  Palette,
  Shirt,
  Scissors,
  Lock,
  Coins
} from 'lucide-react';
import { LpcCharacterConfig } from '../../types';
import {
  LPC_ITEMS,
  LPC_SKIN_PALETTES,
  LPC_HAIR_PALETTES,
  DEFAULT_LPC_CHARACTER,
  LpcItemDef
} from '../../data/lpcCatalog';
import { LpcDirection } from '../../services/lpcRenderer';
import { LpcAvatarView } from './LpcAvatarView';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../services/soundService';
import { itemPricing } from '../../services/itemPricingService';

interface LpcWardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WardrobeCategory =
  | 'body'
  | 'hair'
  | 'hairColor'
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'hat'
  | 'accessories';

const CATEGORY_TABS: { id: WardrobeCategory; label: string; icon: string }[] = [
  { id: 'body', label: '身體', icon: '👤' },
  { id: 'hair', label: '髮型', icon: '💇' },
  { id: 'hairColor', label: '髮色', icon: '🎨' },
  { id: 'top', label: '上衣', icon: '👕' },
  { id: 'bottom', label: '褲子', icon: '👖' },
  { id: 'shoes', label: '鞋子', icon: '👞' },
  { id: 'hat', label: '帽子', icon: '🧢' },
  { id: 'accessories', label: '配件', icon: '👓' }
];

export const LpcWardrobeModal: React.FC<LpcWardrobeModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, lpcCharacter, updateLpcCharacter, purchaseLpcItem } = useAuth();

  // 初始造型快照（用於支援「取消試穿 / 恢復原樣」）
  const [initialConfig, setInitialConfig] = useState<LpcCharacterConfig>(
    () => lpcCharacter || DEFAULT_LPC_CHARACTER
  );

  // 當前試穿狀態（任何點選立即反應到畫布上）
  const [currentConfig, setCurrentConfig] = useState<LpcCharacterConfig>(
    () => lpcCharacter || DEFAULT_LPC_CHARACTER
  );

  const [activeCategory, setActiveCategory] = useState<WardrobeCategory>('body');
  const [direction, setDirection] = useState<LpcDirection>('down');
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(3); // 2 = 128px, 3 = 192px, 4 = 256px
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [purchaseMsg, setPurchaseMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [, setCustomPrices] = useState(itemPricing.getAllCustomPrices());

  // 即時監聽管理員服裝價格變動
  useEffect(() => {
    return itemPricing.subscribe(setCustomPrices);
  }, []);

  // 當 Modal 開啟時同步目前配置
  useEffect(() => {
    if (isOpen) {
      const base = lpcCharacter || DEFAULT_LPC_CHARACTER;
      setInitialConfig(base);
      setCurrentConfig(base);
      setSaveSuccess(false);
      setPurchaseMsg(null);
    }
  }, [isOpen, lpcCharacter]);

  if (!isOpen) return null;

  // 檢查物品是否已解鎖擁有
  const isItemUnlocked = (item: LpcItemDef): boolean => {
    const price = itemPricing.getPrice(item.id, item.price ?? 100);
    if (price === 0) return true;
    const starterIds = [
      'body_male', 'body_female',
      'hair_bangsshort', 'hair_plain',
      'top_tshirt', 'bottom_pants', 'shoes_shoes'
    ];
    if (starterIds.includes(item.id)) return true;
    return Boolean(currentUser?.unlockedItems?.includes(item.id));
  };

  // 四個方向輪轉
  const rotateLeft = () => {
    sound.playClick();
    const order: LpcDirection[] = ['down', 'right', 'up', 'left'];
    const idx = order.indexOf(direction);
    setDirection(order[(idx + 1) % order.length]);
  };

  const rotateRight = () => {
    sound.playClick();
    const order: LpcDirection[] = ['down', 'left', 'up', 'right'];
    const idx = order.indexOf(direction);
    setDirection(order[(idx + 1) % order.length]);
  };

  // 儲存造型至 Firebase
  const handleSave = async () => {
    sound.playSuccess();
    await updateLpcCharacter(currentConfig);
    setInitialConfig(currentConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  // 取消試穿 / 恢復原本造型
  const handleRevert = () => {
    sound.playClick();
    setCurrentConfig(initialConfig);
  };

  // 重設角色至預設冒險者
  const handleReset = () => {
    sound.playClick();
    setCurrentConfig(DEFAULT_LPC_CHARACTER);
  };

  // 點選服裝項目：已擁有則直接穿戴/卸下；未擁有則扣金幣解鎖後穿戴
  const handleItemClick = async (
    category: WardrobeCategory,
    item: LpcItemDef,
    isMulti: boolean = false
  ) => {
    const unlocked = isItemUnlocked(item);
    const price = itemPricing.getPrice(item.id, item.price ?? 100);

    if (!unlocked) {
      if ((currentUser?.coins ?? 0) < price) {
        sound.playError();
        setPurchaseMsg({
          text: `❌ 金幣不足！解鎖「${item.name}」需要 ${price} 幣（持有 ${currentUser?.coins ?? 0} 幣）`,
          error: true
        });
        setTimeout(() => setPurchaseMsg(null), 3000);
        return;
      }

      // 扣幣購買
      const success = await purchaseLpcItem(item.id, price, item.name);
      if (success) {
        sound.playPurchase();
        setPurchaseMsg({
          text: `🎉 成功解鎖「${item.name}」！已扣除 ${price} 金幣。已為您裝備！`,
          error: false
        });
        setTimeout(() => setPurchaseMsg(null), 3000);
      } else {
        sound.playError();
        return;
      }
    } else {
      sound.playEquip();
    }

    // 穿戴
    if (isMulti) {
      setCurrentConfig((prev) => {
        const current = prev.accessories || [];
        const updated = current.includes(item.id)
          ? current.filter((id) => id !== item.id)
          : [...current, item.id];
        return { ...prev, accessories: updated };
      });
    } else {
      setCurrentConfig((prev) => {
        if (category === 'top') return { ...prev, top: item.id };
        if (category === 'bottom') return { ...prev, bottom: item.id };
        if (category === 'shoes') return { ...prev, shoes: item.id };
        if (category === 'hat') return { ...prev, hat: item.id };
        if (category === 'hair') return { ...prev, hair: item.id };
        return prev;
      });
    }
  };

  // 卸下單個部位
  const handleEquipNone = (category: WardrobeCategory) => {
    sound.playClick();
    setCurrentConfig((prev) => {
      if (category === 'top') return { ...prev, top: 'none' };
      if (category === 'bottom') return { ...prev, bottom: 'none' };
      if (category === 'shoes') return { ...prev, shoes: 'none' };
      if (category === 'hat') return { ...prev, hat: 'none' };
      if (category === 'hair') return { ...prev, hair: 'none' };
      return prev;
    });
  };

  // 篩選當前分類下的素材清單
  const itemsForCategory = LPC_ITEMS.filter((item) => {
    if (activeCategory === 'top') return item.category === 'top';
    if (activeCategory === 'bottom') return item.category === 'bottom';
    if (activeCategory === 'shoes') return item.category === 'shoes';
    if (activeCategory === 'hat') return item.category === 'hat';
    if (activeCategory === 'hair') return item.category === 'hair';
    if (activeCategory === 'accessories') return item.category === 'accessories';
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#FAF8F5] border-3 border-[#2E2925] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden text-[#2E2925]"
      >
        {/* Header 頂部導航與標題 */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#F0EBE1] border-b-2 border-[#E5DEC9]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🪞</span>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                2D 全身像素自訂換裝室
                <span className="text-[10px] bg-[#D97706]/15 text-[#B45309] font-bold px-2 py-0.5 rounded-full border border-[#D97706]/30">
                  Universal LPC
                </span>
              </h2>
              <p className="text-xs text-[#786F66]">
                即時更換部位試穿，即刻反應像素全身造型
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 金幣餘額顯示 */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] border-2 border-[#2E2925] rounded-full shadow-sm text-xs font-black text-[#D97706]">
              <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{currentUser?.coins?.toLocaleString() ?? 0}</span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-[#FAF8F5] border-2 border-[#2E2925] flex items-center justify-center text-[#5C5346] hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 提示訊息列 */}
        <AnimatePresence>
          {purchaseMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`px-4 py-2 text-xs font-black text-center flex items-center justify-center gap-2 border-b-2 ${
                purchaseMsg.error
                  ? 'bg-red-500 text-white border-red-700'
                  : 'bg-emerald-500 text-white border-emerald-700'
              }`}
            >
              <span>{purchaseMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 頂部分類標籤列 (Category Tabs) */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FAF8F5] border-b border-[#E5DEC9] overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveCategory(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border-2 ${
                  isActive
                    ? 'bg-[#2E2925] text-white border-[#2E2925] shadow-md scale-102'
                    : 'bg-white/80 text-[#5C5346] border-[#E5DEC9] hover:bg-white hover:border-[#2E2925]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 主內容區：左側角色畫布舞台 + 右側裝備選擇庫 */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* 左側：角色展示大畫布與控制台 */}
          <div className="w-full md:w-80 lg:w-96 p-4 bg-[#F5EFE6] border-b md:border-b-0 md:border-r-2 border-[#E5DEC9] flex flex-col items-center justify-between gap-3">
            {/* 角色大畫布展示舞台 */}
            <div className="relative w-full aspect-square max-w-[260px] rounded-2xl bg-gradient-to-b from-[#EBE2D3] to-[#DFD4C2] border-2 border-[#2E2925] shadow-inner flex flex-col items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(#2E2925 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              />

              {/* 渲染獨立 2D LPC 角色畫布 */}
              <div className="relative z-10 flex items-center justify-center">
                <LpcAvatarView
                  config={currentConfig}
                  direction={direction}
                  scale={zoomScale}
                  animate={isWalking}
                />
              </div>

              {/* 方向指示徽章 */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-xs text-[10px] font-mono text-white/90 uppercase">
                {direction} | {zoomScale}x
              </div>

              {/* 動畫播放指示 */}
              {isWalking && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-[#D97706] text-[10px] font-bold text-white shadow-xs animate-pulse">
                  WALKING
                </div>
              )}
            </div>

            {/* 旋轉、走動與放大縮小操作控制台 */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={rotateLeft}
                  title="向左轉向"
                  className="p-2 rounded-xl bg-white border-2 border-[#2E2925] text-[#2E2925] hover:bg-amber-50 active:scale-95 transition-all shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 bg-white border-2 border-[#2E2925] rounded-xl p-1 shadow-xs">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setDirection('up');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                      direction === 'up'
                        ? 'bg-[#2E2925] text-white'
                        : 'text-[#786F66] hover:text-[#2E2925]'
                    }`}
                  >
                    背
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setDirection('down');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                      direction === 'down'
                        ? 'bg-[#2E2925] text-white'
                        : 'text-[#786F66] hover:text-[#2E2925]'
                    }`}
                  >
                    正
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setDirection('left');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                      direction === 'left'
                        ? 'bg-[#2E2925] text-white'
                        : 'text-[#786F66] hover:text-[#2E2925]'
                    }`}
                  >
                    左
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setDirection('right');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                      direction === 'right'
                        ? 'bg-[#2E2925] text-white'
                        : 'text-[#786F66] hover:text-[#2E2925]'
                    }`}
                  >
                    右
                  </button>
                </div>

                <button
                  onClick={rotateRight}
                  title="向右轉向"
                  className="p-2 rounded-xl bg-white border-2 border-[#2E2925] text-[#2E2925] hover:bg-amber-50 active:scale-95 transition-all shadow-xs"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* 行走動畫切換與縮放倍率 */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsWalking(!isWalking);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    isWalking
                      ? 'bg-[#D97706] text-white border-[#B45309] shadow-inner'
                      : 'bg-white text-[#5C5346] border-[#E5DEC9] hover:border-[#2E2925]'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>{isWalking ? '停止走動' : '原地步行'}</span>
                </button>

                <div className="flex items-center gap-1 bg-white border-2 border-[#E5DEC9] rounded-xl px-2 py-1 text-xs">
                  <ZoomIn className="w-3.5 h-3.5 text-[#786F66]" />
                  {[2, 3, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        sound.playClick();
                        setZoomScale(s);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        zoomScale === s
                          ? 'bg-[#2E2925] text-white'
                          : 'text-[#786F66] hover:text-[#2E2925]'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 右側：服裝與素材選擇區 */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
            {/* === 分類 1：身體 (體型 + 膚色) === */}
            {activeCategory === 'body' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-[#2E2925] mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D97706]" />
                    選擇體型骨架
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setCurrentConfig((prev) => ({
                          ...prev,
                          gender: 'male',
                          body: 'body_male'
                        }));
                      }}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold transition-all ${
                        currentConfig.gender === 'male'
                          ? 'bg-[#2E2925] text-white border-[#2E2925] shadow-md'
                          : 'bg-white text-[#5C5346] border-[#E5DEC9] hover:border-[#2E2925]'
                      }`}
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center p-0.5 overflow-hidden border border-white/30">
                        <img
                          src="/assets/lpc/thumbnails/body_male.png"
                          alt="男性"
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <span>男性體型 (Male)</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setCurrentConfig((prev) => ({
                          ...prev,
                          gender: 'female',
                          body: 'body_female'
                        }));
                      }}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold transition-all ${
                        currentConfig.gender === 'female'
                          ? 'bg-[#2E2925] text-white border-[#2E2925] shadow-md'
                          : 'bg-white text-[#5C5346] border-[#E5DEC9] hover:border-[#2E2925]'
                      }`}
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center p-0.5 overflow-hidden border border-white/30">
                        <img
                          src="/assets/lpc/thumbnails/body_female.png"
                          alt="女性"
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <span>女性體型 (Female)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-[#2E2925] mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#D97706]" />
                    選擇全身膚色 (即時色盤更換)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {LPC_SKIN_PALETTES.map((palette) => {
                      const isSelected = currentConfig.skinTone === palette.id;
                      return (
                        <button
                          key={palette.id}
                          onClick={() => {
                            sound.playClick();
                            setCurrentConfig((prev) => ({
                              ...prev,
                              skinTone: palette.id
                            }));
                          }}
                          className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 text-left transition-all ${
                            isSelected
                              ? 'bg-amber-50 border-[#D97706] shadow-sm'
                              : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full border-2 border-black/20 shadow-inner shrink-0"
                            style={{ backgroundColor: palette.previewColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[#2E2925] truncate">
                              {palette.name}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#D97706] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* === 分類 2：髮型 (Hair Style) === */}
            {activeCategory === 'hair' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#2E2925] flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-[#D97706]" />
                    挑選角色髮型
                  </h3>
                  <span className="text-xs text-[#786F66]">
                    點選髮型後，可前往「髮色」分頁染髮
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* 無髮型選項 */}
                  <button
                    onClick={() => handleEquipNone('hair')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      currentConfig.hair === 'none'
                        ? 'bg-amber-50 border-[#D97706] shadow-sm'
                        : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                    }`}
                  >
                    <span className="text-2xl">🥚</span>
                    <span className="text-xs font-bold text-[#2E2925]">
                      光頭 / 無髮型
                    </span>
                  </button>

                  {itemsForCategory.map((item) => {
                    const isSelected = currentConfig.hair === item.id;
                    const unlocked = isItemUnlocked(item);
                    const price = itemPricing.getPrice(item.id, item.price ?? 100);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick('hair', item)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative group ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <div className="w-14 h-14 bg-[#F5EFE6] rounded-xl flex items-center justify-center p-1 border border-[#E5DEC9] shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative">
                          <img
                            src={`/assets/lpc/thumbnails/${item.id}.png`}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>

                        {/* 狀態徽章 */}
                        {isSelected ? (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : !unlocked ? (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/75 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 shadow-xs">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{price}</span>
                          </div>
                        ) : null}

                        {!unlocked && (
                          <div className="mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1">
                            <span>🪙</span>
                            <span>購買解鎖</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 分類 3：髮色 (Hair Color) === */}
            {activeCategory === 'hairColor' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#2E2925] flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#D97706]" />
                    選擇頭髮染色
                  </h3>
                  <span className="text-xs text-[#786F66]">
                    點選即刻套用至當前髮型
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {LPC_HAIR_PALETTES.map((palette) => {
                    const isSelected = currentConfig.hairColor === palette.id;
                    return (
                      <button
                        key={palette.id}
                        onClick={() => {
                          sound.playClick();
                          setCurrentConfig((prev) => ({
                            ...prev,
                            hairColor: palette.id
                          }));
                        }}
                        className={`p-3 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <span
                          className="w-7 h-7 rounded-full border-2 border-black/20 shadow-inner shrink-0"
                          style={{ backgroundColor: palette.previewColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#2E2925] truncate">
                            {palette.name}
                          </div>
                          <div className="text-[10px] text-[#786F66]">
                            Hex: {palette.previewColor}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#D97706] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 分類 4：上衣 (Tops) === */}
            {activeCategory === 'top' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#2E2925] flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-[#D97706]" />
                  挑選角色上衣
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleEquipNone('top')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      currentConfig.top === 'none'
                        ? 'bg-amber-50 border-[#D97706] shadow-sm'
                        : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                    }`}
                  >
                    <span className="text-2xl">🚫</span>
                    <span className="text-xs font-bold text-[#2E2925]">
                      不穿上衣
                    </span>
                  </button>

                  {itemsForCategory.map((item) => {
                    const isSelected = currentConfig.top === item.id;
                    const unlocked = isItemUnlocked(item);
                    const price = itemPricing.getPrice(item.id, item.price ?? 100);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick('top', item)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative group ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <div className="w-14 h-14 bg-[#F5EFE6] rounded-xl flex items-center justify-center p-1 border border-[#E5DEC9] shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative">
                          <img
                            src={`/assets/lpc/thumbnails/${item.id}.png`}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>

                        {isSelected ? (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : !unlocked ? (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/75 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 shadow-xs">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{price}</span>
                          </div>
                        ) : null}

                        {!unlocked && (
                          <div className="mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1">
                            <span>🪙</span>
                            <span>購買解鎖</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 分類 5：褲子/下著 (Bottoms) === */}
            {activeCategory === 'bottom' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#2E2925] flex items-center gap-2">
                  <span>👖</span>
                  挑選下著長褲
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleEquipNone('bottom')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      currentConfig.bottom === 'none'
                        ? 'bg-amber-50 border-[#D97706] shadow-sm'
                        : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                    }`}
                  >
                    <span className="text-2xl">🚫</span>
                    <span className="text-xs font-bold text-[#2E2925]">
                      不穿長褲
                    </span>
                  </button>

                  {itemsForCategory.map((item) => {
                    const isSelected = currentConfig.bottom === item.id;
                    const unlocked = isItemUnlocked(item);
                    const price = itemPricing.getPrice(item.id, item.price ?? 100);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick('bottom', item)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative group ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <div className="w-14 h-14 bg-[#F5EFE6] rounded-xl flex items-center justify-center p-1 border border-[#E5DEC9] shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative">
                          <img
                            src={`/assets/lpc/thumbnails/${item.id}.png`}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>

                        {isSelected ? (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : !unlocked ? (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/75 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 shadow-xs">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{price}</span>
                          </div>
                        ) : null}

                        {!unlocked && (
                          <div className="mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1">
                            <span>🪙</span>
                            <span>購買解鎖</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 分類 6：鞋子 (Shoes) === */}
            {activeCategory === 'shoes' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#2E2925] flex items-center gap-2">
                  <span>👞</span>
                  挑選角色鞋款
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleEquipNone('shoes')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      currentConfig.shoes === 'none'
                        ? 'bg-amber-50 border-[#D97706] shadow-sm'
                        : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                    }`}
                  >
                    <span className="text-2xl">🦶</span>
                    <span className="text-xs font-bold text-[#2E2925]">
                      赤腳 / 不穿鞋
                    </span>
                  </button>

                  {itemsForCategory.map((item) => {
                    const isSelected = currentConfig.shoes === item.id;
                    const unlocked = isItemUnlocked(item);
                    const price = itemPricing.getPrice(item.id, item.price ?? 100);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick('shoes', item)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative group ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <div className="w-14 h-14 bg-[#F5EFE6] rounded-xl flex items-center justify-center p-1 border border-[#E5DEC9] shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative">
                          <img
                            src={`/assets/lpc/thumbnails/${item.id}.png`}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>

                        {isSelected ? (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : !unlocked ? (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/75 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 shadow-xs">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{price}</span>
                          </div>
                        ) : null}

                        {!unlocked && (
                          <div className="mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1">
                            <span>🪙</span>
                            <span>購買解鎖</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 分類 7：帽子 (Hats) === */}
            {activeCategory === 'hat' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#2E2925] flex items-center gap-2">
                  <span>🧢</span>
                  挑選帽子與頭飾
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleEquipNone('hat')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      currentConfig.hat === 'none'
                        ? 'bg-amber-50 border-[#D97706] shadow-sm'
                        : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                    }`}
                  >
                    <span className="text-2xl">🚫</span>
                    <span className="text-xs font-bold text-[#2E2925]">
                      不戴帽子
                    </span>
                  </button>

                  {itemsForCategory.map((item) => {
                    const isSelected = currentConfig.hat === item.id;
                    const unlocked = isItemUnlocked(item);
                    const price = itemPricing.getPrice(item.id, item.price ?? 100);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick('hat', item)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative group ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <div className="w-14 h-14 bg-[#F5EFE6] rounded-xl flex items-center justify-center p-1 border border-[#E5DEC9] shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative">
                          <img
                            src={`/assets/lpc/thumbnails/${item.id}.png`}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>

                        {isSelected ? (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : !unlocked ? (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/75 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 shadow-xs">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{price}</span>
                          </div>
                        ) : null}

                        {!unlocked && (
                          <div className="mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1">
                            <span>🪙</span>
                            <span>購買解鎖</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 分類 8：配件 (Accessories - 支援多件同時穿戴) === */}
            {activeCategory === 'accessories' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#2E2925] flex items-center gap-2">
                    <span>👓</span>
                    挑選隨身配件 (可同時穿戴多件)
                  </h3>
                  <span className="text-xs text-[#786F66]">
                    已穿戴 {(currentConfig.accessories || []).length} 件
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {itemsForCategory.map((item) => {
                    const isEquipped = (currentConfig.accessories || []).includes(
                      item.id
                    );
                    const unlocked = isItemUnlocked(item);
                    const price = itemPricing.getPrice(item.id, item.price ?? 100);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick('accessories', item, true)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative group ${
                          isEquipped
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <div className="w-14 h-14 bg-[#F5EFE6] rounded-xl flex items-center justify-center p-1 border border-[#E5DEC9] shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative">
                          <img
                            src={`/assets/lpc/thumbnails/${item.id}.png`}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>

                        {!unlocked ? (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/75 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 shadow-xs">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{price}</span>
                          </div>
                        ) : null}

                        {/* 穿戴狀態指示按鈕 */}
                        {unlocked ? (
                          <div
                            className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isEquipped
                                ? 'bg-[#D97706] text-white border-[#D97706]'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            {isEquipped ? '已配戴 (點擊卸下)' : '未配戴 (點擊裝備)'}
                          </div>
                        ) : (
                          <div className="mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1">
                            <span>🪙</span>
                            <span>購買解鎖</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作工具列 (Action Footer) */}
        <div className="p-3.5 sm:p-4 bg-[#F0EBE1] border-t-2 border-[#E5DEC9] flex flex-wrap items-center justify-between gap-2.5">
          {/* 左側：重設角色 */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border-2 border-[#2E2925] text-xs font-bold text-[#5C5346] hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重設角色 (預設冒險者)</span>
          </button>

          {/* 右側：取消試穿 / 恢復原樣 + 儲存造型 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRevert}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border-2 border-[#2E2925] text-xs font-bold text-[#5C5346] hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              <RevertIcon className="w-3.5 h-3.5" />
              <span>取消試穿 (恢復造型)</span>
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl border-2 text-xs font-black transition-all shadow-md active:scale-95 ${
                saveSuccess
                  ? 'bg-[#10B981] text-white border-[#065F46]'
                  : 'bg-[#2E2925] text-white border-[#2E2925] hover:bg-[#433C36]'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>已成功儲存造型！</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>儲存造型</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
