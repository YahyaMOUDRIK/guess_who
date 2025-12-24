"use client";

import styles from "./ConnectionStatus.module.css";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div className={`${styles.status} ${isConnected ? styles.connected : styles.disconnected}`}>
      <span className={styles.indicator} />
      <span className={styles.text}>
        {isConnected ? "Connected" : "Connecting..."}
      </span>
    </div>
  );
}

