import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Shuffle,
  CheckCircle2,
  Trophy,
  Sparkles,
  Zap,
  Check,
  Disc3,
  Clock
} from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';
import { TurnBanner } from '../../common/TurnBanner';
import { sound } from '../../../services/soundService';
import type { StateBingo } from '../../../types';

const BOARD_SIZE = 5;

// Helper to calculate completed lines on a 5x5 board
function calculateLines(board: number[][], calledNumbers: number[]): {
  count: number;
  rows: number[];
  cols: number[];
  diag1: boolean;
  diag2: boolean;
} {
  if (!board || board.length !== 5) return { count: 0, rows: [], cols: [], diag1: false, diag2: false };

  const calledSet = new Set(calledNumbers);
  let count = 0;
  const rows: number[] = [];
  const cols: number[] = [];

  // Check Rows
  for (let r = 0; r < 5; r++) {
    if (board[r] && board[r].every((num) => num > 0 && calledSet.has(num))) {
      count++;
      rows.push(r);
    }
  }

  // Check Columns
  for (let c = 0; c < 5; c++) {
    let allMarked = true;
    for (let r = 0; r < 5; r++) {
      if (!board[r] || !calledSet.has(board[r][c])) {
        allMarked = false;
        break;
      }
    }
    if (allMarked) {
      count++;
      cols.push(c);
    }
  }

  // Check Diagonals
  let diag1 = true;
  for (let i = 0; i < 5; i++) {
    if (!board[i] || !calledSet.has(board[i][i])) {
      diag1 = false;
      break;
    }
  }
  if (diag1) count++;

  let diag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!board[i] || !calledSet.has(board[i][4 - i])) {
      diag2 = false;
      break;
    }
  }
  if (diag2) count++;

  return { count, rows, cols, diag1, diag2 };
}

// 3D Ball colors palette for lottery chute
const BALL_GRADIENTS = [
  'radial-gradient(circle at 32% 32%, #FFF4D8 0%, #DBAD6A 55%, #8C6422 100%)',
  'radial-gradient(circle at 32% 32%, #E8F2F7 0%, #628395 55%, #374E5B 100%)',
  'radial-gradient(circle at 32% 32%, #F9ECE0 0%, #CF995F 55%, #7D5126 100%)',
  'radial-gradient(circle at 32% 32%, #ECE8E5 0%, #96897B 55%, #54493F 100%)',
  'radial-gradient(circle at 32% 32%, #E0DCCD 0%, #B8A97A 55%, #6B5E34 100%)'
];

export const GameBingo: React.FC = () => {
  const { currentRoom, updateRoomState, myRole, isHost } = useRoom();
  const { currentUser } = useAuth();

  const [myBoard, setMyBoard] = useState<number[][]>(() =>
    Array(5).fill(0).map(() => Array(5).fill(0))
  );
  const [currentFillNumber, setCurrentFillNumber] = useState<number>(1);

  const state: StateBingo = currentRoom?.stateBingo || {
    boards: {},
    ready: {},
    calledNumbers: [],
    currentTurnUid: currentRoom?.player1.uid || '',
    linesCompleted: {},
    targetLines: 5
  };

  const boards = state.boards || {};
  const ready = state.ready || {};
  const calledNumbers = Array.isArray(state.calledNumbers) ? state.calledNumbers : [];
  const linesCompleted = state.linesCompleted || {};
  const targetLines = state.targetLines || 5;

  const p1 = currentRoom?.player1;
  const p2 = currentRoom?.player2;
  const myUid = currentUser?.uid || '';
  const opponentUid = myRole === 'player1' ? p2?.uid || '' : p1?.uid || '';
  const opponentUser = myRole === 'player1' ? p2 : p1;

  const myReady = Boolean(ready[myUid]);
  const opponentReady = Boolean(ready[opponentUid]);
  const bothReady = myReady && opponentReady;

  const isMyTurn = bothReady && state.currentTurnUid === myUid && currentRoom?.status !== 'settled';
  const currentTurnPlayer = state.currentTurnUid === p1?.uid ? p1 : p2;

  // Initialize or reset board:
  // When boards[myUid] is unset (e.g. start of round or rematch), reset to BLANK board
  useEffect(() => {
    if (boards[myUid] && Array.isArray(boards[myUid]) && boards[myUid].length === 5) {
      setMyBoard(boards[myUid]);
    } else {
      // Re-arm with a completely fresh empty board
      const empty: number[][] = Array(5)
        .fill(0)
        .map(() => Array(5).fill(0));
      setMyBoard(empty);
      setCurrentFillNumber(1);
    }
  }, [boards[myUid], currentRoom?.status]);

  // Random shuffle numbers 1-25
  const handleRandomShuffle = () => {
    sound.playClick();
    const nums = Array.from({ length: 25 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    const grid: number[][] = [];
    for (let r = 0; r < 5; r++) {
      grid.push(nums.slice(r * 5, (r + 1) * 5));
    }
    setMyBoard(grid);
    setCurrentFillNumber(26);
  };

  // Click cell to fill number sequentially
  const handleCellFill = (r: number, c: number) => {
    if (myReady || myBoard[r][c] !== 0 || currentFillNumber > 25) return;
    sound.playClick();

    const copy = myBoard.map((row) => [...row]);
    copy[r][c] = currentFillNumber;
    setMyBoard(copy);
    setCurrentFillNumber((prev) => prev + 1);
  };

  // Host changes winning target lines (1-5)
  const handleSetTargetLines = async (lines: number) => {
    if (!isHost || myReady || bothReady) return;
    sound.playClick();
    await updateRoomState((draft) => {
      if (!draft.stateBingo) return;
      draft.stateBingo.targetLines = lines;
    });
  };

  // Ready up with completed board
  const handleConfirmReady = async () => {
    const flat = myBoard.flat();
    const allFilled = flat.every((n) => n >= 1 && n <= 25) && new Set(flat).size === 25;
    if (!allFilled) return;

    sound.playClick();
    await updateRoomState((draft) => {
      if (!draft.stateBingo) return;
      draft.stateBingo.boards[myUid] = myBoard;
      draft.stateBingo.ready[myUid] = true;
      draft.stateBingo.linesCompleted[myUid] = 0;
    });
  };

  // Call number during turn
  const handleCallNumber = async (num: number) => {
    if (!isMyTurn || calledNumbers.includes(num)) return;
    sound.playClick();

    const nextCalled = [...calledNumbers, num];

    // Calculate lines for me
    const myLineResult = calculateLines(myBoard, nextCalled);
    // Calculate lines for opponent
    const oppBoard = boards[opponentUid] || [];
    const oppLineResult = calculateLines(oppBoard, nextCalled);

    if (myLineResult.count >= targetLines || oppLineResult.count >= targetLines) {
      sound.playBingoLine();
    }

    await updateRoomState((draft) => {
      if (!draft.stateBingo) return;
      draft.stateBingo.calledNumbers = nextCalled;
      draft.stateBingo.linesCompleted[myUid] = myLineResult.count;
      if (opponentUid) {
        draft.stateBingo.linesCompleted[opponentUid] = oppLineResult.count;
      }

      // Check win condition based on host's targetLines
      const winGoal = draft.stateBingo.targetLines || 5;
      if (myLineResult.count >= winGoal && oppLineResult.count >= winGoal) {
        draft.status = 'settled';
        draft.winnerUid = myUid; // Active caller gets win priority
      } else if (myLineResult.count >= winGoal) {
        draft.status = 'settled';
        draft.winnerUid = myUid;
      } else if (oppLineResult.count >= winGoal) {
        draft.status = 'settled';
        draft.winnerUid = opponentUid;
      } else {
        draft.stateBingo.currentTurnUid = opponentUid;
      }
    });
  };

  // Calculate lines for local rendering
  const myLines = calculateLines(myBoard, calledNumbers);
  const myCompletedLines = myLines.count;
  const oppCompletedLines = linesCompleted[opponentUid] || 0;

  const isBoardFilled =
    myBoard.flat().every((n) => n >= 1 && n <= 25) && new Set(myBoard.flat()).size === 25;

  // The latest 5 called numbers for the rolling chute
  const recentBalls = calledNumbers.slice(-5);
  // Empty slots needed to display 5 total slots
  const emptySlotsCount = Math.max(0, 5 - recentBalls.length);

  return (
    <div className="w-full flex flex-col items-center gap-3 sm:gap-4">
      {/* Turn banner */}
      {bothReady ? (
        <TurnBanner
          isMyTurn={isMyTurn}
          currentTurnPlayerName={currentTurnPlayer?.displayName || ''}
          phaseLabel={`賓果對局（目標 ${targetLines} 條線）`}
        />
      ) : (
        <div className="w-full flex justify-center py-1.5 px-4">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DBAD6A]/15 border border-[#DBAD6A] text-[#2E2925] font-extrabold text-xs sm:text-sm shadow-sm backdrop-blur-md">
            <Grid className="w-4 h-4 text-[#DBAD6A]" />
            <span>準備階段：填入 1 到 25 或使用「隨機排列」快速佈盤</span>
          </div>
        </div>
      )}

      {/* Target Lines Configuration Bar during Preparation Phase */}
      {!bothReady && (
        <div className="w-full max-w-md glass-panel rounded-2xl px-4 py-2.5 border border-white/70 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E2925]">
            <Trophy className="w-4 h-4 text-[#DBAD6A]" />
            <span>{isHost ? '房主設定獲勝連線數：' : '獲勝條件：'}</span>
          </div>

          {isHost && !myReady ? (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => handleSetTargetLines(count)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    targetLines === count
                      ? 'bg-[#DBAD6A] text-white shadow-xs font-black'
                      : 'bg-white/80 hover:bg-white text-[#2E2925] border border-[#96897B]/20'
                  }`}
                >
                  {count} 條
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-1 rounded-xl bg-[#DBAD6A]/20 text-[#DBAD6A] font-extrabold text-xs border border-[#DBAD6A]/40 flex items-center gap-1">
              <span>率先達成</span>
              <span className="font-mono text-sm underline">{targetLines}</span>
              <span>條線即勝</span>
            </div>
          )}
        </div>
      )}

      {/* Opponent Status Indicator (Req 1) */}
      {!bothReady && (
        <div
          className={`w-full max-w-md flex items-center justify-between px-4 py-2 rounded-2xl border text-xs font-bold shadow-xs transition-all ${
            opponentReady
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {opponentReady ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            )}
            <span>
              {opponentReady
                ? `對手（${opponentUser?.displayName || '挑戰者'}）已排好數字，準備就緒！`
                : `對手（${opponentUser?.displayName || '挑戰者'}）正在填寫數字中（未就緒）...`}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/70">
            {opponentReady ? '已就緒' : '佈局中'}
          </span>
        </div>
      )}

      {/* Preparation Action Bar */}
      {!bothReady && !myReady && (
        <div className="w-full max-w-md glass-panel rounded-3xl p-3 sm:p-4 border-2 border-white/80 shadow-md flex items-center justify-between gap-3">
          <button
            onClick={handleRandomShuffle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#CF995F]/15 hover:bg-[#CF995F]/25 text-xs font-bold text-[#CF995F] border border-[#CF995F]/30 shadow-xs cursor-pointer transition-all"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>隨機排列 (1-25)</span>
          </button>

          <motion.button
            whileHover={isBoardFilled ? { scale: 1.03 } : {}}
            whileTap={isBoardFilled ? { scale: 0.97 } : {}}
            disabled={!isBoardFilled}
            onClick={handleConfirmReady}
            className={`px-5 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all ${
              isBoardFilled
                ? 'bg-[#628395] hover:bg-[#526f7f] text-white cursor-pointer shadow-[#628395]/20'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>完成並準備</span>
          </motion.button>
        </div>
      )}

      {/* Waiting for opponent indicator */}
      {myReady && !bothReady && (
        <div className="px-6 py-2.5 rounded-2xl bg-white/70 border border-[#96897B]/20 text-xs font-bold text-[#628395] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>我方棋盤已就緒！等待對手佈局...</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. ROLLING LOTTERY BALL CHUTE (彩球進球軌道：一次顯示5顆，新球將舊球向前推) */}
      {/* ============================================================== */}
      {bothReady && (
        <div className="w-full max-w-md glass-panel rounded-3xl p-2.5 sm:p-3 border-2 border-white/80 shadow-md flex items-center justify-between gap-2 overflow-hidden">
          {/* Chute title tag */}
          <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-2xl bg-white/70 border border-white text-[11px] font-extrabold text-[#628395]">
            <Disc3 className="w-4 h-4 text-[#DBAD6A] animate-spin" />
            <span className="hidden sm:inline">彩球出球軌道</span>
            <span className="sm:hidden">出球</span>
          </div>

          {/* 5-Slot Rolling Track */}
          <div className="flex-1 flex items-center justify-end gap-2 overflow-hidden min-h-[44px]">
            {/* Empty placeholder slots when fewer than 5 balls have entered */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-dashed border-[#96897B]/30 bg-white/30 flex items-center justify-center text-[10px] text-[#96897B]/40 font-mono"
              >
                ·
              </div>
            ))}

            {/* Live rolling balls sliding in and pushing forward */}
            <AnimatePresence initial={false} mode="popLayout">
              {recentBalls.map((num, idx) => {
                const isLatest = idx === recentBalls.length - 1;
                const gradientIndex = num % BALL_GRADIENTS.length;

                return (
                  <motion.div
                    key={`ball-${num}`}
                    layout
                    initial={{ x: 50, scale: 0.3, opacity: 0, rotate: 180 }}
                    animate={{ x: 0, scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ x: -50, scale: 0.3, opacity: 0, rotate: -180 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                    style={{ background: BALL_GRADIENTS[gradientIndex] }}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 flex items-center justify-center shadow-md select-none ${
                      isLatest
                        ? 'ring-2 ring-[#DBAD6A] shadow-[0_0_12px_#DBAD6A]'
                        : 'border border-white/60'
                    }`}
                  >
                    {/* Spherical specular highlight dot */}
                    <div className="absolute top-1 left-1.5 w-2 h-1.5 rounded-full bg-white/70 blur-[0.4px] pointer-events-none" />

                    {/* Center white badge for high-contrast legible number */}
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/95 flex items-center justify-center shadow-xs">
                      <span className="text-[10px] sm:text-xs font-black font-mono text-[#2E2925]">
                        {num}
                      </span>
                    </div>

                    {/* "最新" label for the newest entry */}
                    {isLatest && (
                      <span className="absolute -bottom-1 -right-0.5 text-[8px] font-black px-1 rounded-full bg-[#DBAD6A] text-white shadow-xs">
                        新
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Line Score Status Bar */}
      {bothReady && (
        <div className="w-full max-w-md glass-panel rounded-2xl px-6 py-2.5 border border-white/70 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#628395]">我方連線：</span>
            <div className="flex items-center gap-1 font-mono font-extrabold text-base text-[#628395]">
              <span>{myCompletedLines}</span>
              <span className="text-xs text-[#96897B]">/ {targetLines} 條</span>
            </div>
          </div>

          <div className="h-4 w-px bg-[#96897B]/30" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#CF995F]">對手連線：</span>
            <div className="flex items-center gap-1 font-mono font-extrabold text-base text-[#CF995F]">
              <span>{oppCompletedLines}</span>
              <span className="text-xs text-[#96897B]">/ {targetLines} 條</span>
            </div>
          </div>
        </div>
      )}

      {/* 5x5 Bingo Board */}
      <div className="relative glass-panel rounded-3xl p-4 sm:p-5 border-2 border-white/80 shadow-lg max-w-sm sm:max-w-md w-full aspect-square flex items-center justify-center">
        {/* Dynamic Glowing Lines overlays */}
        {bothReady && (
          <div className="absolute inset-4 sm:inset-5 pointer-events-none z-10">
            {/* Rows glowing lines */}
            {myLines.rows.map((r) => (
              <motion.div
                key={`row-${r}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute left-0 right-0 h-1.5 bg-[#DBAD6A] rounded-full shadow-[0_0_12px_#DBAD6A]"
                style={{ top: `${(r + 0.5) * 20}%`, transform: 'translateY(-50%)' }}
              />
            ))}

            {/* Columns glowing lines */}
            {myLines.cols.map((c) => (
              <motion.div
                key={`col-${c}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                className="absolute top-0 bottom-0 w-1.5 bg-[#DBAD6A] rounded-full shadow-[0_0_12px_#DBAD6A]"
                style={{ left: `${(c + 0.5) * 20}%`, transform: 'translateX(-50%)' }}
              />
            ))}

            {/* Diagonal 1 */}
            {myLines.diag1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-0 left-0 w-[141%] h-1.5 bg-[#DBAD6A] origin-top-left rotate-45 shadow-[0_0_12px_#DBAD6A]"
              />
            )}

            {/* Diagonal 2 */}
            {myLines.diag2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-0 right-0 w-[141%] h-1.5 bg-[#DBAD6A] origin-top-right -rotate-45 shadow-[0_0_12px_#DBAD6A]"
              />
            )}
          </div>
        )}

        {/* 5x5 Grid Cells */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full h-full">
          {myBoard.map((row, r) =>
            row.map((val, c) => {
              const isCalled = val > 0 && calledNumbers.includes(val);

              return (
                <motion.button
                  key={`${r}-${c}`}
                  whileHover={bothReady && isMyTurn && !isCalled ? { scale: 1.08 } : {}}
                  whileTap={bothReady && isMyTurn && !isCalled ? { scale: 0.94 } : {}}
                  disabled={myReady && (!bothReady || !isMyTurn || isCalled)}
                  onClick={() => {
                    if (!myReady) {
                      handleCellFill(r, c);
                    } else if (bothReady && isMyTurn && !isCalled) {
                      handleCallNumber(val);
                    }
                  }}
                  className={`relative rounded-2xl flex items-center justify-center font-mono font-black text-sm sm:text-lg transition-all shadow-sm ${
                    isCalled
                      ? 'bg-[#DBAD6A] text-white shadow-md shadow-[#DBAD6A]/30 border-2 border-white ring-1 ring-[#DBAD6A]'
                      : val !== 0
                      ? 'bg-white/85 text-[#2E2925] border border-white hover:border-[#628395]'
                      : 'bg-white/40 text-[#96897B] border border-dashed border-[#96897B]/30'
                  }`}
                >
                  {val !== 0 ? (
                    <span>{val}</span>
                  ) : (
                    <span className="text-xs font-normal text-[#96897B]/60">空</span>
                  )}

                  {isCalled && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.span>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
