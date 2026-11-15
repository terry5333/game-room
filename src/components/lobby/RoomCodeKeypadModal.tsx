import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Hash,
  Delete,
  RotateCcw,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { sound } from '../../services/soundService';

interface RoomCodeKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoomCodeKeypadModal: React.FC<RoomCodeKeypadModalProps> = ({
  isOpen,
  onClose
}) => {
  const { joinRoomByCode } = useRoom();
  const [digits, setDigits] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setDigits('');
      setIsJoining(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleDigit = useCallback(
    (d: number) => {
      if (digits.length >= 6) return;
      sound.playPop();
      setErrorMessage(null);
      setDigits((prev) => prev + d.toString());
    },
    [digits.length]
  );

  const handleBackspace = useCallback(() => {
    sound.playClick();
    setErrorMessage(null);
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    sound.playClick();
    setErrorMessage(null);
    setDigits('');
  }, []);

  const handleJoin = useCallback(async () => {
    if (digits.length < 6 || isJoining) return;
    setIsJoining(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const success = await joinRoomByCode(digits);
      if (success) {
        sound.playJoin();
        onClose();
      } else {
        sound.playError();
        setErrorMessage('找不到該房號之房間，或房間已滿員！');
        setIsJoining(false);
      }
    } catch (err) {
      sound.playError();
      setErrorMessage('進房時發生異常，請稍後重試。');
      setIsJoining(false);
    }
  }, [digits, isJoining, joinRoomByCode, onClose]);

  // Desktop physical keyboard support: 0-9, Backspace, Escape, Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside another input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (digits.length === 6) {
          handleJoin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, digits.length, handleDigit, handleBackspace, handleJoin, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="relative w-full max-w-sm bg-[#FAF8F5] border-2 border-white/90 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#96897B]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#628395] text-white flex items-center justify-center shadow-xs">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2E2925]">輸入 6 位數房號</h3>
              <p className="text-[11px] text-[#96897B] font-medium">使用內建虛擬鍵盤或電腦鍵盤</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-neutral-200/60 text-[#96897B] hover:text-[#2E2925] transition-colors cursor-pointer"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 PIN Display Slots */}
        <div className="my-5 flex flex-col items-center gap-2">
          <div className="grid grid-cols-6 gap-2 w-full max-w-[280px]">
            {Array.from({ length: 6 }).map((_, idx) => {
              const char = digits[idx];
              const isCurrent = idx === digits.length;
              return (
                <div
                  key={idx}
                  className={`h-12 rounded-xl flex items-center justify-center text-xl font-mono font-black border transition-all ${
                    char
                      ? 'bg-white border-[#628395] text-[#628395] shadow-xs'
                      : isCurrent
                      ? 'bg-white/90 border-[#628395] ring-2 ring-[#628395]/30 text-[#2E2925]'
                      : 'bg-white/40 border-[#96897B]/25 text-[#96897B]/40'
                  }`}
                >
                  {char ? (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      {char}
                    </motion.span>
                  ) : isCurrent ? (
                    <span className="w-2 h-0.5 bg-[#628395] rounded-full animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#96897B]/30" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error notice if room join failed */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-2 text-center text-xs font-bold text-rose-600 flex items-center justify-center gap-1.5 bg-rose-50 border border-rose-200 py-1 px-3 rounded-xl w-full"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* In-Page Virtual Numeric Keypad (3x4 Grid) */}
        <div className="grid grid-cols-3 gap-2 mb-4 select-none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              key={num}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleDigit(num)}
              disabled={isJoining}
              className="h-12 rounded-2xl bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-[#96897B]/20 text-[#2E2925] font-mono text-xl font-bold shadow-2xs hover:shadow-xs transition-all flex items-center justify-center cursor-pointer"
            >
              {num}
            </motion.button>
          ))}

          {/* Clear Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.93 }}
            onClick={handleClear}
            disabled={isJoining || digits.length === 0}
            className="h-12 rounded-2xl bg-white/70 hover:bg-white text-xs font-bold text-[#96897B] hover:text-[#2E2925] border border-[#96897B]/20 disabled:opacity-40 transition-all flex items-center justify-center gap-1 cursor-pointer"
            title="全部清除"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>清除</span>
          </motion.button>

          {/* 0 Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleDigit(0)}
            disabled={isJoining}
            className="h-12 rounded-2xl bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-[#96897B]/20 text-[#2E2925] font-mono text-xl font-bold shadow-2xs hover:shadow-xs transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </motion.button>

          {/* Backspace Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.93 }}
            onClick={handleBackspace}
            disabled={isJoining || digits.length === 0}
            className="h-12 rounded-2xl bg-white/70 hover:bg-white text-[#96897B] hover:text-rose-600 border border-[#96897B]/20 disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer"
            title="倒退刪除"
          >
            <Delete className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Enter Room Action Button */}
        <motion.button
          type="button"
          whileHover={{ scale: digits.length === 6 && !isJoining ? 1.02 : 1 }}
          whileTap={{ scale: digits.length === 6 && !isJoining ? 0.97 : 1 }}
          onClick={handleJoin}
          disabled={digits.length < 6 || isJoining}
          className={`w-full py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
            digits.length === 6 && !isJoining
              ? 'bg-[#628395] hover:bg-[#526f7f] text-white shadow-[#628395]/25 ring-2 ring-[#628395]/40'
              : 'bg-neutral-200 text-[#96897B] border border-[#96897B]/20 cursor-not-allowed opacity-60'
          }`}
        >
          {isJoining ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>正在查詢連線房間中...</span>
            </>
          ) : (
            <>
              <span>進入房間</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};
