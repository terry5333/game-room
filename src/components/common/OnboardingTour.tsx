import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Users2,
  Coins,
  ArrowRight,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../services/soundService';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const { completeTutorial } = useAuth();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '歡迎來到遊戲室！',
      icon: Gamepad2,
      content: '選擇 1A2B、海戰棋、5x5 賓果、點線棋或無限三子棋，一鍵開房或輸入 6 碼代碼與好友即時連線！'
    },
    {
      title: '好友與即時在線感測',
      icon: Users2,
      content: '右側邊欄可輸入朋友的 6 碼邀請碼加為好友，隨時查看在線燈號並直接發送戰帖！'
    },
    {
      title: '對戰金幣獎勵',
      icon: Coins,
      content: '勝方獨享 50 金幣，敗方亦獲 10 金幣安慰獎，快開始你的第一場對決吧！'
    }
  ];

  if (!isOpen) return null;

  const handleNext = () => {
    sound.playClick();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeTutorial();
      onClose();
    }
  };

  const handleSkip = () => {
    sound.playClick();
    completeTutorial();
    onClose();
  };

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-white/80 shadow-xl relative"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-[#628395]' : 'w-1.5 bg-[#96897B]/30'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleSkip}
            className="text-xs text-[#96897B] hover:text-[#2E2925] font-semibold"
          >
            跳過
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#628395] text-white flex items-center justify-center shadow-xs shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-base font-extrabold text-[#2E2925]">
            {current.title}
          </h3>
        </div>

        <p className="text-xs text-[#2E2925]/80 leading-relaxed font-medium mb-5">
          {current.content}
        </p>

        <button
          onClick={handleNext}
          className="w-full py-2.5 px-4 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{step === steps.length - 1 ? '開始遊玩' : '下一步'}</span>
          {step === steps.length - 1 ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5" />
          )}
        </button>
      </motion.div>
    </div>
  );
};
