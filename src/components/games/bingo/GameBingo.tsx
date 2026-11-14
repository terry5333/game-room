import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Shuffle,
  CheckCircle2,
  Trophy,
  Sparkles,
  Zap,
  Check
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
    if (board[r].every((num) => calledSet.has(num))) {
      count++;
      rows.push(r);
    }
  }

  // Check Columns
  for (let c = 0; c < 5; c++) {
    let allMarked = true;
    for (let r = 0; r < 5; r++) {
      if (!calledSet.has(board[r][c])) {
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
    if (!calledSet.has(board[i][i])) {
      diag1 = false;
      break;
    }
  }
  if (diag1) count++;

  let diag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!calledSet.has(board[i][4 - i])) {
      diag2 = false;
      break;
    }
  }
  if (diag2) count++;

  return { count, rows, cols, diag1, diag2 };
}

export const GameBingo: React.FC = () => {
  const { currentRoom, updateRoomState, myRole } = useRoom();
  const { currentUser } = useAuth();

  const [myBoard, setMyBoard] = useState<number[][]>([]);
  const [currentFillNumber, setCurrentFillNumber] = useState<number>(1);

  const state: StateBingo = currentRoom?.stateBingo || {
    boards: {},
    ready: {},
    calledNumbers: [],
    currentTurnUid: currentRoom?.player1.uid || '',
    linesCompleted: {}
  };

  const p1 = currentRoom?.player1;
  const p2 = currentRoom?.player2;
  const myUid = currentUser?.uid || '';
  const opponentUid = myRole === 'player1' ? p2?.uid || '' : p1?.uid || '';

  const myReady = Boolean(state.ready[myUid]);
  const opponentReady = Boolean(state.ready[opponentUid]);
  const bothReady = myReady && opponentReady;

  const isMyTurn = bothReady && state.currentTurnUid === myUid;
  const currentTurnPlayer = state.currentTurnUid === p1?.uid ? p1 : p2;

  // Initialize or load board
  useEffect(() => {
    if (state.boards[myUid]) {
      setMyBoard(state.boards[myUid]);
    } else if (myBoard.length === 0) {
      // Initialize empty 5x5 board with zeros
      const empty: number[][] = Array(5)
        .fill(0)
        .map(() => Array(5).fill(0));
      setMyBoard(empty);
    }
  }, [state.boards[myUid]]);

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

  // Ready up with completed board
  const handleConfirmReady = async () => {
    // Check if all 25 cells are filled with 1-25
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
    if (!isMyTurn || state.calledNumbers.includes(num)) return;
    sound.playClick();

    const nextCalled = [...state.calledNumbers, num];

    // Calculate lines for me
    const myLineResult = calculateLines(myBoard, nextCalled);
    // Calculate lines for opponent
    const oppBoard = state.boards[opponentUid];
    const oppLineResult = calculateLines(oppBoard, nextCalled);

    if (myLineResult.count >= 5 || oppLineResult.count >= 5) {
      sound.playBingoLine();
    }

    await updateRoomState((draft) => {
      if (!draft.stateBingo) return;
      draft.stateBingo.calledNumbers = nextCalled;
      draft.stateBingo.linesCompleted[myUid] = myLineResult.count;
      if (opponentUid) {
        draft.stateBingo.linesCompleted[opponentUid] = oppLineResult.count;
      }

      // Check win condition (5 lines)
      if (myLineResult.count >= 5 && oppLineResult.count >= 5) {
        draft.status = 'settled';
        draft.winnerUid = myUid; // Caller has priority
      } else if (myLineResult.count >= 5) {
        draft.status = 'settled';
        draft.winnerUid = myUid;
      } else if (oppLineResult.count >= 5) {
        draft.status = 'settled';
        draft.winnerUid = opponentUid;
      } else {
        draft.stateBingo.currentTurnUid = opponentUid;
      }
    });
  };

  // Check lines calculation for UI rendering
  const myLines = calculateLines(myBoard, state.calledNumbers);
  const myCompletedLines = myLines.count;
  const oppCompletedLines = state.linesCompleted[opponentUid] || 0;

  const isBoardFilled = myBoard.flat().every((n) => n >= 1 && n <= 25) && new Set(myBoard.flat()).size === 25;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Turn banner */}
      {bothReady ? (
        <TurnBanner
          isMyTurn={isMyTurn}
          currentTurnPlayerName={currentTurnPlayer?.displayName || ''}
          phaseLabel="賓果對局"
        />
      ) : (
        <div className="w-full flex justify-center py-2 px-4">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DBAD6A]/15 border border-[#DBAD6A] text-[#2E2925] font-extrabold text-sm shadow-sm backdrop-blur-md">
            <Grid className="w-4 h-4 text-[#DBAD6A]" />
            <span>準備階段：填入 1 到 25 或使用隨機排列快速佈盤</span>
          </div>
        </div>
      )}

      {/* Preparation Bar */}
      {!bothReady && !myReady && (
        <div className="w-full max-w-md glass-panel rounded-3xl p-4 border-2 border-white/80 shadow-md flex items-center justify-between gap-3">
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

      {/* Waiting for opponent */}
      {myReady && !bothReady && (
        <div className="px-6 py-2.5 rounded-2xl bg-white/70 border border-[#96897B]/20 text-xs font-bold text-[#628395] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>我方棋盤已就緒！等待對手佈局...</span>
        </div>
      )}

      {/* Line Score Status Bar */}
      {bothReady && (
        <div className="w-full max-w-md glass-panel rounded-2xl px-6 py-3 border border-white/70 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#628395]">我方連線：</span>
            <div className="flex items-center gap-1 font-mono font-extrabold text-base text-[#628395]">
              <span>{myCompletedLines}</span>
              <span className="text-xs text-[#96897B]">/ 5 條</span>
            </div>
          </div>

          <div className="h-4 w-px bg-[#96897B]/30" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#CF995F]">對手連線：</span>
            <div className="flex items-center gap-1 font-mono font-extrabold text-base text-[#CF995F]">
              <span>{oppCompletedLines}</span>
              <span className="text-xs text-[#96897B]">/ 5 條</span>
            </div>
          </div>
        </div>
      )}

      {/* 5x5 Bingo Board */}
      <div className="relative glass-panel rounded-3xl p-5 border-2 border-white/80 shadow-lg max-w-sm sm:max-w-md w-full aspect-square flex items-center justify-center">
        {/* Dynamic Glowing Lines overlays */}
        {bothReady && (
          <div className="absolute inset-5 pointer-events-none z-10">
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
        <div className="grid grid-cols-5 gap-2 w-full h-full">
          {myBoard.map((row, r) =>
            row.map((val, c) => {
              const isCalled = state.calledNumbers.includes(val);

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
                  className={`relative rounded-2xl flex items-center justify-center font-mono font-black text-base sm:text-xl transition-all shadow-sm ${
                    isCalled
                      ? 'bg-[#DBAD6A] text-white shadow-md shadow-[#DBAD6A]/30 border-2 border-white'
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
