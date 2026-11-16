import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users2,
  UserPlus,
  Copy,
  Check,
  Swords,
  X,
  Search,
  Eye,
  ArrowRight,
  Gamepad2,
  Bell,
  Trash2,
  ShieldCheck,
  Sparkles,
  CheckCheck,
  Lock,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../context/RoomContext';
import { matchService } from '../../services/matchService';
import type { UserPresence, GameId, BattleInvite, FriendRequest, FriendRecord, RoomCreationOptions } from '../../types';
import { sound } from '../../services/soundService';
import { RoomConfigModal } from './RoomConfigModal';
import { ExamCardModal } from '../profile/ExamCardModal';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GAME_NAMES: Record<GameId, string> = {
  '1a2b': '1A2B',
  'battleship': '海戰棋',
  'bingo': '賓果',
  'dots': '點線棋',
  'ooxx': '無限三子棋',
  'connect4': '四子棋'
};

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers } = useAuth();
  const { currentRoom, createRoom, joinRoomById, joinRoomByCode } = useRoom();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searchInput, setSearchInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [friendRecords, setFriendRecords] = useState<FriendRecord[]>([]);
  const [friendPresences, setFriendPresences] = useState<UserPresence[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);

  const [selectedFriend, setSelectedFriend] = useState<UserPresence | null>(null);
  const [inspectFriend, setInspectFriend] = useState<UserPresence | FriendRecord | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameId>('1a2b');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [requestSending, setRequestSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Subscribe to mutual friends from RTDB
  useEffect(() => {
    if (!currentUser) return;
    const unsub = matchService.subscribeFriends(currentUser.uid, (list) => {
      setFriendRecords(list);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Subscribe to friend requests from RTDB
  useEffect(() => {
    if (!currentUser) return;
    const unsub = matchService.subscribeFriendRequests(currentUser.uid, (reqs) => {
      setIncomingRequests(reqs);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Real-time zero-latency presence listener for friends
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

  const copyMyTag = () => {
    navigator.clipboard.writeText(`${currentUser.displayName}#${currentUser.userTag}`);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  // Send friend request (Requires other party's agreement)
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const query = searchInput.trim().toLowerCase();
    if (!query) return;

    // Search in all registered users
    const target = allUsers.find((u) => {
      if (u.uid === currentUser.uid) return false;
      const matchTag = u.userTag === query || `#${u.userTag}` === query;
      const matchName = u.displayName.toLowerCase() === query;
      const matchCode = u.friendCode?.toLowerCase() === query;
      const matchCombo = `${u.displayName}#${u.userTag}`.toLowerCase() === query;
      return matchTag || matchName || matchCode || matchCombo;
    });

    if (!target) {
      setFeedbackMsg({
        text: '未找到符合的玩家，請確認對方的 4 位數字 ID (#XXXX) 或暱稱是否正確！',
        type: 'error'
      });
      return;
    }

    // Check if already friends
    if (friendRecords.some((f) => f.uid === target.uid)) {
      sound.playError();
      setFeedbackMsg({ text: '該玩家已經是您的好友！', type: 'error' });
      return;
    }

    setRequestSending(true);
    try {
      const result = await matchService.sendFriendRequest(currentUser, target);
      if (result.success) {
        sound.playSuccess();
        setSearchInput('');
      } else {
        sound.playError();
      }
      setFeedbackMsg({
        text: result.message,
        type: result.success ? 'success' : 'error'
      });
    } finally {
      setRequestSending(false);
    }
  };

  // Accept incoming friend request
  const handleAcceptRequest = async (req: FriendRequest) => {
    sound.playSuccess();
    await matchService.acceptFriendRequest(req, currentUser);
    setFeedbackMsg({ text: `已同意並成功與 ${req.fromDisplayName} 加為好友！`, type: 'success' });
  };

  // Decline incoming friend request
  const handleDeclineRequest = async (req: FriendRequest) => {
    sound.playPop();
    await matchService.declineFriendRequest(currentUser.uid, req.fromUid);
    setFeedbackMsg({ text: '已婉拒該好友邀請。', type: 'success' });
  };

  // Follow friend into their active room (Supports 2-5 player rooms seamlessly)
  const handleFollowFriend = async (friend: UserPresence) => {
    if (!friend.currentRoomId && !friend.currentRoomCode) return;
    sound.playJoin();
    onClose();

    let ok = false;
    if (friend.currentRoomId) {
      ok = await joinRoomById(friend.currentRoomId);
    }
    if (!ok && friend.currentRoomCode) {
      ok = await joinRoomByCode(friend.currentRoomCode);
    }
    if (!ok) {
      sound.playError();
      alert('無法進入該房間，可能該房間已滿員或已關閉。');
    }
  };

  // Send battle invite - directly or via room config options
  const handleProceedToCreate = () => {
    sound.playClick();
    if (selectedGame === 'ooxx') {
      // OOXX has no customizable parameters, create directly
      handleCreateWithRules();
    } else {
      setShowConfigModal(true);
    }
  };

  const handleCreateWithRules = async (options?: RoomCreationOptions) => {
    if (!selectedFriend || !currentUser) return;
    setInviting(true);
    sound.playClick();

    try {
      const room = await createRoom(selectedGame, options);
      const invite: BattleInvite = {
        id: 'inv_' + Math.random().toString(36).substring(2, 9),
        fromUid: currentUser.uid,
        fromName: currentUser.displayName,
        fromPhotoURL: currentUser.photoURL,
        toUid: selectedFriend.uid,
        gameId: selectedGame,
        roomId: room.id,
        roomCode: room.code,
        createdAt: Date.now(),
        status: 'pending'
      };

      matchService.sendBattleInvite(invite);
      setSelectedFriend(null);
      setShowConfigModal(false);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setInviting(false);
    }
  };

  const handleInviteToCurrentRoom = (friend: UserPresence) => {
    if (!currentRoom || !currentUser) return;
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
    setFeedbackMsg({ text: `已發送房間邀請給 ${friend.displayName}！`, type: 'success' });
  };

  return (
    <>

      {/* Main Friends Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="w-full max-w-md glass-panel rounded-3xl p-4 sm:p-6 border-2 border-white/80 shadow-2xl relative max-h-[88vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/15 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-[#628395]" />
              <h3 className="font-extrabold text-base text-[#2E2925]">
                好友名單與對戰狀態
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/60 text-[#96897B] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* My Tag Card */}
          <div className="bg-white/60 rounded-2xl p-3 border border-white/70 mb-3 flex items-center justify-between text-xs shrink-0">
            <div>
              <div className="text-[10px] text-[#96897B] font-bold">我的專屬好友 ID</div>
              <div className="font-bold text-[#2E2925] flex items-center gap-1 mt-0.5">
                <span className="truncate max-w-[140px] sm:max-w-none">{currentUser.displayName}</span>
                <span className="font-mono text-[#628395]">#{currentUser.userTag}</span>
              </div>
            </div>

            <button
              onClick={copyMyTag}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-[11px] font-bold text-[#628395] border border-[#96897B]/20 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製' : '複製'}</span>
            </button>
          </div>

          {/* Navigation Tabs (Friends vs Pending Requests) */}
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('friends');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'friends'
                  ? 'bg-[#628395] text-white shadow-xs'
                  : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
              }`}
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>好友名單 ({friendRecords.length})</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('requests');
              }}
              className={`relative flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'bg-[#628395] text-white shadow-xs'
                  : 'bg-white/60 text-[#2E2925] hover:bg-white border border-[#96897B]/20'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>好友邀請</span>
              {incomingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black animate-pulse">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Feedback Alert Banner */}
          <AnimatePresence>
            {feedbackMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-3 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shrink-0 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{feedbackMsg.text}</span>
                <button
                  onClick={() => setFeedbackMsg(null)}
                  className="p-1 hover:opacity-70 text-current cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Send Friend Request Input */}
          <form onSubmit={handleSendFriendRequest} className="flex gap-2 mb-3 shrink-0">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="輸入對方 4 位數 ID (#XXXX) 或暱稱"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/20 text-xs font-bold text-[#2E2925] focus:outline-none focus:border-[#628395]"
              />
              <Search className="w-3.5 h-3.5 text-[#96897B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="submit"
              disabled={!searchInput.trim() || requestSending}
              className="px-3 py-2 rounded-xl bg-[#628395] hover:bg-[#526f7f] disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{requestSending ? '發送中' : '送出邀請'}</span>
            </button>
          </form>

          {/* Tab 1: Friends List */}
          {activeTab === 'friends' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {friendPresences.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#96897B] font-medium leading-relaxed">
                  目前尚無已加好友。<br />
                  請在上方輸入對方的 4 位數字 ID (#XXXX) 送出好友邀請，對方同意後即成為好友！
                </div>
              ) : (
                friendPresences.map((f) => {
                  const isInGame = f.status === 'in_game' && f.currentRoomId;
                  const isOnline = f.status === 'online' || f.status === 'lobby';

                  return (
                    <div
                      key={f.uid}
                      className="glass-panel-subtle rounded-2xl p-3 border border-white/70 flex items-center justify-between gap-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          onClick={() => {
                            sound.playClick();
                            setInspectFriend(f);
                          }}
                          className="relative shrink-0 cursor-pointer hover:scale-105 transition-transform"
                          title="點擊查看好友《帝國受驗准考證》"
                        >
                          <img
                            src={f.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.uid}`}
                            alt={f.displayName}
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                              isInGame
                                ? 'bg-[#CF995F] animate-pulse ring-2 ring-[#CF995F]/30'
                                : isOnline
                                ? 'bg-emerald-500'
                                : 'bg-[#96897B]'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-extrabold text-[#2E2925] truncate">
                              {f.displayName}
                            </span>
                            <span className="font-mono text-[10px] text-[#96897B] shrink-0">
                              #{f.userTag}
                            </span>
                          </div>

                          {/* Room tracking status - 100% visible */}
                          {isInGame ? (
                            <div className="text-[11px] font-bold text-[#CF995F] flex items-center gap-1 mt-0.5 truncate">
                              <Gamepad2 className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                              <span className="truncate">
                                正在房間《{f.currentGameName || '對戰'}》#{f.currentRoomCode}
                                {f.currentRoomMaxPlayers ? ` (${f.currentRoomPlayerCount || 1}/${f.currentRoomMaxPlayers}人)` : ''}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-[#96897B] font-medium">
                              {isOnline ? '大廳在線中' : '離線'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions: Follow into room, Invite to current room, or Send Battle Invite */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isInGame ? (
                          <button
                            onClick={() => handleFollowFriend(f)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#CF995F] hover:bg-[#b8854f] text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="跟隨進入該對戰房間"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>跟隨進房</span>
                          </button>
                        ) : currentRoom ? (
                          <button
                            disabled={!isOnline}
                            onClick={() => handleInviteToCurrentRoom(f)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                              !isOnline
                                ? 'opacity-30 cursor-not-allowed text-[#96897B] bg-neutral-100'
                                : 'bg-[#628395] hover:bg-[#526f7f] text-white cursor-pointer shadow-xs'
                            }`}
                            title="邀請加入我的房間"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>邀請進房</span>
                          </button>
                        ) : (
                          <button
                            disabled={!isOnline}
                            onClick={() => {
                              sound.playClick();
                              setSelectedFriend(f);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                              !isOnline
                                ? 'opacity-30 cursor-not-allowed text-[#96897B] bg-neutral-100'
                                : 'bg-[#628395] hover:bg-[#526f7f] text-white cursor-pointer shadow-xs'
                            }`}
                            title="發送對戰邀請"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            <span>邀請對戰</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Incoming Friend Requests */}
          {activeTab === 'requests' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#96897B] font-medium leading-relaxed">
                  目前沒有待處理的好友邀請。<br />
                  當其他玩家向您發送邀請時，會即時顯示在此處供您同意！
                </div>
              ) : (
                incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="glass-panel-subtle rounded-2xl p-3 border border-white/70 flex items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={req.fromPhotoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.fromUid}`}
                        alt={req.fromDisplayName}
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-extrabold text-[#2E2925] truncate">
                            {req.fromDisplayName}
                          </span>
                          <span className="font-mono text-[10px] text-[#628395] font-bold">
                            #{req.fromUserTag}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#96897B]">
                          請求加您為好友
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>同意</span>
                      </button>

                      <button
                        onClick={() => handleDeclineRequest(req)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-[#96897B] hover:text-rose-600 border border-[#96897B]/20 font-bold text-xs transition-colors cursor-pointer"
                      >
                        婉拒
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Battle Invite Sub-modal */}
      <AnimatePresence>
        {selectedFriend && !showConfigModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs glass-panel rounded-3xl p-5 shadow-2xl border border-white/80"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#2E2925]">
                  邀請 {selectedFriend.displayName} 對戰
                </span>
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="p-1 text-[#96897B] cursor-pointer"
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
                onClick={handleProceedToCreate}
                className="w-full py-2.5 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {selectedGame === 'ooxx' ? (
                  <>
                    <Swords className="w-3.5 h-3.5" />
                    <span>{inviting ? '建立中...' : '送出邀請並開房'}</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{inviting ? '建立中...' : '下一步：自訂規則並開房'}</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Room Rule Configuration Modal when Inviting Friend */}
      <AnimatePresence>
        {showConfigModal && selectedFriend && (
          <RoomConfigModal
            gameId={selectedGame}
            subTitle={`與好友 ${selectedFriend.displayName} 對戰・自訂房間遊玩規則`}
            confirmText="確定規則並送出邀請"
            onClose={() => setShowConfigModal(false)}
            onConfirm={(opts) => handleCreateWithRules(opts)}
          />
        )}
      </AnimatePresence>
      {/* Inspect Friend Exam Card Modal */}
      <ExamCardModal
        isOpen={Boolean(inspectFriend)}
        onClose={() => setInspectFriend(null)}
        user={inspectFriend}
        isSelf={inspectFriend?.uid === currentUser?.uid}
      />
    </>
  );
};
