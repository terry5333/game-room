import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleDot,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Zap,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';
import { TurnBanner } from '../../common/TurnBanner';
import { sound } from '../../../services/soundService';
import type { StateOOXX, PiecePlaced } from '../../../types';

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
    infiniteMode: true
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

  const isMyTurn = state.currentTurnUid === myUid;
  const currentTurnPlayer = state.currentTurnUid === p1?.uid ? p1 : p2;

  // Track pieces per player
  const myPieces = movesHistory.filter((m) => m.uid === myUid);
  const oldestPieceForMe = myPieces.length >= 3 ? myPieces[0] : null;

  // Toggle infinite mode
  const handleToggleMode = async () => {
    sound.playClick();
    await updateRoomState((draft) => {
      if (!draft.stateOOXX) return;
      draft.stateOOXX.infiniteMode = !draft.stateOOXX.infiniteMode;
    });
  };

  // Place a piece at (r, c)
  const handleCellClick = async (r: number, c: number) => {
    if (!isMyTurn || grid[r]?.[c]) return;
    sound.playClick();

    const newGrid = grid.map((row) => [...row]);
    let newHistory = [...movesHistory];

    // In Infinite 3-Piece Mode:
    // If placing a 4th piece, remove the player's oldest piece!
    if (state.infiniteMode) {
      const playerPieces = newHistory.filter((m) => m.uid === myUid);
      if (playerPieces.length >= 3) {
        const oldest = playerPieces[0];
        newGrid[oldest.r][oldest.c] = null;
        newHistory = newHistory.filter((m) => m.moveIndex !== oldest.moveIndex);
      }
    }

    // Place new piece
    newGrid[r][c] = myUid;
    newHistory.push({
      r,
      c,
      uid: myUid,
      moveIndex: Date.now()
    });

    // Check winner
    const winResult = checkWinningLine(newGrid);

    // Check draw in classic mode
    const isGridFull = newGrid.every((row) => row.every((cell) => cell !== null));

    await updateRoomState((draft) => {
      if (!draft.stateOOXX) return;
      draft.stateOOXX.grid = newGrid;
      draft.stateOOXX.movesHistory = newHistory;

      if (winResult) {
        draft.status = 'settled';
        draft.winnerUid = winResult.winner;
        draft.stateOOXX.winningLine = winResult.line;
      } else if (!draft.stateOOXX.infiniteMode && isGridFull) {
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
        phaseLabel={state.infiniteMode ? '無限三子棋' : '經典模式'}
      />

      {/* Mode Switcher pill */}
      <div className="glass-panel rounded-2xl px-4 py-2 border border-white/70 shadow-sm flex items-center gap-3">
        <span className="text-xs font-bold text-[#2E2925]">
          模式：{state.infiniteMode ? '無限防平手三子棋' : '經典 OOXX'}
        </span>

        <button
          onClick={handleToggleMode}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-[#628395] border border-[#96897B]/20 shadow-xs transition-all cursor-pointer"
        >
          {state.infiniteMode ? (
            <>
              <ToggleRight className="w-4 h-4 text-emerald-600" />
              <span>無限模式 (開)</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 text-[#96897B]" />
              <span>經典模式</span>
            </>
          )}
        </button>
      </div>

      {/* Warning Alert if player has 3 pieces and oldest is about to disappear */}
      {state.infiniteMode && isMyTurn && oldestPieceForMe && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1.5 rounded-full bg-[#CF995F]/20 text-[#2E2925] border border-[#CF995F]/40 text-xs font-bold flex items-center gap-1.5"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#CF995F]" />
          <span>場上已滿 3 顆棋！落下新棋時，呼吸閃爍的最早棋子將自動消逝</span>
        </motion.div>
      )}

      {/* 3x3 Board */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-white/80 shadow-lg max-w-xs sm:max-w-sm w-full aspect-square flex items-center justify-center">
        <div className="grid grid-cols-3 gap-3 w-full h-full">
          {grid.map((row, r) =>
            row.map((cellUid, c) => {
              const isP1 = cellUid === p1?.uid;
              const isP2 = cellUid === p2?.uid;
              const isOldest = oldestPieceForMe && oldestPieceForMe.r === r && oldestPieceForMe.c === c;
              const isWinningCell = state.winningLine?.some((pt) => pt.r === r && pt.c === c);

              return (
                <motion.button
                  key={`${r}-${c}`}
                  whileHover={isMyTurn && !cellUid ? { scale: 1.06 } : {}}
                  whileTap={isMyTurn && !cellUid ? { scale: 0.94 } : {}}
                  disabled={!isMyTurn || Boolean(cellUid)}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative rounded-2xl flex items-center justify-center transition-all ${
                    isWinningCell
                      ? 'bg-[#DBAD6A] text-white shadow-lg shadow-[#DBAD6A]/30 border-2 border-white'
                      : cellUid
                      ? isP1
                        ? 'bg-[#628395] text-white shadow-md shadow-[#628395]/20'
                        : 'bg-[#CF995F] text-white shadow-md shadow-[#CF995F]/20'
                      : isMyTurn
                      ? 'bg-white/80 hover:bg-white border-2 border-white cursor-pointer shadow-xs'
                      : 'bg-white/40 border-2 border-white/40 cursor-default'
                  } ${isOldest ? 'animate-pulse-piece ring-2 ring-rose-400' : ''}`}
                >
                  <AnimatePresence>
                    {cellUid && (
                      <motion.div
                        initial={{ scale: 0, rotate: -25 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="font-black text-3xl sm:text-4xl"
                      >
                        {isP1 ? 'O' : 'X'}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Oldest Warning Dot */}
                  {isOldest && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.2 rounded-md bg-rose-500 text-white">
                      將消逝
                    </span>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Rules footer note */}
      <div className="text-xs text-[#96897B] font-semibold text-center max-w-sm flex items-center justify-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-[#DBAD6A]" />
        <span>
          {state.infiniteMode
            ? '每方最多 3 顆棋，下第 4 顆時最早棋子消逝，直到任一方 3 連線獲勝'
            : '經典模式：率先連成一線獲勝，盤滿未分勝負則平局'}
        </span>
      </div>
    </div>
  );
};
