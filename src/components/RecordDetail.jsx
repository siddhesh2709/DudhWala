import styles from './RecordDetail.module.css';
import { fmt, fmtDate } from '../store';

const GN = { kargil: 'Kargil', trans: 'Transaction', maina8: '8 Maina Wali' };

export default function RecordDetail({ dateKey, type, record, onBack, onEdit }) {
  const c = record?.cow  || {};
  const f = record?.calf || {};
  const net = (record?.totalIncome||0) - (record?.totalExpense||0);

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <button className={styles.back} onClick={onBack}>←</button>
        <div className={styles.title}>{fmtDate(dateKey)}</div>
      </div>

      {type === 'cow' && c.saved && (
        <>
          <Section title="🥛 दूध">
            <Row l="सकाळ"     r={`${c.milk_morn||0}L × ₹${c.morn_rate||0} = ${fmt((c.milk_morn||0)*(c.morn_rate||0))}`} rc="blue" />
            <Row l="संध्याकाळ" r={`${c.milk_eve||0}L × ₹${c.eve_rate||0} = ${fmt((c.milk_eve||0)*(c.eve_rate||0))}`}  rc="blue" />
            <Row l="एकूण दूध" r={`${(c.totalMilk||0).toFixed(1)} L`} bold rc="blue" />
          </Section>
          <Section title="🌾 चारा">
            <Row l="जाळी" r={`${c.jali||0}×${c.jali_kg||0}KG=${((c.jali||0)*(c.jali_kg||0)).toFixed(1)}KG`} />
            <Row l="कढई" r={`${c.kadhai||0}×${c.kadhai_kg||0}KG=${((c.kadhai||0)*(c.kadhai_kg||0)).toFixed(1)}KG`} />
          </Section>
          {(c.drCost||c.goniCost||c.medCost) ? (
            <Section title="💸 खर्च">
              {c.dr_came==='yes'     && <Row l="🩺 डॉक्टर"                      r={fmt(c.drCost)}   rc="red" />}
              {c.goni_bought==='yes' && <Row l={`📦 ${GN[c.goni_type]||''} ×${c.goni_cnt}`} r={fmt(c.goniCost)} rc="red" />}
              {c.med_bought==='yes'  && <Row l="💊 मेडिकल"                      r={fmt(c.medCost)}  rc="red" />}
            </Section>
          ) : null}
        </>
      )}

      {type === 'calf' && f.saved && (
        <>
          <Section title="🌾 चारा">
            <Row l="जाळी" r={`${f.jali||0}×${f.jali_kg||0}KG=${((f.jali||0)*(f.jali_kg||0)).toFixed(1)}KG`} />
            {f.milk_fed==='yes' && <Row l="🥛 दूध" r={`${f.calves_fed||0} वासरांना, ${f.milk_liters||0}L`} rc="blue" />}
          </Section>
          {(f.drCost||f.medCost) ? (
            <Section title="💸 खर्च">
              {f.dr_came==='yes'   && <Row l="🩺 डॉक्टर" r={fmt(f.drCost)}  rc="red" />}
              {f.med_bought==='yes' && <Row l="💊 मेडिकल" r={fmt(f.medCost)} rc="red" />}
            </Section>
          ) : null}
        </>
      )}

      {type === 'cow' && (
        <Section title="📊 एकूण" green>
          <Row l="💰 उत्पन्न" r={fmt(c.milkIncome)}   rc="green" bold />
          <Row l="💸 खर्च"   r={fmt(c.totalExpense)}  rc="red"   bold />
          <div className={styles.netRow}>
            <span>📈 निव्वळ</span>
            <span className={net>=0?styles.green:styles.red}>{fmt(net)}</span>
          </div>
        </Section>
      )}

      {type === 'calf' && (
        <Section title="📊 एकूण खर्च" red>
          <div className={styles.netRow}>
            <span>💸 एकूण</span>
            <span className={styles.red}>{fmt(f.totalExpense)}</span>
          </div>
        </Section>
      )}

      {onEdit && (
        <div style={{padding:'0 14px 20px'}}>
          <button className={styles.editBtn} onClick={onEdit}>✏️ नोंद बदला</button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, green, red }) {
  return (
    <div className={styles.section}>
      <div className={styles.sHead} style={green?{background:'var(--green-lt)',color:'var(--green)'}:red?{background:'var(--red-lt)',color:'var(--red)'}:{}}>{title}</div>
      {children}
    </div>
  );
}
function Row({ l, r, rc, bold }) {
  const colors = { blue:'var(--blue)', green:'var(--green)', red:'var(--red)' };
  return (
    <div className={styles.row}>
      <span style={bold?{fontWeight:800}:{}}>{l}</span>
      <span style={{fontWeight:bold?800:700,color:colors[rc]||'var(--text)'}}>{r}</span>
    </div>
  );
}
