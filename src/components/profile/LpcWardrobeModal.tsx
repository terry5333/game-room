import React, { useState } from 'react';
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
  Scissors
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
  const { lpcCharacter, updateLpcCharacter } = useAuth();

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

  // 當 Modal 開啟時同步目前配置
  React.useEffect(() => {
    if (isOpen) {
      const base = lpcCharacter || DEFAULT_LPC_CHARACTER;
      setInitialConfig(base);
      setCurrentConfig(base);
      setSaveSuccess(false);
    }
  }, [isOpen, lpcCharacter]);

  if (!isOpen) return null;

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

  // 切換單件穿戴
  const handleEquipItem = (category: WardrobeCategory, itemId: string) => {
    sound.playClick();
    setCurrentConfig((prev) => {
      if (category === 'top') return { ...prev, top: itemId };
      if (category === 'bottom') return { ...prev, bottom: itemId };
      if (category === 'shoes') return { ...prev, shoes: itemId };
      if (category === 'hat') return { ...prev, hat: itemId };
      if (category === 'hair') return { ...prev, hair: itemId };
      return prev;
    });
  };

  // 配件支援多穿戴/卸下
  const handleToggleAccessory = (accId: string) => {
    sound.playClick();
    setCurrentConfig((prev) => {
      const current = prev.accessories || [];
      const updated = current.includes(accId)
        ? current.filter((id) => id !== accId)
        : [...current, accId];
      return { ...prev, accessories: updated };
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
              {/* 背景格紋微裝飾 */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(#2E2925 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              />

              {/* LPC 像素畫布渲染 */}
              <div className="relative z-10 drop-shadow-lg">
                <LpcAvatarView
                  config={currentConfig}
                  size={64 * zoomScale}
                  scale={zoomScale}
                  direction={direction}
                  animate={isWalking}
                />
              </div>

              {/* 舞台光影地板裝飾 */}
              <div className="absolute bottom-4 w-28 h-6 bg-black/15 rounded-full blur-[2px] pointer-events-none" />

              {/* 當前朝向標籤 */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/80 border border-[#2E2925]/20 text-[10px] font-bold text-[#5C5346]">
                朝向：
                {direction === 'down'
                  ? '正面 ⬇️'
                  : direction === 'left'
                  ? '左側 ⬅️'
                  : direction === 'right'
                  ? '右側 ➡️'
                  : '背面 ⬆️'}
              </div>

              {/* 放大倍率標籤 */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/80 border border-[#2E2925]/20 text-[10px] font-bold text-[#5C5346]">
                {zoomScale}x
              </div>
            </div>

            {/* 控制台：旋轉視角、動作播放、放大倍率 */}
            <div className="w-full flex flex-col gap-2">
              {/* 四向旋轉與行走開關 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={rotateLeft}
                    className="p-2 rounded-xl bg-white border-2 border-[#2E2925] text-[#2E2925] hover:bg-[#FAF8F5] transition-all shadow-sm active:scale-95"
                    title="向左轉"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={rotateRight}
                    className="p-2 rounded-xl bg-white border-2 border-[#2E2925] text-[#2E2925] hover:bg-[#FAF8F5] transition-all shadow-sm active:scale-95"
                    title="向右轉"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                {/* 行走動畫開關 */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsWalking(!isWalking);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    isWalking
                      ? 'bg-[#10B981] text-white border-[#065F46] shadow-sm'
                      : 'bg-white text-[#2E2925] border-[#2E2925] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Footprints className="w-4 h-4" />
                  <span>{isWalking ? '動作中 (行走)' : '靜止 (站立)'}</span>
                </button>

                {/* 放大倍率切換 */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setZoomScale((prev) => (prev === 2 ? 3 : prev === 3 ? 4 : 2));
                  }}
                  className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-white border-2 border-[#2E2925] text-xs font-bold text-[#2E2925] hover:bg-[#FAF8F5]"
                  title="切換放大倍率"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>{zoomScale}x</span>
                </button>
              </div>

              {/* 當前穿搭摘要膠囊 */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-white/70 rounded-xl border border-[#E5DEC9] text-[11px] text-[#786F66]">
                <span className="font-bold text-[#2E2925]">穿戴中：</span>
                <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5DEC9]">
                  {currentConfig.gender === 'male' ? '男性' : '女性'}
                </span>
                <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5DEC9]">
                  {LPC_SKIN_PALETTES.find((p) => p.id === currentConfig.skinTone)?.name || '白皙'}
                </span>
                <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5DEC9]">
                  {LPC_HAIR_PALETTES.find((p) => p.id === currentConfig.hairColor)?.name || '棕髮'}
                </span>
                {currentConfig.accessories && currentConfig.accessories.length > 0 && (
                  <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5DEC9]">
                    飾品 x{currentConfig.accessories.length}
                  </span>
                )}
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
                      <span className="text-xl">👦</span>
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
                      <span className="text-xl">👧</span>
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
                    onClick={() => handleEquipItem('hair', 'none')}
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
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleEquipItem('hair', item.id)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <span className="text-2xl">💇</span>
                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
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
                    onClick={() => handleEquipItem('top', 'none')}
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
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleEquipItem('top', item.id)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <span className="text-2xl">👕</span>
                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
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
                    onClick={() => handleEquipItem('bottom', 'none')}
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
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleEquipItem('bottom', item.id)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <span className="text-2xl">👖</span>
                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
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
                  挑選鞋子靴具
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleEquipItem('shoes', 'none')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      currentConfig.shoes === 'none'
                        ? 'bg-amber-50 border-[#D97706] shadow-sm'
                        : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                    }`}
                  >
                    <span className="text-2xl">🦶</span>
                    <span className="text-xs font-bold text-[#2E2925]">
                      赤腳行走
                    </span>
                  </button>

                  {itemsForCategory.map((item) => {
                    const isSelected = currentConfig.shoes === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleEquipItem('shoes', item.id)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <span className="text-2xl">👞</span>
                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
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
                    onClick={() => handleEquipItem('hat', 'none')}
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
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleEquipItem('hat', item.id)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative ${
                          isSelected
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <span className="text-2xl">🧢</span>
                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 分類 8：配件 (Accessories - 支援多穿戴) === */}
            {activeCategory === 'accessories' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#2E2925] flex items-center gap-2">
                    <span>👓</span>
                    挑選眼鏡與腰帶飾品
                  </h3>
                  <span className="text-xs font-bold text-[#B45309] bg-amber-100 px-2 py-0.5 rounded-md">
                    支援多件同時穿戴
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {itemsForCategory.map((item) => {
                    const isEquipped = (currentConfig.accessories || []).includes(
                      item.id
                    );
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleToggleAccessory(item.id)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative ${
                          isEquipped
                            ? 'bg-amber-50 border-[#D97706] shadow-sm scale-101'
                            : 'bg-white border-[#E5DEC9] hover:border-[#2E2925]'
                        }`}
                      >
                        <span className="text-2xl">👓</span>
                        <span className="text-xs font-bold text-[#2E2925]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#786F66] line-clamp-1">
                          {item.description}
                        </span>
                        <div
                          className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isEquipped
                              ? 'bg-[#D97706] text-white border-[#D97706]'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          {isEquipped ? '已配戴 (點擊卸下)' : '未配戴'}
                        </div>
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
