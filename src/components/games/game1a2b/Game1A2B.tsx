import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Delete,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';
import { TurnBanner } from '../../common/TurnBanner';
import { sound } from '../../../services/soundService';
import type { GuessRecord, State1A2B } from '../../../types';

export const Game1A2B: React.FC = () => {
  const { currentRoom, updateRoomState, myRole } = useRoom();
  const { currentUser } = useAuth();

  const [inputDigits, setInputDigits] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [hintRevealed, setHintRevealed] = useState<boolean>(false);

  const state: State1A2B = currentRoom?.state1a2b || {
    secrets: {},
    lockedIn: {},
    guesses: [],
    currentTurnUid: currentRoom?.player1.uid || '',
    turnDeadline: Date.now() + 30000
  };

  const secrets = state.secrets || {};
  const lockedIn = state.lockedIn || {};
  const allGuesses = Array.isArray(state.guesses) ? state.guesses : [];

  const p1 = currentRoom?.player1;
  const p2 = currentRoom?.player2;
  const myUid = currentUser?.uid || '';
  const opponentUid = myRole === 'player1' ? p2?.uid || '' : p1?.uid || '';
  const opponentUser = myRole === 'player1' ? p2 : p1;

  const mySecret = secrets[myUid] || '';
  const myLocked = Boolean(lockedIn[myUid]);
  const opponentLocked = Boolean(lockedIn[opponentUid]);
  const bothLocked = myLocked && opponentLocked;

  const isMyTurn = bothLocked && state.currentTurnUid === myUid;
  const currentTurnPlayer = state.currentTurnUid === p1?.uid ? p1 : p2;

  // 30s Countdown timer during guessing phase
  useEffect(() => {
    if (!bothLocked || currentRoom?.status !== 'in_progress') return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((state.turnDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Timeout turn switch
      if (remaining === 0 && isMyTurn) {
        // Auto pass turn on timeout
        sound.playSplash();
        updateRoomState((draft) => {
          if (draft.state1a2b) {
            draft.state1a2b.currentTurnUid = opponentUid;
            draft.state1a2b.turnDeadline = Date.now() + 30000;
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bothLocked, state.turnDeadline, isMyTurn, currentRoom?.status, opponentUid]);

  // Keypad inputs
  const handleDigitPress = (d: number) => {
    sound.playClick();
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
    sound.playClick();

    await updateRoomState((draft) => {
      if (!draft.state1a2b) return;
      draft.state1a2b.secrets[myUid] = inputDigits;
      draft.state1a2b.lockedIn[myUid] = true;
      // If opponent already locked in, start 30s timer
      if (draft.state1a2b.lockedIn[opponentUid]) {
        draft.state1a2b.turnDeadline = Date.now() + 30000;
      }
    });

    setInputDigits('');
  };

  // Submit guess in battle phase
  const handleSubmitGuess = async () => {
    if (inputDigits.length !== 4 || !isMyTurn) return;
    sound.playClick();

    const targetSecret = secrets[opponentUid];
    if (!targetSecret) return;

    let bulls = 0; // A
    let cows = 0;  // B

    for (let i = 0; i < 4; i++) {
      if (inputDigits[i] === targetSecret[i]) {
        bulls++;
      } else if (targetSecret.includes(inputDigits[i])) {
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
      draft.state1a2b.guesses = [newRecord, ...draft.state1a2b.guesses];

      if (isWin) {
        draft.status = 'settled';
        draft.winnerUid = myUid;
      } else {
        draft.state1a2b.currentTurnUid = opponentUid;
        draft.state1a2b.turnDeadline = Date.now() + 30000;
      }
    });

    setInputDigits('');
  };

  // Filter guesses by player
  const myGuesses = state.guesses.filter((g) => g.guesserUid === myUid);
  const opponentGuesses = state.guesses.filter((g) => g.guesserUid === opponentUid);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Turn indicator banner */}
      {bothLocked ? (
        <TurnBanner
          isMyTurn={isMyTurn}
          currentTurnPlayerName={currentTurnPlayer?.displayName || ''}
          timeLeft={timeLeft}
          phaseLabel="猜題階段"
        />
      ) : (
        <div className="w-full flex justify-center py-2 px-4">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DBAD6A]/15 border border-[#DBAD6A] text-[#2E2925] font-extrabold text-sm shadow-sm backdrop-blur-md">
            <Lock className="w-4 h-4 text-[#DBAD6A]" />
            <span>出題階段：請各自為對手設定 4 位不重複數字秘密密碼</span>
          </div>
        </div>
      )}

      {/* Opponent Live Status (Req 1) */}
      {!bothLocked && (
        <div
          className={`w-full max-w-lg flex items-center justify-between px-4 py-2 rounded-2xl border text-xs font-bold shadow-xs transition-all ${
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
                ? `對手（${opponentUser?.displayName || '挑戰者'}）已完成出題，密碼已鎖定！`
                : `對手（${opponentUser?.displayName || '挑戰者'}）正在思考出題密碼中（未就緒）...`}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/70">
            {opponentLocked ? '已出題' : '思考中'}
          </span>
        </div>
      )}

      {/* Main Game Arena Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Input Pad & Secret Status */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full glass-panel rounded-3xl p-6 border-2 border-white/80 shadow-md">
            {/* Phase info */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#96897B]/20">
              <span className="font-extrabold text-sm text-[#2E2925]">
                {!bothLocked ? '出題設定' : isMyTurn ? '輪到你猜測！' : '等待對方猜測'}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#96897B]">我方密碼：</span>
                <span className="font-mono font-black text-sm bg-white/80 px-2.5 py-0.5 rounded-lg text-[#628395] border border-[#96897B]/20 tracking-wider">
                  {mySecret ? mySecret : '尚未鎖定'}
                </span>
              </div>
            </div>

            {/* Display slots */}
            <div className="flex justify-center gap-3 my-6">
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

            {/* Numeric Keypad (0-9, Backspace, Submit) */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const isSelected = inputDigits.includes(digit.toString());
                const disabled = (!bothLocked && myLocked) || (bothLocked && !isMyTurn) || isSelected;

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
                title="刪除上一位"
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
                  (bothLocked && !isMyTurn)
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
              >
                清除
              </motion.button>
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
                    <span>鎖定 4 位出題密碼</span>
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={isMyTurn && inputDigits.length === 4 ? { scale: 1.02 } : {}}
                whileTap={isMyTurn && inputDigits.length === 4 ? { scale: 0.98 } : {}}
                disabled={!isMyTurn || inputDigits.length !== 4}
                onClick={handleSubmitGuess}
                className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                  isMyTurn && inputDigits.length === 4
                    ? 'bg-[#628395] hover:bg-[#526f7f] text-white shadow-[#628395]/20 cursor-pointer'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>送出猜題結果</span>
              </motion.button>
            )}

            {/* 5-Round Hint Feature (Req 8) */}
            {bothLocked && (
              <div className="mt-4 pt-3.5 border-t border-[#96897B]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E2925]">
                    <Sparkles className="w-4 h-4 text-[#DBAD6A]" />
                    <span>5 回合提示功能</span>
                  </div>

                  {myGuesses.length >= 5 ? (
                    <button
                      onClick={() => {
                        sound.playClick();
                        setHintRevealed((prev) => !prev);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#DBAD6A] hover:bg-[#c69a59] text-white font-black text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <span>{hintRevealed ? '隱藏提示' : '💡 查看密碼線索'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-[#96897B] bg-white/70 px-2.5 py-1 rounded-lg border border-[#96897B]/20">
                      再猜 {5 - myGuesses.length} 次解鎖提示
                    </span>
                  )}
                </div>

                <AnimatePresence>
                  {hintRevealed && myGuesses.length >= 5 && secrets[opponentUid] && (
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
                          對手 4 位密碼中包含數字【
                          <strong className="text-sm font-black text-[#628395] underline">
                            {secrets[opponentUid][1] || secrets[opponentUid][0]}
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

        {/* Right Column: History Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel rounded-3xl p-5 border-2 border-white/80 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/20 mb-3">
              <span className="font-extrabold text-sm text-[#2E2925]">
                歷次猜題攻防紀錄 ({allGuesses.length} 次)
              </span>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-[#628395] font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#628395]" /> 我方
                </span>
                <span className="flex items-center gap-1 text-[#CF995F] font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CF995F]" /> 對手
                </span>
              </div>
            </div>

            {/* Guesses list */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {allGuesses.length === 0 ? (
                <div className="text-center py-16 text-xs text-[#96897B] font-medium">
                  雙方密碼鎖定後，每一次猜測的 A/B 結果將在此即時對壘！
                </div>
              ) : (
                allGuesses.map((g, idx) => {
                  const isMine = g.guesserUid === myUid;
                  const is4A0B = g.bulls === 4;

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
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#96897B] w-6">
                          #{allGuesses.length - idx}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md text-white ${
                            isMine ? 'bg-[#628395]' : 'bg-[#CF995F]'
                          }`}
                        >
                          {isMine ? '我方' : '對手'}
                        </span>
                        <span className="font-mono font-black text-lg tracking-widest text-[#2E2925]">
                          {g.guess}
                        </span>
                      </div>

                      {/* Badges for A and B */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-xl bg-[#628395] text-white shadow-xs">
                          {g.bulls}A
                        </span>
                        <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-xl bg-[#CF995F] text-white shadow-xs">
                          {g.cows}B
                        </span>
                        {is4A0B && (
                          <span className="text-xs font-black text-[#DBAD6A] ml-1 flex items-center gap-0.5">
                            <Sparkles className="w-3.5 h-3.5" /> 破解！
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
    </div>
  );
};
