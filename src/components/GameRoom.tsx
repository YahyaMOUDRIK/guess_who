"use client";

import styles from "./GameRoom.module.css";
import { Room } from "@/hooks/useSocket";
import { GameBoard } from "./GameBoard";
import { Socket } from "socket.io-client";

interface GameRoomProps {
  room: Room;
  playerId: string | null;
  socket: Socket | null;
  onLeave: () => void;
}

export function GameRoom({ room, playerId, socket, onLeave }: GameRoomProps) {
  // Always show the GameBoard - it handles waiting state internally
  return (
    <GameBoard
      room={room}
      playerId={playerId}
      socket={socket}
      onLeave={onLeave}
    />
  );
}
