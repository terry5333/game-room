import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users2,
  UserPlus,
  Check,
  Copy,
  Gamepad2,
  Sparkles,
  Send,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { matchService } from '../../services/matchService';
import { sound } from '../../services/soundService';
import type { GameRoom, FriendRecord, UserPresence, BattleInvite, GameId } from '../../types';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: GameRoom;
}

const GAME_NAMES: Record<GameId, string> = {
  '1a2b': '1A2B 數字密碼戰',
  'battleship': '海戰棋',
  'bingo': '賓果 5x5',
  'dots': '點線棋',
  'ooxx': '經典 OOXX'
};

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isOpen,
  onClose,
  currentRoom
}) => {
  const { currentUser } = useAuth();
  const [friendRecords, setFriendRecords] = useState<FriendRecord[]>([]);
  const [friendPresences, setFriendPresences] = useState<UserPresence[]>([]);
  const [invitedUids, setInvitedUids] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<boolean>(false);

  // Subscribe to mutual friends
  useEffect(() => {
    if (!currentUser || !isOpen) return;
    const unsub = matchService.subscribeFriends(currentUser.uid, (list) => {
      setFriendRecords(list);
    });
    return () => unsub();
  }, [currentUser?.uid, isOpen]);

  // Live status updater
  useEffect(() => {
    if (!isOpen || friendRecords.length === 0) {
      setFriendPresences([]);
      return;
    }

    const refresh = () => {
      const enriched = matchService.getFriendsLiveStatus(friendRecords);
      setFriendPresences(enriched);
    };

    refresh();
    const unsub = matchService.subscribePresence(refresh);
    const timer = setInterval(refresh, 3500);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [isOpen, friendRecords]);

  if (!isOpen || !currentUser) return null;

  const currentRoomPlayerUids = new Set(
    (currentRoom.players && currentRoom.players.length > 0
      ? currentRoom.players
      : [currentRoom.player1, currentRoom.player2]
    )
      .filter(Boolean)
      .map((p) => p?.uid)
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (friend: UserPresence) => {
    sound.playSuccess();
    const invite: BattleInvite = {
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      fromUid: currentUser.uid,
      fromName: currentUser.displayName,
      fromPhotoURL: currentUser.photoURL,
      toUid: friend.uid,
      gameId: currentRoom.gameId,
      roomId: currentRoom.id,
      roomCode: currentRoom.code,
      createdAt: Date.now(),
      status: 'pending'
    };

    matchService.sendBattleInvite(invite);
    setInvitedUids((prev) => new Set(prev).add(friend.uid));
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="relative w-full max-w-md bg-[#FAF8F5] border-2 border-white/90 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#96897B]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#628395] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2E2925]">邀請好友加入房間</h3>
              <p className="text-[11px] text-[#96897B] font-medium">
                {GAME_NAMES[currentRoom.gameId]}・房號 #{currentRoom.code}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-neutral-200/60 text-[#96897B] hover:text-[#2E2925] transition-colors cursor-pointer"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Code Quick Share Banner */}
        <div className="my-3.5 p-3 rounded-2xl bg-white border border-[#628395]/20 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#96897B]">房間號碼：</span>
            <span className="font-mono text-base font-black text-[#628395] tracking-widest">
              {currentRoom.code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-[#628395]/15 hover:bg-[#628395] text-[#628395] hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">已複製</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>複製房號</span>
              </>
            )}
          </button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {friendPresences.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs text-[#96897B] font-medium leading-relaxed">
              <Users2 className="w-8 h-8 text-[#96897B]/40 mx-auto mb-2" />
              目前尚未加入好友。<br />
              您可以將上方房號分享給好友，或在遊戲大廳搜尋對方 ID 加入好友！
            </div>
          ) : (
            friendPresences.map((f) => {
              const isAlreadyIn = currentRoomPlayerUids.has(f.uid) || f.currentRoomId === currentRoom.id;
              const isInvited = invitedUids.has(f.uid);
              const isOffline = f.status === 'offline';
              const isInOtherGame = !isAlreadyIn && f.status === 'in_game' && f.currentRoomId !== currentRoom.id;
              const isOnlineInLobby = !isAlreadyIn && !isInOtherGame && !isOffline;

              return (
                <div
                  key={f.uid}
                  className="rounded-2xl p-2.5 bg-white/80 border border-[#96897B]/15 flex items-center justify-between gap-2.5 shadow-2xs hover:bg-white transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={f.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.uid}`}
                        alt={f.displayName}
                        className="w-8 h-8 rounded-xl object-cover border border-[#96897B]/20"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                          isAlreadyIn
                            ? 'bg-emerald-500'
                            : isInOtherGame
                            ? 'bg-[#CF995F]'
                            : isOnlineInLobby
                            ? 'bg-emerald-500'
                            : 'bg-[#96897B]'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#2E2925] truncate">
                          {f.displayName}
                        </span>
                        <span className="font-mono text-[10px] text-[#96897B] shrink-0">
                          #{f.userTag}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-[#96897B] truncate">
                        {isAlreadyIn
                          ? '已在房間內'
                          : isInOtherGame
                          ? `對戰中（${f.currentGameName || '遊戲中'}）`
                          : isOnlineInLobby
                          ? '在線（大廳中）'
                          : '離線'}
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="shrink-0">
                    {isAlreadyIn ? (
                      <span className="text-[11px] font-bold text-emerald-600 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200">
                        已在房內
                      </span>
                    ) : isInvited ? (
                      <span className="text-[11px] font-bold text-[#628395] px-2.5 py-1 rounded-xl bg-[#628395]/15 border border-[#628395]/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>已邀請</span>
                      </span>
                    ) : isOffline ? (
                      <button
                        onClick={() => handleSendInvite(f)}
                        className="py-1.5 px-3 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-[#96897B] hover:text-[#2E2925] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="好友目前離線，仍可送出邀請待其上線"
                      >
                        <Send className="w-3 h-3" />
                        <span>邀請</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendInvite(f)}
                        className="py-1.5 px-3 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>邀請</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#96897B]/15 mt-2 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="py-2 px-4 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-[#2E2925] text-xs font-bold transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      </motion.div>
    </div>
  );
};
