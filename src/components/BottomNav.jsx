import styles from './BottomNav.module.css';

const TABS = [
  { id: 'cow',     icon: '🐄', label: 'गाय' },
  { id: 'calf',    icon: '🐮', label: 'वासरे' },
  { id: 'profile', icon: '👤', label: 'प्रोफाइल' },
];

export default function BottomNav({ active, onSwitch }) {
  return (
    <nav className={styles.nav}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.btn} ${active === tab.id ? styles.active : ''}`}
          onClick={() => onSwitch(tab.id)}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
