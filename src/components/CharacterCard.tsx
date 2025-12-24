"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./CharacterCard.module.css";
import { Character } from "@/data/characters";

interface CharacterCardProps {
  character: Character;
  isEliminated: boolean;
  isSelected: boolean;
  onToggleEliminate: () => void;
  onSelect: () => void;
}

export function CharacterCard({
  character,
  isEliminated,
  isSelected,
  onToggleEliminate,
  onSelect,
}: CharacterCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`${styles.card} ${isEliminated ? styles.eliminated : ""} ${
        isSelected ? styles.selected : ""
      }`}
    >
      <button
        type="button"
        className={styles.imageWrapper}
        onClick={onToggleEliminate}
        aria-label={isEliminated ? `Restore ${character.name}` : `Eliminate ${character.name}`}
      >
        {imageError ? (
          <div className={styles.placeholder}>
            <span className={styles.placeholderEmoji}>👤</span>
            <span className={styles.placeholderId}>{character.id}</span>
          </div>
        ) : (
          <Image
            src={character.image}
            alt={character.name}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 80px, 120px"
            onError={() => setImageError(true)}
          />
        )}
        {isEliminated && (
          <div className={styles.eliminatedOverlay}>
            <span className={styles.xMark}>✕</span>
          </div>
        )}
      </button>
      <div className={styles.info}>
        <span className={styles.name}>{character.name}</span>
        <button
          className={`${styles.selectButton} ${isSelected ? styles.selectedButton : ""}`}
          onClick={onSelect}
          title={isSelected ? "Unselect" : "Pick this character"}
        >
          {isSelected ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}

