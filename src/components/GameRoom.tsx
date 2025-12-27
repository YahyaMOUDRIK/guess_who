"use client";

import styles from "./GameRoom.module.css";
import { Room } from "@/hooks/useSocket";
import { GameBoard } from "./GameBoard";
import { Socket } from "socket.io-client";

interface GameRoomProps {
  room: Room;
  playerId: string | null;
  socket: any; // Use the one from useSocket
  onLeave: () => void;
  pickCharacter: (id: string) => void;
  toggleElimination: (id: string) => void;
  validateTurn: () => void;
  lockGuess: (id: string) => void;
  playAgain: () => void;
}

export function GameRoom({
  room,
  playerId,
  onLeave,
  pickCharacter,
  toggleElimination,
  validateTurn,
  lockGuess,
  playAgain
}: GameRoomProps) {
  return (
    <GameBoard
      room={room}
      playerId={playerId}
      onLeave={onLeave}
      pickCharacter={pickCharacter}
      toggleElimination={toggleElimination}
      validateTurn={validateTurn}
      lockGuess={lockGuess}
      playAgain={playAgain}
    />
  );
}

