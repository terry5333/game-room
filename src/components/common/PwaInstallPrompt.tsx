import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { sound } from '../../services/soundService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 2. Mobile detection (User Agent or screen width)
    const ua = navigator.userAgent || '';
    const isMobileDevice =
      /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      window.innerWidth <= 768;

    const isAppleDevice = /iPhone|iPad|iPod/i.test(ua) && !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    if (!isMobileDevice) {
      // Desktop: do not auto-prompt, but listen for beforeinstallprompt in case
      return;
    }

    // 3. Check dismissal cool-down (6 hours)
    const dismissedTime = localStorage.getItem('gameroom_pwa_dismissed_time');
    const now = Date.now();
    const coolDownMs = 6 * 60 * 60 * 1000; // 6 hours

    const shouldShow = !dismissedTime || now - parseInt(dismissedTime, 10) > coolDownMs;

    // 4. Capture native beforeinstallprompt (Android / Chromium)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (shouldShow) {
        // Small delay so user sees initial page load first
        setTimeout(() => setIsOpen(true), 1200);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If on iOS Safari or mobile device where beforeinstallprompt doesn't fire immediately
    if (shouldShow && isMobileDevice) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    // 5. Detect app installed event
    const handleAppInstalled = () => {
      setInstalled(true);
      setIsOpen(false);
      setShowIOSGuide(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Listen to manual install trigger from Header / Menu
  useEffect(() => {
    const handleTriggerManual = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-pwa-install', handleTriggerManual);
    return () => window.removeEventListener('open-pwa-install', handleTriggerManual);
  }, []);

  const handleDismiss = () => {
    sound.playClick();
    setIsOpen(false);
    setShowIOSGuide(false);
    localStorage.setItem('gameroom_pwa_dismissed_time', Date.now().toString());
  };

  const handleInstallClick = async () => {
    sound.playClick();

    if (deferredPrompt) {
      // Native Android / Chromium prompt
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        sound.playSuccess();
        setInstalled(true);
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS Safari guide
      setShowIOSGuide(true);
    } else {
      // Android browser without deferredPrompt (e.g. WebView or Firefox)
      alert('請點擊瀏覽器右上角選單【⋮】，選擇「安裝應用程式」或「新增至主畫面」即可完成安裝！');
      handleDismiss();
    }
  };

  if (installed || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end sm:justify-center items-center p-3 sm:p-4 bg-black/40 backdrop-blur-[2px]">
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="pointer-events-auto w-full max-w-md rounded-3xl bg-[#FAF8F5] border-3 border-[#8D5B4C] shadow-2xl overflow-hidden p-4 sm:p-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2B1E16] border-2 border-[#D4AF37] flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                <img
                  src="/icons/icon-192.png"
                  alt="遊戲室"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to SVG if PNG not yet cached
                    (e.target as HTMLImageElement).src = '/icons/icon.svg';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-base text-[#2E2925] tracking-tight">
                    安裝「遊戲室」App
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#8D5B4C] text-[10px] font-bold text-white">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-[#7A6B5D] font-medium">
                  將遊技室安裝到手機桌面，隨點即玩
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-full text-[#96897B] hover:text-[#2E2925] hover:bg-[#8D5B4C]/10 transition-colors cursor-pointer"
              title="稍後再說"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Benefits Bullet Points */}
          {!showIOSGuide ? (
            <>
              <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-2xl bg-[#F4E8D3]/60 border border-[#8D5B4C]/20 text-center">
                <div className="flex flex-col items-center">
                  <Smartphone className="w-4 h-4 text-[#8D5B4C] mb-1" />
                  <span className="text-[11px] font-black text-[#2E2925]">全螢幕無阻</span>
                  <span className="text-[9px] text-[#7A6B5D]">隱藏網址列</span>
                </div>
                <div className="flex flex-col items-center border-x border-[#8D5B4C]/20 px-1">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] mb-1" />
                  <span className="text-[11px] font-black text-[#2E2925]">秒開低延遲</span>
                  <span className="text-[9px] text-[#7A6B5D]">快取加速連線</span>
                </div>
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-[11px] font-black text-[#2E2925]">桌面一鍵進</span>
                  <span className="text-[9px] text-[#7A6B5D]">像原生App</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs text-[#7A6B5D] bg-[#EADBC8] hover:bg-[#DFCDB8] transition-colors cursor-pointer"
                >
                  稍後再說
                </button>

                <button
                  onClick={handleInstallClick}
                  className="flex-2 py-2.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-[#8D5B4C] to-[#6F4336] hover:brightness-110 shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>立即安裝到手機</span>
                </button>
              </div>
            </>
          ) : (
            /* iOS Specific Guidance */
            <div className="my-2 space-y-2.5">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="font-black flex items-center gap-1.5 text-amber-800">
                  <Share className="w-4 h-4 text-[#8D5B4C]" />
                  <span>iPhone / iPad 安裝步驟：</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#5D4037]">
                  <li>
                    點擊 Safari 瀏覽器底部的 <strong>「分享」按鈕</strong>（帶箭頭的方框）。
                  </li>
                  <li>
                    在跳出的選單中向下滑動，點選 <strong>「加入主畫面」</strong>（
                    <PlusSquare className="w-3.5 h-3.5 inline text-[#8D5B4C] mx-0.5" />）。
                  </li>
                  <li>點擊右上角的「新增」，即可在手機桌面找到「遊戲室」！</li>
                </ol>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-2xl font-black text-xs text-white bg-[#8D5B4C] hover:bg-[#6F4336] transition-colors cursor-pointer"
              >
                我知道了，已完成加入
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
