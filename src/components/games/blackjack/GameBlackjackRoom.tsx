import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Coins, RotateCcw, ShieldAlert, Award, ArrowRight } from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';
import { sound } from '../../../services/soundService';
import type { PlayingCard, HandScore, StateBlackjack, BlackjackPlayerState, PlayerSlot } from '../../../types';

export function createShuffledDeck(): PlayingCard[] {
  const suits: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣'];
  const ranks: Array<'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'> = [
    'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'
  ];
  const deck: PlayingCard[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      let value = parseInt(rank, 10);
      if (rank === 'A') value = 11;
      else if (['J', 'Q', 'K', '10'].includes(rank)) value = 10;

      deck.push({
        suit,
        rank,
        value,
        color: suit === '♥' || suit === '♦' ? 'red' : 'black'
      });
    }
  }

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function calculateHandScore(cards: PlayingCard[]): HandScore {
  if (!cards || cards.length === 0) {
    return { total: 0, isSoft: false, isBlackjack: false, isBust: false };
  }

  let total = 0;
  let aces = 0;

  for (const c of cards) {
    total += c.value;
    if (c.rank === 'A') aces += 1;
  }

  let isSoft = false;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  if (aces > 0 && total <= 21) {
    isSoft = true;
  }

  const isBlackjack = cards.length === 2 && total === 21;
  const isBust = total > 21;

  return { total, isSoft, isBlackjack, isBust };
}

export const GameBlackjackRoom: React.FC = () => {
  const { currentRoom, updateRoomState, isHost } = useRoom();
  const { currentUser, updateCoins } = useAuth();
  const [hasPaidEntry, setHasPaidEntry] = useState(false);
  const [selectedBet, setSelectedBet] = useState<number>(20);

  const state: StateBlackjack = currentRoom?.stateBlackjack || {
    entryFee: 100,
    totalRounds: 5,
    currentRound: 1,
    phase: 'betting',
    dealerHand: [],
    dealerScore: { total: 0, isSoft: false, isBlackjack: false, isBust: false },
    deck: [],
    players: {},
    eliminatedUids: [],
    pot: 100
  };

  const myUid = currentUser?.uid || '';
  const roomPlayers: PlayerSlot[] = currentRoom?.players && currentRoom.players.length > 0
    ? currentRoom.players
    : ([currentRoom?.player1, currentRoom?.player2].filter(Boolean) as PlayerSlot[]);

  const myState: BlackjackPlayerState = state.players[myUid] || {
    uid: myUid,
    chips: state.entryFee,
    bet: Math.min(20, state.entryFee),
    hand: [],
    status: 'betting',
    score: { total: 0, isSoft: false, isBlackjack: false, isBust: false }
  };

  // Deduct initial entry fee upon room start
  useEffect(() => {
    if (!currentUser || hasPaidEntry || currentRoom?.status !== 'in_progress') return;

    // Check if player has already paid or needs to pay entry fee
    const fee = state.entryFee || 100;
    if (currentUser.coins >= fee) {
      updateCoins(-fee, 'casino_bet', `21點房間入場費 🪙${fee}`).catch(console.warn);
      setHasPaidEntry(true);
    }
  }, [currentUser, hasPaidEntry, currentRoom?.status, state.entryFee]);

  // Handle Bet Confirmation
  const handleConfirmBet = async () => {
    if (myState.chips < selectedBet) {
      sound.playError();
      return;
    }
    sound.playChipBet();

    await updateRoomState((draft) => {
      if (!draft.stateBlackjack) return;
      if (!draft.stateBlackjack.players[myUid]) {
        draft.stateBlackjack.players[myUid] = {
          uid: myUid,
          chips: draft.stateBlackjack.entryFee,
          bet: selectedBet,
          hand: [],
          status: 'playing',
          score: { total: 0, isSoft: false, isBlackjack: false, isBust: false }
        };
      } else {
        draft.stateBlackjack.players[myUid].bet = selectedBet;
        draft.stateBlackjack.players[myUid].status = 'playing';
      }
    });
  };

  // Deal Initial Cards (Host or Single Player)
  const handleStartDealing = async () => {
    sound.playCardDeal();

    const deck = state.deck && state.deck.length >= 20 ? [...state.deck] : createShuffledDeck();
    const updatedPlayers: Record<string, BlackjackPlayerState> = {};

    roomPlayers.forEach((p) => {
      const existing = state.players[p.uid];
      const pBet = existing?.bet || Math.min(20, existing?.chips || state.entryFee);
      const c1 = deck.pop()!;
      const c2 = deck.pop()!;
      const hand = [c1, c2];
      const score = calculateHandScore(hand);

      updatedPlayers[p.uid] = {
        uid: p.uid,
        chips: existing?.chips || state.entryFee,
        bet: pBet,
        hand,
        status: score.isBlackjack ? 'blackjack' : 'playing',
        score
      };
    });

    const d1 = deck.pop()!;
    const d2 = deck.pop()!;
    const dHand = [d1, d2];
    const dScore = calculateHandScore(dHand);

    await updateRoomState((draft) => {
      if (!draft.stateBlackjack) return;
      draft.stateBlackjack.deck = deck;
      draft.stateBlackjack.dealerHand = dHand;
      draft.stateBlackjack.dealerScore = dScore;
      draft.stateBlackjack.players = updatedPlayers;
      draft.stateBlackjack.phase = 'player_turns';
      draft.stateBlackjack.roundMessage = '請各位玩家進行【要牌 (Hit)】、【停牌 (Stand)】或【雙倍 (Double)】！';
    });
  };

  // Player Action: Hit
  const handleHit = async () => {
    if (myState.status !== 'playing' || state.phase !== 'player_turns') return;

    sound.playCardDeal();
    const deck = [...state.deck];
    if (deck.length === 0) return;

    const card = deck.pop()!;
    const newHand = [...myState.hand, card];
    const score = calculateHandScore(newHand);
    const newStatus = score.isBust ? 'bust' : score.total === 21 ? 'stand' : 'playing';

    if (score.isBust) {
      sound.playError();
    } else {
      sound.playPop();
    }

    await updateRoomState((draft) => {
      if (!draft.stateBlackjack) return;
      draft.stateBlackjack.deck = deck;
      if (draft.stateBlackjack.players[myUid]) {
        draft.stateBlackjack.players[myUid].hand = newHand;
        draft.stateBlackjack.players[myUid].score = score;
        draft.stateBlackjack.players[myUid].status = newStatus;
      }
    });
  };

  // Player Action: Stand
  const handleStand = async () => {
    if (myState.status !== 'playing' || state.phase !== 'player_turns') return;
    sound.playClick();

    await updateRoomState((draft) => {
      if (!draft.stateBlackjack) return;
      if (draft.stateBlackjack.players[myUid]) {
        draft.stateBlackjack.players[myUid].status = 'stand';
      }
    });
  };

  // Player Action: Double Down
  const handleDoubleDown = async () => {
    if (myState.status !== 'playing' || myState.hand.length !== 2 || state.phase !== 'player_turns') return;
    if (myState.chips < myState.bet * 2) {
      sound.playError();
      return;
    }
    sound.playChipBet();

    const deck = [...state.deck];
    if (deck.length === 0) return;

    const card = deck.pop()!;
    const newHand = [...myState.hand, card];
    const score = calculateHandScore(newHand);
    const newStatus = score.isBust ? 'bust' : 'stand';

    await updateRoomState((draft) => {
      if (!draft.stateBlackjack) return;
      draft.stateBlackjack.deck = deck;
      if (draft.stateBlackjack.players[myUid]) {
        draft.stateBlackjack.players[myUid].bet *= 2;
        draft.stateBlackjack.players[myUid].hand = newHand;
        draft.stateBlackjack.players[myUid].score = score;
        draft.stateBlackjack.players[myUid].status = newStatus;
      }
    });
  };

  // Check if all players have completed actions -> Dealer Turn
  const allPlayersDone = roomPlayers.every((p) => {
    const st = state.players[p.uid]?.status;
    return st === 'stand' || st === 'bust' || st === 'blackjack';
  });

  // Resolve Dealer Turn & Settle Round
  const handleSettleDealerTurn = async () => {
    sound.playCardDeal();

    const deck = [...state.deck];
    const dHand = [...state.dealerHand];
    let dScore = calculateHandScore(dHand);

    // Dealer hits on soft/hard 16 or lower, stands on 17+
    while (dScore.total < 17 && deck.length > 0) {
      dHand.push(deck.pop()!);
      dScore = calculateHandScore(dHand);
    }

    const updatedPlayers = { ...state.players };
    const eliminated: string[] = [...(state.eliminatedUids || [])];
    const messages: string[] = [];

    // Compare each player
    Object.values(updatedPlayers).forEach((pState) => {
      const pScore = pState.score;
      let diff = 0;

      if (pState.status === 'bust') {
        diff = -pState.bet;
        messages.push(`${pState.uid === myUid ? '你' : '玩家'} 爆牌，扣除 ${pState.bet} 籌碼`);
      } else if (dScore.isBust) {
        diff = pState.status === 'blackjack' ? Math.floor(pState.bet * 1.5) : pState.bet;
        messages.push(`莊家爆牌！${pState.uid === myUid ? '你' : '玩家'} 贏得 +${diff} 籌碼`);
      } else if (pState.status === 'blackjack') {
        if (dScore.isBlackjack) {
          diff = 0;
          messages.push('雙方 Blackjack 平手，返還籌碼');
        } else {
          diff = Math.floor(pState.bet * 1.5);
          messages.push(`👑 天牌 Blackjack！贏得 +${diff} 籌碼`);
        }
      } else if (pScore.total > dScore.total) {
        diff = pState.bet;
        messages.push(`${pScore.total} 點大於莊家 ${dScore.total} 點，贏得 +${diff} 籌碼`);
      } else if (pScore.total < dScore.total) {
        diff = -pState.bet;
        messages.push(`${pScore.total} 點小於莊家 ${dScore.total} 點，輸掉 ${pState.bet} 籌碼`);
      } else {
        diff = 0;
        messages.push('點數平手，籌碼返還');
      }

      pState.chips = Math.max(0, pState.chips + diff);
      if (pState.chips <= 0 && !eliminated.includes(pState.uid)) {
        eliminated.push(pState.uid);
      }
    });

    const isAnyoneOutOfMoney = eliminated.length > 0;
    const isFinalRound = state.currentRound >= state.totalRounds;
    const shouldGameOver = isAnyoneOutOfMoney || isFinalRound;

    await updateRoomState((draft) => {
      if (!draft.stateBlackjack) return;
      draft.stateBlackjack.deck = deck;
      draft.stateBlackjack.dealerHand = dHand;
      draft.stateBlackjack.dealerScore = dScore;
      draft.stateBlackjack.players = updatedPlayers;
      draft.stateBlackjack.eliminatedUids = eliminated;
      draft.stateBlackjack.roundMessage = messages.join(' • ');

      if (shouldGameOver) {
        draft.stateBlackjack.phase = 'game_over';
        draft.status = 'settled';

        // Winner is player with maximum chips
        let maxChips = -1;
        let winnerUid = 'draw';
        Object.values(updatedPlayers).forEach((p) => {
          if (p.chips > maxChips) {
            maxChips = p.chips;
            winnerUid = p.uid;
          }
        });
        draft.winnerUid = winnerUid;
      } else {
        draft.stateBlackjack.phase = 'round_settled';
      }
    });
  };

  // Advance to Next Round
  const handleNextRound = async () => {
    sound.playClick();

    await updateRoomState((draft) => {
      if (!draft.stateBlackjack) return;
      draft.stateBlackjack.currentRound += 1;
      draft.stateBlackjack.phase = 'betting';
      draft.stateBlackjack.dealerHand = [];
      draft.stateBlackjack.dealerScore = { total: 0, isSoft: false, isBlackjack: false, isBust: false };
      draft.stateBlackjack.roundMessage = undefined;

      Object.values(draft.stateBlackjack.players).forEach((p) => {
        p.hand = [];
        p.status = 'betting';
        p.bet = Math.min(20, p.chips);
        p.score = { total: 0, isSoft: false, isBlackjack: false, isBust: false };
      });
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 py-2 text-[#FFE8D6]">
      {/* Top Match HUD Bar */}
      <div className="w-full max-w-4xl glass-panel rounded-2xl px-4 py-2.5 border border-[#D4AF37]/50 shadow-md flex items-center justify-between gap-3 bg-[#1B3624]/90 text-xs font-black">
        <div className="flex items-center gap-2 text-[#FFD700]">
          <span className="text-base">🃏</span>
          <span>第 {state.currentRound} / {state.totalRounds} 回合</span>
          <span className="px-1.5 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#FFD700] text-[10px]">
            入場費 🪙 {state.entryFee}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-200">
            <Coins className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>總獎池底額: 🪙 {state.pot}</span>
          </div>

          {state.eliminatedUids && state.eliminatedUids.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] animate-pulse">
              🚨 破產警報: {state.eliminatedUids.length} 人沒錢
            </span>
          )}
        </div>
      </div>

      {/* Main Luxury Green Casino Felt Table */}
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#0B3B24] via-[#0D4A2D] to-[#062013] border-4 border-[#D4AF37] rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between min-h-[460px] relative overflow-hidden">
        {/* Table Felt Arch Watermark */}
        <div className="w-full flex items-center justify-between px-3 py-1 rounded-full bg-black/40 border border-[#D4AF37]/40 mb-3 text-[10px] font-black text-amber-200">
          <span>BLACKJACK PAYS 3:2 • DEALER STANDS ON 17</span>
          <span className="text-[#FFD700]">直到有人沒錢 或 滿 {state.totalRounds} 回合結算</span>
        </div>

        {/* 1. SYSTEM DEALER SECTION */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-neutral-900 flex items-center justify-center font-black text-xs shadow-xs">
              🏛️
            </div>
            <span className="text-xs sm:text-sm font-black text-amber-200">
              系統莊家 (System Dealer)
            </span>
            {(state.phase === 'round_settled' || state.phase === 'game_over') && state.dealerHand.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-black/60 text-[#FFD700] text-[10px] font-mono font-black border border-amber-500/40">
                {state.dealerScore.total} 點 {state.dealerScore.isBust && '(爆牌)'}
              </span>
            )}
          </div>

          {/* Dealer Cards */}
          <div className="flex items-center gap-2 min-h-[88px]">
            {state.dealerHand.length === 0 ? (
              <div className="w-16 h-22 rounded-xl border-2 border-dashed border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]/40 text-xs font-black">
                等待開局
              </div>
            ) : (
              state.dealerHand.map((c, i) => {
                const isHidden = i === 1 && state.phase === 'player_turns';

                if (isHidden) {
                  return (
                    <div
                      key="dealer-hidden"
                      className="w-16 h-22 rounded-xl bg-gradient-to-br from-[#8C1D1D] to-[#5C0D0D] border-2 border-white shadow-lg flex flex-col items-center justify-center text-amber-200 select-none"
                    >
                      <span className="text-xl">🂠</span>
                      <span className="text-[9px] font-black">暗牌</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={`dealer-c-${i}`}
                    className="w-16 h-22 rounded-xl bg-white border-2 border-amber-300 shadow-lg flex flex-col justify-between p-1.5 select-none"
                  >
                    <div className={`text-xs font-black leading-none ${c.color === 'red' ? 'text-red-600' : 'text-neutral-900'}`}>
                      {c.rank}
                    </div>
                    <div className={`text-2xl text-center leading-none ${c.color === 'red' ? 'text-red-600' : 'text-neutral-900'}`}>
                      {c.suit}
                    </div>
                    <div className={`text-xs font-black text-right leading-none ${c.color === 'red' ? 'text-red-600' : 'text-neutral-900'}`}>
                      {c.rank}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. CENTER ROUND STATUS / DEALER CONTROLS */}
        <div className="my-3 flex flex-col items-center text-center">
          {state.roundMessage ? (
            <div className="px-4 py-2 rounded-2xl bg-black/80 border border-[#D4AF37] text-xs font-black text-[#FDF6C7] shadow-xl max-w-lg animate-fade-in">
              {state.roundMessage}
            </div>
          ) : (
            <div className="text-[11px] font-bold text-emerald-200/90">
              {state.phase === 'betting'
                ? '請確認本輪下注籌碼，全員就緒後開局發牌！'
                : '依序進行要牌或停牌，目標擊敗系統莊家！'}
            </div>
          )}

          {/* Host Next Actions */}
          <div className="mt-2.5 flex items-center gap-2">
            {state.phase === 'betting' && isHost && (
              <button
                onClick={handleStartDealing}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:brightness-110 text-[#231710] font-black text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>發牌開局 (Deal)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {state.phase === 'player_turns' && allPlayersDone && (
              <button
                onClick={handleSettleDealerTurn}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-[#231710] font-black text-xs shadow-md cursor-pointer transition-all active:scale-95 animate-pulse flex items-center gap-1.5"
              >
                <span>全員停牌，揭開莊家底牌 ➔</span>
              </button>
            )}

            {state.phase === 'round_settled' && isHost && (
              <button
                onClick={handleNextRound}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-black text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>進入下一回合 (第 {state.currentRound + 1} 輪)</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. PLAYERS SEATS GRID */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {roomPlayers.map((p) => {
            const pState = state.players[p.uid] || {
              uid: p.uid,
              chips: state.entryFee,
              bet: 20,
              hand: [],
              status: 'betting',
              score: { total: 0, isSoft: false, isBlackjack: false, isBust: false }
            };
            const isMe = p.uid === myUid;
            const isBust = pState.status === 'bust';
            const isBJ = pState.status === 'blackjack';
            const isStand = pState.status === 'stand';

            return (
              <div
                key={`bj-seat-${p.uid}`}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  isMe
                    ? 'bg-black/60 border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md'
                    : 'bg-black/40 border-emerald-900/40 text-neutral-300'
                }`}
              >
                {/* Seat Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={p.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.uid}`}
                      alt={p.displayName}
                      className="w-7 h-7 rounded-lg border border-[#D4AF37]/40 object-cover"
                    />
                    <div>
                      <div className="text-xs font-black text-[#FDF6C7] flex items-center gap-1">
                        <span>{p.displayName}</span>
                        {isMe && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">你</span>}
                      </div>
                      <div className="text-[10px] font-mono text-amber-200">
                        籌碼: 🪙 {pState.chips}
                      </div>
                    </div>
                  </div>

                  {/* Bet & Status Badges */}
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-[#FFD700]">
                      注額: 🪙 {pState.bet}
                    </div>
                    {isBust ? (
                      <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black">爆牌</span>
                    ) : isBJ ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500 text-neutral-900 text-[9px] font-black">21點</span>
                    ) : isStand ? (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-black">停牌 ({pState.score.total}點)</span>
                    ) : (
                      <span className="text-[9px] text-neutral-400 font-bold">{pState.score.total > 0 ? `${pState.score.total} 點` : '等待中'}</span>
                    )}
                  </div>
                </div>

                {/* Player Cards */}
                <div className="flex items-center gap-1.5 min-h-[72px] overflow-x-auto py-1">
                  {pState.hand.length === 0 ? (
                    <div className="text-[10px] text-neutral-500 font-bold">尚未發牌</div>
                  ) : (
                    pState.hand.map((c, idx) => (
                      <div
                        key={`card-${p.uid}-${idx}`}
                        className="w-12 h-17 rounded-lg bg-white border border-amber-300 shadow-sm flex flex-col justify-between p-1 select-none shrink-0"
                      >
                        <div className={`text-[10px] font-black leading-none ${c.color === 'red' ? 'text-red-600' : 'text-neutral-900'}`}>
                          {c.rank}
                        </div>
                        <div className={`text-lg text-center leading-none ${c.color === 'red' ? 'text-red-600' : 'text-neutral-900'}`}>
                          {c.suit}
                        </div>
                        <div className={`text-[10px] font-black text-right leading-none ${c.color === 'red' ? 'text-red-600' : 'text-neutral-900'}`}>
                          {c.rank}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* My Interactive Controls (Only visible on My Seat) */}
                {isMe && state.phase === 'player_turns' && myState.status === 'playing' && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5">
                    <button
                      onClick={handleHit}
                      className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      要牌 (Hit)
                    </button>
                    <button
                      onClick={handleStand}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      停牌 (Stand)
                    </button>
                    {myState.hand.length === 2 && myState.chips >= myState.bet * 2 && (
                      <button
                        onClick={handleDoubleDown}
                        className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        加倍 (2x)
                      </button>
                    )}
                  </div>
                )}

                {/* Betting Phase: Select Round Bet */}
                {isMe && state.phase === 'betting' && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      {[10, 20, 50, 100].map((b) => (
                        <button
                          key={`bet-opt-${b}`}
                          disabled={myState.chips < b}
                          onClick={() => setSelectedBet(b)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            selectedBet === b
                              ? 'bg-[#FFD700] text-neutral-900 border-[#FFD700]'
                              : 'bg-black/40 text-amber-200 border-amber-500/30'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleConfirmBet}
                      className="px-2.5 py-1 rounded-lg bg-[#D4AF37] text-neutral-900 text-[10px] font-black shadow-xs cursor-pointer hover:brightness-110 active:scale-95"
                    >
                      確認下注
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Over Modal / Result Banner */}
      <AnimatePresence>
        {state.phase === 'game_over' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl glass-panel rounded-3xl p-5 border-2 border-[#D4AF37] bg-[#140D0A]/95 text-center shadow-2xl flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-neutral-900 flex items-center justify-center font-black text-2xl shadow-lg animate-bounce">
              🏆
            </div>
            <h3 className="text-lg font-black text-[#FDF6C7]">
              21點牌局終局結算！
            </h3>
            <p className="text-xs text-amber-200 font-bold">
              {state.eliminatedUids && state.eliminatedUids.length > 0
                ? '已有玩家籌碼耗盡破產，牌局提前終結！'
                : `已完成全數 ${state.totalRounds} 回合大戰！`}
            </p>

            {/* Scoreboard */}
            <div className="w-full space-y-1.5 my-2">
              {Object.values(state.players)
                .sort((a, b) => b.chips - a.chips)
                .map((p, idx) => (
                  <div
                    key={`final-p-${p.uid}`}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-500/20 border-[#FFD700] text-[#FFD700]'
                        : 'bg-black/40 border-white/10 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span>{p.uid === myUid ? '你' : '玩家'}</span>
                    </div>
                    <div className="font-mono text-sm font-black">
                      剩餘籌碼: 🪙 {p.chips}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
