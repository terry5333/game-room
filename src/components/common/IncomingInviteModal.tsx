import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, X, Check, Gamepad2, Timer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../context/RoomContext';
import { matchService } from '../../services/matchService';
import { sound } from '../../services/soundService';
import type { BattleInvite, GameId } from '../../types';

const GAME_NAMES: Record<GameId, string> = {
  '1a2b': '1A2B 數字密碼戰',
  'battleship': '海戰棋 艦隊對決',
  'bingo': '賓果 5x5 連線',
  'dots': '點線棋 圍地方格',
  'ooxx': '經典 OOXX'
};

export const IncomingInviteModal: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentRoom, joinRoomById, joinRoomByCode, leaveRoom } = useRoom();
  const [invite, setInvite] = useState<BattleInvite | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [joining, setJoining] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Global listener for battle invites whenever currentUser is signed in
  useEffect(() => {
    if (!currentUser) return;

    const unsub = matchService.subscribeInvites(currentUser.uid, (incoming) => {
      if (incoming.status === 'pending') {
        const age = Date.now() - (incoming.createdAt || 0);
        if (age < 45000) {
          // Play notification chime!
          sound.playTurnChime();
          setInvite(incoming);
          setSecondsLeft(Math.max(5, Math.ceil((45000 - age) / 1000)));
        }
      }
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // Countdown timer for pending invite
  useEffect(() => {
    if (!invite) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (currentUser && invite) {
            matchService.respondBattleInvite(currentUser.uid, invite.id, 'expired');
          }
          setInvite(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [invite?.id, currentUser?.uid]);

  const handleDecline = useCallback(async () => {
    if (!invite || !currentUser) return;
    sound.playClick();
    const inv = invite;
    setInvite(null);
    await matchService.respondBattleInvite(currentUser.uid, inv.id, 'declined');
  }, [invite, currentUser]);

  const handleAccept = async () => {
    if (!invite || !currentUser || joining) return;
    setJoining(true);
    sound.playSuccess();
    const inv = invite;

    try {
      // 1. Send accepted response
      await matchService.respondBattleInvite(currentUser.uid, inv.id, 'accepted');

      // 2. If already in another room, leave it first
      if (currentRoom && currentRoom.id !== inv.roomId) {
        await leaveRoom();
      }

      // 3. Join target room by ID first, fallback to code
      let joined = await joinRoomById(inv.roomId);
      if (!joined && inv.roomCode) {
        joined = await joinRoomByCode(inv.roomCode);
      }

      if (!joined) {
        sound.playError();
        setErrorToast('該房間已滿、已結束或不存在');
        setTimeout(() => setErrorToast(null), 3500);
      } else {
        setInvite(null);
      }
    } catch (err) {
      console.warn('Accept invite error:', err);
      setErrorToast('加入房間失敗，請稍後重試');
      setTimeout(() => setErrorToast(null), 3500);
    } finally {
      setJoining(false);
    }
  };

  if (!currentUser) return null;

  return (
    <AnimatePresence>
      {invite && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="relative w-full max-w-sm bg-[#FAF8F5] border-3 border-[#628395] rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            {/* Top decorative accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#DBAD6A] via-[#628395] to-[#DBAD6A]" />

            {/* Close / Decline button */}
            <button
              onClick={handleDecline}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-200/70 text-[#96897B] hover:text-[#2E2925] transition-colors cursor-pointer"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Swords Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#628395] text-[#DFD5A5] flex items-center justify-center shadow-md animate-pulse">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-black text-[#DBAD6A] px-2 py-0.5 rounded-md bg-[#DBAD6A]/15 border border-[#DBAD6A]/30">
                  對戰邀請函
                </span>
                <h3 className="text-base font-black text-[#2E2925] mt-0.5">
                  收到遊戲對戰邀請！
                </h3>
              </div>
            </div>

            {/* Sender profile & Room Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#96897B]/20 shadow-2xs mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    invite.fromPhotoURL ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${invite.fromUid}`
                  }
                  alt={invite.fromName}
                  className="w-11 h-11 rounded-xl object-cover border-2 border-[#628395]/30 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-[#2E2925] truncate">
                    {invite.fromName}
                  </div>
                  <div className="text-xs text-[#96897B] font-medium flex items-center gap-1 mt-0.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-[#628395]" />
                    <span className="font-bold text-[#628395]">
                      {GAME_NAMES[invite.gameId] || invite.gameId}
                    </span>
                  </div>
                </div>
              </div>

              {invite.roomCode && (
                <div className="mt-2.5 pt-2 border-t border-[#96897B]/10 flex items-center justify-between text-xs">
                  <span className="text-[#96897B] font-medium">房間號碼：</span>
                  <span className="font-mono font-black text-sm text-[#628395] tracking-wider">
                    #{invite.roomCode}
                  </span>
                </div>
              )}
            </div>

            {/* Countdown timer */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#96897B] font-semibold mb-4">
              <Timer className="w-4 h-4 text-[#CF995F] animate-pulse" />
              <span>
                邀請將於 <span className="font-mono font-bold text-[#CF995F]">{secondsLeft}</span> 秒後自動失效
              </span>
            </div>

            {/* Error toast inside modal */}
            {errorToast && (
              <div className="mb-3 p-2 rounded-xl bg-red-100 border border-red-200 text-xs text-red-700 text-center font-bold">
                {errorToast}
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleDecline}
                disabled={joining}
                className="py-2.5 px-4 rounded-xl border border-[#96897B]/30 hover:bg-neutral-100 text-[#96897B] hover:text-[#2E2925] text-xs font-bold transition-all cursor-pointer text-center"
              >
                婉拒
              </button>
              <button
                onClick={handleAccept}
                disabled={joining}
                className="py-2.5 px-4 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {joining ? (
                  <span>進入中...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>接受進入</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
