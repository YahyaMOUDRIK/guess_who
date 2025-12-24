"use client";

import styles from "./RoomLobby.module.css";

export function RoomLobby() {
  return (
    <div className={styles.lobby}>
      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🎯</span>
          <span>Ask yes/no questions</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🔍</span>
          <span>Eliminate characters</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🏆</span>
          <span>Guess to win!</span>
        </div>
      </div>
      <p className={styles.instructions}>
        Create a room and share the code with a friend, or join an existing game!
      </p>
    </div>
  );
}

