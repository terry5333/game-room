import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Delete,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Target,
  Trophy,
  AlertCircle,
  Keyboard,
  ArrowRight
} from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';
import { sound } from '../../../services/soundService';
import type { GuessRecord, State1A2B, PlayerSlot } from '../../../types';

export const Game1A2B: React.FC = () => {
  const { currentRoom, updateRoomState, myRole, players } = useRoom();
  const { currentUser } = useAuth();

  const [inputDigits, setInputDigits] = useState<string>('');
  const [hintRevealed, setHintRevealed] = useState<boolean>(false);
  const [hintUnlockedNotice, setHintUnlockedNotice] = useState<boolean>(false);
  const [hintNotified, setHintNotified] = useState<boolean>(false);
  const [historyTab, setHistoryTab] = useState<'all' | 'mine' | 'opponent'>('all');

  const state: State1A2B = currentRoom?.state1a2b || {
    secrets: {},
    lockedIn: {},
    guesses: [],
    currentTurnUid: currentRoom?.player1.uid || '',
    turnDeadline: Date.now() + 30000,
    hintEnabled: true,
    hintRound: 5,
    maxRounds: 0
  };

  const secrets = state.secrets || {};
  const lockedIn = state.lockedIn || {};
  const allGuesses = Array.isArray(state.guesses) ? state.guesses : [];

  // Guarantee all players (P1, P2) are properly recognized even if room.players was singular
  const allPlayers: PlayerSlot[] = (() => {
    const list = [...(players || [])];
    if (currentRoom?.player1 && !list.some((p) => p.uid === currentRoom.player1.uid)) {
      list.unshift(currentRoom.player1);
    }
    if (currentRoom?.player2 && !list.some((p) => p.uid === currentRoom.player2.uid)) {
      list.push(currentRoom.player2);
    }
    return list;
  })();

  const isMultiplayer = (currentRoom?.maxPlayers || 2) > 2 || Boolean(state.targetSecret);

  const p1 = currentRoom?.player1 || allPlayers[0];
  const p2 = currentRoom?.player2 || allPlayers[1];
  const myUid = currentUser?.uid || '';

  const opponentUser =
    allPlayers.find((p) => p.uid !== myUid) ||
    (myRole === 'player1' ? p2 : p1);
  const opponentUid = opponentUser?.uid || (myRole === 'player1' ? p2?.uid || '' : p1?.uid || '');

  const mySecret = secrets[myUid] || '';
  const myLocked = Boolean(lockedIn[myUid]);
  const opponentLocked = Boolean(lockedIn[opponentUid]);
  const bothLocked = isMultiplayer ? true : myLocked && opponentLocked;

  const targetSecret = isMultiplayer
    ? state.targetSecret || '1234'
    : secrets[opponentUid] || '';

  // Configuration options
  const hintEnabled = state.hintEnabled !== false;
  const hintRound = state.hintRound || 5;
  const maxRounds = state.maxRounds || 0; // 0 = unlimited

  const PLAYER_THEMES = [
    { bg: 'bg-[#628395]', border: 'border-[#628395]/40', text: 'text-[#628395]', name: 'P1' },
    { bg: 'bg-[#CF995F]', border: 'border-[#CF995F]/40', text: 'text-[#CF995F]', name: 'P2' },
    { bg: 'bg-emerald-600', border: 'border-emerald-500/40', text: 'text-emerald-700', name: 'P3' },
    { bg: 'bg-purple-600', border: 'border-purple-500/40', text: 'text-purple-700', name: 'P4' }
  ];

  // Filter guesses by player
  const myGuesses = allGuesses.filter((g) => g.guesserUid === myUid);
  const opponentGuesses = allGuesses.filter((g) => g.guesserUid === opponentUid);

  // Best A calculation
  const myBestA = myGuesses.length > 0 ? Math.max(...myGuesses.map((g) => g.bulls)) : 0;
  const oppBestA = opponentGuesses.length > 0 ? Math.max(...opponentGuesses.map((g) => g.bulls)) : 0;

  const hasReachedMaxRounds = maxRounds > 0 && myGuesses.length >= maxRounds;
  const canGuess = bothLocked && !hasReachedMaxRounds && currentRoom?.status === 'in_progress';
  const isSettled = currentRoom?.status === 'settled';

  // Reset hint state on rematch
  useEffect(() => {
    if (myGuesses.length === 0) {
      setHintRevealed(false);
      setHintNotified(false);
      setHintUnlockedNotice(false);
    }
  }, [myGuesses.length]);

  // When hint condition is met, trigger prominent screen pop-up and sound alert
  useEffect(() => {
    if (hintEnabled && bothLocked && myGuesses.length >= hintRound && !hintNotified && !isSettled) {
      setHintNotified(true);
      setHintRevealed(true);
      setHintUnlockedNotice(true);
      sound.playSuccess();
    }
  }, [hintEnabled, bothLocked, myGuesses.length, hintRound, hintNotified, isSettled]);

  // Keypad inputs
  const handleDigitPress = (d: number) => {
    sound.playPop();
    const str = d.toString();
    if (inputDigits.includes(str)) return; // No duplicates allowed!
    if (inputDigits.length < 4) {
      setInputDigits((prev) => prev + str);
    }
  };

  const handleBackspace = () => {
    sound.playClick();
    setInputDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    sound.playClick();
    setInputDigits('');
  };

  // Lock in secret number in setup phase
  const handleLockSecret = async () => {
    if (inputDigits.length !== 4) return;
    sound.playLock();

    await updateRoomState((draft) => {
      if (!draft.state1a2b) return;
      draft.state1a2b.secrets[myUid] = inputDigits;
      draft.state1a2b.lockedIn[myUid] = true;
    });

    setInputDigits('');
  };

  // Submit guess in battle phase (Simultaneous real-time guessing)
  const handleSubmitGuess = async () => {
    if (inputDigits.length !== 4 || !canGuess) return;
    sound.playAcknowledge();

    const secretToMatch = isMultiplayer
      ? state.targetSecret || '1234'
      : secrets[opponentUid];
    if (!secretToMatch) return;

    let bulls = 0; // A
    let cows = 0;  // B

    for (let i = 0; i < 4; i++) {
      if (inputDigits[i] === secretToMatch[i]) {
        bulls++;
      } else if (secretToMatch.includes(inputDigits[i])) {
        cows++;
      }
    }

    const newRecord: GuessRecord = {
      guesserUid: myUid,
      guess: inputDigits,
      bulls,
      cows,
      timestamp: Date.now()
    };

    const isWin = bulls === 4;

    await updateRoomState((draft) => {
      if (!draft.state1a2b) return;
      draft.state1a2b.guesses = [newRecord, ...(draft.state1a2b.guesses || [])];

      if (isWin) {
        sound.playWin();
        draft.status = 'settled';
        draft.winnerUid = myUid;
      } else if (maxRounds > 0) {
        // If max rounds enabled, check if all players have exhausted guesses
        const updatedMyCount = myGuesses.length + 1;
        const allPlayersExhausted = allPlayers.every((p) => {
          if (p.uid === myUid) return updatedMyCount >= maxRounds;
          const otherGuesses = allGuesses.filter((g) => g.guesserUid === p.uid);
          return otherGuesses.length >= maxRounds;
        });

        if (allPlayersExhausted) {
          draft.status = 'settled';
          // Find player with best A (bulls)
          let bestA = -1;
          let bestPlayerUid = 'draw';
          allPlayers.forEach((p) => {
            const pGuesses =
              p.uid === myUid
                ? [bulls, ...myGuesses.map((g) => g.bulls)]
                : allGuesses.filter((g) => g.guesserUid === p.uid).map((g) => g.bulls);
            const pMax = pGuesses.length > 0 ? Math.max(...pGuesses) : 0;
            if (pMax > bestA) {
              bestA = pMax;
              bestPlayerUid = p.uid;
            } else if (pMax === bestA) {
              bestPlayerUid = 'draw';
            }
          });
          draft.winnerUid = bestPlayerUid;
        }
      }
    });

    setInputDigits('');
  };

  // Keyboard controls for desktop: 0-9, Backspace, Enter, Delete/Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in regular text inputs or textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!bothLocked) {
          if (inputDigits.length === 4 && !myLocked) {
            handleLockSecret();
          }
        } else {
          if (canGuess && inputDigits.length === 4) {
            handleSubmitGuess();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputDigits, bothLocked, myLocked, canGuess]);

  // Filtered guesses to display in history panel
  const displayedGuesses = allGuesses.filter((g) => {
    if (historyTab === 'mine') return g.guesserUid === myUid;
    if (historyTab === 'opponent') return g.guesserUid === opponentUid;
    return true;
  });

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Dynamic Simultaneous Guessing Banner & Opponent Live Progress */}
      {bothLocked ? (
        <div className="w-full glass-panel rounded-3xl p-4 sm:p-5 border-2 border-white/80 shadow-md flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#96897B]/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#628395] text-white flex items-center justify-center shadow-xs">
                <Zap className="w-5 h-5 text-amber-200 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#2E2925]">即時競速搶答中</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#628395]/15 text-[#628395] border border-[#628395]/20">
                    雙方同時猜題
                  </span>
                </div>
                <p className="text-xs text-[#96897B] font-medium">
                  不需等待對手！各自加速推理解密，搶先猜出 4A0B 者獲勝
                </p>
              </div>
            </div>

            {/* Turn speed comparison pill */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#96897B]">對壘戰況：</span>
              <span className="text-xs font-black px-3 py-1 rounded-xl bg-white/80 border border-[#96897B]/20 text-[#2E2925] shadow-2xs">
                {myGuesses.length > opponentGuesses.length
                  ? `我方領先 ${myGuesses.length - opponentGuesses.length} 回合`
                  : opponentGuesses.length > myGuesses.length
                  ? `對手領先 ${opponentGuesses.length - myGuesses.length} 回合`
                  : '雙方回合進度一致'}
              </span>
            </div>
          </div>

          {/* Live Opponent vs My Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* My progress card */}
            <div className="p-3.5 rounded-2xl bg-[#628395]/10 border border-[#628395]/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#628395] text-white font-mono font-black text-xs flex items-center justify-center shadow-2xs">
                  P1
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#2E2925] flex items-center gap-1.5">
                    <span>我方（{currentUser?.displayName || '玩家'}）</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#628395]">
                    目前最佳：<span className="font-mono font-black">{myBestA}A</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-base text-[#628395]">
                  {myGuesses.length}{' '}
                  <span className="text-xs font-bold text-[#96897B]">
                    {maxRounds > 0 ? `/ ${maxRounds} 次` : '次'}
                  </span>
                </div>
                <div className="text-[10px] text-[#96897B] font-semibold">
                  {canGuess ? '已就緒可猜題' : '已達上限'}
                </div>
              </div>
            </div>

            {/* Opponent progress card */}
            <div className="p-3.5 rounded-2xl bg-[#CF995F]/10 border border-[#CF995F]/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#CF995F] text-white font-mono font-black text-xs flex items-center justify-center shadow-2xs">
                  P2
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#2E2925] flex items-center gap-1.5">
                    <span>對手（{opponentUser?.displayName || '對手'}）</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/70 text-[#CF995F]">
                      {opponentGuesses.length === 0 ? '尚未出手' : `已猜 ${opponentGuesses.length} 回合`}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[#CF995F]">
                    目前最佳：<span className="font-mono font-black">{oppBestA}A</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-base text-[#CF995F]">
                  {opponentGuesses.length}{' '}
                  <span className="text-xs font-bold text-[#96897B]">
                    {maxRounds > 0 ? `/ ${maxRounds} 次` : '次'}
                  </span>
                </div>
                <div className="text-[10px] text-[#CF995F] font-bold animate-pulse">
                  {opponentGuesses.length > 0 ? '對手同步解密中' : '思考中...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center py-2 px-4">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DBAD6A]/15 border border-[#DBAD6A] text-[#2E2925] font-extrabold text-sm shadow-sm backdrop-blur-md">
            <Lock className="w-4 h-4 text-[#DBAD6A]" />
            <span>出題階段：請各自為對手設定 4 位不重複數字秘密密碼</span>
          </div>
        </div>
      )}

      {/* Opponent Live Status during setup */}
      {!bothLocked && (
        <div
          className={`w-full max-w-lg flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold shadow-xs transition-all ${
            opponentLocked
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {opponentLocked ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            )}
            <span>
              {opponentLocked
                ? `對手（${opponentUser?.displayName || '對手'}）已完成出題，密碼已鎖定！`
                : `對手（${opponentUser?.displayName || '對手'}）正在思考出題密碼中...`}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/70">
            {opponentLocked ? '已就緒' : '思考中'}
          </span>
        </div>
      )}

      {/* Main Game Arena Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Input Pad & Secret Status */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full glass-panel rounded-3xl p-6 border-2 border-white/80 shadow-md">
            {/* Header info */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#96897B]/20">
              <span className="font-extrabold text-sm text-[#2E2925]">
                {!bothLocked
                  ? '出題設定'
                  : hasReachedMaxRounds
                  ? '已達猜題上限'
                  : `猜題第 ${myGuesses.length + 1} 回合`}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#96897B]">
                  {isMultiplayer ? '目標密碼：' : '我方出題密碼：'}
                </span>
                <span className="font-mono font-black text-sm bg-white/80 px-2.5 py-0.5 rounded-lg text-[#628395] border border-[#96897B]/20 tracking-wider">
                  {isMultiplayer ? '4 位神秘數字' : mySecret ? mySecret : '尚未鎖定'}
                </span>
              </div>
            </div>

            {/* Display slots */}
            <div className="flex justify-center gap-3 my-5">
              {[0, 1, 2, 3].map((idx) => {
                const char = inputDigits[idx] || '';
                return (
                  <motion.div
                    key={idx}
                    animate={{ scale: char ? 1.08 : 1 }}
                    className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center font-mono font-black text-2xl sm:text-3xl border-2 transition-all shadow-inner ${
                      char
                        ? 'bg-white text-[#2E2925] border-[#628395] shadow-md shadow-[#628395]/15'
                        : 'bg-white/40 text-[#96897B] border-[#96897B]/30'
                    }`}
                  >
                    {char ? char : <span className="opacity-20">•</span>}
                  </motion.div>
                );
              })}
            </div>

            {/* Active Unlocked Hint Clue Banner Above Keypad */}
            {bothLocked && hintEnabled && myGuesses.length >= hintRound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-3 max-w-xs mx-auto p-2.5 rounded-2xl bg-[#DBAD6A]/20 border border-[#DBAD6A]/60 text-xs font-bold text-[#2E2925] flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#DBAD6A] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    💡
                  </span>
                  <span>
                    密碼線索：包含數字【
                    <strong className="text-base font-black text-[#628395] underline">
                      {targetSecret[1] || targetSecret[0] || '7'}
                    </strong>
                    】
                  </span>
                </div>
                <span className="text-[10px] bg-white/90 px-2 py-0.5 rounded-md text-[#DBAD6A] font-extrabold border border-[#DBAD6A]/30">
                  第 {hintRound} 輪情報
                </span>
              </motion.div>
            )}

            {/* Numeric Keypad (0-9, Backspace, Submit) */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const isSelected = inputDigits.includes(digit.toString());
                const disabled =
                  (!bothLocked && myLocked) ||
                  (bothLocked && (!canGuess || isSettled)) ||
                  isSelected;

                return (
                  <motion.button
                    key={digit}
                    whileHover={!disabled ? { scale: 1.08 } : {}}
                    whileTap={!disabled ? { scale: 0.94 } : {}}
                    disabled={disabled}
                    onClick={() => handleDigitPress(digit)}
                    className={`h-12 sm:h-14 rounded-2xl font-mono font-black text-xl transition-all shadow-sm ${
                      isSelected
                        ? 'bg-[#96897B]/20 text-[#96897B] opacity-50 cursor-not-allowed border border-[#96897B]/20'
                        : disabled
                        ? 'bg-white/40 text-[#96897B]/50 cursor-not-allowed border border-white/40'
                        : 'bg-white/90 hover:bg-white text-[#2E2925] border border-white shadow-md cursor-pointer hover:border-[#628395]'
                    }`}
                  >
                    {digit}
                  </motion.button>
                );
              })}

              {/* Backspace */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                disabled={inputDigits.length === 0}
                onClick={handleBackspace}
                className="h-12 sm:h-14 rounded-2xl bg-white/70 hover:bg-white text-[#96897B] hover:text-[#2E2925] border border-[#96897B]/20 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="刪除上一位 (Backspace)"
              >
                <Delete className="w-5 h-5" />
              </motion.button>

              {/* 0 */}
              <motion.button
                whileHover={!inputDigits.includes('0') ? { scale: 1.08 } : {}}
                whileTap={!inputDigits.includes('0') ? { scale: 0.94 } : {}}
                disabled={
                  inputDigits.includes('0') ||
                  (!bothLocked && myLocked) ||
                  (bothLocked && (!canGuess || isSettled))
                }
                onClick={() => handleDigitPress(0)}
                className={`h-12 sm:h-14 rounded-2xl font-mono font-black text-xl transition-all shadow-sm ${
                  inputDigits.includes('0')
                    ? 'bg-[#96897B]/20 text-[#96897B] opacity-50 cursor-not-allowed border border-[#96897B]/20'
                    : 'bg-white/90 hover:bg-white text-[#2E2925] border border-white shadow-md cursor-pointer hover:border-[#628395]'
                }`}
              >
                0
              </motion.button>

              {/* Clear */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                disabled={inputDigits.length === 0}
                onClick={handleClear}
                className="h-12 sm:h-14 rounded-2xl bg-white/70 hover:bg-white text-xs font-bold text-[#96897B] hover:text-rose-600 border border-[#96897B]/20 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="全部清除 (Esc)"
              >
                清除
              </motion.button>
            </div>

            {/* Desktop Keyboard Quick Tip Bar */}
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#96897B] mb-4 select-none">
              <span className="px-1.5 py-0.5 rounded bg-white/80 font-mono text-[10px] text-[#2E2925] border border-[#96897B]/20 shadow-2xs">
                0-9
              </span>
              <span>鍵盤輸入</span>
              <span className="text-[#96897B]/40">•</span>
              <span className="px-1.5 py-0.5 rounded bg-white/80 font-mono text-[10px] text-[#2E2925] border border-[#96897B]/20 shadow-2xs">
                Backspace
              </span>
              <span>退格</span>
              <span className="text-[#96897B]/40">•</span>
              <span className="px-1.5 py-0.5 rounded bg-white/80 font-mono text-[10px] text-[#2E2925] border border-[#96897B]/20 shadow-2xs">
                Enter
              </span>
              <span>確認送出</span>
            </div>

            {/* Action Lock or Submit Button */}
            {!bothLocked ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={inputDigits.length !== 4 || myLocked}
                onClick={handleLockSecret}
                className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  myLocked
                    ? 'bg-emerald-600 text-white cursor-default'
                    : inputDigits.length === 4
                    ? 'bg-[#628395] hover:bg-[#526f7f] text-white shadow-[#628395]/20'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {myLocked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      已鎖定密碼，等待對手出題 ({opponentLocked ? '對手已就緒' : '對手思考中...'})
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>鎖定 4 位出題密碼 (Enter)</span>
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={canGuess && inputDigits.length === 4 ? { scale: 1.02 } : {}}
                whileTap={canGuess && inputDigits.length === 4 ? { scale: 0.98 } : {}}
                disabled={!canGuess || inputDigits.length !== 4}
                onClick={handleSubmitGuess}
                className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                  canGuess && inputDigits.length === 4
                    ? 'bg-[#628395] hover:bg-[#526f7f] text-white shadow-[#628395]/20 cursor-pointer'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {hasReachedMaxRounds
                    ? '已達回合上限'
                    : `送出第 ${myGuesses.length + 1} 回合猜測 (Enter)`}
                </span>
              </motion.button>
            )}

            {/* Hint Feature Section */}
            {bothLocked && (
              <div className="mt-4 pt-3.5 border-t border-[#96897B]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E2925]">
                    <Sparkles className="w-4 h-4 text-[#DBAD6A]" />
                    <span>
                      {hintEnabled ? `提示功能（第 ${hintRound} 回合）` : '提示功能（本局未開啟）'}
                    </span>
                  </div>

                  {hintEnabled ? (
                    myGuesses.length >= hintRound ? (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setHintRevealed((prev) => !prev);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#DBAD6A] hover:bg-[#c69a59] text-white font-black text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <span>{hintRevealed ? '隱藏提示' : '查看密碼線索'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-[#96897B] bg-white/70 px-2.5 py-1 rounded-lg border border-[#96897B]/20">
                        再猜 {hintRound - myGuesses.length} 次解鎖提示
                      </span>
                    )
                  ) : (
                    <span className="text-[11px] font-bold text-[#96897B]/60">無提示模式</span>
                  )}
                </div>

                <AnimatePresence>
                  {hintEnabled && hintRevealed && myGuesses.length >= hintRound && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 rounded-2xl bg-[#DBAD6A]/15 border border-[#DBAD6A]/40 text-xs font-bold text-[#2E2925] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#DBAD6A] text-white font-mono text-[10px] font-black">
                          情報線索
                        </span>
                        <span>
                          目標 4 位密碼中包含數字【
                          <strong className="text-sm font-black text-[#628395] underline">
                            {targetSecret[1] || targetSecret[0] || '7'}
                          </strong>
                          】！
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History Panel with Tab Switcher & Inline A/B next to guess number */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel rounded-3xl p-5 border-2 border-white/80 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#96897B]/20 gap-2 mb-3">
              <span className="font-extrabold text-sm text-[#2E2925]">
                歷次猜題攻防紀錄 ({allGuesses.length} 次)
              </span>

              {/* History Filter Tabs */}
              <div className="flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-[#96897B]/20 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setHistoryTab('all');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    historyTab === 'all'
                      ? 'bg-[#628395] text-white shadow-xs'
                      : 'text-[#96897B] hover:text-[#2E2925]'
                  }`}
                >
                  全部 ({allGuesses.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setHistoryTab('mine');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    historyTab === 'mine'
                      ? 'bg-[#628395] text-white shadow-xs'
                      : 'text-[#96897B] hover:text-[#2E2925]'
                  }`}
                >
                  我方 ({myGuesses.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setHistoryTab('opponent');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    historyTab === 'opponent'
                      ? 'bg-[#CF995F] text-white shadow-xs'
                      : 'text-[#96897B] hover:text-[#2E2925]'
                  }`}
                >
                  對手 ({opponentGuesses.length})
                </button>
              </div>
            </div>

            {/* Guesses list */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {displayedGuesses.length === 0 ? (
                <div className="text-center py-16 text-xs text-[#96897B] font-medium">
                  {historyTab === 'opponent'
                    ? '對手尚未送出任何猜題'
                    : historyTab === 'mine'
                    ? '我方尚未送出任何猜題'
                    : bothLocked
                    ? '已進入猜題競速！每一次猜測的 A/B 結果將在此即時對壘！'
                    : '雙方密碼鎖定後，每一次猜測的 A/B 結果將在此即時對壘！'}
                </div>
              ) : (
                displayedGuesses.map((g, idx) => {
                  const isMine = g.guesserUid === myUid;
                  const is4A0B = g.bulls === 4;
                  const guesserIndex = allPlayers.findIndex((p) => p.uid === g.guesserUid);
                  const theme =
                    PLAYER_THEMES[
                      guesserIndex >= 0 ? guesserIndex % PLAYER_THEMES.length : isMine ? 0 : 1
                    ];
                  const guesserName = isMine
                    ? '我方'
                    : opponentUser?.displayName || `對手`;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: isMine ? -10 : 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        is4A0B
                          ? 'bg-[#DBAD6A]/25 border-[#DBAD6A] shadow-md'
                          : isMine
                          ? 'bg-[#628395]/10 border-[#628395]/30'
                          : 'bg-[#CF995F]/10 border-[#CF995F]/30'
                      }`}
                    >
                      {/* Left: Tag + 猜測數字 + 緊鄰在其右側的 幾A幾B */}
                      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#96897B] w-6 shrink-0">
                          #{displayedGuesses.length - idx}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md text-white shrink-0 ${theme.bg}`}
                        >
                          {guesserName}
                        </span>

                        {/* 4 位數字 + 幾A幾B 緊密並列顯示在數字旁邊！ */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg sm:text-xl tracking-wider text-[#2E2925]">
                            {g.guess}
                          </span>
                          <div className="flex items-center gap-1 font-mono font-black text-xs">
                            <span className="px-2 py-0.5 rounded-lg bg-[#628395] text-white shadow-2xs">
                              {g.bulls}A
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-[#CF995F] text-white shadow-2xs">
                              {g.cows}B
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: 破譯標籤或回合序號 */}
                      <div className="shrink-0">
                        {is4A0B ? (
                          <span className="text-xs font-black text-[#DBAD6A] flex items-center gap-0.5 animate-bounce">
                            <Sparkles className="w-3.5 h-3.5" /> 破譯成功！
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-[#96897B]">
                            {isMine
                              ? `我方第 ${myGuesses.length - myGuesses.indexOf(g)} 次`
                              : `對手第 ${opponentGuesses.length - opponentGuesses.indexOf(g)} 次`}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1A2B Hint Unlocked Popup Notification */}
      <AnimatePresence>
        {hintUnlockedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="max-w-sm w-full bg-[#FAF7F2] rounded-3xl p-6 shadow-2xl border-2 border-[#DBAD6A] text-center relative overflow-hidden"
            >
              {/* Header Badge */}
              <div className="w-14 h-14 rounded-2xl bg-[#DBAD6A]/20 text-[#DBAD6A] flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Sparkles className="w-8 h-8 text-[#DBAD6A] animate-pulse" />
              </div>

              <span className="text-[10px] tracking-widest uppercase font-black px-2.5 py-0.5 rounded-full bg-[#DBAD6A]/20 text-[#8C6D3B] mb-1 inline-block">
                HINT UNLOCKED
              </span>

              <h3 className="text-xl font-black text-[#2E2925] mb-2 tracking-wide font-serif">
                密碼提示已解鎖！
              </h3>

              <p className="text-xs text-[#5D4037] leading-relaxed mb-4">
                受驗生已猜測滿 <strong>{hintRound}</strong> 回合，官方線索已為您開放！
              </p>

              <div className="p-4 rounded-2xl bg-[#DBAD6A]/15 border-2 border-dashed border-[#DBAD6A]/60 mb-5">
                <div className="text-xs text-[#8C6D3B] font-bold mb-1">
                  🔍 對手 4 位密碼情報
                </div>
                <div className="text-base font-extrabold text-[#2E2925]">
                  其中包含數字【
                  <span className="text-2xl font-black text-[#628395] underline mx-1">
                    {targetSecret[1] || targetSecret[0] || '7'}
                  </span>
                  】
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  setHintRevealed(true);
                  setHintUnlockedNotice(false);
                }}
                className="w-full py-3 px-5 rounded-2xl bg-[#DBAD6A] hover:bg-[#c69a59] text-white font-black text-sm shadow-md shadow-[#DBAD6A]/30 transition-all cursor-pointer"
              >
                我知道了，繼續解密
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
