import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GameRoom, GameId, UserProfile, RoomCreationOptions, PlayerRole, PlayerSlot } from '../types';
import { matchService, DEFAULT_SETTINGS } from '../services/matchService';
import { useAuth } from './AuthContext';
import { sound } from '../services/soundService';

interface RoomContextType {
  currentRoom: GameRoom | null;
  isHost: boolean;
  myRole: PlayerRole;
  playerIndex: number;
  players: PlayerSlot[];
  isConnected: boolean;
  isOpponentConnected: boolean;
  reconnecting: boolean;
  activeOngoingRoom: GameRoom | null;
  createRoom: (gameId: GameId, options?: RoomCreationOptions) => Promise<GameRoom>;
  joinRoomByCode: (code: string) => Promise<boolean>;
  joinRoomById: (roomId: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  updateRoomState: (updater: (draft: GameRoom) => void) => Promise<void>;
  surrender: () => Promise<void>;
  restartGame: () => Promise<void>;
  startGame: () => Promise<void>;
  rejoinActiveRoom: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isOpponentConnected, setIsOpponentConnected] = useState<boolean>(true);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [activeOngoingRoom, setActiveOngoingRoom] = useState<GameRoom | null>(null);

  // Subscribe to network & Firebase connection health
  useEffect(() => {
    const unsub = matchService.subscribeConnection((connected) => {
      setIsConnected(connected);
    });
    return () => unsub();
  }, []);

  // Auto-reconnect: Restore room on refresh or temporary disconnection
  useEffect(() => {
    if (!currentUser) return;
    const savedRoomId = localStorage.getItem('duo_active_room_id');
    if (savedRoomId && !currentRoom) {
      setReconnecting(true);
      matchService.getRoom(savedRoomId).then((room) => {
        const roomPlayers = room?.players && room.players.length > 0
          ? room.players
          : [room?.player1, room?.player2].filter(Boolean);
        if (
          room &&
          room.status !== 'closed' &&
          roomPlayers.some((p: any) => p.uid === currentUser.uid)
        ) {
          setCurrentRoom(room);
          setActiveOngoingRoom(room);
        } else {
          localStorage.removeItem('duo_active_room_id');
          setActiveOngoingRoom(null);
        }
      }).catch((e) => {
        console.warn('Auto-reconnect error:', e);
      }).finally(() => {
        setReconnecting(false);
      });
    }
  }, [currentUser?.uid]);

  // Track opponent's presence in real time
  useEffect(() => {
    if (!currentRoom || !currentUser) return;
    const opponentUid =
      currentRoom.player1.uid === currentUser.uid
        ? currentRoom.player2?.uid
        : currentRoom.player1.uid;

    if (!opponentUid) {
      setIsOpponentConnected(true);
      return;
    }

    const unsub = matchService.subscribePresence((presences) => {
      const opp = presences.find((p) => p.uid === opponentUid);
      if (opp) {
        setIsOpponentConnected(opp.status !== 'offline');
      } else {
        setIsOpponentConnected(true);
      }
    });

    return () => unsub();
  }, [currentRoom?.id, currentRoom?.player1?.uid, currentRoom?.player2?.uid, currentUser?.uid]);

  // Subscribe to room changes when inside a room
  useEffect(() => {
    if (!currentRoom?.id) return;

    localStorage.setItem('duo_active_room_id', currentRoom.id);

    const unsub = matchService.subscribeRoom(currentRoom.id, (updatedRoom) => {
      if (!updatedRoom || updatedRoom.status === 'closed') {
        localStorage.removeItem('duo_active_room_id');
        setActiveOngoingRoom(null);
        setCurrentRoom(null);
        return;
      }
      setCurrentRoom((prev) => {
        if (!prev) return updatedRoom;
        // Monotonic version sequence protection: zero clock-skew delay, immune to device time differences
        if (
          prev.id === updatedRoom.id &&
          prev.version &&
          updatedRoom.version &&
          updatedRoom.version < prev.version
        ) {
          return prev;
        }
        return updatedRoom;
      });
    });

    return () => unsub();
  }, [currentRoom?.id]);

  // Update presence status based on whether user is in a room or in lobby
  useEffect(() => {
    if (!currentUser) return;
    const sendPresence = () => {
      const pCount =
        (currentRoom?.players && currentRoom.players.length) ||
        (currentRoom?.player2 ? 2 : 1);

      matchService.updatePresence({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        userTag: currentUser.userTag,
        status: currentRoom ? 'in_game' : 'lobby',
        lastActive: Date.now(),
        currentRoomId: currentRoom?.id,
        currentRoomCode: currentRoom?.code,
        currentGameId: currentRoom?.gameId,
        currentRoomMaxPlayers: currentRoom?.maxPlayers || 2,
        currentRoomPlayerCount: pCount
      });
    };

    sendPresence();
    const interval = setInterval(sendPresence, 30000);
    return () => clearInterval(interval);
  }, [currentUser, currentRoom?.id, currentRoom?.gameId, currentRoom?.code, currentRoom?.maxPlayers, currentRoom?.players]);

  const isHost = Boolean(currentUser && currentRoom && currentRoom.hostUid === currentUser.uid);

  const players: PlayerSlot[] = currentRoom
    ? (() => {
        let list: PlayerSlot[] = Array.isArray(currentRoom.players)
          ? [...currentRoom.players]
          : currentRoom.players
          ? Object.values(currentRoom.players)
          : [];
        if (currentRoom.player1 && !list.some((p) => p.uid === currentRoom.player1.uid)) {
          list.unshift(currentRoom.player1);
        }
        if (currentRoom.player2 && !list.some((p) => p.uid === currentRoom.player2.uid)) {
          list.push(currentRoom.player2);
        }
        return list;
      })()
    : [];

  const playerIndex =
    currentUser && currentRoom ? players.findIndex((p) => p.uid === currentUser.uid) : -1;

  let myRole: PlayerRole = 'spectator';
  if (playerIndex === 0) myRole = 'player1';
  else if (playerIndex === 1) myRole = 'player2';
  else if (playerIndex === 2) myRole = 'player3';
  else if (playerIndex === 3) myRole = 'player4';
  else if (playerIndex === 4) myRole = 'player5';

  const createRoom = async (gameId: GameId, options?: RoomCreationOptions): Promise<GameRoom> => {
    if (!currentUser) throw new Error('Must be logged in to create room');
    const multiplier = DEFAULT_SETTINGS.multipliers[gameId] || 1;
    const room = await matchService.createRoom(currentUser, gameId, multiplier, options);
    localStorage.setItem('duo_active_room_id', room.id);
    setActiveOngoingRoom(room);
    setCurrentRoom(room);
    sound.playClick();
    return room;
  };

  const joinRoomByCode = async (code: string): Promise<boolean> => {
    if (!currentUser) return false;
    const room = await matchService.joinRoomByCode(code.trim(), currentUser);
    if (room) {
      localStorage.setItem('duo_active_room_id', room.id);
      setActiveOngoingRoom(room);
      setCurrentRoom(room);
      sound.playClick();
      return true;
    }
    return false;
  };

  const joinRoomById = async (roomId: string): Promise<boolean> => {
    if (!currentUser) return false;
    const room = await matchService.joinRoom(roomId, currentUser);
    if (room) {
      localStorage.setItem('duo_active_room_id', room.id);
      setActiveOngoingRoom(room);
      setCurrentRoom(room);
      sound.playClick();
      return true;
    }
    return false;
  };

  const rejoinActiveRoom = async () => {
    if (activeOngoingRoom) {
      setCurrentRoom(activeOngoingRoom);
      sound.playClick();
    }
  };

  const leaveRoom = async () => {
    localStorage.removeItem('duo_active_room_id');
    setActiveOngoingRoom(null);
    if (currentRoom) {
      const roomId = currentRoom.id;
      // 5 返回大廳就算退出 6 退出就結束遊戲默認對方勝利
      if (currentRoom.status === 'in_progress' && currentUser) {
        const activeList = currentRoom.players && currentRoom.players.length > 0
          ? currentRoom.players
          : ([currentRoom.player1, currentRoom.player2].filter(Boolean) as PlayerSlot[]);
        const remaining = activeList.filter((p) => p.uid !== currentUser.uid);

        const copy: GameRoom = JSON.parse(JSON.stringify(currentRoom));
        if (remaining.length <= 1) {
          copy.status = 'settled';
          copy.winnerUid = remaining[0]?.uid || 'draw';
        } else {
          copy.players = remaining;
          copy.player1 = remaining[0] || copy.player1;
          copy.player2 = remaining[1] || copy.player2;
        }
        copy.updatedAt = Date.now();
        await matchService.updateRoom(copy);
      } else {
        // If waiting or settled, delete room
        await matchService.deleteRoom(roomId);
      }
    }
    setCurrentRoom(null);
    sound.playClick();
    if (currentUser) {
      matchService.updatePresence({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        userTag: currentUser.userTag,
        status: 'lobby',
        lastActive: Date.now()
      });
    }
  };

  const updateRoomState = async (updater: (draft: GameRoom) => void) => {
    if (!currentRoom) return;
    const copy: GameRoom = JSON.parse(JSON.stringify(currentRoom));
    updater(copy);
    copy.version = (copy.version || 0) + 1;
    copy.updatedAt = Date.now();
    // Instantaneous local UI response for zero input lag
    setCurrentRoom(copy);
    matchService.updateRoom(copy).catch(console.warn);
  };

  const startGame = async () => {
    if (!currentRoom || !isHost) return;
    sound.playClick();
    await updateRoomState((draft) => {
      draft.status = 'in_progress';
      draft.updatedAt = Date.now();
    });
  };

  const surrender = async () => {
    if (!currentRoom || !currentUser) return;
    const activeList = currentRoom.players && currentRoom.players.length > 0
      ? currentRoom.players
      : ([currentRoom.player1, currentRoom.player2].filter(Boolean) as PlayerSlot[]);
    const other = activeList.find((p) => p.uid !== currentUser.uid);
    await updateRoomState((draft) => {
      draft.status = 'settled';
      draft.winnerUid = other?.uid || 'draw';
    });
  };

  const restartGame = async () => {
    if (!currentRoom) return;
    await updateRoomState((draft) => {
      const activePlayers = draft.players && draft.players.length > 0
        ? draft.players
        : ([draft.player1, draft.player2].filter(Boolean) as PlayerSlot[]);
      draft.players = activePlayers.map((p) => ({ ...p, ready: false }));
      draft.player1 = draft.players[0] || draft.player1;
      draft.player2 = draft.players[1] || draft.player2;
      draft.status = draft.players.length >= (draft.maxPlayers || 2) ? 'in_progress' : 'waiting';
      draft.winnerUid = undefined;

      // Re-initialize specific game state
      if (draft.gameId === '1a2b') {
        const preservedHintEnabled = draft.state1a2b?.hintEnabled !== undefined ? draft.state1a2b.hintEnabled : true;
        const preservedHintRound = draft.state1a2b?.hintRound || 5;
        const preservedMaxRounds = draft.state1a2b?.maxRounds || 0;
        let targetSecret = draft.state1a2b?.targetSecret;
        if ((draft.maxPlayers || 2) > 2) {
          const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          targetSecret = pool.slice(0, 4).join('');
        }
        draft.state1a2b = {
          secrets: {},
          lockedIn: targetSecret ? { [draft.hostUid]: true } : {},
          guesses: [],
          currentTurnUid: draft.hostUid,
          turnDeadline: Date.now() + 30000,
          hintsUsed: {},
          hintEnabled: preservedHintEnabled,
          hintRound: preservedHintRound,
          maxRounds: preservedMaxRounds,
          targetSecret
        };
      } else if (draft.gameId === 'battleship') {
        const preservedGridSize = draft.stateBattleship?.gridSize || 8;
        draft.stateBattleship = {
          boards: {},
          currentTurnUid: draft.hostUid,
          gridSize: preservedGridSize
        };
      } else if (draft.gameId === 'bingo') {
        const preservedTarget = draft.stateBingo?.targetLines || 5;
        draft.stateBingo = {
          boards: {},
          ready: {},
          calledNumbers: [],
          currentTurnUid: draft.hostUid,
          linesCompleted: {},
          targetLines: preservedTarget
        };
      } else if (draft.gameId === 'dots') {
        const preservedGridSize = draft.stateDots?.gridSize || 4;
        const initialScores: Record<string, number> = {};
        draft.players.forEach((p) => {
          initialScores[p.uid] = 0;
        });
        draft.stateDots = {
          lines: {},
          boxes: {},
          currentTurnUid: draft.hostUid,
          scores: initialScores,
          lastBonusTurn: false,
          gridSize: preservedGridSize
        };
      } else if (draft.gameId === 'ooxx') {
        draft.stateOOXX = {
          grid: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
          ],
          movesHistory: [],
          currentTurnUid: draft.hostUid,
          infiniteMode: false
        };
      }
    });
    sound.playClick();
  };

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        isHost,
        myRole,
        playerIndex,
        players,
        isConnected,
        isOpponentConnected,
        reconnecting,
        activeOngoingRoom,
        createRoom,
        joinRoomByCode,
        joinRoomById,
        leaveRoom,
        updateRoomState,
        surrender,
        restartGame,
        startGame,
        rejoinActiveRoom
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within a RoomProvider');
  return ctx;
};
