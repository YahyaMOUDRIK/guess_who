"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

export interface Player {
  id: string;
  ready: boolean;
  choice: string | null;
  eliminated: string[];
  finalized: boolean;
}

export interface Character {
  id: string;
  name: string;
  image: string;
}

export interface Room {
  code: string;
  players: Player[];
  status: "waiting" | "picking" | "playing" | "finished";
  characters: Character[];
  turn: string | null;
  winner: string | null;
  createdAt: number;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: Room | null;
  playerId: string | null;
  createRoom: () => Promise<Room | null>;
  joinRoom: (code: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  pickCharacter: (characterId: string) => void;
  toggleElimination: (characterId: string) => void;
  validateTurn: () => void;
  lockGuess: (characterId: string) => void;
}

// Store room state outside component to persist across strict mode remounts
let persistedRoom: Room | null = null;

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(persistedRoom);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const mountedRef = useRef(false);

  // Initialize persistent player ID (per session/tab)
  useEffect(() => {
    let pid = sessionStorage.getItem("guess-who-player-id");
    if (!pid) {
      pid = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("guess-who-player-id", pid);
    }
    setPlayerId(pid);
  }, []);

  // Sync Room to URL and Persisted State
  useEffect(() => {
    if (currentRoom) {
      persistedRoom = currentRoom;
      const url = new URL(window.location.href);
      if (url.searchParams.get("room") !== currentRoom.code) {
        url.searchParams.set("room", currentRoom.code);
        window.history.pushState({}, "", url.toString());
      }
    } else {
      persistedRoom = null;
      const url = new URL(window.location.href);
      if (url.searchParams.has("room")) {
        url.searchParams.delete("room");
        window.history.pushState({}, "", url.toString());
      }
    }
  }, [currentRoom]);

  useEffect(() => {
    if (!playerId) return; // Wait for playerId
    if (mountedRef.current) return;
    mountedRef.current = true;

    const socketInstance = getSocket();
    setSocket(socketInstance);

    const onConnect = () => {
      setIsConnected(true);

      // Auto-rejoin if room code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const roomCode = urlParams.get("room");
      if (roomCode) {
        socketInstance.emit("join-room", roomCode, playerId, (response: any) => {
          if (response.success && response.room) {
            console.log("Auto-joined room:", response.room.code, response.room.status);
            setCurrentRoom(response.room);
          } else {
            // Room exists check failed or other error
            const url = new URL(window.location.href);
            url.searchParams.delete("room");
            window.history.pushState({}, "", url.toString());
            setCurrentRoom(null);
          }
        });
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onRoomUpdate = (room: Room) => {
      console.log("Room updated from socket event:", room.status, room);
      setCurrentRoom(room);
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("room-update", onRoomUpdate);

    if (socketInstance.connected) {
      onConnect();
    }

    return () => {
      console.log("Cleaning up socket listeners");
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.off("room-update", onRoomUpdate);
      mountedRef.current = false;
    };
  }, [playerId]);

  const createRoom = useCallback(async (): Promise<Room | null> => {
    if (!socket || !playerId) return null;
    return new Promise((resolve) => {
      socket.emit("create-room", playerId, (response: { success: boolean; room?: Room }) => {
        if (response.success && response.room) {
          setCurrentRoom(response.room);
          resolve(response.room);
        } else {
          resolve(null);
        }
      });
    });
  }, [socket, playerId]);

  const joinRoom = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      if (!socket || !playerId) return { success: false, error: "Not connected" };
      return new Promise((resolve) => {
        socket.emit("join-room", code.toUpperCase(), playerId, (response: { success: boolean; room?: Room; error?: string }) => {
          if (response.success && response.room) {
            console.log("Joined room manually:", response.room.code, response.room.status);
            setCurrentRoom(response.room);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: response.error });
          }
        });
      });
    },
    [socket, playerId]
  );

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit("leave-room", () => {
      setCurrentRoom(null);
      persistedRoom = null;
    });
  }, [socket]);

  const pickCharacter = useCallback((characterId: string) => {
    if (!socket || !currentRoom) return;
    socket.emit("pick-character", { roomCode: currentRoom.code, characterId });
  }, [socket, currentRoom]);

  const toggleElimination = useCallback((characterId: string) => {
    if (!socket || !currentRoom) return;
    socket.emit("toggle-elimination", { roomCode: currentRoom.code, characterId });
  }, [socket, currentRoom]);

  const validateTurn = useCallback(() => {
    if (!socket || !currentRoom) return;
    socket.emit("validate-turn", { roomCode: currentRoom.code });
  }, [socket, currentRoom]);

  const lockGuess = useCallback((characterId: string) => {
    if (!socket || !currentRoom) return;
    socket.emit("lock-guess", { roomCode: currentRoom.code, characterId });
  }, [socket, currentRoom]);

  return {
    socket,
    isConnected,
    currentRoom,
    playerId,
    createRoom,
    joinRoom,
    leaveRoom,
    pickCharacter,
    toggleElimination,
    validateTurn,
    lockGuess,
  };
}

