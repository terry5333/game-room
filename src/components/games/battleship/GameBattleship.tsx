import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Anchor,
  RotateCw,
  Shuffle,
  Shield,
  Crosshair,
  Flame,
  Droplets,
  AlertOctagon,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';
import { TurnBanner } from '../../common/TurnBanner';
import { sound } from '../../../services/soundService';
import type {
  Ship,
  ShipOrientation,
  BattleshipPlayerBoard,
  StateBattleship
} from '../../../types';

const GRID_SIZE = 8;

const INITIAL_SHIPS: { id: string; name: string; length: number }[] = [
  { id: 's4', name: '旗艦', length: 4 },
  { id: 's3a', name: '巡洋艦', length: 3 },
  { id: 's3b', name: '驅逐艦', length: 3 },
  { id: 's2', name: '潛艇', length: 2 }
];

export const GameBattleship: React.FC = () => {
  const { currentRoom, updateRoomState, myRole } = useRoom();
  const { currentUser } = useAuth();

  const [selectedShipId, setSelectedShipId] = useState<string>('s4');
  const [orientation, setOrientation] = useState<ShipOrientation>('horizontal');
  const [myShips, setMyShips] = useState<Ship[]>([]);
  const [sunkNotice, setSunkNotice] = useState<string | null>(null);

  const state: StateBattleship = currentRoom?.stateBattleship || {
    boards: {},
    currentTurnUid: currentRoom?.player1.uid || ''
  };

  const boards = state.boards || {};
  const p1 = currentRoom?.player1;
  const p2 = currentRoom?.player2;
  const myUid = currentUser?.uid || '';
  const opponentUid = myRole === 'player1' ? p2?.uid || '' : p1?.uid || '';

  const myBoard = boards[myUid];
  const opponentBoard = boards[opponentUid];

  const myPlaced = Boolean(myBoard?.placed);
  const opponentPlaced = Boolean(opponentBoard?.placed);
  const bothPlaced = myPlaced && opponentPlaced;

  const isMyTurn = bothPlaced && state.currentTurnUid === myUid;
  const currentTurnPlayer = state.currentTurnUid === p1?.uid ? p1 : p2;

  // Sync my local placed ships when room loads
  useEffect(() => {
    if (myBoard?.ships && Array.isArray(myBoard.ships)) {
      setMyShips(myBoard.ships);
    }
  }, [myBoard?.ships]);

  // Handle ship placement validation
  const canPlaceShip = (r: number, c: number, len: number, ori: ShipOrientation, existingShips: Ship[]): boolean => {
    if (ori === 'horizontal') {
      if (c + len > GRID_SIZE) return false;
      for (let i = 0; i < len; i++) {
        const col = c + i;
        for (const ship of existingShips) {
          if (ship.coords.some((pt) => pt.r === r && pt.c === col)) {
            return false;
          }
        }
      }
    } else {
      if (r + len > GRID_SIZE) return false;
      for (let i = 0; i < len; i++) {
        const row = r + i;
        for (const ship of existingShips) {
          if (ship.coords.some((pt) => pt.r === row && pt.c === c)) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Click grid to place selected ship
  const handleCellClickForPlacement = (r: number, c: number) => {
    if (myPlaced) return;
    const meta = INITIAL_SHIPS.find((s) => s.id === selectedShipId);
    if (!meta) return;

    const filtered = myShips.filter((s) => s.id !== selectedShipId);
    if (!canPlaceShip(r, c, meta.length, orientation, filtered)) {
      sound.playSplash();
      return;
    }

    sound.playClick();
    const coords: { r: number; c: number }[] = [];
    for (let i = 0; i < meta.length; i++) {
      coords.push({
        r: orientation === 'vertical' ? r + i : r,
        c: orientation === 'horizontal' ? c + i : c
      });
    }

    const newShip: Ship = {
      id: meta.id,
      name: meta.name,
      length: meta.length,
      coords,
      sunk: false
    };

    const nextShips = [...filtered, newShip];
    setMyShips(nextShips);

    // Auto select next unplaced ship
    const remaining = INITIAL_SHIPS.find((s) => !nextShips.some((ns) => ns.id === s.id));
    if (remaining) {
      setSelectedShipId(remaining.id);
    }
  };

  // Random Placement generator
  const handleRandomPlacement = () => {
    sound.playClick();
    const placed: Ship[] = [];

    for (const meta of INITIAL_SHIPS) {
      let success = false;
      let tries = 0;
      while (!success && tries < 300) {
        tries++;
        const ori: ShipOrientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
        const r = Math.floor(Math.random() * GRID_SIZE);
        const c = Math.floor(Math.random() * GRID_SIZE);

        if (canPlaceShip(r, c, meta.length, ori, placed)) {
          const coords: { r: number; c: number }[] = [];
          for (let i = 0; i < meta.length; i++) {
            coords.push({
              r: ori === 'vertical' ? r + i : r,
              c: ori === 'horizontal' ? c + i : c
            });
          }
          placed.push({
            id: meta.id,
            name: meta.name,
            length: meta.length,
            coords,
            sunk: false
          });
          success = true;
        }
      }
    }

    setMyShips(placed);
  };

  // Lock in fleet
  const handleConfirmFleet = async () => {
    if (myShips.length !== 4) return;
    sound.playClick();

    await updateRoomState((draft) => {
      if (!draft.stateBattleship) return;
      draft.stateBattleship.boards[myUid] = {
        ships: myShips,
        placed: true,
        attacksReceived: draft.stateBattleship.boards[myUid]?.attacksReceived || []
      };
    });
  };

  // Battle: Attack opponent coordinate
  const handleAttackOpponent = async (r: number, c: number) => {
    if (!isMyTurn || !opponentBoard) return;

    const oppAttacks = Array.isArray(opponentBoard.attacksReceived) ? opponentBoard.attacksReceived : [];
    const oppShips = Array.isArray(opponentBoard.ships) ? opponentBoard.ships : [];

    // Check if already attacked this cell
    const alreadyAttacked = oppAttacks.some((a) => a.r === r && a.c === c);
    if (alreadyAttacked) return;

    // Check hit
    let hit = false;
    let hitShip: Ship | null = null;

    for (const ship of oppShips) {
      if (ship.coords && ship.coords.some((pt) => pt.r === r && pt.c === c)) {
        hit = true;
        hitShip = ship;
        break;
      }
    }

    if (hit) {
      sound.playExplosion();
    } else {
      sound.playSplash();
    }

    let newlySunkShipName: string | undefined = undefined;

    await updateRoomState((draft) => {
      if (!draft.stateBattleship) return;
      const targetBoard = draft.stateBattleship.boards[opponentUid];
      if (!targetBoard) return;

      targetBoard.attacksReceived.push({ r, c, hit });

      if (hit && hitShip) {
        // Check if this ship is completely sunk now
        const allAttacks = targetBoard.attacksReceived;
        const liveShip = targetBoard.ships.find((s) => s.id === hitShip!.id);
        if (liveShip) {
          const allHits = liveShip.coords.every((pt) =>
            allAttacks.some((a) => a.r === pt.r && a.c === pt.c && a.hit)
          );
          if (allHits) {
            liveShip.sunk = true;
            newlySunkShipName = liveShip.name;
          }
        }
      }

      // Check if all 4 ships are sunk
      const allOpponentShipsSunk = targetBoard.ships.every((s) => s.sunk);

      if (allOpponentShipsSunk) {
        draft.status = 'settled';
        draft.winnerUid = myUid;
      } else {
        draft.stateBattleship.currentTurnUid = opponentUid;
        draft.stateBattleship.lastAttack = {
          attackerUid: myUid,
          r,
          c,
          hit,
          sunkShipName: newlySunkShipName
        };
      }
    });

    if (newlySunkShipName) {
      setSunkNotice(`💥 擊沉敵方艦艇：${newlySunkShipName}！`);
      setTimeout(() => setSunkNotice(null), 3000);
    }
  };

  // Attacks received on my board
  const myAttacksReceived = myBoard?.attacksReceived || [];
  // Attacks I sent to opponent
  const attacksSentToOpponent = opponentBoard?.attacksReceived || [];

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Turn banner */}
      {bothPlaced ? (
        <TurnBanner
          isMyTurn={isMyTurn}
          currentTurnPlayerName={currentTurnPlayer?.displayName || ''}
          phaseLabel="戰鬥交火"
        />
      ) : (
        <div className="w-full flex justify-center py-2 px-4">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#628395]/15 border border-[#628395] text-[#2E2925] font-extrabold text-sm shadow-sm backdrop-blur-md">
            <Anchor className="w-4 h-4 text-[#628395]" />
            <span>佈署階段：請在 8x8 海域佈署 4 艘戰艦並確認就緒</span>
          </div>
        </div>
      )}

      {/* Sunk Ship Notice Pop */}
      <AnimatePresence>
        {sunkNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="px-6 py-2.5 rounded-full bg-rose-500 text-white font-extrabold text-sm shadow-lg flex items-center gap-2"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span>{sunkNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 1: Placement Controls */}
      {!bothPlaced && !myPlaced && (
        <div className="w-full max-w-2xl glass-panel rounded-3xl p-4 sm:p-6 border-2 border-white/80 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-xs font-bold text-[#2E2925]">
              已佈署艦艇：
              <span className="text-[#628395] font-extrabold ml-1 font-mono">
                {myShips.length} / 4
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-[#2E2925] border border-[#96897B]/30 shadow-xs cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#628395]" />
                <span>方向：{orientation === 'horizontal' ? '水平 ➔' : '垂直 ⬇'}</span>
              </button>

              <button
                onClick={handleRandomPlacement}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#CF995F]/15 hover:bg-[#CF995F]/25 text-xs font-bold text-[#CF995F] border border-[#CF995F]/30 shadow-xs cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>隨機擺放</span>
              </button>
            </div>
          </div>

          {/* Ship Selector Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {INITIAL_SHIPS.map((ship) => {
              const isPlaced = myShips.some((s) => s.id === ship.id);
              const isSelected = selectedShipId === ship.id;

              return (
                <button
                  key={ship.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedShipId(ship.id);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#628395] text-white border-[#628395] shadow-sm'
                      : isPlaced
                      ? 'bg-white/90 text-emerald-700 border-emerald-300'
                      : 'bg-white/60 text-[#2E2925] hover:bg-white border-[#96897B]/20'
                  }`}
                >
                  <span>{ship.name} ({ship.length}格)</span>
                  {isPlaced && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {/* Confirm Fleet Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={myShips.length !== 4}
            onClick={handleConfirmFleet}
            className={`w-full py-3 rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              myShips.length === 4
                ? 'bg-[#628395] hover:bg-[#526f7f] text-white shadow-[#628395]/20'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>確認艦隊佈署就緒</span>
          </motion.button>
        </div>
      )}

      {/* Waiting for opponent placement */}
      {myPlaced && !bothPlaced && (
        <div className="px-6 py-3 rounded-2xl bg-white/70 border border-[#96897B]/20 text-xs font-bold text-[#628395] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>我方已完成艦隊佈署！等待對手佈署中...</span>
        </div>
      )}

      {/* Boards Section */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Opponent's Ocean (Target Grid to attack) */}
        {bothPlaced && (
          <div className="glass-panel rounded-3xl p-5 border-2 border-[#CF995F]/60 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#96897B]/20">
              <div className="flex items-center gap-2 font-extrabold text-sm text-[#2E2925]">
                <Crosshair className="w-4 h-4 text-[#CF995F]" />
                <span>敵方海域雷達 (點擊轟炸)</span>
              </div>
              <span className="text-xs font-bold text-[#CF995F]">
                剩餘艦隊：{opponentBoard?.ships.filter((s) => !s.sunk).length || 0} 艘
              </span>
            </div>

            {/* 8x8 Ocean Grid */}
            <div className="grid grid-cols-8 gap-1 aspect-square max-w-sm mx-auto bg-[#628395]/15 p-2 rounded-2xl border border-[#628395]/30">
              {Array.from({ length: GRID_SIZE }).map((_, r) =>
                Array.from({ length: GRID_SIZE }).map((_, c) => {
                  const attack = attacksSentToOpponent.find((a) => a.r === r && a.c === c);
                  const isHit = Boolean(attack?.hit);
                  const isMiss = attack && !attack.hit;

                  return (
                    <motion.button
                      key={`${r}-${c}`}
                      whileHover={isMyTurn && !attack ? { scale: 1.1 } : {}}
                      whileTap={isMyTurn && !attack ? { scale: 0.92 } : {}}
                      disabled={!isMyTurn || Boolean(attack)}
                      onClick={() => handleAttackOpponent(r, c)}
                      className={`relative rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all ${
                        isHit
                          ? 'bg-rose-500 text-white shadow-sm'
                          : isMiss
                          ? 'bg-sky-200/60 text-sky-800'
                          : isMyTurn
                          ? 'bg-white/80 hover:bg-white border border-white cursor-pointer shadow-xs'
                          : 'bg-white/40 border border-white/40 cursor-default'
                      }`}
                    >
                      {isHit && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center justify-center"
                        >
                          <Flame className="w-4 h-4 text-amber-200 animate-pulse" />
                        </motion.div>
                      )}
                      {isMiss && (
                        <div className="w-2.5 h-2.5 rounded-full bg-sky-500/70 animate-ripple" />
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* My Ocean (Fleet placement or received attacks) */}
        <div className="glass-panel rounded-3xl p-5 border-2 border-[#628395]/60 shadow-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#96897B]/20">
            <div className="flex items-center gap-2 font-extrabold text-sm text-[#2E2925]">
              <Anchor className="w-4 h-4 text-[#628395]" />
              <span>我方艦隊陣列</span>
            </div>
            <span className="text-xs font-bold text-[#628395]">
              存活艦艇：{myShips.filter((s) => !s.sunk).length} 艘
            </span>
          </div>

          {/* 8x8 Grid */}
          <div className="grid grid-cols-8 gap-1 aspect-square max-w-sm mx-auto bg-[#628395]/15 p-2 rounded-2xl border border-[#628395]/30">
            {Array.from({ length: GRID_SIZE }).map((_, r) =>
              Array.from({ length: GRID_SIZE }).map((_, c) => {
                const hasMyShip = myShips.some((s) =>
                  s.coords.some((pt) => pt.r === r && pt.c === c)
                );
                const receivedAttack = myAttacksReceived.find((a) => a.r === r && a.c === c);
                const isHit = Boolean(receivedAttack?.hit);
                const isMiss = receivedAttack && !receivedAttack.hit;

                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={myPlaced}
                    onClick={() => handleCellClickForPlacement(r, c)}
                    className={`relative rounded-lg flex items-center justify-center transition-all ${
                      isHit
                        ? 'bg-rose-500 text-white font-bold'
                        : isMiss
                        ? 'bg-sky-200/70'
                        : hasMyShip
                        ? 'bg-[#628395] text-white shadow-xs'
                        : !myPlaced
                        ? 'bg-white/75 hover:bg-white border border-white cursor-pointer'
                        : 'bg-white/40 border border-white/30'
                    }`}
                  >
                    {isHit && <Flame className="w-3.5 h-3.5 text-amber-200" />}
                    {isMiss && <Droplets className="w-3.5 h-3.5 text-sky-700" />}
                    {hasMyShip && !receivedAttack && (
                      <div className="w-2 h-2 rounded-full bg-white/70" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
