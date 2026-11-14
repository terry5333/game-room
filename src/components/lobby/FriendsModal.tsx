import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users2,
  UserPlus,
  Copy,
  Check,
  Swords,
  X,
  Search,
  Radio,
  Eye,
  ArrowRight,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../context/RoomContext';
import { matchService } from '../../services/matchService';
import type { UserPresence, GameId, BattleInvite } from '../../types';
import { sound } from '../../services/soundService';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GAME_NAMES: Record<GameId, string> = {
  '1a2b': '1A2B',
  'battleship': '海戰棋',
  'bingo': '賓果',
  'dots': '點線棋',
  'ooxx': '無限三子棋'
};

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers } = useAuth();
  const { createRoom, joinRoomById } = useRoom();

  const [searchInput, setSearchInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [myFriendsUids, setMyFriendsUids] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('duo_my_friends');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  if (!isOpen || !currentUser) return null;

  const copyMyTag = () => {
    navigator.clipboard.writeText(`${currentUser.displayName}#${currentUser.userTag}`);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  // Add friend by 4-digit ID or Name or Code
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const query = searchInput.trim().toLowerCase();
    if (!query) return;

    // Search in all users or presences
    const target = allUsers.find((u) => {
      if (u.uid === currentUser.uid) return false;
      const matchTag = u.userTag === query || `#${u.userTag}` === query;
      const matchName = u.displayName.toLowerCase() === query;
      const matchCode = u.friendCode.toLowerCase() === query;
      const matchCombo = `${u.displayName}#${u.userTag}`.toLowerCase() === query;
      return matchTag || matchName || matchCode || matchCombo;
    });

    if (!target) {
      alert('未找到符合的玩家，請確認對方的 4 位數字 ID (#XXXX) 或暱稱是否正確！');
      return;
    }

    if (myFriendsUids.includes(target.uid)) {
      alert('該玩家已在您的好友名單中！');
      return;
    }

    const next = [...myFriendsUids, target.uid];
    setMyFriendsUids(next);
    localStorage.setItem('duo_my_friends', JSON.stringify(next));
    setSearchInput('');
    alert(`成功加為好友：${target.displayName} #${target.userTag}！`);
  };

  // Follow friend into room (跟蹤好友房間 / 觀戰 / 加入)
  const handleFollowFriend = async (friend: UserPresence) => {
    if (!friend.currentRoomId) return;
    sound.playClick();
    onClose();
    const ok = await joinRoomById(friend.currentRoomId);
    if (!ok) {
      alert('無法進入該房間，可能房間已結束或已關閉。');
    }
  };

  // Send battle invite
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
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setInviting(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!incomingInvite) return;
    sound.playClick();
    const targetRoomId = incomingInvite.roomId;
    incomingInvite.status = 'accepted';
    setIncomingInvite(null);
    onClose();

    const ok = await joinRoomById(targetRoomId);
    if (!ok) {
      alert('無法加入該房間。');
    }
  };

  // Get friends list
  const friendsList = allUsers
    .filter((u) => myFriendsUids.includes(u.uid))
    .map((u) => {
      const live = presences.find((p) => p.uid === u.uid);
      return {
        uid: u.uid,
        displayName: u.displayName,
        photoURL: u.photoURL,
        userTag: u.userTag,
        status: live ? live.status : ('offline' as const),
        currentRoomId: live?.currentRoomId,
        currentRoomCode: live?.currentRoomCode,
        currentGameName: live?.currentGameName || (live?.currentGameId ? GAME_NAMES[live.currentGameId] : undefined)
      };
    });

  return (
    <>
      {/* Incoming Invite Notification Card */}
      <AnimatePresence>
        {incomingInvite && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
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
                  onClick={() => setIncomingInvite(null)}
                  className="py-2 px-3 rounded-xl bg-white/70 hover:bg-white text-[#96897B] font-bold text-xs border border-[#96897B]/20 transition-colors cursor-pointer"
                >
                  婉拒
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Friends Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          className="w-full max-w-md glass-panel rounded-3xl p-6 border-2 border-white/80 shadow-2xl relative max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/15 mb-3">
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-[#628395]" />
              <h3 className="font-extrabold text-base text-[#2E2925]">
                好友名單與對戰動態
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/60 text-[#96897B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* My Tag Card */}
          <div className="bg-white/60 rounded-xl p-3 border border-white/70 mb-3 flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] text-[#96897B] font-bold">我的專屬 ID</div>
              <div className="font-bold text-[#2E2925] flex items-center gap-1">
                <span>{currentUser.displayName}</span>
                <span className="font-mono text-[#628395]">#{currentUser.userTag}</span>
              </div>
            </div>

            <button
              onClick={copyMyTag}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-50 text-[11px] font-bold text-[#628395] border border-[#96897B]/20 flex items-center gap-1 shadow-2xs"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? '已複製' : '複製'}</span>
            </button>
          </div>

          {/* Search & Add Friend Input */}
          <form onSubmit={handleAddFriend} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="輸入對方 4 位數字 ID (#XXXX) 或暱稱"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/20 text-xs font-bold text-[#2E2925] focus:outline-none focus:border-[#628395]"
              />
              <Search className="w-3.5 h-3.5 text-[#96897B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-[#628395] hover:bg-[#526f7f] disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>加好友</span>
            </button>
          </form>

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="text-xs font-bold text-[#96897B] mb-1">
              我的好友 ({friendsList.length})
            </div>

            {friendsList.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#96897B]">
                目前尚無好友，請在上方輸入朋友的 4 位數字 ID (#XXXX) 新增好友！
              </div>
            ) : (
              friendsList.map((f) => {
                const isOnline = f.status === 'online' || f.status === 'lobby';
                const isInGame = f.status === 'in_game';

                return (
                  <div
                    key={f.uid}
                    className="glass-panel rounded-2xl p-3 border border-white/70 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={f.photoURL}
                          alt={f.displayName}
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                            isInGame
                              ? 'bg-[#CF995F] animate-pulse'
                              : isOnline
                              ? 'bg-emerald-500'
                              : 'bg-[#96897B]'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-extrabold text-[#2E2925] truncate">
                            {f.displayName}
                          </span>
                          <span className="font-mono text-[10px] text-[#96897B]">
                            #{f.userTag}
                          </span>
                        </div>

                        {/* Room tracking status */}
                        {isInGame && f.currentRoomId ? (
                          <div className="text-[11px] font-semibold text-[#CF995F] flex items-center gap-1 mt-0.5">
                            <Gamepad2 className="w-3 h-3" />
                            <span>
                              正在對戰{f.currentGameName ? `《${f.currentGameName}》` : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#96897B]">
                            {isOnline ? '大廳在線中' : '離線'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Track/Spectate Room or Send Battle Invite */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {isInGame && f.currentRoomId ? (
                        <button
                          onClick={() => handleFollowFriend(f)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#CF995F] hover:bg-[#b8854f] text-white text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="跟隨進入該對戰房間觀戰/加入"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>跟隨進房</span>
                        </button>
                      ) : (
                        <button
                          disabled={!isOnline}
                          onClick={() => {
                            sound.playClick();
                            setSelectedFriend(f);
                          }}
                          className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                            !isOnline
                              ? 'opacity-30 cursor-not-allowed text-[#96897B]'
                              : 'bg-[#628395]/15 hover:bg-[#628395] text-[#628395] hover:text-white cursor-pointer'
                          }`}
                          title="發送對戰邀請"
                        >
                          <Swords className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Game Invite Picker Sub-modal */}
      <AnimatePresence>
        {selectedFriend && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs glass-panel rounded-2xl p-5 shadow-2xl border border-white/80"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#2E2925]">
                  邀請 {selectedFriend.displayName} 對戰
                </span>
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="p-1 text-[#96897B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 mb-4">
                {(Object.keys(GAME_NAMES) as GameId[]).map((gid) => (
                  <button
                    key={gid}
                    onClick={() => setSelectedGame(gid)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                      selectedGame === gid
                        ? 'bg-[#628395] text-white shadow-xs'
                        : 'bg-white/60 text-[#2E2925] hover:bg-white'
                    }`}
                  >
                    <span>{GAME_NAMES[gid]}</span>
                    {selectedGame === gid && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>

              <button
                disabled={inviting}
                onClick={handleSendInvite}
                className="w-full py-2.5 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>{inviting ? '建立中...' : '送出邀請並開房'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
