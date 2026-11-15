import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Sparkles,
  RotateCcw,
  Sliders,
  Grid,
  Check,
  X,
  Target,
  Hash,
  Anchor,
  SquareDot
} from 'lucide-react';
import type { GameId, RoomCreationOptions } from '../../types';
import { sound } from '../../services/soundService';

interface RoomConfigModalProps {
  gameId: GameId;
  onClose: () => void;
  onConfirm: (options: RoomCreationOptions) => void;
  initialOptions?: RoomCreationOptions;
  confirmText?: string;
  subTitle?: string;
}

export const RoomConfigModal: React.FC<RoomConfigModalProps> = ({
  gameId,
  onClose,
  onConfirm,
  initialOptions,
  confirmText,
  subTitle
}) => {
  // Common
  const [maxPlayers, setMaxPlayers] = useState<number>(initialOptions?.maxPlayers || 2);

  // 1A2B Options
  const [hintEnabled, setHintEnabled] = useState<boolean>(initialOptions?.hintEnabled ?? true);
  const [hintRound, setHintRound] = useState<number>(initialOptions?.hintRound || 5);
  const [maxRounds, setMaxRounds] = useState<number>(initialOptions?.maxRounds || 0); // 0 = unlimited

  // Bingo Options
  const [targetLines, setTargetLines] = useState<number>(initialOptions?.targetLines || 5);

  // Battleship Options
  const [gridSize, setGridSize] = useState<number>(initialOptions?.gridSize || 8);

  // Dots Options
  const [dotsGridSize, setDotsGridSize] = useState<number>(initialOptions?.dotsGridSize || 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const finalMaxPlayers =
      gameId === '1a2b'
        ? 2
        : gameId === 'battleship'
        ? 2
        : gameId === 'ooxx'
        ? 2
        : gameId === 'dots'
        ? Math.min(3, maxPlayers)
        : Math.min(5, maxPlayers); // Bingo up to 5

    onConfirm({
      maxPlayers: finalMaxPlayers,
      hintEnabled,
      hintRound,
      maxRounds,
      targetLines,
      gridSize,
      dotsGridSize
    });
  };

  const gameInfoMap: Record<GameId, { title: string; icon: React.ElementType }> = {
    '1a2b': { title: '1A2B 數字密碼戰', icon: Hash },
    'battleship': { title: '海戰棋 艦隊對決', icon: Anchor },
    'bingo': { title: '賓果 5x5 連線', icon: Grid },
    'dots': { title: '點線棋 圍地方格', icon: SquareDot },
    'ooxx': { title: '經典 OOXX', icon: Sliders }
  };

  const info = gameInfoMap[gameId];
  const GameIcon = info.icon;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-[#FAF8F5] border-2 border-white/80 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#96897B]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#628395]/15 text-[#628395] flex items-center justify-center border border-[#628395]/20 shadow-xs">
              <GameIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2E2925] tracking-tight">{info.title}</h2>
              <p className="text-xs font-bold text-[#96897B]">{subTitle || '自訂房間遊玩規則與對弈參數'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-[#96897B] hover:text-[#2E2925] hover:bg-neutral-200/50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1A2B Configuration */}
          {gameId === '1a2b' && (
            <>
              {/* 遊玩人數 (固定雙人) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#2E2925] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#628395]" />
                    <span>遊玩人數</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#628395]">
                    2 人模式（雙人對決）
                  </span>
                </label>
                <div className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#628395]/30 text-xs font-extrabold text-[#2E2925] flex items-center justify-between shadow-2xs">
                  <span>1A2B 雙人密碼推理破譯對決</span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#628395]/15 text-[#628395] border border-[#628395]/20">
                    限定 2 人
                  </span>
                </div>
              </div>

              {/* 提示功能開關 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#2E2925] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#DBAD6A]" />
                  <span>提示功能開關</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setHintEnabled(true);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      hintEnabled
                        ? 'bg-[#DBAD6A] text-white border-[#DBAD6A] shadow-xs'
                        : 'bg-white text-[#2E2925] border-[#96897B]/30 hover:border-[#DBAD6A]'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${hintEnabled ? 'opacity-100' : 'opacity-0'}`} />
                    <span>開啟提示（推薦）</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setHintEnabled(false);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !hintEnabled
                        ? 'bg-[#2E2925] text-white border-[#2E2925] shadow-xs'
                        : 'bg-white text-[#2E2925] border-[#96897B]/30 hover:border-[#2E2925]'
                    }`}
                  >
                    <span>關閉提示（純硬核）</span>
                  </button>
                </div>
              </div>

              {/* 提示解鎖回合數 */}
              {hintEnabled && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-xs font-black text-[#2E2925] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#DBAD6A]" />
                      <span>提示在第幾回合出現</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#DBAD6A]">
                      目前設定：第 {hintRound} 回合解鎖
                    </span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 8, 10].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setHintRound(r);
                        }}
                        className={`py-2 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          hintRound === r
                            ? 'bg-[#DBAD6A] text-white border-[#DBAD6A] shadow-xs'
                            : 'bg-white text-[#2E2925] border-[#96897B]/30 hover:border-[#DBAD6A]'
                        }`}
                      >
                        第 {r} 回合
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 回合上限次數 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#2E2925] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-[#CF995F]" />
                    <span>猜題回合上限</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#CF995F]">
                    {maxRounds === 0 ? '無上限（直到猜出）' : `上限 ${maxRounds} 回合`}
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '無限制', val: 0 },
                    { label: '10 次', val: 10 },
                    { label: '15 次', val: 15 },
                    { label: '20 次', val: 20 }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setMaxRounds(item.val);
                      }}
                      className={`py-2 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        maxRounds === item.val
                          ? 'bg-[#CF995F] text-white border-[#CF995F] shadow-xs'
                          : 'bg-white text-[#2E2925] border-[#96897B]/30 hover:border-[#CF995F]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Bingo Configuration */}
          {gameId === 'bingo' && (
            <>
              {/* 遊玩人數 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#2E2925] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#DBAD6A]" />
                    <span>遊玩人數（多人連線派對，支援 2-5 人）</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#DBAD6A]">
                    {maxPlayers} 人連線
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { count: 2, label: '2 人', sub: '雙人對決' },
                    { count: 3, label: '3 人', sub: '三人派對' },
                    { count: 4, label: '4 人', sub: '四人混戰' },
                    { count: 5, label: '5 人', sub: '五人狂歡' }
                  ].map((item) => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setMaxPlayers(item.count);
                      }}
                      className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        maxPlayers === item.count
                          ? 'bg-[#DBAD6A] text-white border-[#DBAD6A] shadow-xs'
                          : 'bg-white text-[#2E2925] border-[#96897B]/30 hover:border-[#DBAD6A]'
                      }`}
                    >
                      <span className="font-mono font-black text-xs">{item.label}</span>
                      <span
                        className={`text-[10px] ${
                          maxPlayers === item.count ? 'text-white/80' : 'text-[#96897B]'
                        }`}
                      >
                        {item.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 幾條線獲勝 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#2E2925] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#DBAD6A]" />
                    <span>獲勝連線數</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#DBAD6A]">
                    率先達成 {targetLines} 條線獲勝
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lines) => (
                    <button
                      key={lines}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setTargetLines(lines);
                      }}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        targetLines === lines
                          ? 'bg-[#DBAD6A] text-white border-[#DBAD6A] shadow-xs'
                          : 'bg-white text-[#2E2925] border-[#96897B]/30 hover:border-[#DBAD6A]'
                      }`}
                    >
                      {lines} 條線
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Battleship Configuration */}
          {gameId === 'battleship' && (
            <div className="space-y-2">
              <label className="text-xs font-black text-[#2E2925] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-[#628395]" />
                  <span>海域地圖尺寸（幾x幾）</span>
                </span>
                <span className="text-[11px] font-bold text-[#628395]">
                  目前規格：{gridSize}x{gridSize}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { size: 6, label: '6x6 格', desc: '小型極速戰 (3 艦)' },
                  { size: 8, label: '8x8 格', desc: '標準海戰 (4 艦)' },
                  { size: 10, label: '10x10 格', desc: '大型艦隊戰 (5 艦)' }
                ].map((item) => (
                  <button
                    key={item.size}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setGridSize(item.size);
                    }}
                    className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      gridSize === item.size
                        ? 'bg-[#628395] text-white border-[#628395] shadow-sm'
                        : 'bg-white text-[#2E2925] border-[#96897B]/30 hover:border-[#628395]'
                    }`}
                  >
                    <span className="font-mono font-black text-sm">{item.label}</span>
                    <span className={`text-[10px] ${gridSize === item.size ? 'text-white/80' : 'text-[#96897B]'}`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dots and Boxes Configuration */}
          {gameId === 'dots' && (
            <>
              {/* 遊玩人數 (最多 3 人) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#2E2925] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#CF995F]" />
                    <span>遊玩人數（最多 3 人）</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#CF995F]">
                    {maxPlayers > 3 ? 3 : maxPlayers} 人爭奪
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { count: 2, label: '2 人', sub: '雙人圍地' },
                    { count: 3, label: '3 人', sub: '三方爭霸' }
                  ].map((item) => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setMaxPlayers(item.count);
                      }}
                      className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        (maxPlayers > 3 ? 3 : maxPlayers) === item.count
                          ? 'bg-[#CF995F] text-white border-[#CF995F] shadow-xs'
                          : 'bg-white text-[#2E2925] border-[#96897B]/30 hover:border-[#CF995F]'
                      }`}
                    >
                      <span className="font-mono font-black text-xs">{item.label}</span>
                      <span
                        className={`text-[10px] ${
                          (maxPlayers > 3 ? 3 : maxPlayers) === item.count ? 'text-white/80' : 'text-[#96897B]'
                        }`}
                      >
                        {item.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 棋盤規格 (幾x幾) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#2E2925] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <SquareDot className="w-3.5 h-3.5 text-[#CF995F]" />
                    <span>棋盤規格（幾x幾）</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#CF995F]">
                    {dotsGridSize}x{dotsGridSize} 格（共 {dotsGridSize * dotsGridSize} 方格）
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { size: 3, label: '3x3 格', sub: '9 方格 (快速)' },
                    { size: 4, label: '4x4 格', sub: '16 方格 (標準)' },
                    { size: 5, label: '5x5 格', sub: '25 方格 (進階)' },
                    { size: 6, label: '6x6 格', sub: '36 方格 (史詩)' }
                  ].map((item) => (
                    <button
                      key={item.size}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setDotsGridSize(item.size);
                      }}
                      className={`py-2.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        dotsGridSize === item.size
                          ? 'bg-[#CF995F] text-white border-[#CF995F] shadow-xs'
                          : 'bg-white text-[#2E2925] border-[#96897B]/30 hover:border-[#CF995F]'
                      }`}
                    >
                      <span className="font-mono font-black text-xs">{item.label}</span>
                      <span className={`text-[10px] ${dotsGridSize === item.size ? 'text-white/80' : 'text-[#96897B]'}`}>
                        {item.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#96897B]/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl border border-[#96897B]/30 bg-white text-[#2E2925] font-bold text-xs hover:bg-neutral-100 transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-black text-xs shadow-md shadow-[#628395]/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{confirmText || '確定創建房間'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
