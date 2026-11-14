import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';
import { TurnBanner } from '../../common/TurnBanner';
import { sound } from '../../../services/soundService';
import type { StateOOXX } from '../../../types';

// Helper to check 3 in a row
function checkWinningLine(grid: (string | null)[][]): { winner: string; line: { r: number; c: number }[] } | null {
  // Check rows
  for (let r = 0; r < 3; r++) {
    if (grid[r][0] && grid[r][0] === grid[r][1] && grid[r][0] === grid[r][2]) {
      return {
        winner: grid[r][0]!,
        line: [
          { r, c: 0 },
          { r, c: 1 },
          { r, c: 2 }
        ]
      };
    }
  }

  // Check cols
  for (let c = 0; c < 3; c++) {
    if (grid[0][c] && grid[0][c] === grid[1][c] && grid[0][c] === grid[2][c]) {
      return {
        winner: grid[0][c]!,
        line: [
          { r: 0, c },
          { r: 1, c },
          { r: 2, c }
        ]
      };
    }
  }

  // Diagonals
  if (grid[0][0] && grid[0][0] === grid[1][1] && grid[0][0] === grid[2][2]) {
    return {
      winner: grid[0][0]!,
      line: [
        { r: 0, c: 0 },
        { r: 1, c: 1 },
        { r: 2, c: 2 }
      ]
    };
  }

  if (grid[0][2] && grid[0][2] === grid[1][1] && grid[0][2] === grid[2][0]) {
    return {
      winner: grid[0][2]!,
      line: [
        { r: 0, c: 2 },
        { r: 1, c: 1 },
        { r: 2, c: 0 }
      ]
    };
  }

  return null;
}

export const GameOOXX: React.FC = () => {
  const { currentRoom, updateRoomState, myRole } = useRoom();
  const { currentUser } = useAuth();

  const state: StateOOXX = currentRoom?.stateOOXX || {
    grid: [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ],
    movesHistory: [],
    currentTurnUid: currentRoom?.player1.uid || '',
    infiniteMode: false
  };

  const grid = Array.isArray(state.grid)
    ? state.grid.map((row) => (Array.isArray(row) ? row : [null, null, null]))
    : [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ];
  const movesHistory = Array.isArray(state.movesHistory) ? state.movesHistory : [];

  const p1 = currentRoom?.player1;
  const p2 = currentRoom?.player2;
  const myUid = currentUser?.uid || '';
  const opponentUid = myRole === 'player1' ? p2?.uid || '' : p1?.uid || '';

  const isMyTurn = state.currentTurnUid === myUid && currentRoom?.status !== 'settled';
  const currentTurnPlayer = state.currentTurnUid === p1?.uid ? p1 : p2;

  // Place a piece at (r, c)
  const handleCellClick = async (r: number, c: number) => {
    if (!isMyTurn || grid[r]?.[c] || currentRoom?.status === 'settled') return;
    sound.playClick();

    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = myUid;

    const newHistory = [
      ...movesHistory,
      {
        r,
        c,
        uid: myUid,
        moveIndex: Date.now()
      }
    ];

    // Check winner
    const winResult = checkWinningLine(newGrid);

    // Check draw in classic mode (all 9 cells filled)
    const isGridFull = newGrid.every((row) => row.every((cell) => cell !== null));

    await updateRoomState((draft) => {
      if (!draft.stateOOXX) return;
      draft.stateOOXX.grid = newGrid;
      draft.stateOOXX.movesHistory = newHistory;

      if (winResult) {
        draft.status = 'settled';
        draft.winnerUid = winResult.winner;
        draft.stateOOXX.winningLine = winResult.line;
      } else if (isGridFull) {
        draft.status = 'settled';
        draft.winnerUid = 'draw';
      } else {
        draft.stateOOXX.currentTurnUid = opponentUid;
      }
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Turn banner */}
      <TurnBanner
        isMyTurn={isMyTurn}
        currentTurnPlayerName={currentTurnPlayer?.displayName || ''}
        phaseLabel="經典 OOXX 對弈"
      />

      {/* Symbol description bar */}
      <div className="glass-panel rounded-2xl px-5 py-2 border border-white/70 shadow-sm flex items-center gap-5 text-xs font-bold">
        <div className="flex items-center gap-1.5 text-[#628395]">
          <span className="w-5 h-5 rounded-full bg-[#628395] text-white flex items-center justify-center font-black text-xs">
            O
          </span>
          <span>{p1?.displayName || '玩家1'} (P1)</span>
        </div>
        <div className="h-3.5 w-px bg-[#96897B]/30" />
        <div className="flex items-center gap-1.5 text-[#CF995F]">
          <span className="w-5 h-5 rounded-full bg-[#CF995F] text-white flex items-center justify-center font-black text-xs">
            X
          </span>
          <span>{p2?.displayName || '玩家2'} (P2)</span>
        </div>
      </div>

      {/* 3x3 Board */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-white/80 shadow-lg max-w-xs sm:max-w-sm w-full aspect-square flex items-center justify-center">
        <div className="grid grid-cols-3 gap-3 w-full h-full">
          {grid.map((row, r) =>
            row.map((cellUid, c) => {
              const isP1 = cellUid === p1?.uid;
              const isWinningCell = state.winningLine?.some((pt) => pt.r === r && pt.c === c);

              return (
                <motion.button
                  key={`${r}-${c}`}
                  whileHover={isMyTurn && !cellUid ? { scale: 1.05 } : {}}
                  whileTap={isMyTurn && !cellUid ? { scale: 0.95 } : {}}
                  disabled={!isMyTurn || Boolean(cellUid)}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative rounded-2xl flex items-center justify-center transition-all ${
                    isWinningCell
                      ? 'bg-[#DBAD6A] text-white shadow-lg shadow-[#DBAD6A]/40 border-2 border-white ring-2 ring-[#DBAD6A] animate-pulse'
                      : cellUid
                      ? isP1
                        ? 'bg-[#628395] text-white shadow-md shadow-[#628395]/20'
                        : 'bg-[#CF995F] text-white shadow-md shadow-[#CF995F]/20'
                      : isMyTurn
                      ? 'bg-white/80 hover:bg-white border-2 border-white cursor-pointer shadow-xs'
                      : 'bg-white/40 border-2 border-white/40 cursor-default'
                  }`}
                >
                  <AnimatePresence>
                    {cellUid && (
                      <motion.div
                        initial={{ scale: 0, rotate: -25 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="font-black text-4xl sm:text-5xl"
                      >
                        {isP1 ? 'O' : 'X'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Rules footer note */}
      <div className="text-xs text-[#96897B] font-semibold text-center max-w-sm flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#DBAD6A]" />
        <span>雙方輪流落子，最先將三個符號連成一線（橫、豎、斜）者獲勝！</span>
      </div>
    </div>
  );
};
