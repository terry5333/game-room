import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Sparkles, Trophy, RotateCcw, Zap, HelpCircle, Crosshair, Flame, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../services/soundService';

interface CasinoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CasinoTab = 'slot' | 'scratch' | 'dice' | 'roulette';

// ==========================================
// 1. SLOT MACHINE SYMBOLS & PAYOUTS
// ==========================================
interface SlotSymbol {
  id: string;
  char: string;
  name: string;
  weight: number; // probability weight
}

const SLOT_SYMBOLS: SlotSymbol[] = [
  { id: '7', char: '7️⃣', name: '大紅柒', weight: 2 },
  { id: 'crown', char: '👑', name: '帝國冠', weight: 3 },
  { id: 'diamond', char: '💎', name: '金剛石', weight: 6 },
  { id: 'bell', char: '🔔', name: '招財鐘', weight: 9 },
  { id: 'watermelon', char: '🍉', name: '昭和瓜', weight: 15 },
  { id: 'coin', char: '🪙', name: '帝國幣', weight: 22 },
  { id: 'cherry', char: '🍒', name: '紅櫻桃', weight: 14 }
];

const BET_OPTIONS = [5, 10, 20, 50, 100, 200];

// ==========================================
// 2. SCRATCH CARD TIERS
// ==========================================
interface ScratchTier {
  id: string;
  name: string;
  price: number;
  topPrize: number;
  desc: string;
  color: string;
}

const SCRATCH_TIERS: ScratchTier[] = [
  {
    id: 'fortune_20',
    name: '昭和小確幸・對對碰',
    price: 20,
    topPrize: 80,
    desc: '刮出 6 個金元寶，湊齊 3 個相同金額即中獎！',
    color: '#8D5B4C'
  },
  {
    id: 'gold_50',
    name: '帝國金元寶・幸運號',
    price: 50,
    topPrize: 180,
    desc: '刮出帝國幸運號，4 個號碼中任一對中即可獲得對應獎金！',
    color: '#B8860B'
  },
  {
    id: 'jackpot_100',
    name: '狀元及第・777 豪賭',
    price: 100,
    topPrize: 350,
    desc: '3x3 九宮格，只要出現 7️⃣ 或任意連成一線即爆頭獎！',
    color: '#A82323'
  }
];

export const CasinoModal: React.FC<CasinoModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCoins } = useAuth();
  const [activeTab, setActiveTab] = useState<CasinoTab>('slot');
  const [coinsNotice, setCoinsNotice] = useState<string | null>(null);

  // ------------------------------------------
  // SLOT MACHINE STATE
  // ------------------------------------------
  const [slotBet, setSlotBet] = useState<number>(10);
  const [slotReels, setSlotReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>([
    SLOT_SYMBOLS[0],
    SLOT_SYMBOLS[0],
    SLOT_SYMBOLS[0]
  ]);
  const [isSlotSpinning, setIsSlotSpinning] = useState(false);
  const [slotWinMessage, setSlotWinMessage] = useState<string | null>(null);
  const [slotWinAmount, setSlotWinAmount] = useState<number>(0);
  const [leverPulled, setLeverPulled] = useState(false);

  // ------------------------------------------
  // SCRATCH CARD STATE
  // ------------------------------------------
  const [selectedScratchTier, setSelectedScratchTier] = useState<ScratchTier>(SCRATCH_TIERS[0]);
  const [scratchCardActive, setScratchCardActive] = useState(false);
  const [scratchPrizes, setScratchPrizes] = useState<any>(null);
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const [scratchWinAmount, setScratchWinAmount] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScratchingRef = useRef<boolean>(false);

  // ------------------------------------------
  // DICE (SIC BO) STATE
  // ------------------------------------------
  const [diceBet, setDiceBet] = useState<number>(10);
  const [diceChoice, setDiceChoice] = useState<'big' | 'small' | 'odd' | 'even' | 'triple' | null>(null);
  const [diceResult, setDiceResult] = useState<[number, number, number]>([3, 4, 5]);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceMessage, setDiceMessage] = useState<string | null>(null);

  // ------------------------------------------
  // GLOBAL PROGRESSIVE JACKPOT (累積大獎池)
  // ------------------------------------------
  const [globalJackpot, setGlobalJackpot] = useState<number>(() => {
    const saved = localStorage.getItem('gameroom_casino_jackpot');
    return saved ? parseInt(saved, 10) : 13880;
  });

  const contributeJackpot = (betAmt: number) => {
    const delta = Math.max(1, Math.round(betAmt * 0.03));
    setGlobalJackpot((prev) => {
      const next = prev + delta;
      localStorage.setItem('gameroom_casino_jackpot', next.toString());
      return next;
    });
  };

  // ------------------------------------------
  // 4. RUSSIAN ROULETTE (俄羅斯輪盤) STATE
  // ------------------------------------------
  const ROULETTE_MULTIPLIERS = [1.5, 2.5, 4.5, 9.0, 20.0];
  const [rouletteBet, setRouletteBet] = useState<number>(10);
  const [rouletteRound, setRouletteRound] = useState<number>(1);
  const [bulletChamber, setBulletChamber] = useState<number>(1);
  const [currentChamber, setCurrentChamber] = useState<number>(1);
  const [firedChambers, setFiredChambers] = useState<number[]>([]);
  const [isRevolverSpinning, setIsRevolverSpinning] = useState(false);
  const [rouletteState, setRouletteState] = useState<'ready' | 'survived' | 'dead' | 'cashed'>('ready');
  const [rouletteMessage, setRouletteMessage] = useState<string | null>(null);

  const handlePullTrigger = async () => {
    if (isRevolverSpinning) return;

    const chamberToFire = rouletteState === 'survived' ? currentChamber + 1 : 1;
    const roundNow = rouletteState === 'survived' ? rouletteRound + 1 : 1;

    // Start fresh game if ready/dead/cashed
    if (rouletteState === 'ready' || rouletteState === 'dead' || rouletteState === 'cashed') {
      if (currentCoins < rouletteBet) {
        sound.playError();
        showToast('持有金幣不足以進行本輪挑戰！');
        return;
      }

      await updateCoins(-rouletteBet, 'casino_bet', `俄羅斯輪盤下注 🪙${rouletteBet}`);
      contributeJackpot(rouletteBet);

      const targetBullet = Math.floor(Math.random() * 6) + 1;
      setBulletChamber(targetBullet);
      setCurrentChamber(1);
      setFiredChambers([]);
      setRouletteRound(1);
      setRouletteMessage(null);
    }

    setIsRevolverSpinning(true);
    sound.playRevolverSpin();

    setTimeout(async () => {
      setIsRevolverSpinning(false);

      setCurrentChamber(chamberToFire);
      setFiredChambers((prev) => [...prev, chamberToFire]);

      if (chamberToFire === bulletChamber) {
        sound.playGunshot();
        setRouletteState('dead');
        setRouletteMessage(`💥 槍響中彈！在第 ${roundNow} 輪（第 ${chamberToFire} 號彈巢）擊發！遺憾出局！`);
      } else {
        sound.playDryFire();
        if (roundNow === 5) {
          const jackpotBonus = Math.floor(globalJackpot * 0.3);
          const totalWin = rouletteBet * 20 + jackpotBonus;
          sound.playJackpot();
          setRouletteState('cashed');
          setRouletteMessage(`🏆 傳奇誕生！極限生還 5 輪！狂攬 20 倍 + 瓜分獎池 30% 🪙 +${totalWin}！`);
          await updateCoins(totalWin, 'casino_win', `俄羅斯輪盤極限生還 🪙+${totalWin}`);
          setGlobalJackpot((prev) => {
            const next = Math.max(5000, prev - jackpotBonus);
            localStorage.setItem('gameroom_casino_jackpot', next.toString());
            return next;
          });
        } else {
          setRouletteState('survived');
          setRouletteRound(roundNow);
          const currentWin = Math.floor(rouletteBet * ROULETTE_MULTIPLIERS[roundNow - 1]);
          setRouletteMessage(`💨 喀嚓！第 ${roundNow} 輪安全！當前獲利 🪙 ${currentWin}（${ROULETTE_MULTIPLIERS[roundNow - 1]}x）！`);
        }
      }
    }, 850);
  };

  const handleCashOutRoulette = async () => {
    if (rouletteState !== 'survived') return;
    const mult = ROULETTE_MULTIPLIERS[rouletteRound - 1] || 1;
    const winnings = Math.floor(rouletteBet * mult);
    sound.playSlotWin();
    setRouletteState('cashed');
    setRouletteMessage(`💰 見好就收！成功帶走 🪙 +${winnings} 金幣！`);
    await updateCoins(winnings, 'casino_win', `俄羅斯輪盤見好就收 🪙+${winnings}`);
  };

  if (!isOpen || !currentUser) return null;

  const currentCoins = currentUser.coins ?? 0;

  const showToast = (msg: string) => {
    setCoinsNotice(msg);
    setTimeout(() => setCoinsNotice(null), 3000);
  };

  // Helper to pick random weighted symbol
  const getRandomSymbol = (): SlotSymbol => {
    const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let r = Math.random() * totalWeight;
    for (const sym of SLOT_SYMBOLS) {
      if (r < sym.weight) return sym;
      r -= sym.weight;
    }
    return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
  };

  // ------------------------------------------
  // 1. SLOT MACHINE SPIN LOGIC
  // ------------------------------------------
  const handleSpinSlot = async () => {
    if (isSlotSpinning) return;
    if (currentCoins < slotBet) {
      sound.playError();
      showToast('金幣不足，請調整下注額或前往對戰贏取金幣！');
      return;
    }

    // Pull mechanical lever animation
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 400);

    setIsSlotSpinning(true);
    setSlotWinMessage(null);
    setSlotWinAmount(0);

    // Deduct bet immediately
    await updateCoins(-slotBet, 'casino_bet', `拉霸機下注 🪙${slotBet}`);
    contributeJackpot(slotBet);

    // Spin reel ticking audio
    sound.playClick();
    const spinAudioInterval = setInterval(() => {
      sound.playSlotSpin();
    }, 120);

    // Pick winning targets
    const target1 = getRandomSymbol();
    const target2 = getRandomSymbol();
    const target3 = getRandomSymbol();

    // Fast-cycle symbols visually
    const cycleInterval = setInterval(() => {
      setSlotReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      ]);
    }, 80);

    // Reel 1 stop
    setTimeout(() => {
      sound.playSlotStop();
      setSlotReels((prev) => [target1, prev[1], prev[2]]);
    }, 900);

    // Reel 2 stop
    setTimeout(() => {
      sound.playSlotStop();
      setSlotReels((prev) => [target1, target2, prev[2]]);
    }, 1500);

    // Reel 3 stop & resolve
    setTimeout(async () => {
      clearInterval(spinAudioInterval);
      clearInterval(cycleInterval);
      sound.playSlotStop();
      setSlotReels([target1, target2, target3]);

      // Calculate payout
      let multiplier = 0;
      let winDesc = '';

      if (target1.id === target2.id && target2.id === target3.id) {
        // Triple Match
        if (target1.id === '7') {
          multiplier = 15;
          winDesc = '👑 昭和特獎 777 爆擊！獲得 15 倍！';
        } else if (target1.id === 'crown') {
          multiplier = 10;
          winDesc = '👑 帝國黃金冠連線！獲得 10 倍！';
        } else if (target1.id === 'diamond') {
          multiplier = 7;
          winDesc = '💎 璀璨鑽石連線！獲得 7 倍！';
        } else if (target1.id === 'bell') {
          multiplier = 5;
          winDesc = '🔔 招財金鐘連線！獲得 5 倍！';
        } else if (target1.id === 'watermelon') {
          multiplier = 3;
          winDesc = '🍉 昭和西瓜連線！獲得 3 倍！';
        } else if (target1.id === 'coin') {
          multiplier = 2;
          winDesc = '🪙 帝國金幣連線！獲得 2 倍！';
        } else if (target1.id === 'cherry') {
          multiplier = 1.5;
          winDesc = '🍒 三顆紅櫻桃！獲得 1.5 倍！';
        }
      } else {
        // Partial Cherry rules (Only 2 cherries gives return, 1 cherry is miss)
        const cherryCount = [target1.id, target2.id, target3.id].filter((id) => id === 'cherry').length;
        if (cherryCount === 2) {
          multiplier = 1;
          winDesc = '🍒 雙櫻桃保本！返還本金！';
        }
      }

      const winnings = Math.floor(slotBet * multiplier);

      if (winnings > 0) {
        if (multiplier >= 10) {
          sound.playJackpot();
        } else {
          sound.playSlotWin();
        }
        setSlotWinAmount(winnings);
        setSlotWinMessage(`${winDesc} 獲得 🪙 +${winnings}！`);
        await updateCoins(winnings, 'casino_win', `拉霸機中獎 🪙+${winnings}`);
      } else {
        setSlotWinMessage('差一點點就連線了，再試一手手氣！');
      }

      setIsSlotSpinning(false);
    }, 2100);
  };

  // ------------------------------------------
  // 2. SCRATCH CARD PURCHASE & GENERATION
  // ------------------------------------------
  const handleBuyScratchTicket = async (tier: ScratchTier) => {
    if (scratchCardActive && !scratchRevealed) {
      if (!window.confirm('目前這張刮刮樂尚未刮完，確定要購買新刮刮樂嗎？')) return;
    }
    if (currentCoins < tier.price) {
      sound.playError();
      showToast('金幣不足以購買此刮刮樂！');
      return;
    }

    sound.playClick();
    setSelectedScratchTier(tier);
    setScratchRevealed(false);
    setScratchWinAmount(0);

    // Deduct ticket cost
    await updateCoins(-tier.price, 'casino_bet', `購買【${tier.name}】刮刮樂`);
    contributeJackpot(tier.price);

    // Generate random prizes based on tier (drastically lower win rate & lower prize amounts)
    if (tier.id === 'fortune_20') {
      // Tier 1: 6 values, match 3 to win
      const pool = [5, 10, 15, 20, 25, 40, 80];
      const win = Math.random() < 0.18; // 18% win rate (down from 38%)
      let items: number[] = [];
      if (win) {
        const prizeOptions = [10, 15, 20, 25, 40, 80];
        const winPrize = prizeOptions[Math.floor(Math.random() * prizeOptions.length)];
        items = [winPrize, winPrize, winPrize];
        while (items.length < 6) {
          const filler = pool[Math.floor(Math.random() * pool.length)];
          if (items.filter((x) => x === filler).length < 2) {
            items.push(filler);
          }
        }
      } else {
        items = [5, 10, 15, 20, 40, 80];
      }
      // Shuffle
      items.sort(() => Math.random() - 0.5);
      setScratchPrizes({ type: 'match3', items });
    } else if (tier.id === 'gold_50') {
      // Tier 2: 1 Lucky number, 4 Player numbers
      const lucky = Math.floor(Math.random() * 20) + 1;
      const win = Math.random() < 0.16; // 16% win rate (down from 40%)
      const nums: { num: number; prize: number; match: boolean }[] = [];
      const prizePool = [20, 30, 50, 75, 100, 180];

      let winInserted = false;
      for (let i = 0; i < 4; i++) {
        const isMatch = win && !winInserted && (i === 1 || Math.random() < 0.3);
        if (isMatch) winInserted = true;
        const prize = prizePool[Math.floor(Math.random() * prizePool.length)];
        nums.push({
          num: isMatch ? lucky : (lucky + i + 1 + Math.floor(Math.random() * 5)) % 25 + 1,
          prize,
          match: isMatch
        });
      }
      setScratchPrizes({ type: 'luckyNum', lucky, nums });
    } else {
      // Tier 3: 3x3 grid
      const symbols = ['7️⃣', '🪙', '👑', '💎', '🔔'];
      const win = Math.random() < 0.12; // 12% win rate (down from 42%)
      const grid: string[] = [];
      if (win) {
        // Guaranteed 7
        for (let i = 0; i < 9; i++) {
          grid.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
        grid[Math.floor(Math.random() * 9)] = '7️⃣';
      } else {
        // No 7s
        for (let i = 0; i < 9; i++) {
          grid.push(symbols[Math.floor(Math.random() * (symbols.length - 1)) + 1]);
        }
      }
      setScratchPrizes({ type: 'grid', grid });
    }

    setScratchCardActive(true);

    // Initialize Canvas foil coating
    setTimeout(() => {
      initScratchCanvas();
    }, 50);
  };

  // Paint silver/gold foil coating on HTML5 Canvas
  const initScratchCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Metallic foil gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#D4AF37');
    grad.addColorStop(0.3, '#FDF6C7');
    grad.addColorStop(0.5, '#C5A028');
    grad.addColorStop(0.7, '#FDF6C7');
    grad.addColorStop(1, '#997300');

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle pattern stamp
    ctx.fillStyle = 'rgba(74, 43, 24, 0.25)';
    ctx.font = 'bold 15px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ 帝國金箔・刮開見喜 ★', width / 2, height / 2 - 12);
    ctx.font = '12px sans-serif';
    ctx.fillText('（以滑鼠或手指刮開）', width / 2, height / 2 + 12);

    // Decorative border line
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);
  };

  // Scratch interaction (destination-out)
  const scratch = (clientX: number, clientY: number) => {
    if (!canvasRef.current || scratchRevealed) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    sound.playScratch();

    // Check completion threshold
    checkScratchProgress();
  };

  const checkScratchProgress = () => {
    if (scratchRevealed || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let clearPixels = 0;
      const totalPixels = data.length / 4;
      // Sample every 16th pixel for high efficiency
      for (let i = 3; i < data.length; i += 64) {
        if (data[i] === 0) clearPixels++;
      }

      const ratio = clearPixels / (totalPixels / 16);
      if (ratio > 0.52) {
        // Auto clear full card
        handleFullReveal();
      }
    } catch {}
  };

  // One-click instant scratch / full reveal
  const handleFullReveal = async () => {
    if (scratchRevealed || !scratchPrizes) return;
    setScratchRevealed(true);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Evaluate win & award prize
    let totalWin = 0;
    if (scratchPrizes.type === 'match3') {
      const counts: Record<number, number> = {};
      for (const val of scratchPrizes.items) {
        counts[val] = (counts[val] || 0) + 1;
        if (counts[val] === 3) {
          totalWin = val;
          break;
        }
      }
    } else if (scratchPrizes.type === 'luckyNum') {
      for (const item of scratchPrizes.nums) {
        if (item.match) {
          totalWin += item.prize;
        }
      }
    } else if (scratchPrizes.type === 'grid') {
      const hasSeven = scratchPrizes.grid.includes('7️⃣');
      if (hasSeven) {
        totalWin = selectedScratchTier.topPrize;
      }
    }

    setScratchWinAmount(totalWin);
    if (totalWin > 0) {
      if (totalWin >= 180) {
        sound.playJackpot();
      } else {
        sound.playSlotWin();
      }
      await updateCoins(totalWin, 'casino_win', `刮刮樂中獎 🪙+${totalWin}`);
    } else {
      sound.playClick();
    }
  };

  // ------------------------------------------
  // 3. DICE (SIC BO) ROLL LOGIC
  // ------------------------------------------
  const handleRollDice = async () => {
    if (isDiceRolling) return;
    if (!diceChoice) {
      sound.playError();
      showToast('請先選擇要下注的盤口（大、小、單、雙、豹子）！');
      return;
    }
    if (currentCoins < diceBet) {
      sound.playError();
      showToast('持有的帝國金幣不足！');
      return;
    }

    setIsDiceRolling(true);
    setDiceMessage(null);

    // Deduct bet
    await updateCoins(-diceBet, 'casino_bet', `骰寶下注 🪙${diceBet}`);
    contributeJackpot(diceBet);

    // Dice cup shake audio
    sound.playDiceShake();

    // Roll random dice
    setTimeout(async () => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const d3 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2 + d3;
      const isTriple = d1 === d2 && d2 === d3;

      setDiceResult([d1, d2, d3]);
      setIsDiceRolling(false);

      let isWin = false;
      let multiplier = 0;

      if (diceChoice === 'triple') {
        if (isTriple) {
          isWin = true;
          multiplier = 10; // 10x (was 24x)
        }
      } else if (!isTriple) {
        if (diceChoice === 'big' && total >= 11 && total <= 17) {
          isWin = true;
          multiplier = 2;
        } else if (diceChoice === 'small' && total >= 4 && total <= 10) {
          isWin = true;
          multiplier = 2;
        } else if (diceChoice === 'odd' && total % 2 === 1) {
          isWin = true;
          multiplier = 2;
        } else if (diceChoice === 'even' && total % 2 === 0) {
          isWin = true;
          multiplier = 2;
        }
      }

      if (isWin) {
        const winCoins = diceBet * multiplier;
        if (multiplier >= 20) {
          sound.playJackpot();
        } else {
          sound.playSlotWin();
        }
        setDiceMessage(`🎉 開出【${d1}, ${d2}, ${d3}】點（總合 ${total}）！下注獲勝，贏得 🪙+${winCoins}！`);
        await updateCoins(winCoins, 'casino_win', `骰寶獲勝 🪙+${winCoins}`);
      } else {
        sound.playError();
        setDiceMessage(
          isTriple
            ? `⚠️ 開出【${d1}, ${d2}, ${d3}】全圍豹子！通殺大小單雙！`
            : `開出【${d1}, ${d2}, ${d3}】點（總合 ${total}），差一點就猜中了，下把定能翻盤！`
        );
      }
    }, 1100);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 14 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-4xl bg-[#231710] border-4 border-double border-[#D4AF37] rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-[#FFE8D6]"
          style={{
            backgroundImage:
              'radial-gradient(#4A2B18 1px, transparent 1px), linear-gradient(to bottom, #231710, #140D0A)',
            backgroundSize: '16px 16px, 100% 100%'
          }}
        >
          {/* Top Marquee Header */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#D4AF37]/40 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-[#231710] flex items-center justify-center shadow-lg font-black text-xl">
                🎰
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-[#FDF6C7] tracking-wider font-serif">
                    帝國地下遊技場
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#A82323] text-white text-[10px] font-black tracking-wider animate-pulse">
                    777 博弈大廳
                  </span>
                </div>
                <p className="text-[11px] text-[#C5A028] font-bold">
                  昭和復古拉霸機・黃金刮刮樂・地下骰寶
                </p>
              </div>
            </div>

            {/* Current Balance Chip & Close Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-[#D4AF37]/60 text-[#FDF6C7] font-mono font-black text-sm shadow-inner">
                <Coins className="w-4 h-4 text-[#D4AF37]" />
                <span>{currentCoins.toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FFE8D6] transition-colors cursor-pointer"
                title="離開遊技場"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {coinsNotice && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-[#A82323] text-white text-xs font-bold text-center shadow-md animate-fade-in">
              {coinsNotice}
            </div>
          )}

          {/* Progressive Global Jackpot Banner */}
          <div className="relative mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-[#20120B] via-[#3D2314] to-[#20120B] border-2 border-[#D4AF37] shadow-xl flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-2.5 z-10">
              <span className="text-2xl animate-bounce">👑</span>
              <div>
                <div className="text-[10px] font-black text-[#FFD700] tracking-widest uppercase flex items-center gap-1.5">
                  <span>IMPERIAL GRAND JACKPOT</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#A82323] text-white text-[9px] font-black">
                    帝國累積大獎池
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-[#FDF6C7] tracking-wider drop-shadow-md">
                  🪙 {globalJackpot.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-right z-10">
              <div className="text-[10px] text-[#D4AF37] font-bold">每局注額 3% 自動累加</div>
              <div className="text-[10px] text-amber-200 font-extrabold">輪盤通關第5輪／拉霸特獎即瓜分！</div>
            </div>
          </div>

          {/* Navigation Tabs (4 Games: Slots, Scratch, Dice, Roulette) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-black/40 border border-[#D4AF37]/30 mb-4 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('slot');
              }}
              className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'slot'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#231710] shadow-md'
                  : 'text-[#C5A028] hover:bg-white/5'
              }`}
            >
              <span>🎰</span>
              <span>幸運拉霸</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('scratch');
              }}
              className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'scratch'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#231710] shadow-md'
                  : 'text-[#C5A028] hover:bg-white/5'
              }`}
            >
              <span>🎫</span>
              <span>黃金刮刮樂</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('dice');
              }}
              className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'dice'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#231710] shadow-md'
                  : 'text-[#C5A028] hover:bg-white/5'
              }`}
            >
              <span>🎲</span>
              <span>地下骰寶</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('roulette');
              }}
              className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'roulette'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#231710] shadow-md'
                  : 'text-[#C5A028] hover:bg-white/5'
              }`}
            >
              <span>🎯</span>
              <span>俄羅斯輪盤</span>
            </button>
          </div>

          {/* ========================================================
              TAB 1: 🎰 幸運拉霸機 (SLOT MACHINE)
              ======================================================== */}
          {activeTab === 'slot' && (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
              {/* Slot Machine Vintage Cabinet */}
              <div className="relative p-4 sm:p-6 rounded-3xl bg-[#1A100B] border-3 border-[#D4AF37] shadow-2xl flex flex-col items-center">
                {/* Cabinet Header Neon Lights */}
                <div className="w-full flex items-center justify-between px-4 py-1.5 rounded-full bg-black/60 border border-[#D4AF37]/50 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping" />
                    <span className="text-[11px] font-black text-[#FDF6C7] tracking-widest">
                      SHOWA IMPERIAL SLOTS
                    </span>
                  </div>
                  <div className="text-[11px] font-black text-[#FFD700]">
                    ★ 頭獎 777 賠率 15x ★
                  </div>
                </div>

                {/* 3 Reel Windows & Mechanical Lever */}
                <div className="w-full flex items-center justify-center gap-3 sm:gap-6 relative">
                  {/* Reel 1 */}
                  <div className="w-24 sm:w-32 h-32 sm:h-40 rounded-2xl bg-gradient-to-b from-[#2E2018] via-white to-[#2E2018] p-1.5 shadow-2xl border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden relative">
                    <div className="w-full h-full rounded-xl bg-[#FFF9E6] flex flex-col items-center justify-center shadow-inner">
                      <span
                        className={`text-5xl sm:text-6xl transition-transform ${
                          isSlotSpinning ? 'animate-bounce blur-[1px]' : ''
                        }`}
                      >
                        {slotReels[0].char}
                      </span>
                      <span className="text-[10px] font-black text-[#5D3A1A] mt-1">
                        {slotReels[0].name}
                      </span>
                    </div>
                  </div>

                  {/* Reel 2 */}
                  <div className="w-24 sm:w-32 h-32 sm:h-40 rounded-2xl bg-gradient-to-b from-[#2E2018] via-white to-[#2E2018] p-1.5 shadow-2xl border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden relative">
                    <div className="w-full h-full rounded-xl bg-[#FFF9E6] flex flex-col items-center justify-center shadow-inner">
                      <span
                        className={`text-5xl sm:text-6xl transition-transform ${
                          isSlotSpinning ? 'animate-bounce blur-[1px]' : ''
                        }`}
                      >
                        {slotReels[1].char}
                      </span>
                      <span className="text-[10px] font-black text-[#5D3A1A] mt-1">
                        {slotReels[1].name}
                      </span>
                    </div>
                  </div>

                  {/* Reel 3 */}
                  <div className="w-24 sm:w-32 h-32 sm:h-40 rounded-2xl bg-gradient-to-b from-[#2E2018] via-white to-[#2E2018] p-1.5 shadow-2xl border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden relative">
                    <div className="w-full h-full rounded-xl bg-[#FFF9E6] flex flex-col items-center justify-center shadow-inner">
                      <span
                        className={`text-5xl sm:text-6xl transition-transform ${
                          isSlotSpinning ? 'animate-bounce blur-[1px]' : ''
                        }`}
                      >
                        {slotReels[2].char}
                      </span>
                      <span className="text-[10px] font-black text-[#5D3A1A] mt-1">
                        {slotReels[2].name}
                      </span>
                    </div>
                  </div>

                  {/* Right Side Pull Lever */}
                  <div
                    onClick={handleSpinSlot}
                    className="hidden sm:flex flex-col items-center ml-2 cursor-pointer group"
                    title="拉動搖桿旋轉！"
                  >
                    <div
                      className={`w-4 h-24 bg-gradient-to-r from-neutral-400 to-neutral-200 rounded-full border border-neutral-600 transition-transform origin-bottom duration-300 ${
                        leverPulled ? 'rotate-45 scale-y-75' : 'group-hover:rotate-6'
                      }`}
                    />
                    <div className="w-9 h-9 rounded-full bg-[#A82323] border-2 border-white shadow-lg -mt-2 group-hover:scale-110 transition-transform" />
                  </div>
                </div>

                {/* Win / Feedback Announcement Banner */}
                <div className="w-full mt-4 min-h-[38px] flex items-center justify-center">
                  {slotWinMessage ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`px-4 py-1.5 rounded-xl text-center font-black text-xs sm:text-sm shadow-md ${
                        slotWinAmount > 0
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#231710] animate-pulse'
                          : 'bg-black/50 text-[#C5A028]'
                      }`}
                    >
                      {slotWinMessage}
                    </motion.div>
                  ) : (
                    <span className="text-xs text-[#A8884A] font-bold">
                      請選擇下注代幣量，點擊「拉動搖桿」開始！
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Controls: Bet Chips & Spin Button */}
              <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Bet Selectors */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[#C5A028]">下注額：</span>
                  {BET_OPTIONS.map((amt) => (
                    <button
                      key={amt}
                      disabled={isSlotSpinning}
                      onClick={() => {
                        sound.playClick();
                        setSlotBet(amt);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        slotBet === amt
                          ? 'bg-[#D4AF37] text-[#231710] shadow-md scale-105'
                          : 'bg-black/50 text-[#FFE8D6] hover:bg-white/10'
                      }`}
                    >
                      🪙 {amt}
                    </button>
                  ))}
                  <button
                    disabled={isSlotSpinning}
                    onClick={() => {
                      sound.playClick();
                      const maxAffordable = Math.min(500, Math.max(5, currentCoins));
                      setSlotBet(maxAffordable);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-[#A82323] hover:bg-[#831818] text-white transition-colors cursor-pointer"
                  >
                    MAX
                  </button>
                </div>

                {/* Spin Action Button */}
                <button
                  disabled={isSlotSpinning || currentCoins < slotBet}
                  onClick={handleSpinSlot}
                  className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                    isSlotSpinning
                      ? 'bg-neutral-600 text-neutral-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#B8860B] hover:brightness-110 text-[#231710] active:scale-95'
                  }`}
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>{isSlotSpinning ? '旋轉中...' : `拉動搖桿 (🪙 ${slotBet})`}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: 🎫 黃金刮刮樂 (SCRATCH CARD)
              ======================================================== */}
          {activeTab === 'scratch' && (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
              {/* Ticket Tier Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                {SCRATCH_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => handleBuyScratchTicket(tier)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedScratchTier.id === tier.id && scratchCardActive
                        ? 'bg-[#2E1F16] border-[#D4AF37] shadow-lg scale-[1.02]'
                        : 'bg-black/40 border-[#D4AF37]/30 hover:border-[#D4AF37]/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-black text-[#FDF6C7]">
                        <span>{tier.name}</span>
                        <span className="text-[#D4AF37]">🪙 {tier.price}</span>
                      </div>
                      <p className="text-[10px] text-[#C5A028] mt-1 leading-relaxed">
                        {tier.desc}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-neutral-400">頭獎：🪙 {tier.topPrize}</span>
                      <button className="px-2.5 py-1 rounded-lg bg-[#D4AF37] text-[#231710] font-black text-[10px]">
                        購買此張
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Scratch Ticket Stage */}
              {scratchCardActive && scratchPrizes ? (
                <div className="relative p-4 rounded-3xl bg-[#1A100B] border-2 border-[#D4AF37] shadow-xl flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-xs font-black text-[#FDF6C7] mb-2 px-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                      【{selectedScratchTier.name}】
                    </span>
                    <span className="text-[#C5A028]">
                      最高獎金：🪙 {selectedScratchTier.topPrize}
                    </span>
                  </div>

                  {/* Interactive Scratch Area */}
                  <div className="relative w-full max-w-md h-48 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/80 bg-[#FFFDF2] select-none">
                    {/* Underlying Content (Prizes Revealed Underneath) */}
                    <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-[#231710]">
                      {scratchPrizes.type === 'match3' && (
                        <div>
                          <div className="text-[11px] font-black text-[#8D5B4C] text-center mb-2">
                            湊齊 3 個相同金額即中獎！
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            {scratchPrizes.items.map((val: number, idx: number) => (
                              <div
                                key={idx}
                                className="w-20 sm:w-24 py-2 sm:py-2.5 rounded-xl bg-[#FAF0D9] border-2 border-[#D4AF37] text-center font-black text-xs sm:text-sm text-[#5D3A1A] shadow-xs flex flex-col items-center"
                              >
                                <span>🪙</span>
                                <span>{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {scratchPrizes.type === 'luckyNum' && (
                        <div className="w-full">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-[#8D5B4C]">帝國幸運號：</span>
                            <span className="w-8 h-8 rounded-full bg-[#A82323] text-white flex items-center justify-center font-black text-sm shadow-xs">
                              {scratchPrizes.lucky}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {scratchPrizes.nums.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className={`p-2 rounded-xl text-center border-2 shadow-xs ${
                                  item.match
                                    ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]'
                                    : 'bg-[#FAF0D9] border-[#D4AF37] text-[#5D3A1A]'
                                }`}
                              >
                                <div className="text-base font-black">#{item.num}</div>
                                <div className="text-[11px] font-bold mt-0.5">🪙 {item.prize}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {scratchPrizes.type === 'grid' && (
                        <div>
                          <div className="text-[11px] font-black text-[#8D5B4C] text-center mb-1">
                            只要刮出 7️⃣ 即贏取頭獎 🪙 {selectedScratchTier.topPrize}！
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {scratchPrizes.grid.map((sym: string, idx: number) => (
                              <div
                                key={idx}
                                className="w-16 h-12 rounded-xl bg-[#FAF0D9] border-2 border-[#D4AF37] flex items-center justify-center text-2xl shadow-xs"
                              >
                                {sym}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* HTML5 Canvas Foil Coating */}
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={220}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                      onMouseDown={(e) => {
                        isScratchingRef.current = true;
                        scratch(e.clientX, e.clientY);
                      }}
                      onMouseMove={(e) => {
                        if (isScratchingRef.current) {
                          scratch(e.clientX, e.clientY);
                        }
                      }}
                      onMouseUp={() => {
                        isScratchingRef.current = false;
                      }}
                      onMouseLeave={() => {
                        isScratchingRef.current = false;
                      }}
                      onTouchStart={(e) => {
                        isScratchingRef.current = true;
                        if (e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY);
                      }}
                      onTouchMove={(e) => {
                        if (isScratchingRef.current && e.touches[0]) {
                          scratch(e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                      onTouchEnd={() => {
                        isScratchingRef.current = false;
                      }}
                    />
                  </div>

                  {/* Scratch Action Tools */}
                  <div className="w-full mt-3 flex items-center justify-between">
                    <div className="text-xs font-bold">
                      {scratchRevealed ? (
                        scratchWinAmount > 0 ? (
                          <span className="text-[#FFD700] font-black animate-pulse">
                            🎉 恭喜中獎！贏得 🪙 +{scratchWinAmount}！
                          </span>
                        ) : (
                          <span className="text-neutral-400">未中獎，再刮一張試手氣！</span>
                        )
                      ) : (
                        <span className="text-[#C5A028]">請在刮片區域塗抹刮開金箔</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!scratchRevealed && (
                        <button
                          onClick={handleFullReveal}
                          className="px-3.5 py-1.5 rounded-xl bg-[#B8860B] hover:bg-[#D4AF37] text-[#231710] font-black text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>一鍵刮開</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleBuyScratchTicket(selectedScratchTier)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#FFD700] text-[#231710] font-black text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>再買一張 (🪙 {selectedScratchTier.price})</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-black/30 rounded-3xl border border-[#D4AF37]/30 my-auto">
                  <span className="text-4xl">🎫</span>
                  <p className="text-sm font-bold text-[#FDF6C7] mt-2">
                    請於上方選擇一張刮刮樂開始試手氣！
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 3: 🎲 地下骰寶 (SIC BO)
              ======================================================== */}
          {activeTab === 'dice' && (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
              {/* Wooden Shaker Cup & Dice Stage */}
              <div className="relative p-4 sm:p-6 rounded-3xl bg-[#1A100B] border-2 border-[#D4AF37] shadow-xl flex flex-col items-center">
                {/* 3 Physical Dice Display */}
                <div className="w-full flex items-center justify-center gap-4 py-4 sm:py-6">
                  {diceResult.map((dot, idx) => (
                    <motion.div
                      key={idx}
                      animate={isDiceRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 0.9, 1] } : {}}
                      transition={{ repeat: isDiceRolling ? Infinity : 0, duration: 0.2 }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-3 border-[#D4AF37] shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-black text-[#231710]"
                    >
                      {dot === 1 ? '⚀' : dot === 2 ? '⚁' : dot === 3 ? '⚂' : dot === 4 ? '⚃' : dot === 5 ? '⚄' : '⚅'}
                    </motion.div>
                  ))}
                </div>

                {/* Dice Total Notice */}
                <div className="text-xs sm:text-sm font-black text-[#FDF6C7] mb-2">
                  總點數：{diceResult[0] + diceResult[1] + diceResult[2]} 點（
                  {diceResult[0] + diceResult[1] + diceResult[2] >= 11 ? '大' : '小'}・
                  {(diceResult[0] + diceResult[1] + diceResult[2]) % 2 === 1 ? '單' : '雙'}
                  {diceResult[0] === diceResult[1] && diceResult[1] === diceResult[2] ? '・豹子' : ''}）
                </div>

                {/* Roll Message */}
                {diceMessage && (
                  <div className="mt-1 px-4 py-1.5 rounded-xl bg-black/60 border border-[#D4AF37]/50 text-xs sm:text-sm font-bold text-center text-[#FFD700]">
                    {diceMessage}
                  </div>
                )}
              </div>

              {/* Betting Board Grid */}
              <div className="mt-3">
                <div className="text-xs font-bold text-[#C5A028] mb-1.5">
                  選擇下注盤口（點擊選取）：
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    disabled={isDiceRolling}
                    onClick={() => {
                      sound.playClick();
                      setDiceChoice('big');
                    }}
                    className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                      diceChoice === 'big'
                        ? 'bg-[#A82323] border-[#FFD700] text-white shadow-lg scale-105'
                        : 'bg-black/50 border-[#D4AF37]/40 text-[#FFE8D6] hover:bg-white/10'
                    }`}
                  >
                    <div>🔴 大 (11~17)</div>
                    <div className="text-[10px] text-neutral-300 font-normal mt-0.5">賠率 1:1</div>
                  </button>

                  <button
                    disabled={isDiceRolling}
                    onClick={() => {
                      sound.playClick();
                      setDiceChoice('small');
                    }}
                    className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                      diceChoice === 'small'
                        ? 'bg-[#1976D2] border-[#FFD700] text-white shadow-lg scale-105'
                        : 'bg-black/50 border-[#D4AF37]/40 text-[#FFE8D6] hover:bg-white/10'
                    }`}
                  >
                    <div>🔵 小 (4~10)</div>
                    <div className="text-[10px] text-neutral-300 font-normal mt-0.5">賠率 1:1</div>
                  </button>

                  <button
                    disabled={isDiceRolling}
                    onClick={() => {
                      sound.playClick();
                      setDiceChoice('odd');
                    }}
                    className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                      diceChoice === 'odd'
                        ? 'bg-[#B8860B] border-[#FFD700] text-[#231710] shadow-lg scale-105'
                        : 'bg-black/50 border-[#D4AF37]/40 text-[#FFE8D6] hover:bg-white/10'
                    }`}
                  >
                    <div>⚪ 單 (奇數)</div>
                    <div className="text-[10px] text-neutral-300 font-normal mt-0.5">賠率 1:1</div>
                  </button>

                  <button
                    disabled={isDiceRolling}
                    onClick={() => {
                      sound.playClick();
                      setDiceChoice('even');
                    }}
                    className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                      diceChoice === 'even'
                        ? 'bg-[#B8860B] border-[#FFD700] text-[#231710] shadow-lg scale-105'
                        : 'bg-black/50 border-[#D4AF37]/40 text-[#FFE8D6] hover:bg-white/10'
                    }`}
                  >
                    <div>⚫ 雙 (偶數)</div>
                    <div className="text-[10px] text-neutral-300 font-normal mt-0.5">賠率 1:1</div>
                  </button>

                  <button
                    disabled={isDiceRolling}
                    onClick={() => {
                      sound.playClick();
                      setDiceChoice('triple');
                    }}
                    className={`col-span-2 sm:col-span-1 py-3 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                      diceChoice === 'triple'
                        ? 'bg-[#E65100] border-[#FFD700] text-white shadow-lg scale-105'
                        : 'bg-black/50 border-[#D4AF37]/40 text-[#FFE8D6] hover:bg-white/10'
                    }`}
                  >
                    <div>👑 豹子 (圍骰)</div>
                    <div className="text-[10px] text-yellow-300 font-bold mt-0.5">賠率 1:10</div>
                  </button>
                </div>
              </div>

              {/* Bottom Roll Controls */}
              <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[#C5A028]">下注額：</span>
                  {BET_OPTIONS.map((amt) => (
                    <button
                      key={amt}
                      disabled={isDiceRolling}
                      onClick={() => {
                        sound.playClick();
                        setDiceBet(amt);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        diceBet === amt
                          ? 'bg-[#D4AF37] text-[#231710] shadow-md scale-105'
                          : 'bg-black/50 text-[#FFE8D6] hover:bg-white/10'
                      }`}
                    >
                      🪙 {amt}
                    </button>
                  ))}
                </div>

                <button
                  disabled={isDiceRolling || currentCoins < diceBet || !diceChoice}
                  onClick={handleRollDice}
                  className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                    isDiceRolling || !diceChoice
                      ? 'bg-neutral-600 text-neutral-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#B8860B] hover:brightness-110 text-[#231710] active:scale-95'
                  }`}
                >
                  <Trophy className="w-5 h-5 fill-current" />
                  <span>{isDiceRolling ? '搖盅中...' : `搖盅擲骰 (🪙 ${diceBet})`}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: 🎯 俄羅斯輪盤 (RUSSIAN ROULETTE)
              ======================================================== */}
          {activeTab === 'roulette' && (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
              {/* Revolver Chamber Stage Cabinet */}
              <div className="relative p-4 sm:p-5 rounded-3xl bg-[#1A0E08] border-3 border-[#D4AF37] shadow-2xl flex flex-col items-center">
                {/* Header Neon / Gold Badge */}
                <div className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-black/60 border border-[#D4AF37]/50 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-[11px] font-black text-[#FDF6C7] tracking-wider">
                      RUSSIAN ROULETTE・命運轉輪
                    </span>
                  </div>
                  <div className="text-[11px] font-black text-[#FFD700]">
                    ★ 6孔1彈・極限 20x 奪獎池 ★
                  </div>
                </div>

                {/* 5-Stage Multiplier Ladder Progress Bar */}
                <div className="w-full grid grid-cols-5 gap-1 sm:gap-2 mb-4">
                  {ROULETTE_MULTIPLIERS.map((mult, idx) => {
                    const stepNum = idx + 1;
                    const isCurrent = rouletteRound === stepNum && rouletteState === 'survived';
                    const isPassed = rouletteRound > stepNum || (rouletteRound === 5 && rouletteState === 'cashed');

                    return (
                      <div
                        key={`roulette-step-${stepNum}`}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isPassed
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                            : isCurrent
                            ? 'bg-amber-500/20 border-[#FFD700] text-[#FFD700] shadow-md scale-105 animate-pulse'
                            : 'bg-black/40 border-neutral-700 text-neutral-400'
                        }`}
                      >
                        <div className="text-[10px] font-bold">第 {stepNum} 發</div>
                        <div className="text-xs sm:text-sm font-black font-mono">
                          {mult}x
                        </div>
                        {stepNum === 5 && (
                          <div className="text-[8px] text-amber-300 font-extrabold mt-0.5">
                            +30%獎池
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Revolver 6-Chamber Cylinder SVG */}
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center my-2">
                  <motion.svg
                    viewBox="0 0 200 200"
                    className="w-full h-full filter drop-shadow-xl"
                    animate={isRevolverSpinning ? { rotate: [0, 720] } : {}}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    {/* Outer Steel Cylinder */}
                    <circle cx="100" cy="100" r="90" fill="#2E2018" stroke="#D4AF37" strokeWidth="4" />
                    <circle cx="100" cy="100" r="82" fill="#1A100A" stroke="#5D3A1A" strokeWidth="2" />
                    {/* Flutes (Cylinder Cuts) */}
                    {[0, 60, 120, 180, 240, 300].map((deg) => (
                      <rect
                        key={`flute-${deg}`}
                        x="96"
                        y="12"
                        width="8"
                        height="26"
                        rx="4"
                        fill="#0E0805"
                        transform={`rotate(${deg} 100 100)`}
                      />
                    ))}

                    {/* Center Ratchet / Ejector Rod Hub */}
                    <circle cx="100" cy="100" r="28" fill="#5D3A1A" stroke="#D4AF37" strokeWidth="2" />
                    <circle cx="100" cy="100" r="14" fill="#0E0805" />

                    {/* 6 Chambers */}
                    {[1, 2, 3, 4, 5, 6].map((ch) => {
                      const angle = (ch - 1) * 60 - 90; // Top is chamber 1
                      const rad = (angle * Math.PI) / 180;
                      const cx = 100 + 52 * Math.cos(rad);
                      const cy = 100 + 52 * Math.sin(rad);

                      const isFired = firedChambers.includes(ch);
                      const isBulletHere = ch === bulletChamber && rouletteState === 'dead';
                      const isAiming = ch === (rouletteState === 'survived' ? currentChamber + 1 : currentChamber);

                      return (
                        <g key={`chamber-${ch}`}>
                          {/* Chamber Hole */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r="19"
                            fill={isBulletHere ? '#A82323' : isFired ? '#120A06' : '#3E2A1E'}
                            stroke={isAiming && !isRevolverSpinning ? '#FFD700' : '#8D5B4C'}
                            strokeWidth={isAiming ? 3 : 1.5}
                          />

                          {/* Bullet Primer or Empty Chamber Mark */}
                          {isBulletHere ? (
                            <text
                              x={cx}
                              y={cy + 6}
                              fontSize="18"
                              textAnchor="middle"
                              fill="#FFFFFF"
                            >
                              💥
                            </text>
                          ) : isFired ? (
                            <circle cx={cx} cy={cy} r="6" fill="#0A0503" />
                          ) : (
                            <g>
                              {/* Brass Cartridge Case */}
                              <circle cx={cx} cy={cy} r="14" fill="#B8860B" />
                              <circle cx={cx} cy={cy} r="6" fill="#D4AF37" />
                              <text
                                x={cx}
                                y={cy + 3.5}
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                                fill="#2B1E16"
                              >
                                {ch}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </motion.svg>

                  {/* Top Hammer / Firing Pin Indicator */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                    <Crosshair className="w-6 h-6 text-[#FFD700] animate-pulse" />
                  </div>
                </div>

                {/* Announcement Banner */}
                <div className="w-full mt-2 min-h-[36px] flex items-center justify-center">
                  {rouletteMessage ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`px-4 py-1.5 rounded-xl text-center font-black text-xs sm:text-sm shadow-md ${
                        rouletteState === 'dead'
                          ? 'bg-rose-950 border border-rose-500 text-rose-200'
                          : rouletteState === 'survived'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-pulse'
                          : 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#231710]'
                      }`}
                    >
                      {rouletteMessage}
                    </motion.div>
                  ) : (
                    <span className="text-xs text-[#A8884A] font-bold">
                      選擇下注額，點擊「扣動扳機」開始對決命運！
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Bet Selectors */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[#C5A028]">下注額：</span>
                  {BET_OPTIONS.map((amt) => (
                    <button
                      key={`roulette-bet-${amt}`}
                      disabled={isRevolverSpinning || rouletteState === 'survived'}
                      onClick={() => {
                        sound.playClick();
                        setRouletteBet(amt);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        rouletteBet === amt
                          ? 'bg-[#D4AF37] text-[#231710] shadow-md scale-105'
                          : 'bg-black/50 text-[#FFE8D6] hover:bg-white/10'
                      }`}
                    >
                      🪙 {amt}
                    </button>
                  ))}
                </div>

                {/* Dual Action Buttons when survived OR Single trigger button */}
                <div className="w-full sm:w-auto flex items-center gap-2">
                  {rouletteState === 'survived' ? (
                    <>
                      <button
                        disabled={isRevolverSpinning}
                        onClick={handleCashOutRoulette}
                        className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white shadow-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Coins className="w-4 h-4" />
                        <span>見好就收 (🪙 {Math.floor(rouletteBet * ROULETTE_MULTIPLIERS[rouletteRound - 1])})</span>
                      </button>

                      <button
                        disabled={isRevolverSpinning}
                        onClick={handlePullTrigger}
                        className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#A82323] via-rose-600 to-[#831818] hover:brightness-110 text-white shadow-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all animate-pulse"
                      >
                        <Crosshair className="w-4 h-4" />
                        <span>扣動第 {rouletteRound + 1} 發 ({ROULETTE_MULTIPLIERS[rouletteRound]}x)</span>
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={isRevolverSpinning || currentCoins < rouletteBet}
                      onClick={handlePullTrigger}
                      className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                        isRevolverSpinning
                          ? 'bg-neutral-600 text-neutral-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#B8860B] hover:brightness-110 text-[#231710] active:scale-95'
                      }`}
                    >
                      <Crosshair className="w-5 h-5 fill-current" />
                      <span>{isRevolverSpinning ? '轉輪旋轉中...' : `扣動扳機 🎲 (🪙 ${rouletteBet})`}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};