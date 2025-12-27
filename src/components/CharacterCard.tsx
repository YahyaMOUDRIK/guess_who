"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./CharacterCard.module.css";
import { Character } from "@/hooks/useSocket";

interface CharacterCardProps {
  character: Character;
  isEliminated: boolean;
  isSelected: boolean;
  onToggleEliminate: () => void;
  onSelect: () => void;
  isPicking?: boolean;
}

export function CharacterCard({
  character,
  isEliminated,
  isSelected,
  onToggleEliminate,
  onSelect,
  isPicking = false,
}: CharacterCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`${styles.cardContainer} ${isEliminated ? styles.flipped : ""}`}
      onClick={!isPicking ? onToggleEliminate : undefined}
    >
      <div className={styles.cardInner}>
        {/* Front of the card */}
        <div className={`${styles.cardFront} ${isSelected ? styles.selected : ""}`}>
          <div className={styles.imageWrapper}>
            {imageError ? (
              <div className={styles.placeholder}>
                <span className={styles.placeholderEmoji}>👤</span>
              </div>
            ) : (
              <img
                src={character.image}
                alt={character.name}
                className={styles.image}
                onError={() => setImageError(true)}
              />
            )}
          </div>
          <div className={styles.info}>
            <span className={styles.name}>{character.name}</span>
            {isPicking && (
              <button
                className={`${styles.selectButton} ${isSelected ? styles.selectedButton : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                {isSelected ? "Selected" : "Pick"}
              </button>
            )}
          </div>
        </div>

        {/* Back of the card */}
        <div className={styles.cardBack}>
          <div className={styles.backPattern}>
            <span>?</span>
          </div>
        </div>
      </div>
    </div>
  );
}
