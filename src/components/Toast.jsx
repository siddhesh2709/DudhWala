import { useEffect, useRef } from 'react';
import styles from './Toast.module.css';

export default function Toast({ message, type = 'ok', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      {message}
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className={styles.wrap}>
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onDone={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
