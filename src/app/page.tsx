"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { useSocket } from "@/hooks/useSocket";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { RoomLobby } from "@/components/RoomLobby";
import { GameRoom } from "@/components/GameRoom";

export default function Home() {
  const {
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
    lockGuess
  } = useSocket();

  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const room = await createRoom();
      if (!room) {
        setError("Failed to create room. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const result = await joinRoom(joinCode.trim().toUpperCase());
      if (!result.success) {
        setError(result.error || "Failed to join room");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setJoinCode("");
    setError(null);
  };

  // If in a room, show the game room
  if (currentRoom) {
    return (
      <GameRoom
        room={currentRoom}
        playerId={playerId}
        socket={socket}
        onLeave={handleLeaveRoom}
        pickCharacter={pickCharacter}
        toggleElimination={toggleElimination}
        validateTurn={validateTurn}
        lockGuess={lockGuess}
      />
    );
  }


  // Otherwise show the lobby
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleEmoji}>🎭</span>
            Guess Who?
          </h1>
          <p className={styles.subtitle}>
            The classic guessing game, now multiplayer!
          </p>
          <ConnectionStatus isConnected={isConnected} />
        </div>

        <div className={styles.actions}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Create a Game</h2>
            <p className={styles.cardDescription}>
              Start a new game and invite a friend with your room code
            </p>
            <button
              className={styles.buttonPrimary}
              onClick={handleCreateRoom}
              disabled={!isConnected || isLoading}
            >
              {isLoading ? "Creating..." : "Create Room"}
            </button>
          </div>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Join a Game</h2>
            <p className={styles.cardDescription}>
              Enter a room code to join your friend&apos;s game
            </p>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className={styles.input}
                maxLength={6}
                disabled={!isConnected || isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.trim() && !isLoading && isConnected) {
                    handleJoinRoom();
                  }
                }}
              />
              <button
                className={styles.buttonSecondary}
                onClick={handleJoinRoom}
                disabled={!isConnected || isLoading || !joinCode.trim()}
              >
                {isLoading ? "Joining..." : "Join"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <span>⚠️</span> {error}
          </div>
        )}

        <RoomLobby />
      </div>
    </main>
  );
}

