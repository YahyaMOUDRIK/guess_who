"use client";

import styles from "./CharacterGrid.module.css";
import { Character } from "@/hooks/useSocket";
import { CharacterCard } from "./CharacterCard";

interface CharacterGridProps {
  characters: Character[];
  eliminatedIds: string[];
  selectedId: string | null;
  onToggleEliminate: (id: string) => void;
  onSelect: (id: string) => void;
  isPicking?: boolean;
}

export function CharacterGrid({
  characters,
  eliminatedIds,
  selectedId,
  onToggleEliminate,
  onSelect,
  isPicking = false,
}: CharacterGridProps) {
  const eliminatedSet = new Set(eliminatedIds);

  return (
    <div className={styles.gridWrapper}>
      <div className={styles.grid}>
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isEliminated={eliminatedSet.has(character.id)}
            isSelected={selectedId === character.id}
            onToggleEliminate={() => onToggleEliminate(character.id)}
            onSelect={() => onSelect(character.id)}
            isPicking={isPicking}
          />
        ))}
      </div>
    </div>
  );
}
