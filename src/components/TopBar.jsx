import styles from './TopBar.module.css';

export default function TopBar({ title, icon = '🐄', right, onBack, farmName }) {
  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        {onBack && (
          <button className={styles.back} onClick={onBack}>←</button>
        )}
        <div className={styles.logo}>
          <div className={styles.pill}>{icon}</div>
          <span className={styles.name}>{farmName || title}</span>
        </div>
      </div>
      {right && <div className={styles.right}>{right}</div>}
    </header>
  );
}
