import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users2,
  UserPlus,
  Copy,
  Check,
  Swords,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../context/RoomContext';
import { matchService } from '../../services/matchService';
import type { UserPresence, GameId, BattleInvite } from '../../types';
import { sound } from '../../services/soundService';

interface FriendsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRules: () => void;
}

const GAME_NAMES: Record<GameId, string> = {
  '1a2b': '1A2B',
  'battleship': '海戰棋',
  'bingo': '賓果',
  'dots': '點線棋',
  'ooxx': '無限三子棋',
  'connect4': '四子棋'
};

export const FriendsSidebar: React.FC<FriendsSidebarProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, allUsers } = useAuth();
  const { createRoom, joinRoomById } = useRoom();

  const [playerCodeInput, setPlayerCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserPresence | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameId>('1a2b');
  const [incomingInvite, setIncomingInvite] = useState<BattleInvite | null>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const unsub = matchService.subscribePresence((list) => {
      setPresences(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = matchService.subscribeInvites(currentUser.uid, (invite) => {
      if (invite.status === 'pending') {
        sound.playTurnChime();
        setIncomingInvite(invite);
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  if (!currentUser) return null;

  const copyMyCode = () => {
    navigator.clipboard.writeText(`#${currentUser.userTag}`);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const clean = playerCodeInput.trim().replace('#', '');
    if (!clean) return;

    const targetUser = allUsers.find((u) => u.userTag === clean || u.displayName.toLowerCase() === playerCodeInput.trim().toLowerCase());
    if (!targetUser) {
      alert('未找到對應玩家代碼 (#XXXX) 的玩家！');
      return;
    }
    if (targetUser.uid === currentUser.uid) {
      alert('無法將自己加為好友！');
      return;
    }

    matchService.updatePresence({
      uid: targetUser.uid,
      displayName: targetUser.displayName,
      photoURL: targetUser.photoURL,
      status: 'online',
      lastActive: Date.now()
    });

    setPlayerCodeInput('');
  };

  const handleSendInvite = async () => {
    if (!selectedFriend) return;
    setInviting(true);
    sound.playClick();

    try {
      const room = await createRoom(selectedGame);
      const invite: BattleInvite = {
        id: 'inv_' + Math.random().toString(36).substring(2, 9),
        fromUid: currentUser.uid,
        fromName: currentUser.displayName,
        toUid: selectedFriend.uid,
        gameId: selectedGame,
        roomId: room.id,
        createdAt: Date.now(),
        status: 'pending'
      };

      matchService.sendBattleInvite(invite);
      setSelectedFriend(null);
    } catch (e) {
      console.error(e);
    } finally {
      setInviting(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!incomingInvite) return;
    sound.playClick();
    const invite = incomingInvite;
    setIncomingInvite(null);
    await matchService.respondBattleInvite(currentUser.uid, invite.id, 'accepted');

    const ok = await joinRoomById(invite.roomId);
    if (!ok) {
      alert('無法加入該房間，可能已開始或關閉。');
    }
  };

  const handleDeclineInvite = async () => {
    sound.playClick();
    if (incomingInvite) {
      const invite = incomingInvite;
      setIncomingInvite(null);
      await matchService.respondBattleInvite(currentUser.uid, invite.id, 'declined');
    }
  };

  const displayFriends = presences.filter((p) => p.uid !== currentUser.uid);
  const effectiveFriends =
    displayFriends.length > 0
      ? displayFriends
      : allUsers
          .filter((u) => u.uid !== currentUser.uid)
          .map((u) => ({
            uid: u.uid,
            displayName: u.displayName,
            photoURL: u.photoURL,
            status: 'online' as const,
            lastActive: Date.now()
          }));

  return (
    <>
      {/* Incoming Invite Notification Card */}
      <AnimatePresence>
        {incomingInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-[#CF995F] shadow-xl text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#CF995F] text-white flex items-center justify-center mb-3 shadow-xs">
                <Swords className="w-6 h-6 text-white" />
              </div>

              <h4 className="font-extrabold text-base text-[#2E2925] mb-1">
                收到對戰邀請！
              </h4>
              <p className="text-xs text-[#96897B] font-medium mb-4">
                好友 <span className="font-bold text-[#628395]">{incomingInvite.fromName}</span> 邀請你進行《{GAME_NAMES[incomingInvite.gameId]}》！
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAcceptInvite}
                  className="py-2 px-3 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  接受挑戰
                </button>
                <button
                  onClick={handleDeclineInvite}
                  className="py-2 px-3 rounded-xl bg-white/70 hover:bg-white text-[#96897B] font-bold text-xs border border-[#96897B]/20 transition-colors cursor-pointer"
                >
                  婉拒
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:static top-0 right-0 bottom-0 z-40 w-72 glass-panel lg:bg-transparent p-4 flex flex-col gap-3 border-l border-white/60 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#96897B]/15">
          <div className="flex items-center gap-1.5">
            <Users2 className="w-4 h-4 text-[#628395]" />
            <span className="font-bold text-xs text-[#2E2925]">即時好友 ({effectiveFriends.length})</span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-[#96897B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleAddFriend} className="flex gap-1.5">
          <input
            type="text"
            value={playerCodeInput}
            onChange={(e) => setPlayerCodeInput(e.target.value)}
            placeholder="玩家代碼 (#XXXX)"
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-white/70 border border-[#96897B]/20 text-xs font-mono focus:outline-none focus:border-[#628395] text-[#2E2925]"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded-xl bg-[#628395] text-white text-xs font-bold hover:bg-[#526f7f] transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {effectiveFriends.map((f) => {
            const isOnline = f.status === 'online' || f.status === 'lobby';
            const isInGame = f.status === 'in_game';

            return (
              <div
                key={f.uid}
                className="bg-white/50 rounded-xl p-2 flex items-center justify-between gap-2 hover:bg-white/70 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={f.photoURL}
                      alt={f.displayName}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                        isInGame
                          ? 'bg-[#CF995F]'
                          : isOnline
                          ? 'bg-emerald-500'
                          : 'bg-[#96897B]'
                      }`}
                    />
                  </div>

                  <span className="text-xs font-bold text-[#2E2925] truncate">
                    {f.displayName}
                  </span>
                </div>

                <button
                  disabled={isInGame}
                  onClick={() => {
                    sound.playClick();
                    setSelectedFriend(f);
                  }}
                  title={isInGame ? '對戰中' : '邀請對戰'}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isInGame
                      ? 'opacity-30 cursor-not-allowed text-[#96897B]'
                      : 'text-[#CF995F] hover:bg-[#CF995F]/15 cursor-pointer'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Invite Game Picker Modal */}
        <AnimatePresence>
          {selectedFriend && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-xs glass-panel rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#2E2925]">
                    邀請 {selectedFriend.displayName}
                  </span>
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="p-1 text-[#96897B]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 mb-3">
                  {(Object.keys(GAME_NAMES) as GameId[]).map((gid) => (
                    <button
                      key={gid}
                      onClick={() => setSelectedGame(gid)}
                      className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                        selectedGame === gid
                          ? 'bg-[#628395] text-white'
                          : 'bg-white/60 text-[#2E2925] hover:bg-white'
                      }`}
                    >
                      <span>{GAME_NAMES[gid]}</span>
                      {selectedGame === gid && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>

                <button
                  disabled={inviting}
                  onClick={handleSendInvite}
                  className="w-full py-2 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>{inviting ? '發送中...' : '送出邀請'}</span>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </aside>
    </>
  );
};
