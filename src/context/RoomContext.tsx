import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GameRoom, GameId, UserProfile } from '../types';
import { matchService, DEFAULT_SETTINGS } from '../services/matchService';
import { useAuth } from './AuthContext';
import { sound } from '../services/soundService';

interface RoomContextType {
  currentRoom: GameRoom | null;
  isHost: boolean;
  myRole: 'player1' | 'player2' | 'spectator';
  isConnected: boolean;
  isOpponentConnected: boolean;
  reconnecting: boolean;
  activeOngoingRoom: GameRoom | null;
  createRoom: (gameId: GameId) => Promise<GameRoom>;
  joinRoomByCode: (code: string) => Promise<boolean>;
  joinRoomById: (roomId: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  updateRoomState: (updater: (draft: GameRoom) => void) => Promise<void>;
  surrender: () => Promise<void>;
  restartGame: () => Promise<void>;
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
        if (
          room &&
          room.status !== 'closed' &&
          (room.player1.uid === currentUser.uid || room.player2?.uid === currentUser.uid)
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
      setCurrentRoom(updatedRoom);
    });

    return () => unsub();
  }, [currentRoom?.id]);

  // Update presence status based on whether user is in a room or in lobby
  useEffect(() => {
    if (!currentUser) return;
    const sendPresence = () => {
      matchService.updatePresence({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        userTag: currentUser.userTag,
        status: currentRoom ? 'in_game' : 'lobby',
        lastActive: Date.now(),
        currentRoomId: currentRoom?.id,
        currentRoomCode: currentRoom?.code,
        currentGameId: currentRoom?.gameId
      });
    };

    sendPresence();
    const interval = setInterval(sendPresence, 15000);
    return () => clearInterval(interval);
  }, [currentUser, currentRoom?.id, currentRoom?.gameId, currentRoom?.code]);

  const isHost = Boolean(currentUser && currentRoom && currentRoom.hostUid === currentUser.uid);

  let myRole: 'player1' | 'player2' | 'spectator' = 'spectator';
  if (currentUser && currentRoom) {
    if (currentRoom.player1.uid === currentUser.uid) {
      myRole = 'player1';
    } else if (currentRoom.player2?.uid === currentUser.uid) {
      myRole = 'player2';
    }
  }

  const createRoom = async (gameId: GameId): Promise<GameRoom> => {
    if (!currentUser) throw new Error('Must be logged in to create room');
    const multiplier = DEFAULT_SETTINGS.multipliers[gameId] || 1;
    const room = await matchService.createRoom(currentUser, gameId, multiplier);
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
        const opponentUid =
          currentRoom.player1.uid === currentUser.uid
            ? currentRoom.player2?.uid
            : currentRoom.player1.uid;

        const copy: GameRoom = JSON.parse(JSON.stringify(currentRoom));
        copy.status = 'settled';
        copy.winnerUid = opponentUid || 'draw';
        copy.updatedAt = Date.now();
        await matchService.updateRoom(copy);
      } else {
        // If waiting or settled, delete room
        await matchService.deleteRoom(roomId);
      }
    }
    setCurrentRoom(null);
    sound.playClick();
  };

  const updateRoomState = async (updater: (draft: GameRoom) => void) => {
    if (!currentRoom) return;
    const copy: GameRoom = JSON.parse(JSON.stringify(currentRoom));
    updater(copy);
    // Instantaneous local UI response for zero input lag
    setCurrentRoom(copy);
    matchService.updateRoom(copy).catch(console.warn);
  };

  const surrender = async () => {
    if (!currentRoom || !currentUser) return;
    const opponentUid = myRole === 'player1' ? currentRoom.player2?.uid : currentRoom.player1.uid;
    await updateRoomState((draft) => {
      draft.status = 'settled';
      draft.winnerUid = opponentUid || 'draw';
    });
  };

  const restartGame = async () => {
    if (!currentRoom) return;
    await updateRoomState((draft) => {
      draft.status = draft.player2 ? 'in_progress' : 'waiting';
      draft.winnerUid = undefined;

      // Re-initialize specific game state
      if (draft.gameId === '1a2b') {
        draft.state1a2b = {
          secrets: {},
          lockedIn: {},
          guesses: [],
          currentTurnUid: draft.hostUid,
          turnDeadline: Date.now() + 30000,
          hintsUsed: {}
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
        draft.stateDots = {
          lines: {},
          boxes: {},
          currentTurnUid: draft.hostUid,
          scores: { [draft.player1.uid]: 0, ...(draft.player2 ? { [draft.player2.uid]: 0 } : {}) },
          lastBonusTurn: false
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
        createRoom,
        joinRoomByCode,
        joinRoomById,
        leaveRoom,
        updateRoomState,
        surrender,
        restartGame
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
