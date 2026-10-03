import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import RecordDetail from '../components/RecordDetail';
import styles from './CowPage.module.css';
import { fmtDate, fmtMonth, fmt, fmtL, todayKey, p2, MR_MONTHS } from '../store';

export default function CowPage({ onSwitchTab, onGoEntry }) {
  const { state } = useApp();
  const { profile, records } = state;
  const dk = todayKey();
  const rec = records[dk];
  const cowDone = !!rec?.cow?.saved;
  const cow = rec?.cow || {};
  const now = new Date();
  const ms = `${now.getFullYear()}-${p2(now.getMonth()+1)}`;
  const [detailKey, setDetailKeyState] = useState(null);

  useEffect(() => {
    const handlePopState = (e) => {
      if (!e.state || !e.state.cowDetailKey) {
        setDetailKeyState(null);
      } else if (e.state.cowDetailKey) {
        setDetailKeyState(e.state.cowDetailKey);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openDetail = (d) => {
    window.history.pushState({ ...window.history.state, cowDetailKey: d }, '');
    setDetailKeyState(d);
  };

  const closeDetail = () => {
    if (window.history.state?.cowDetailKey) {
      window.history.back();
    } else {
      setDetailKeyState(null);
    }
  };

  // Monthly totals
  let mM=0, mI=0, mE=0;
  Object.entries(records).forEach(([d,r]) => {
    if (d.startsWith(ms) && r.cow?.saved) {
      mM += r.cow.totalMilk || 0;
      mI += r.cow.milkIncome || 0;
      mE += r.cow.totalExpense || 0;
    }
  });
  const mNet = mI - mE;

  const dates = Object.keys(records).filter(d => records[d].cow?.saved).sort().reverse();

  if (detailKey) {
    return (
      <RecordDetail
        dateKey={detailKey}
        type="cow"
        record={records[detailKey]}
        onBack={closeDetail}
        onEdit={detailKey === dk ? () => { closeDetail(); onGoEntry('cow'); } : null}
      />
    );
  }

  return (
    <div className={styles.page}>
      <TopBar
        icon="🐄"
        farmName={profile?.farmName}
        right={<span className={styles.dateChip}>{fmtDate(dk)}</span>}
      />

      {/* Hero Banner */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>गाय व्यवस्थापन</h1>
        <p className={styles.heroSub}>{cowDone ? 'आजची नोंद पूर्ण झाली ✓' : 'आजची नोंद भरा'}</p>
      </div>

      {/* Status pill */}
      <div className={styles.pillWrap}>
        {cowDone
          ? <span className={`${styles.pill} ${styles.pillOk}`}>✅ आजची गाय नोंद पूर्ण झाली!</span>
          : <span className={`${styles.pill} ${styles.pillNone}`}>📋 आजची नोंद अद्याप झाली नाही</span>
        }
      </div>

      {/* Entry button */}
      <div className={styles.secHead}>आजची नोंद</div>
      <div className={styles.entryCard} onClick={() => onGoEntry('cow')}>
        <div className={styles.ecLeft}>
          <span className={styles.ecIcon}>🐄</span>
          <div>
            <div className={styles.ecTitle}>गाय दैनंदिन नोंद</div>
            <div className={styles.ecSub}>आजच्या सर्व प्रश्नांची उत्तरे द्या</div>
          </div>
        </div>
        <span className={`${styles.ecBadge} ${cowDone ? styles.done : styles.todo}`}>
          {cowDone ? '✓ झाले' : 'भरा →'}
        </span>
      </div>

      {/* Today stats */}
      <div className={styles.secHead}>आजचा सारांश</div>
        <div className={styles.cardsGrid}>
          <StatCard icon="🥛" color="blue"   label="आजचे दूध"    value={fmtL(cow.totalMilk)} tag="लिटर" />
          <StatCard icon="💰" color="green"  label="आजचे उत्पन्न" value={fmt(cow.milkIncome)} tag="उत्पन्न" />
          <StatCard icon="💸" color="red"    label="आजचा खर्च"   value={fmt(cow.totalExpense)} tag="खर्च" />
          <StatCard icon="📈" color={((cow.milkIncome||0)-(cow.totalExpense||0))>=0?'green':'red'}
            label="निव्वळ फायदा" value={fmt((cow.milkIncome||0)-(cow.totalExpense||0))} tag="नफा/तोटा" />
        </div>

      {/* Monthly summary */}
      <div className={styles.secHead}>या महिन्याचा सारांश</div>
      <div className={styles.monthBox}>
        <div className={styles.mbHead}>📅 {MR_MONTHS[now.getMonth()]} {now.getFullYear()}</div>
        <MbRow label="🥛 एकूण दूध"    value={mM.toFixed(1)+' L'} cls="blue" />
        <MbRow label="💰 एकूण उत्पन्न" value={fmt(mI)}            cls="green" />
        <MbRow label="💸 एकूण खर्च"   value={fmt(mE)}             cls="red" />
        <MbRow label="📈 निव्वळ"       value={fmt(mNet)}           cls={mNet>=0?'green':'red'} />
      </div>

      {/* Past records */}
      <div className={styles.secHead}>मागील नोंदी</div>
      <div className={styles.recList}>
        {dates.length === 0
          ? <Empty />
          : dates.map(d => {
              const c = records[d].cow;
              const net = (c.milkIncome||0) - (c.totalExpense||0);
              return (
                <div className={styles.recItem} key={d} onClick={() => openDetail(d)}>
                  <div>
                    <div className={styles.recDate}>{fmtDate(d)}</div>
                    <div className={styles.recMini}>
                      <span>🥛 {(c.totalMilk||0).toFixed(1)}L</span>
                      <span>💰 {fmt(c.milkIncome)}</span>
                      <span>💸 {fmt(c.totalExpense)}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className={`${styles.recNet} ${net>=0?styles.green:styles.red}`}>{fmt(net)}</div>
                    <div className={styles.recArr}>›</div>
                  </div>
                </div>
              );
            })
        }
      </div>

      <div style={{height:90}} />
      <BottomNav active="cow" onSwitch={onSwitchTab} />
    </div>
  );
}

function StatCard({ icon, color, label, value, tag }) {
  return (
    <div className={`${styles.statCard} ${styles['card_'+color]}`}>
      <div className={styles.scHeader}>
        <div className={`${styles.scIcon} ${styles['ic_'+color]}`}>{icon}</div>
        {tag && <span className={`${styles.scBadge} ${styles['bdg_'+color]}`}>{tag}</span>}
      </div>
      <div className={styles.scLabel}>{label}</div>
      <div className={`${styles.scValue} ${styles['v_'+color]}`}>{value}</div>
    </div>
  );
}
function MbRow({ label, value, cls }) {
  return (
    <div className={styles.mbRow}>
      <span className={styles.mbL}>{label}</span>
      <span className={`${styles.mbR} ${styles['v_'+cls]}`}>{value}</span>
    </div>
  );
}
function Empty() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>📭</div>
      <p>अद्याप कोणतीही नोंद नाही</p>
    </div>
  );
}
