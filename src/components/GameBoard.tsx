"use client";

import { useEffect, useState } from "react";
import styles from "./GameBoard.module.css";
import { CharacterGrid } from "./CharacterGrid";
import { Room } from "@/hooks/useSocket";

interface GameBoardProps {
  room: Room;
  playerId: string | null;
  onLeave: () => void;
  pickCharacter: (id: string) => void;
  toggleElimination: (id: string) => void;
  validateTurn: () => void;
  lockGuess: (id: string) => void;
}

export function GameBoard({
  room,
  playerId,
  onLeave,
  pickCharacter,
  toggleElimination,
  validateTurn,
  lockGuess,
}: GameBoardProps) {
  const me = room.players.find((p) => p.id === playerId);
  const opponent = room.players.find((p) => p.id !== playerId);
  const isMyTurn = room.turn === playerId;
  const myChoice = room.characters.find((c) => c.id === me?.choice);

  const [localFlipped, setLocalFlipped] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sync horizontal state
  useEffect(() => {
    if (me) {
      setLocalFlipped(me.eliminated);
    }
  }, [me?.eliminated]);

  const handleToggle = (id: string) => {
    if (room.status === "playing") {
      toggleElimination(id);
    }
  };

  const handleLockGuess = () => {
    if (room.status === "playing" && isMyTurn) {
      const remaining = room.characters.filter(c => !me?.eliminated.includes(c.id));
      const target = remaining.length === 1 ? remaining[0] : null;

      const confirmMsg = target
        ? `Are you sure you want to guess ${target.name}? If you're wrong, you lose!`
        : "You have multiple cards left. To guess now, you must pick one specific character. (Tip: eliminate others first or just guess by common sense if you're brave!)";

      if (target) {
        if (confirm(confirmMsg)) {
          lockGuess(target.id);
        }
      } else {
        alert("Please eliminate all but one character before locking your guess, or select a character to guess (functionality for selecting a specific guess without elimination is not yet implemented, please eliminate cards until only one remains).");
      }
    }
  };


  if (room.status === "waiting") {
    return (
      <div className={styles.waitingContainer}>
        <div className={styles.loader}></div>
        <h2>Waiting for an opponent...</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ margin: 0 }}>Share code: <strong>{room.code}</strong></p>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#10b981' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <button onClick={onLeave} className={styles.leaveButton}>Exit</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.left}>
            <button className={styles.leaveButtonSmall} onClick={onLeave}>←</button>
            <div className={styles.roomBadge}>Room: {room.code}</div>
          </div>

          <div className={styles.center}>
            {room.status === "picking" ? (
              <h2 className={styles.statusText}>Pick Your Character</h2>
            ) : (
              <div className={styles.turnIndicator}>
                {isMyTurn ? (
                  <span className={styles.yourTurn}>Your Turn</span>
                ) : (
                  <span className={styles.opponentTurn}>Opponent&apos;s Turn</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.right}>
            {opponent && (
              <div className={styles.opponentStats}>
                <span className={styles.statLabel}>Opponent:</span>
                <span className={styles.statValue}>{room.characters.length - (opponent.eliminated?.length || 0)} left</span>
              </div>
            )}
          </div>
        </div>

        {room.status === "playing" && myChoice && (
          <div className={styles.myChoiceBar}>
            <div className={styles.myChoiceInfo}>
              <span>Your character:</span>
              <strong>{myChoice.name}</strong>
            </div>
            <img src={myChoice.image} alt={myChoice.name} className={styles.myChoiceImg} />
          </div>
        )}
      </header>

      <main className={styles.main}>
        <CharacterGrid
          characters={room.characters}
          eliminatedIds={me?.eliminated || []}
          selectedId={me?.choice || null}
          onToggleEliminate={handleToggle}
          onSelect={pickCharacter}
          isPicking={room.status === "picking"}
        />
      </main>

      <footer className={styles.footer}>
        {room.status === "picking" && (
          <div className={styles.pickingFooter}>
            {me?.choice ? (
              <p>You picked <strong>{room.characters.find(c => c.id === me.choice)?.name}</strong>. Waiting for opponent...</p>
            ) : (
              <p>Select a character from the grid above to start the game.</p>
            )}
          </div>
        )}

        {room.status === "playing" && (
          <div className={styles.actionRow}>
            <button
              className={styles.validateButton}
              onClick={validateTurn}
              disabled={!isMyTurn}
            >
              Validate & End Turn
            </button>
            <button
              className={styles.guessButton}
              onClick={handleLockGuess}
              disabled={!isMyTurn || me?.eliminated.length !== (room.characters.length - 1)}
            >
              Lock Final Guess
            </button>
          </div>
        )}

        {room.status === "finished" && (
          <div className={styles.gameOver}>
            <h2>Game Over!</h2>
            <p className={styles.winnerText}>
              {room.winner === playerId ? "🏆 You Won!" : "❌ You Lost!"}
            </p>
            <button onClick={onLeave} className={styles.playAgain}>Back to Lobby</button>
          </div>
        )}
      </footer>
    </div>
  );
}
