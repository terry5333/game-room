import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, ArrowDown, Bot } from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';
import { TurnBanner } from '../../common/TurnBanner';
import { sound } from '../../../services/soundService';
import type { StateConnect4 } from '../../../types';

const ROWS = 6;
const COLS = 7;

// Check 4-in-a-row in all 4 directions
export function checkConnectFourWinner(grid: (string | null)[][]): {
  winner: string;
  winningLine: { r: number; c: number }[];
} | null {
  // Horizontal (—)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const u = grid[r]?.[c];
      if (u && u.trim() !== '' &&
          u === grid[r]?.[c + 1] &&
          u === grid[r]?.[c + 2] &&
          u === grid[r]?.[c + 3]) {
        return {
          winner: u,
          winningLine: [
            { r, c },
            { r, c: c + 1 },
            { r, c: c + 2 },
            { r, c: c + 3 }
          ]
        };
      }
    }
  }

  // Vertical (|)
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const u = grid[r]?.[c];
      if (u && u.trim() !== '' &&
          u === grid[r + 1]?.[c] &&
          u === grid[r + 2]?.[c] &&
          u === grid[r + 3]?.[c]) {
        return {
          winner: u,
          winningLine: [
            { r, c },
            { r: r + 1, c },
            { r: r + 2, c },
            { r: r + 3, c }
          ]
        };
      }
    }
  }

  // Diagonal Down-Right (\)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const u = grid[r]?.[c];
      if (u && u.trim() !== '' &&
          u === grid[r + 1]?.[c + 1] &&
          u === grid[r + 2]?.[c + 2] &&
          u === grid[r + 3]?.[c + 3]) {
        return {
          winner: u,
          winningLine: [
            { r, c },
            { r: r + 1, c: c + 1 },
            { r: r + 2, c: c + 2 },
            { r: r + 3, c: c + 3 }
          ]
        };
      }
    }
  }

  // Diagonal Up-Right (/)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const u = grid[r]?.[c];
      if (u && u.trim() !== '' &&
          u === grid[r - 1]?.[c + 1] &&
          u === grid[r - 2]?.[c + 2] &&
          u === grid[r - 3]?.[c + 3]) {
        return {
          winner: u,
          winningLine: [
            { r, c },
            { r: r - 1, c: c + 1 },
            { r: r - 2, c: c + 2 },
            { r: r - 3, c: c + 3 }
          ]
        };
      }
    }
  }

  return null;
}

// Find lowest unoccupied row in a column
export function getLowestEmptyRow(grid: (string | null)[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    const val = grid[r]?.[col];
    if (!val || val.trim() === '') {
      return r;
    }
  }
  return -1;
}

export const GameConnect4: React.FC = () => {
  const { currentRoom, updateRoomState, myRole } = useRoom();
  const { currentUser } = useAuth();
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const aiThinkingRef = useRef(false);

  const state: StateConnect4 = currentRoom?.stateConnect4 || {
    grid: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
    currentTurnUid: currentRoom?.player1?.uid || ''
  };

  const grid: (string | null)[][] = Array.isArray(state.grid)
    ? state.grid.map((row) =>
        Array.isArray(row)
          ? row.map((cell) => (cell && cell.trim() !== '' ? cell : null))
          : Array(COLS).fill(null)
      )
    : Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

  const p1 = currentRoom?.player1;
  const p2 = currentRoom?.player2;
  const myUid = currentUser?.uid || '';
  const players = currentRoom?.players || [p1, p2].filter(Boolean);
  const otherPlayer = players.find((p) => p && p.uid !== myUid);
  const opponentUid = otherPlayer?.uid || (myRole === 'player1' ? (p2?.uid || 'ai_bot') : (p1?.uid || ''));

  const isSoloVsAI = !p2 || p2.uid === 'ai_bot' || players.length <= 1;
  const isMyTurn = state.currentTurnUid === myUid && currentRoom?.status !== 'settled';
  const isP1 = myUid === p1?.uid;

  const currentTurnPlayer =
    state.currentTurnUid === p1?.uid
      ? p1
      : state.currentTurnUid === p2?.uid
      ? p2
      : isSoloVsAI && state.currentTurnUid === 'ai_bot'
      ? { uid: 'ai_bot', displayName: '昭和棋士 AI', avatar: '🤖' }
      : otherPlayer;

  // AI Solo opponent move logic
  useEffect(() => {
    if (!isSoloVsAI || currentRoom?.status === 'settled') return;
    if (state.currentTurnUid !== 'ai_bot' || aiThinkingRef.current) return;

    aiThinkingRef.current = true;
    const timer = setTimeout(async () => {
      try {
        // Find best column: 1. Win move, 2. Block move, 3. Center preference, 4. Random valid
        let targetCol = -1;

        // 1. Check AI winning move
        for (let c = 0; c < COLS; c++) {
          const r = getLowestEmptyRow(grid, c);
          if (r !== -1) {
            const testGrid = grid.map((row) => [...row]);
            testGrid[r][c] = 'ai_bot';
            if (checkConnectFourWinner(testGrid)) {
              targetCol = c;
              break;
            }
          }
        }

        // 2. Check block opponent winning move
        if (targetCol === -1) {
          for (let c = 0; c < COLS; c++) {
            const r = getLowestEmptyRow(grid, c);
            if (r !== -1) {
              const testGrid = grid.map((row) => [...row]);
              testGrid[r][c] = myUid;
              if (checkConnectFourWinner(testGrid)) {
                targetCol = c;
                break;
              }
            }
          }
        }

        // 3. Strategic column preference: Center (3), then 2, 4, 1, 5, 0, 6
        if (targetCol === -1) {
          const priority = [3, 2, 4, 1, 5, 0, 6];
          for (const c of priority) {
            if (getLowestEmptyRow(grid, c) !== -1) {
              targetCol = c;
              break;
            }
          }
        }

        if (targetCol !== -1) {
          await dropDisc(targetCol, 'ai_bot', myUid);
        }
      } finally {
        aiThinkingRef.current = false;
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [state.currentTurnUid, isSoloVsAI, currentRoom?.status, grid]);

  // Drop disc into column
  const dropDisc = async (col: number, playerUid: string, nextTurnUid: string) => {
    const row = getLowestEmptyRow(grid, col);
    if (row === -1) return; // Column is full

    sound.playDiscDrop();

    const newGrid = grid.map((rArr) => [...rArr]);
    newGrid[row][col] = playerUid;

    const winResult = checkConnectFourWinner(newGrid);

    // Check draw (top row full)
    const isBoardFull = newGrid[0].every((cell) => cell && cell.trim() !== '');

    if (winResult) {
      sound.playConnectFourWin();
      sound.playVictory();
    } else if (isBoardFull) {
      sound.playDraw();
    }

    await updateRoomState((draft) => {
      if (!draft.stateConnect4) {
        draft.stateConnect4 = {
          grid: newGrid,
          currentTurnUid: nextTurnUid,
          lastDrop: { r: row, c: col, uid: playerUid }
        };
      } else {
        draft.stateConnect4.grid = newGrid;
        draft.stateConnect4.lastDrop = { r: row, c: col, uid: playerUid };
      }

      if (winResult) {
        draft.status = 'settled';
        draft.winnerUid = winResult.winner;
        draft.stateConnect4.winningLine = winResult.winningLine;
      } else if (isBoardFull) {
        draft.status = 'settled';
        draft.winnerUid = 'draw';
      } else {
        draft.stateConnect4.currentTurnUid = nextTurnUid;
      }
    });
  };

  const handleColumnClick = async (col: number) => {
    if (!isMyTurn || currentRoom?.status === 'settled') return;
    const row = getLowestEmptyRow(grid, col);
    if (row === -1) return; // Full column

    const nextUid = isSoloVsAI ? 'ai_bot' : opponentUid;
    await dropDisc(col, myUid, nextUid);
  };

  const winningCells = state.winningLine || [];
  const isWinningCell = (r: number, c: number) =>
    winningCells.some((pt) => pt.r === r && pt.c === c);

  return (
    <div className="w-full flex flex-col items-center gap-4 py-2">
      {/* Turn Banner */}
      <TurnBanner
        isMyTurn={isMyTurn}
        currentTurnPlayerName={currentTurnPlayer?.displayName || '玩家'}
        phaseLabel="四子棋 重力連線爭霸"
      />

      {/* Player identity badges */}
      <div className="glass-panel rounded-2xl px-5 py-2.5 border border-white/70 shadow-sm flex items-center gap-4 sm:gap-6 text-xs font-bold">
        <div className="flex items-center gap-2 text-[#D34836]">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E25C4B] to-[#B83A2E] shadow-sm flex items-center justify-center text-white text-[10px]">
            ●
          </span>
          <span>{p1?.displayName || '玩家1'} (紅先)</span>
          {myUid === p1?.uid && <span className="text-[10px] bg-[#D34836]/10 px-1.5 py-0.5 rounded text-[#D34836]">你</span>}
        </div>
        <div className="h-4 w-px bg-[#96897B]/30" />
        <div className="flex items-center gap-2 text-[#DBAD6A]">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E5BE7E] to-[#C99849] shadow-sm flex items-center justify-center text-white text-[10px]">
            ●
          </span>
          <span>
            {isSoloVsAI ? '昭和棋士 AI' : p2?.displayName || otherPlayer?.displayName || '玩家2'} (黃後)
          </span>
          {myUid !== p1?.uid && !isSoloVsAI && <span className="text-[10px] bg-[#DBAD6A]/10 px-1.5 py-0.5 rounded text-[#DBAD6A]">你</span>}
          {isSoloVsAI && (
            <span className="text-[10px] bg-[#628395]/10 text-[#628395] px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Bot className="w-3 h-3" /> 單人練習
            </span>
          )}
        </div>
      </div>

      {/* Connect Four Board Container */}
      <div className="relative max-w-md sm:max-w-lg w-full flex flex-col items-center">
        {/* Column Hover Drop Indicators */}
        <div className="grid grid-cols-7 gap-2 w-full px-4 sm:px-6 mb-1 h-7">
          {Array.from({ length: COLS }).map((_, c) => {
            const isFull = getLowestEmptyRow(grid, c) === -1;
            const isTarget = hoverCol === c && isMyTurn && !isFull && currentRoom?.status !== 'settled';

            return (
              <div
                key={`indicator-${c}`}
                className="flex items-center justify-center"
              >
                <AnimatePresence>
                  {isTarget && (
                    <motion.div
                      initial={{ y: -6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -6, opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <ArrowDown className={`w-4 h-4 animate-bounce ${isP1 ? 'text-[#D34836]' : 'text-[#DBAD6A]'}`} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* The Vertical Grid Matrix */}
        <div
          className="w-full bg-gradient-to-b from-[#2B4C6F] to-[#1C3550] p-3 sm:p-4 rounded-3xl shadow-2xl border-4 border-[#3D638D] relative overflow-hidden"
          onMouseLeave={() => setHoverCol(null)}
        >
          {/* Subtle retro frame screws */}
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#152538] border border-white/20" />
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#152538] border border-white/20" />
          <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#152538] border border-white/20" />
          <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#152538] border border-white/20" />

          {/* 7 Columns */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {Array.from({ length: COLS }).map((_, c) => {
              const colFull = getLowestEmptyRow(grid, c) === -1;
              const canClick = isMyTurn && !colFull && currentRoom?.status !== 'settled';

              return (
                <div
                  key={`col-${c}`}
                  onMouseEnter={() => setHoverCol(c)}
                  onClick={() => canClick && handleColumnClick(c)}
                  className={`flex flex-col gap-1.5 sm:gap-2.5 rounded-2xl p-1 transition-all ${
                    canClick ? 'cursor-pointer hover:bg-white/10' : ''
                  }`}
                >
                  {Array.from({ length: ROWS }).map((_, r) => {
                    const cellUid = grid[r]?.[c];
                    const isOccupied = Boolean(cellUid && cellUid.trim() !== '');
                    const isCellP1 = cellUid === p1?.uid;
                    const isWinning = isWinningCell(r, c);

                    return (
                      <div
                        key={`cell-${r}-${c}`}
                        className="relative aspect-square w-full rounded-full bg-[#132233] border-2 border-[#1E3752] shadow-inner flex items-center justify-center overflow-hidden"
                      >
                        {/* Ghost disc preview on hover */}
                        {hoverCol === c && !isOccupied && r === getLowestEmptyRow(grid, c) && isMyTurn && currentRoom?.status !== 'settled' && (
                          <div
                            className={`w-full h-full rounded-full opacity-40 transition-all ${
                              isP1
                                ? 'bg-gradient-to-br from-[#E25C4B] to-[#B83A2E]'
                                : 'bg-gradient-to-br from-[#E5BE7E] to-[#C99849]'
                            }`}
                          />
                        )}

                        {/* Occupied Disc with drop spring physics */}
                        <AnimatePresence>
                          {isOccupied && (
                            <motion.div
                              initial={{ y: -(r + 1) * 55, opacity: 0.8 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{
                                type: 'spring',
                                bounce: 0.35,
                                duration: 0.45
                              }}
                              className={`w-full h-full rounded-full shadow-lg flex items-center justify-center relative transition-all ${
                                isWinning
                                  ? 'ring-4 ring-[#FFDF78] ring-offset-2 ring-offset-[#2B4C6F] animate-pulse z-10'
                                  : ''
                              } ${
                                isCellP1
                                  ? 'bg-gradient-to-br from-[#E86150] via-[#D34836] to-[#99281D] border-2 border-[#FFA194]'
                                  : 'bg-gradient-to-br from-[#F5D08C] via-[#DBAD6A] to-[#A3742C] border-2 border-[#FFE8BD]'
                              }`}
                            >
                              {/* Inner radial bevel ridge */}
                              <div className="w-3/5 h-3/5 rounded-full border border-white/30 flex items-center justify-center">
                                {isWinning && (
                                  <Trophy className="w-3.5 h-3.5 text-white drop-shadow" />
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Board base stand legs */}
        <div className="flex justify-between w-full px-6 -mt-1 z-0">
          <div className="w-12 h-5 bg-[#1C3550] rounded-b-xl border-x-2 border-b-2 border-[#3D638D] shadow-md" />
          <div className="w-12 h-5 bg-[#1C3550] rounded-b-xl border-x-2 border-b-2 border-[#3D638D] shadow-md" />
        </div>
      </div>

      {/* Rules summary note */}
      <div className="text-xs text-[#96897B] font-semibold text-center max-w-sm flex items-center justify-center gap-1.5 mt-2">
        <Sparkles className="w-3.5 h-3.5 text-[#DBAD6A]" />
        <span>點擊任意行落子，重力沉底！橫、直、斜率先連成四顆者獲勝。</span>
      </div>
    </div>
  );
};
