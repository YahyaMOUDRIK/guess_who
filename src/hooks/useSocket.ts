"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

export interface Player {
  id: string;
  ready: boolean;
}

export interface Room {
  code: string;
  players: Player[];
  status: "waiting" | "playing" | "finished";
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
}

// Store room state outside component to persist across strict mode remounts
let persistedRoom: Room | null = null;

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(persistedRoom);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const mountedRef = useRef(false);

  // Sync persisted room state
  useEffect(() => {
    if (currentRoom) {
      persistedRoom = currentRoom;
    }
  }, [currentRoom]);

  useEffect(() => {
    // Skip duplicate mount in strict mode
    if (mountedRef.current) return;
    mountedRef.current = true;

    const socketInstance = getSocket();
    setSocket(socketInstance);

    const onConnect = () => {
      setIsConnected(true);
      setPlayerId(socketInstance.id || null);
      
      // If we had a room, try to re-sync (the socket id changed)
      if (persistedRoom) {
        // Check if we're still in that room on the server
        socketInstance.emit("get-room", persistedRoom.code, (response: { success: boolean; room?: Room }) => {
          if (response.success && response.room) {
            // Check if our socket is still in the room
            const stillInRoom = response.room.players.some(p => p.id === socketInstance.id);
            if (!stillInRoom) {
              // Try to rejoin
              socketInstance.emit("join-room", persistedRoom!.code, (joinResponse: { success: boolean; room?: Room }) => {
                if (joinResponse.success && joinResponse.room) {
                  setCurrentRoom(joinResponse.room);
                  persistedRoom = joinResponse.room;
                } else {
                  // Room doesn't exist or is full, clear it
                  setCurrentRoom(null);
                  persistedRoom = null;
                }
              });
            } else {
              setCurrentRoom(response.room);
            }
          } else {
            // Room no longer exists
            setCurrentRoom(null);
            persistedRoom = null;
          }
        });
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onPlayerJoined = ({ room }: { playerId: string; room: Room }) => {
      setCurrentRoom(room);
      persistedRoom = room;
    };

    const onPlayerLeft = ({ room }: { playerId: string; room: Room }) => {
      setCurrentRoom(room);
      persistedRoom = room;
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("player-joined", onPlayerJoined);
    socketInstance.on("player-left", onPlayerLeft);

    // Check if already connected
    if (socketInstance.connected) {
      setIsConnected(true);
      setPlayerId(socketInstance.id || null);
    }

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.off("player-joined", onPlayerJoined);
      socketInstance.off("player-left", onPlayerLeft);
      mountedRef.current = false;
    };
  }, []);

  const createRoom = useCallback(async (): Promise<Room | null> => {
    if (!socket) return null;

    return new Promise((resolve) => {
      socket.emit("create-room", (response: { success: boolean; room?: Room }) => {
        if (response.success && response.room) {
          setCurrentRoom(response.room);
          persistedRoom = response.room;
          resolve(response.room);
        } else {
          resolve(null);
        }
      });
    });
  }, [socket]);

  const joinRoom = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      if (!socket) return { success: false, error: "Not connected" };

      return new Promise((resolve) => {
        socket.emit(
          "join-room",
          code,
          (response: { success: boolean; room?: Room; error?: string }) => {
            if (response.success && response.room) {
              setCurrentRoom(response.room);
              persistedRoom = response.room;
              resolve({ success: true });
            } else {
              resolve({ success: false, error: response.error });
            }
          }
        );
      });
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    if (!socket) return;

    socket.emit("leave-room", () => {
      setCurrentRoom(null);
      persistedRoom = null;
    });
  }, [socket]);

  return {
    socket,
    isConnected,
    currentRoom,
    playerId,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}
