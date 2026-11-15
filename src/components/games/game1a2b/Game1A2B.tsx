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

  const isMultiplayer =
    (currentRoom?.maxPlayers || 2) >= 3 || allPlayers.length >= 3 || Boolean(state.targetSecret);

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
    { bg: 'bg-purple-600', border: 'border-purple-500/40', text: 'text-purple-700', name: 'P4' },
    { bg: 'bg-rose-600', border: 'border-rose-500/40', text: 'text-rose-700', name: 'P5' }
  ];

  // Filter guesses by player
  const myGuesses = allGuesses.filter((g) => g.guesserUid === myUid);
  const otherGuesses = allGuesses.filter((g) => g.guesserUid !== myUid);
  const opponentGuesses = otherGuesses;

  // Best A calculation
  const myBestA = myGuesses.length > 0 ? Math.max(...myGuesses.map((g) => g.bulls)) : 0;
  const oppBestA = opponentGuesses.length > 0 ? Math.max(...opponentGuesses.map((g) => g.bulls)) : 0;

  const hasReachedMaxRounds = maxRounds > 0 && myGuesses.length >= maxRounds;
  const canGuess = bothLocked && !hasReachedMaxRounds && currentRoom?.status === 'in_progress';
  const isSettled = currentRoom?.status === 'settled';

  // Auto-generate target secret if multiplayer and not yet set
  useEffect(() => {
    if (isMultiplayer && !state.targetSecret && currentRoom?.status === 'in_progress') {
      const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      const secret = pool.slice(0, 4).join('');
      updateRoomState((draft) => {
        if (!draft.state1a2b) return;
        draft.state1a2b.targetSecret = secret;
        const lockedInObj: Record<string, boolean> = {};
        const pList =
          draft.players && draft.players.length > 0
            ? draft.players
            : [draft.player1, draft.player2].filter(Boolean);
        pList.forEach((p) => {
          lockedInObj[p.uid] = true;
        });
        draft.state1a2b.lockedIn = lockedInObj;
      });
    }
  }, [isMultiplayer, state.targetSecret, currentRoom?.status]);

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
    if (historyTab === 'opponent') return g.guesserUid !== myUid;
    return true;
  });

  return (
    <div className="w-full flex flex-col items-center gap-3 sm:gap-4">
      {/* Dynamic Simultaneous Guessing Banner & Opponent Live Progress */}
      {bothLocked ? (
        <div className="w-full glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-5 border-2 border-white/80 shadow-md flex flex-col gap-2.5 sm:gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-[#96897B]/20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#628395] text-white flex items-center justify-center shadow-xs shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-[#2E2925]">
                    {isMultiplayer ? '多人搶猜競速中' : '即時競速搶答中'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#628395]/15 text-[#628395] border border-[#628395]/20">
                    {isMultiplayer ? `${allPlayers.length}人同猜系統密碼` : '雙方同時猜題'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#96897B] font-medium hidden sm:block">
                  {isMultiplayer
                    ? '所有玩家猜同一個系統密碼，對手數字已自動隱藏，搶先猜出 4A0B 者獲勝！'
                    : '不需等待對手！各自加速推理解密，搶先猜出 4A0B 者獲勝'}
                </p>
              </div>
            </div>

            {/* Turn speed comparison pill */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-[#96897B]">戰況：</span>
              <span className="text-[11px] sm:text-xs font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl bg-white/80 border border-[#96897B]/20 text-[#2E2925] shadow-2xs">
                我方已猜 {myGuesses.length} 次
              </span>
            </div>
          </div>

          {/* Live Opponent vs My Progress Cards (all players support) */}
          <div
            className={`grid gap-2 sm:gap-3 ${
              allPlayers.length > 2
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2'
            }`}
          >
            {allPlayers.map((p, idx) => {
              const isThisMe = p.uid === myUid;
              const pGuesses = allGuesses.filter((g) => g.guesserUid === p.uid);
              const bestA = pGuesses.length > 0 ? Math.max(...pGuesses.map((g) => g.bulls)) : 0;
              const theme = PLAYER_THEMES[idx % PLAYER_THEMES.length];

              return (
                <div
                  key={p.uid}
                  className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border flex items-center justify-between ${
                    isThisMe
                      ? 'bg-[#628395]/10 border-[#628395]/30'
                      : 'bg-[#CF995F]/10 border-[#CF995F]/30'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${theme.bg} text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      P{idx + 1}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-extrabold text-[#2E2925] truncate">
                        {p.displayName || `玩家${idx + 1}`} {isThisMe && ' (我)'}
                      </div>
                      <div className={`text-[10px] sm:text-[11px] font-bold ${theme.text}`}>
                        最佳：<span className="font-mono font-black">{bestA}A</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-mono font-black text-xs sm:text-base ${theme.text}`}>
                      {pGuesses.length}{' '}
                      <span className="text-[10px] font-bold text-[#96897B]">
                        {maxRounds > 0 ? `/ ${maxRounds}` : '次'}
                      </span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-[#96897B] font-semibold">
                      {pGuesses.length > 0 ? '解密對弈中' : '思考中...'}
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Main Game Arena Layout: Split into Left = 猜題輸入, Right = 猜題進度 on Mobile & Desktop */}
      <div className="w-full grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-12 lg:gap-5 items-start">
        {/* Left Column: 猜題輸入區 */}
        <div className="col-span-1 lg:col-span-6 flex flex-col items-center w-full">
          <div className="w-full glass-panel rounded-2xl sm:rounded-3xl p-2.5 sm:p-6 border-2 border-white/80 shadow-md flex flex-col">
            {/* Header info */}
            <div className="flex items-center justify-between mb-2 sm:mb-4 pb-1.5 sm:pb-3 border-b border-[#96897B]/20">
              <span className="font-extrabold text-xs sm:text-sm text-[#2E2925]">
                {!bothLocked
                  ? '出題設定'
                  : hasReachedMaxRounds
                  ? '已達上限'
                  : `第 ${myGuesses.length + 1} 回合`}
              </span>

              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-[#96897B]">
                  {isMultiplayer ? '目標：' : '自定：'}
                </span>
                <span className="font-mono font-black text-xs sm:text-sm bg-white/80 px-1.5 sm:px-2.5 py-0.5 rounded-lg text-[#628395] border border-[#96897B]/20 tracking-wider">
                  {isMultiplayer ? '系統密碼' : mySecret ? mySecret : '未鎖定'}
                </span>
              </div>
            </div>

            {/* Display slots */}
            <div className="flex justify-center gap-1 sm:gap-3 my-2 sm:my-4">
              {[0, 1, 2, 3].map((idx) => {
                const char = inputDigits[idx] || '';
                return (
                  <motion.div
                    key={idx}
                    animate={{ scale: char ? 1.05 : 1 }}
                    className={`w-7 h-9 sm:w-16 sm:h-20 rounded-lg sm:rounded-2xl flex items-center justify-center font-mono font-black text-base sm:text-3xl border-2 transition-all shadow-inner ${
                      char
                        ? 'bg-white text-[#2E2925] border-[#628395] shadow-xs'
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
                className="mb-2 max-w-xs mx-auto p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#DBAD6A]/15 border border-[#DBAD6A]/50 text-[10px] sm:text-xs font-bold text-[#2E2925] flex items-center justify-between shadow-xs w-full"
              >
                {hintRevealed ? (
                  <>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="w-5 h-5 rounded bg-[#DBAD6A] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                        💡
                      </span>
                      <span>
                        含數字【
                        <strong className="text-xs sm:text-base font-black text-[#628395] underline">
                          {targetSecret[1] || targetSecret[0] || '7'}
                        </strong>
                        】
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setHintRevealed(false);
                      }}
                      className="text-[9px] sm:text-[10px] text-[#8C6D3B] hover:text-[#5D4037] underline cursor-pointer"
                    >
                      隱藏
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-[#DBAD6A] text-white flex items-center justify-center font-black text-xs shrink-0 animate-pulse">
                        💡
                      </span>
                      <span className="text-[#8C6D3B] text-[10px] sm:text-xs">提示已解鎖</span>
                    </div>
                    <button
                      onClick={() => {
                        sound.playSuccess();
                        setHintRevealed(true);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-[#DBAD6A] hover:bg-[#c69a59] text-white font-black text-[10px] sm:text-[11px] shadow-xs cursor-pointer transition-all"
                    >
                      查看
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* Numeric Keypad (0-9, Backspace, Submit) */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2.5 max-w-xs mx-auto mb-2 sm:mb-3 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const isSelected = inputDigits.includes(digit.toString());
                const disabled =
                  (!bothLocked && myLocked) ||
                  (bothLocked && (!canGuess || isSettled)) ||
                  isSelected;

                return (
                  <motion.button
                    key={digit}
                    whileHover={!disabled ? { scale: 1.05 } : {}}
                    whileTap={!disabled ? { scale: 0.92 } : {}}
                    disabled={disabled}
                    onClick={() => handleDigitPress(digit)}
                    className={`h-9 sm:h-14 rounded-xl sm:rounded-2xl font-mono font-black text-sm sm:text-xl transition-all shadow-xs flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#96897B]/20 text-[#96897B] opacity-50 cursor-not-allowed border border-[#96897B]/20'
                        : disabled
                        ? 'bg-white/40 text-[#96897B]/50 cursor-not-allowed border border-white/40'
                        : 'bg-white/90 hover:bg-white text-[#2E2925] border border-white shadow-xs cursor-pointer hover:border-[#628395]'
                    }`}
                  >
                    {digit}
                  </motion.button>
                );
              })}

              {/* Backspace */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                disabled={inputDigits.length === 0}
                onClick={handleBackspace}
                className="h-9 sm:h-14 rounded-xl sm:rounded-2xl bg-white/70 hover:bg-white text-[#96897B] hover:text-[#2E2925] border border-[#96897B]/20 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="刪除上一位 (Backspace)"
              >
                <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              {/* 0 */}
              <motion.button
                whileHover={!inputDigits.includes('0') ? { scale: 1.05 } : {}}
                whileTap={!inputDigits.includes('0') ? { scale: 0.92 } : {}}
                disabled={
                  inputDigits.includes('0') ||
                  (!bothLocked && myLocked) ||
                  (bothLocked && (!canGuess || isSettled))
                }
                onClick={() => handleDigitPress(0)}
                className={`h-9 sm:h-14 rounded-xl sm:rounded-2xl font-mono font-black text-sm sm:text-xl transition-all shadow-xs flex items-center justify-center ${
                  inputDigits.includes('0')
                    ? 'bg-[#96897B]/20 text-[#96897B] opacity-50 cursor-not-allowed border border-[#96897B]/20'
                    : 'bg-white/90 hover:bg-white text-[#2E2925] border border-white shadow-xs cursor-pointer hover:border-[#628395]'
                }`}
              >
                0
              </motion.button>

              {/* Clear */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                disabled={inputDigits.length === 0}
                onClick={handleClear}
                className="h-9 sm:h-14 rounded-xl sm:rounded-2xl bg-white/70 hover:bg-white text-[10px] sm:text-xs font-bold text-[#96897B] hover:text-rose-600 border border-[#96897B]/20 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="全部清除 (Esc)"
              >
                清除
              </motion.button>
            </div>

            {/* Desktop Keyboard Quick Tip Bar */}
            <div className="hidden sm:flex items-center justify-center gap-2 text-[11px] font-bold text-[#96897B] mb-3 select-none">
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
                className={`w-full py-2 sm:py-3.5 px-2 sm:px-6 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  myLocked
                    ? 'bg-emerald-600 text-white cursor-default'
                    : inputDigits.length === 4
                    ? 'bg-[#628395] hover:bg-[#526f7f] text-white shadow-[#628395]/20'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {myLocked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>已鎖定密碼，等待對手</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>鎖定 4 位密碼 (Enter)</span>
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={canGuess && inputDigits.length === 4 ? { scale: 1.02 } : {}}
                whileTap={canGuess && inputDigits.length === 4 ? { scale: 0.98 } : {}}
                disabled={!canGuess || inputDigits.length !== 4}
                onClick={handleSubmitGuess}
                className={`w-full py-2 sm:py-3.5 px-2 sm:px-6 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                  canGuess && inputDigits.length === 4
                    ? 'bg-[#628395] hover:bg-[#526f7f] text-white shadow-[#628395]/20 cursor-pointer'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>
                  {hasReachedMaxRounds
                    ? '已達回合上限'
                    : `送出猜測 (${inputDigits.length}/4)`}
                </span>
              </motion.button>
            )}

            {/* Hint Feature Section on Desktop */}
            {bothLocked && (
              <div className="mt-3 pt-2.5 border-t border-[#96897B]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#2E2925]">
                    <Sparkles className="w-3.5 h-3.5 text-[#DBAD6A]" />
                    <span>
                      {hintEnabled ? `提示（第 ${hintRound} 回合）` : '無提示模式'}
                    </span>
                  </div>

                  {hintEnabled ? (
                    myGuesses.length >= hintRound ? (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setHintRevealed((prev) => !prev);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#DBAD6A] hover:bg-[#c69a59] text-white font-black text-[10px] sm:text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <span>{hintRevealed ? '隱藏' : '查看線索'}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#96897B] bg-white/70 px-2 py-0.5 rounded border border-[#96897B]/20">
                        再猜 {hintRound - myGuesses.length} 次
                      </span>
                    )
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 猜題進度區 (Mobile side-by-side with keypad!) */}
        <div className="col-span-1 lg:col-span-6 space-y-2 sm:space-y-4 w-full">
          <div className="glass-panel rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 border-2 border-white/80 shadow-md flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 sm:pb-3 border-b border-[#96897B]/20 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <span className="font-extrabold text-xs sm:text-sm text-[#2E2925]">
                猜題進度 ({allGuesses.length} 次)
              </span>

              {/* History Filter Tabs */}
              <div className="flex items-center gap-1 bg-white/70 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-[#96897B]/20 text-[10px] sm:text-xs">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setHistoryTab('all');
                  }}
                  className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold transition-all cursor-pointer ${
                    historyTab === 'all'
                      ? 'bg-[#628395] text-white shadow-2xs'
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
                  className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold transition-all cursor-pointer ${
                    historyTab === 'mine'
                      ? 'bg-[#628395] text-white shadow-2xs'
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
                  className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold transition-all cursor-pointer ${
                    historyTab === 'opponent'
                      ? 'bg-[#CF995F] text-white shadow-2xs'
                      : 'text-[#96897B] hover:text-[#2E2925]'
                  }`}
                >
                  {isMultiplayer ? '其他人' : '對手'} ({otherGuesses.length})
                </button>
              </div>
            </div>

            {/* Guesses list */}
            <div className="max-h-[300px] sm:max-h-[380px] overflow-y-auto space-y-1.5 sm:space-y-2 pr-0.5 sm:pr-1">
              {displayedGuesses.length === 0 ? (
                <div className="text-center py-12 sm:py-16 text-[11px] sm:text-xs text-[#96897B] font-medium">
                  {historyTab === 'opponent'
                    ? '其他人尚未送出任何猜題'
                    : historyTab === 'mine'
                    ? '我方尚未送出任何猜題'
                    : bothLocked
                    ? '已進入猜題競速！A/B 結果將在此即時對壘！'
                    : '密碼鎖定後，每一次猜測的 A/B 結果將在此即時對壘！'}
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
                  const guesserObj = allPlayers.find((p) => p.uid === g.guesserUid);
                  const guesserName = isMine
                    ? '我方'
                    : (guesserObj?.displayName || `P${guesserIndex + 1}`).slice(0, 4);

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: isMine ? -6 : 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between gap-1 sm:gap-3 ${
                        is4A0B
                          ? 'bg-[#DBAD6A]/25 border-[#DBAD6A] shadow-xs'
                          : isMine
                          ? 'bg-[#628395]/10 border-[#628395]/30'
                          : 'bg-[#CF995F]/10 border-[#CF995F]/30'
                      }`}
                    >
                      {/* Left: Tag + 猜測數字 (或遮蔽 ••••) + 幾A幾B */}
                      <div className="flex items-center gap-1 sm:gap-2.5 flex-wrap min-w-0">
                        <span
                          className={`text-[9px] sm:text-[10px] font-black px-1 sm:px-2 py-0.2 sm:py-0.5 rounded text-white shrink-0 ${theme.bg}`}
                        >
                          {guesserName}
                        </span>

                        {/* 不能顯示別人猜的數字：非我方猜測，一律以 •••• 遮蔽！ */}
                        <div className="flex items-center gap-1 sm:gap-2">
                          {isMine ? (
                            <span className="font-mono font-black text-xs sm:text-xl tracking-wider text-[#2E2925]">
                              {g.guess}
                            </span>
                          ) : (
                            <span className="font-mono font-black text-xs sm:text-base tracking-widest text-[#96897B] flex items-center gap-0.5">
                              <span>••••</span>
                              <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#96897B]/60 shrink-0" />
                            </span>
                          )}

                          <div className="flex items-center gap-0.5 sm:gap-1 font-mono font-black text-[10px] sm:text-xs">
                            <span className="px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-[#628395] text-white shadow-2xs">
                              {g.bulls}A
                            </span>
                            <span className="px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-[#CF995F] text-white shadow-2xs">
                              {g.cows}B
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: 破譯標籤或序號 */}
                      <div className="shrink-0 text-right">
                        {is4A0B ? (
                          <span className="text-[10px] sm:text-xs font-black text-[#DBAD6A] flex items-center gap-0.5 animate-bounce">
                            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 破譯!
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] font-mono text-[#96897B]">
                            #{displayedGuesses.length - idx}
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

              <p className="text-xs text-[#5D4037] leading-relaxed mb-5">
                受驗生已猜測滿 <strong>{hintRound}</strong> 回合，官方密碼線索已開放使用資格！您可以選擇現在立即查看，或保留到關鍵時刻再開啟。
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    sound.playSuccess();
                    setHintRevealed(true);
                    setHintUnlockedNotice(false);
                  }}
                  className="w-full py-3 px-5 rounded-2xl bg-[#DBAD6A] hover:bg-[#c69a59] text-white font-black text-xs shadow-md shadow-[#DBAD6A]/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>立即使用提示（查看線索）</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setHintUnlockedNotice(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white/80 hover:bg-white text-[#5D4037] font-bold text-xs border border-[#96897B]/20 transition-all cursor-pointer"
                >
                  保留提示，稍後再用
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
