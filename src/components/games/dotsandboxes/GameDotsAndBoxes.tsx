import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { SquareDot, Sparkles, Trophy, Award, Zap } from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';
import { TurnBanner } from '../../common/TurnBanner';
import { sound } from '../../../services/soundService';
import type { StateDots } from '../../../types';

export const GameDotsAndBoxes: React.FC = () => {
  const { currentRoom, updateRoomState, myRole, players } = useRoom();
  const { currentUser } = useAuth();

  const state: StateDots = currentRoom?.stateDots || {
    lines: {},
    boxes: {},
    currentTurnUid: currentRoom?.player1.uid || '',
    scores: {},
    lastBonusTurn: false,
    gridSize: 4
  };

  const boxesCount = state.gridSize || 4;
  const gridDots = boxesCount + 1;
  const totalBoxes = boxesCount * boxesCount;
  const stepPercent = 100 / boxesCount;

  const lines = state.lines || {};
  const boxes = state.boxes || {};

  const allPlayers =
    players && players.length > 0
      ? players
      : ([currentRoom?.player1, currentRoom?.player2].filter(Boolean) as any[]);

  const myUid = currentUser?.uid || '';
  const isMyTurn = state.currentTurnUid === myUid;
  const currentTurnPlayer = allPlayers.find((p) => p.uid === state.currentTurnUid) || allPlayers[0];

  const PLAYER_DOTS_THEMES = [
    { bg: 'bg-[#628395]', lineBg: 'bg-[#628395]', text: 'text-[#628395]', dot: 'bg-[#628395]', name: 'P1' },
    { bg: 'bg-[#CF995F]', lineBg: 'bg-[#CF995F]', text: 'text-[#CF995F]', dot: 'bg-[#CF995F]', name: 'P2' },
    { bg: 'bg-emerald-600', lineBg: 'bg-emerald-600', text: 'text-emerald-700', dot: 'bg-emerald-600', name: 'P3' },
    { bg: 'bg-purple-600', lineBg: 'bg-purple-600', text: 'text-purple-700', dot: 'bg-purple-600', name: 'P4' }
  ];

  const isSettled = currentRoom?.status === 'settled';
  const winnerUid = currentRoom?.winnerUid;

  // Handle line click
  const handleLineClick = async (lineKey: string) => {
    if (!isMyTurn || lines[lineKey]) return;
    sound.playClick();

    const newLines = { ...lines, [lineKey]: myUid };
    const newBoxes = { ...boxes };
    let newlyCompletedBoxes = 0;

    // Check all boxes
    for (let r = 0; r < boxesCount; r++) {
      for (let c = 0; c < boxesCount; c++) {
        const boxKey = `${r}_${c}`;
        if (!newBoxes[boxKey]) {
          const top = newLines[`h_${r}_${c}`];
          const bottom = newLines[`h_${r + 1}_${c}`];
          const left = newLines[`v_${r}_${c}`];
          const right = newLines[`v_${r}_${c + 1}`];

          if (top && bottom && left && right) {
            newBoxes[boxKey] = myUid;
            newlyCompletedBoxes++;
          }
        }
      }
    }

    if (newlyCompletedBoxes > 0) {
      sound.playBoxClaim();
      setTimeout(() => {
        sound.playBonusTurn();
      }, 150);
    }

    const totalClaimed = Object.keys(newBoxes).length;
    const isGameOver = totalClaimed === totalBoxes;

    if (isGameOver) {
      confetti({
        particleCount: 90,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#DBAD6A', '#628395', '#CF995F', '#DFD5A5']
      });
    }

    await updateRoomState((draft) => {
      if (!draft.stateDots) return;
      draft.stateDots.lines = newLines;
      draft.stateDots.boxes = newBoxes;

      if (isGameOver) {
        draft.status = 'settled';
        const playerCounts = allPlayers
          .map((p) => ({
            uid: p.uid,
            count: Object.values(newBoxes).filter((u) => u === p.uid).length
          }))
          .sort((a, b) => b.count - a.count);

        if (playerCounts[0].count === playerCounts[1]?.count) {
          draft.winnerUid = 'draw';
        } else {
          draft.winnerUid = playerCounts[0].uid;
        }
      } else {
        // If player completed a box, they get a BONUS TURN!
        if (newlyCompletedBoxes > 0) {
          draft.stateDots.lastBonusTurn = true;
          // currentTurnUid remains unchanged!
        } else {
          draft.stateDots.lastBonusTurn = false;
          const playerUids = allPlayers.map((p) => p.uid);
          const currIdx = playerUids.indexOf(state.currentTurnUid);
          const nextIdx = (currIdx + 1) % playerUids.length;
          draft.stateDots.currentTurnUid = playerUids[nextIdx];
        }
      }
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Turn banner */}
      <TurnBanner
        isMyTurn={isMyTurn}
        currentTurnPlayerName={currentTurnPlayer?.displayName || ''}
        phaseLabel={state.lastBonusTurn && isMyTurn ? '連鎖加步 (Bonus Turn)！' : `點線對弈 (${boxesCount}x${boxesCount})`}
      />

      {/* Score Header */}
      <div className="w-full max-w-md glass-panel rounded-2xl px-4 py-2.5 border border-white/70 shadow-sm flex items-center justify-around gap-2 flex-wrap">
        {allPlayers.map((p, idx) => {
          const theme = PLAYER_DOTS_THEMES[idx] || PLAYER_DOTS_THEMES[0];
          const sc = Object.values(boxes).filter((u) => u === p.uid).length;
          const isMe = p.uid === myUid;
          return (
            <div key={p.uid} className="flex items-center gap-1.5 text-xs">
              <div className={`w-3 h-3 rounded-full ${theme.dot}`} />
              <span className={`font-bold ${theme.text}`}>
                {isMe ? '我方' : theme.name}：
              </span>
              <span className="font-mono font-extrabold text-sm text-[#2E2925]">
                {sc} <span className="text-[10px] text-[#96897B]">/ {totalBoxes}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Settlement Results Card */}
      {isSettled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md py-2.5 px-4 rounded-2xl bg-[#DBAD6A]/20 border-2 border-[#DBAD6A] text-[#2E2925] flex items-center justify-between shadow-md backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#DBAD6A] animate-bounce" />
            <span className="text-xs font-black">
              {winnerUid === 'draw'
                ? '對局結算：勢均力敵 平手！'
                : `對局結算：${allPlayers.find((p) => p.uid === winnerUid)?.displayName || '勝者'} 獲勝！`}
            </span>
          </div>
        </motion.div>
      )}

      {/* Dots and Boxes Board Container */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-white/80 shadow-lg max-w-md sm:max-w-lg w-full flex flex-col items-center justify-center">
        <div className="relative w-full max-w-xs sm:max-w-sm aspect-square select-none">
          {/* Render Boxes */}
          {Array.from({ length: boxesCount }).map((_, r) =>
            Array.from({ length: boxesCount }).map((_, c) => {
              const boxOwner = boxes[`${r}_${c}`];
              const ownerIdx = allPlayers.findIndex((p) => p.uid === boxOwner);
              const theme = ownerIdx !== -1 ? PLAYER_DOTS_THEMES[ownerIdx] : PLAYER_DOTS_THEMES[0];
              const isWinnerBox = isSettled && winnerUid && boxOwner === winnerUid;

              return (
                <div
                  key={`box-${r}-${c}`}
                  className="absolute transition-all rounded-xl flex items-center justify-center overflow-hidden"
                  style={{
                    top: `${r * stepPercent}%`,
                    left: `${c * stepPercent}%`,
                    width: `${stepPercent}%`,
                    height: `${stepPercent}%`,
                    padding: boxesCount >= 5 ? '4px' : '8px'
                  }}
                >
                  <AnimatePresence>
                    {boxOwner && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: isWinnerBox ? 1.05 : 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className={`w-full h-full rounded-xl flex items-center justify-center font-extrabold text-white text-xs sm:text-sm shadow-sm transition-all ${
                          theme.bg
                        } ${isWinnerBox ? 'ring-3 ring-[#DBAD6A] shadow-md shadow-[#DBAD6A]/50 animate-pulse' : ''}`}
                      >
                        {ownerIdx !== -1 ? `P${ownerIdx + 1}` : 'P?'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}

          {/* Render Horizontal Lines */}
          {Array.from({ length: gridDots }).map((_, r) =>
            Array.from({ length: gridDots - 1 }).map((_, c) => {
              const key = `h_${r}_${c}`;
              const lineOwner = lines[key];
              const ownerIdx = allPlayers.findIndex((p) => p.uid === lineOwner);
              const theme = ownerIdx !== -1 ? PLAYER_DOTS_THEMES[ownerIdx] : PLAYER_DOTS_THEMES[0];

              return (
                <button
                  key={key}
                  disabled={!isMyTurn || Boolean(lineOwner)}
                  onClick={() => handleLineClick(key)}
                  className={`absolute h-3 -translate-y-1.5 transition-all cursor-pointer z-20 rounded-full group ${
                    lineOwner
                      ? `${theme.lineBg} shadow-xs`
                      : isMyTurn
                      ? 'bg-transparent hover:bg-[#628395]/40 border-b border-dashed border-[#96897B]/40'
                      : 'bg-transparent border-b border-dashed border-[#96897B]/20 cursor-default'
                  }`}
                  style={{
                    top: `${r * stepPercent}%`,
                    left: `${c * stepPercent}%`,
                    width: `${stepPercent}%`
                  }}
                />
              );
            })
          )}

          {/* Render Vertical Lines */}
          {Array.from({ length: gridDots - 1 }).map((_, r) =>
            Array.from({ length: gridDots }).map((_, c) => {
              const key = `v_${r}_${c}`;
              const lineOwner = lines[key];
              const ownerIdx = allPlayers.findIndex((p) => p.uid === lineOwner);
              const theme = ownerIdx !== -1 ? PLAYER_DOTS_THEMES[ownerIdx] : PLAYER_DOTS_THEMES[0];

              return (
                <button
                  key={key}
                  disabled={!isMyTurn || Boolean(lineOwner)}
                  onClick={() => handleLineClick(key)}
                  className={`absolute w-3 -translate-x-1.5 transition-all cursor-pointer z-20 rounded-full group ${
                    lineOwner
                      ? `${theme.lineBg} shadow-xs`
                      : isMyTurn
                      ? 'bg-transparent hover:bg-[#628395]/40 border-r border-dashed border-[#96897B]/40'
                      : 'bg-transparent border-r border-dashed border-[#96897B]/20 cursor-default'
                  }`}
                  style={{
                    top: `${r * stepPercent}%`,
                    left: `${c * stepPercent}%`,
                    height: `${stepPercent}%`
                  }}
                />
              );
            })
          )}

          {/* Render Dots */}
          {Array.from({ length: gridDots }).map((_, r) =>
            Array.from({ length: gridDots }).map((_, c) => (
              <div
                key={`dot-${r}-${c}`}
                className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2E2925] border-2 border-white shadow-sm z-30 pointer-events-none"
                style={{
                  top: `${r * stepPercent}%`,
                  left: `${c * stepPercent}%`
                }}
              />
            ))
          )}
        </div>

        {/* Footer tip */}
        <div className="mt-6 text-xs text-[#96897B] font-semibold text-center flex items-center justify-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#DBAD6A]" />
          <span>圍封方格最後一邊者可佔領該格並獲額外連續行動機會</span>
        </div>
      </div>
    </div>
  );
};
