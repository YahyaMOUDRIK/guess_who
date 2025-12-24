"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./GameBoard.module.css";
import { CharacterGrid, GameState } from "./CharacterGrid";
import { Room } from "@/hooks/useSocket";
import { Socket } from "socket.io-client";

interface GameBoardProps {
  room: Room;
  playerId: string | null;
  socket: Socket | null;
  onLeave: () => void;
}

export function GameBoard({ room, playerId, socket, onLeave }: GameBoardProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [opponentReady, setOpponentReady] = useState(false);
  const isHost = room.players[0]?.id === playerId;
  const playerNumber = isHost ? 1 : 2;

  // Listen for opponent's ready state
  useEffect(() => {
    if (!socket) return;

    const handleOpponentReady = () => {
      setOpponentReady(true);
    };

    socket.on("opponent-ready", handleOpponentReady);

    return () => {
      socket.off("opponent-ready", handleOpponentReady);
    };
  }, [socket]);

  // Notify when we're ready (have a game state)
  useEffect(() => {
    if (socket && gameState) {
      socket.emit("player-ready", { roomCode: room.code });
    }
  }, [socket, gameState, room.code]);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.leaveButton} onClick={onLeave}>
            ← Leave
          </button>
          <div className={styles.roomInfo}>
            <span className={styles.roomCode} onClick={copyRoomCode} title="Click to copy">
              {room.code}
            </span>
            <span className={styles.playerBadge}>Player {playerNumber}</span>
          </div>
        </div>
        <h1 className={styles.title}>Guess Who?</h1>
        <div className={styles.headerRight}>
          <div className={styles.playersStatus}>
            {room.players.map((player, idx) => (
              <div
                key={player.id}
                className={`${styles.playerDot} ${player.id === playerId ? styles.you : ""}`}
                title={`Player ${idx + 1}${player.id === playerId ? " (You)" : ""}`}
              >
                {idx + 1}
              </div>
            ))}
            {room.players.length < 2 && (
              <div className={styles.playerDot + " " + styles.waiting}>?</div>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {room.players.length < 2 && (
          <div className={styles.waitingBanner}>
            <span>👥 Waiting for opponent... Share code: </span>
            <strong onClick={copyRoomCode}>{room.code}</strong>
          </div>
        )}
        <CharacterGrid onStateChange={handleStateChange} />
      </main>
    </div>
  );
}

