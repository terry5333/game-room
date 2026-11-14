import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GameRoom, GameId, UserProfile } from '../types';
import { matchService, DEFAULT_SETTINGS } from '../services/matchService';
import { useAuth } from './AuthContext';
import { sound } from '../services/soundService';

interface RoomContextType {
  currentRoom: GameRoom | null;
  isHost: boolean;
  myRole: 'player1' | 'player2' | 'spectator';
  createRoom: (gameId: GameId) => Promise<GameRoom>;
  joinRoomByCode: (code: string) => Promise<boolean>;
  joinRoomById: (roomId: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  updateRoomState: (updater: (draft: GameRoom) => void) => Promise<void>;
  surrender: () => Promise<void>;
  restartGame: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);

  // Subscribe to room changes when inside a room
  useEffect(() => {
    if (!currentRoom?.id) return;

    const unsub = matchService.subscribeRoom(currentRoom.id, (updatedRoom) => {
      setCurrentRoom(updatedRoom);
    });

    return () => unsub();
  }, [currentRoom?.id]);

  // Update presence status based on whether user is in a room or in lobby
  useEffect(() => {
    if (!currentUser) return;
    matchService.updatePresence({
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      status: currentRoom ? 'in_game' : 'lobby',
      lastActive: Date.now(),
      currentRoomId: currentRoom?.id,
      currentGameId: currentRoom?.gameId
    });
  }, [currentUser, currentRoom?.id, currentRoom?.gameId]);

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
    setCurrentRoom(room);
    sound.playClick();
    return room;
  };

  const joinRoomByCode = async (code: string): Promise<boolean> => {
    if (!currentUser) return false;
    const room = await matchService.joinRoomByCode(code.trim(), currentUser);
    if (room) {
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
      setCurrentRoom(room);
      sound.playClick();
      return true;
    }
    return false;
  };

  const leaveRoom = async () => {
    if (currentRoom && currentUser) {
      // If user was host and waiting, mark closed
      if (isHost && currentRoom.status === 'waiting') {
        currentRoom.status = 'closed';
        await matchService.updateRoom(currentRoom);
      }
    }
    setCurrentRoom(null);
    sound.playClick();
  };

  const updateRoomState = async (updater: (draft: GameRoom) => void) => {
    if (!currentRoom) return;
    const copy: GameRoom = JSON.parse(JSON.stringify(currentRoom));
    updater(copy);
    setCurrentRoom(copy);
    await matchService.updateRoom(copy);
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
          turnDeadline: Date.now() + 30000
        };
      } else if (draft.gameId === 'battleship') {
        draft.stateBattleship = {
          boards: {},
          currentTurnUid: draft.hostUid
        };
      } else if (draft.gameId === 'bingo') {
        draft.stateBingo = {
          boards: {},
          ready: {},
          calledNumbers: [],
          currentTurnUid: draft.hostUid,
          linesCompleted: {}
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
          infiniteMode: draft.stateOOXX?.infiniteMode ?? true
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
