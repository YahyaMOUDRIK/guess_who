"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./CharacterGrid.module.css";
import { Character, characters, shuffleCharacters } from "@/data/characters";
import { CharacterCard } from "./CharacterCard";

interface CharacterGridProps {
  onStateChange?: (state: GameState) => void;
  initialState?: GameState;
}

export interface GameState {
  eliminatedIds: number[];
  selectedId: number | null;
  shuffleOrder: number[];
}

export function CharacterGrid({ onStateChange, initialState }: CharacterGridProps) {
  const [shuffledCharacters, setShuffledCharacters] = useState<Character[]>([]);
  const [eliminatedIds, setEliminatedIds] = useState<Set<number>>(
    new Set(initialState?.eliminatedIds || [])
  );
  const [selectedId, setSelectedId] = useState<number | null>(
    initialState?.selectedId || null
  );

  // Initialize shuffled characters on mount
  useEffect(() => {
    if (initialState?.shuffleOrder && initialState.shuffleOrder.length > 0) {
      // Use the provided shuffle order
      const orderedChars = initialState.shuffleOrder
        .map((id) => characters.find((c) => c.id === id))
        .filter((c): c is Character => c !== undefined);
      setShuffledCharacters(orderedChars);
    } else {
      // Create new shuffle
      const shuffled = shuffleCharacters(characters);
      setShuffledCharacters(shuffled);
    }
  }, [initialState?.shuffleOrder]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange && shuffledCharacters.length > 0) {
      onStateChange({
        eliminatedIds: Array.from(eliminatedIds),
        selectedId,
        shuffleOrder: shuffledCharacters.map((c) => c.id),
      });
    }
  }, [eliminatedIds, selectedId, shuffledCharacters, onStateChange]);

  const toggleEliminate = useCallback((id: number) => {
    setEliminatedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const resetAll = useCallback(() => {
    setEliminatedIds(new Set());
    setSelectedId(null);
  }, []);

  const eliminatedCount = eliminatedIds.size;
  const remainingCount = characters.length - eliminatedCount;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            <span className={styles.statNumber}>{remainingCount}</span>
            <span className={styles.statLabel}>Remaining</span>
          </span>
          <span className={styles.statDivider}>|</span>
          <span className={styles.statItem}>
            <span className={styles.statNumber}>{eliminatedCount}</span>
            <span className={styles.statLabel}>Eliminated</span>
          </span>
        </div>
        <button className={styles.resetButton} onClick={resetAll}>
          ↺ Reset All
        </button>
      </div>

      <div className={styles.grid}>
        {shuffledCharacters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isEliminated={eliminatedIds.has(character.id)}
            isSelected={selectedId === character.id}
            onToggleEliminate={() => toggleEliminate(character.id)}
            onSelect={() => toggleSelect(character.id)}
          />
        ))}
      </div>

      {selectedId && (
        <div className={styles.selectionBanner}>
          <span>🎯 You picked: </span>
          <strong>
            {characters.find((c) => c.id === selectedId)?.name || "Unknown"}
          </strong>
        </div>
      )}

      <div className={styles.instructions}>
        <p>👆 Click a character to <strong>eliminate</strong> them</p>
        <p>⭐ Click the star to <strong>pick</strong> your guess</p>
      </div>
    </div>
  );
}

