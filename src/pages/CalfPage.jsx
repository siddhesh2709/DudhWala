import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import RecordDetail from '../components/RecordDetail';
import styles from './CalfPage.module.css';
import { fmtDate, fmt, todayKey, p2, MR_MONTHS } from '../store';

export default function CalfPage({ onSwitchTab, onGoEntry }) {
  const { state } = useApp();
  const { profile, records } = state;
  const dk = todayKey();
  const rec = records[dk];
  const calfDone = !!rec?.calf?.saved;
  const calf = rec?.calf || {};
  const now = new Date();
  const ms = `${now.getFullYear()}-${p2(now.getMonth()+1)}`;
  const [detailKey, setDetailKeyState] = useState(null);

  useEffect(() => {
    const handlePopState = (e) => {
      if (!e.state || !e.state.calfDetailKey) {
        setDetailKeyState(null);
      } else if (e.state.calfDetailKey) {
        setDetailKeyState(e.state.calfDetailKey);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openDetail = (d) => {
    window.history.pushState({ ...window.history.state, calfDetailKey: d }, '');
    setDetailKeyState(d);
  };

  const closeDetail = () => {
    if (window.history.state?.calfDetailKey) {
      window.history.back();
    } else {
      setDetailKeyState(null);
    }
  };

  let mE=0, mDr=0, mMed=0;
  Object.entries(records).forEach(([d,r]) => {
    if (d.startsWith(ms) && r.calf?.saved) {
      mE   += r.calf.totalExpense || 0;
      mDr  += r.calf.drCost  || 0;
      mMed += r.calf.medCost || 0;
    }
  });

  const dates = Object.keys(records).filter(d => records[d].calf?.saved).sort().reverse();

  if (detailKey) {
    return (
      <RecordDetail
        dateKey={detailKey}
        type="calf"
        record={records[detailKey]}
        onBack={closeDetail}
        onEdit={detailKey === dk ? () => { closeDetail(); onGoEntry('calf'); } : null}
      />
    );
  }

  return (
    <div className={styles.page}>
      <TopBar
        icon="🐮"
        farmName={profile?.farmName}
        right={<span className={styles.dateChip}>{fmtDate(dk)}</span>}
      />

      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>वासरे व्यवस्थापन</h1>
        <p className={styles.heroSub}>{calfDone ? 'आजची नोंद पूर्ण झाली ✓' : 'आजची नोंद भरा'}</p>
      </div>

      <div className={styles.pillWrap}>
        {calfDone
          ? <span className={`${styles.pill} ${styles.pillOk}`}>✅ आजची वासरे नोंद पूर्ण झाली!</span>
          : <span className={`${styles.pill} ${styles.pillNone}`}>📋 आजची नोंद अद्याप झाली नाही</span>
        }
      </div>

      <div className={styles.secHead}>आजची नोंद</div>
      <div className={styles.entryCard} onClick={() => onGoEntry('calf')}>
        <div className={styles.ecLeft}>
          <span className={styles.ecIcon}>🐮</span>
          <div>
            <div className={styles.ecTitle}>वासरे दैनंदिन नोंद</div>
            <div className={styles.ecSub}>चारा, दूध, डॉक्टर, मेडिकल</div>
          </div>
        </div>
        <span className={`${styles.ecBadge} ${calfDone ? styles.done : styles.todo}`}>
          {calfDone ? '✓ झाले' : 'भरा →'}
        </span>
      </div>

      <div className={styles.secHead}>आजचा सारांश</div>
      <div className={styles.cardsGrid}>
        <div className={`${styles.statCard} ${styles.card_green}`}>
          <div className={styles.scHeader}>
            <div className={`${styles.scIcon} ${styles.ic_green}`}>🐮</div>
            <span className={`${styles.scBadge} ${styles.bdg_green}`}>संख्या</span>
          </div>
          <div className={styles.scLabel}>वासरांची संख्या</div>
          <div className={`${styles.scValue} ${styles.v_green}`}>{profile?.calves || 0}</div>
        </div>
        <div className={`${styles.statCard} ${styles.card_red}`}>
          <div className={styles.scHeader}>
            <div className={`${styles.scIcon} ${styles.ic_red}`}>💸</div>
            <span className={`${styles.scBadge} ${styles.bdg_red}`}>खर्च</span>
          </div>
          <div className={styles.scLabel}>आजचा खर्च</div>
          <div className={`${styles.scValue} ${styles.v_red}`}>{fmt(calf.totalExpense)}</div>
        </div>
      </div>

      <div className={styles.secHead}>या महिन्याचा सारांश</div>
      <div className={styles.monthBox}>
        <div className={styles.mbHead}>📅 {MR_MONTHS[now.getMonth()]} {now.getFullYear()}</div>
        <div className={styles.mbRow}><span className={styles.mbL}>💸 एकूण खर्च</span><span className={`${styles.mbR} ${styles.v_red}`}>{fmt(mE)}</span></div>
        <div className={styles.mbRow}><span className={styles.mbL}>🩺 डॉक्टर खर्च</span><span className={`${styles.mbR} ${styles.v_blue}`}>{fmt(mDr)}</span></div>
        <div className={styles.mbRow}><span className={styles.mbL}>💊 मेडिकल खर्च</span><span className={`${styles.mbR} ${styles.v_purple}`}>{fmt(mMed)}</span></div>
      </div>

      <div className={styles.secHead}>मागील नोंदी</div>
      <div className={styles.recList}>
        {dates.length === 0
          ? <div className={styles.empty}><div className={styles.emptyIcon}>📭</div><p>अद्याप कोणतीही नोंद नाही</p></div>
          : dates.map(d => {
              const f = records[d].calf;
              return (
                <div className={styles.recItem} key={d} onClick={() => openDetail(d)}>
                  <div>
                    <div className={styles.recDate}>{fmtDate(d)}</div>
                    <div className={styles.recMini}>
                      <span>💸 {fmt(f.totalExpense)}</span>
                      {f.milk_fed === 'yes' && <span>🥛 {f.milk_liters||0}L</span>}
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className={`${styles.recNet} ${styles.v_red}`}>{fmt(f.totalExpense)}</div>
                    <div className={styles.recArr}>›</div>
                  </div>
                </div>
              );
            })
        }
      </div>

      <div style={{height:90}} />
      <BottomNav active="calf" onSwitch={onSwitchTab} />
    </div>
  );
}
