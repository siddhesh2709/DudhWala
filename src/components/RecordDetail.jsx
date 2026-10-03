import styles from './RecordDetail.module.css';
import { fmt, fmtDate } from '../store';

const GN = { kargil: 'Kargil', trans: 'Transaction', maina8: '8 Maina Wali' };

export default function RecordDetail({ dateKey, type = 'all', record, onBack, onEdit }) {
  const c = record?.cow  || {};
  const f = record?.calf || {};
  const showCow = (type === 'cow' || type === 'all') && c.saved;
  const showCalf = (type === 'calf' || type === 'all') && f.saved;
  const totalInc = (c.milkIncome || 0);
  const totalExp = (c.totalExpense || 0) + (f.totalExpense || 0);
  const net = totalInc - totalExp;

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <button className={styles.back} onClick={onBack}>←</button>
        <div className={styles.title}>📅 {fmtDate(dateKey)}</div>
      </div>

      {showCow && (
        <>
          <Section title="🐄 गाय नोंद — 🥛 दूध उत्पन्न">
            <Row l="सकाळ"     r={`${c.milk_morn||0}L × ₹${c.morn_rate||0} = ${fmt((c.milk_morn||0)*(c.morn_rate||0))}`} rc="blue" />
            <Row l="संध्याकाळ" r={`${c.milk_eve||0}L × ₹${c.eve_rate||0} = ${fmt((c.milk_eve||0)*(c.eve_rate||0))}`}  rc="blue" />
            <Row l="एकूण दूध" r={`${(c.totalMilk||0).toFixed(1)} L`} bold rc="blue" />
          </Section>
          <Section title="🌾 गाय - चारा">
            <Row l="जाळी (वजन)" r={`${c.jali||0} जाळी × ${c.jali_kg||0}KG = ${((c.jali||0)*(c.jali_kg||0)).toFixed(1)} KG`} />
            {c.jaliCost > 0 && <Row l="जाळी खर्च" r={fmt(c.jaliCost)} rc="red" />}
            {c.kadhai > 0 && <Row l="कढई" r={`${c.kadhai||0}×${c.kadhai_kg||0}KG=${((c.kadhai||0)*(c.kadhai_kg||0)).toFixed(1)}KG`} />}
          </Section>
          {(c.jaliCost || c.drCost || c.goniCost || c.medCost) ? (
            <Section title="💸 गाय - खर्च">
              {c.jaliCost > 0        && <Row l="🌾 चारा (जाळी)"                 r={fmt(c.jaliCost)} rc="red" />}
              {c.dr_came==='yes'     && <Row l="🩺 डॉक्टर"                      r={fmt(c.drCost)}   rc="red" />}
              {c.goni_bought==='yes' && <Row l={`📦 ${GN[c.goni_type]||''} ×${c.goni_cnt}`} r={fmt(c.goniCost)} rc="red" />}
              {c.med_bought==='yes'  && <Row l="💊 मेडिकल"                      r={fmt(c.medCost)}  rc="red" />}
              <Row l="गाय एकूण खर्च" r={fmt(c.totalExpense)} bold rc="red" />
            </Section>
          ) : null}
        </>
      )}

      {showCalf && (
        <>
          <Section title="🐮 वासरे नोंद — 🌾 चारा व खर्च">
            <Row l="जाळी" r={`${f.jali||0}×${f.jali_kg||0}KG=${((f.jali||0)*(f.jali_kg||0)).toFixed(1)}KG`} />
            {f.jaliCost > 0 && <Row l="जाळी खर्च" r={fmt(f.jaliCost)} rc="red" />}
            {f.milk_fed==='yes' && <Row l="🥛 दूध पाजले" r={`${f.calves_fed||0} वासरांना, ${f.milk_liters||0}L`} rc="blue" />}
          </Section>
          {(f.jaliCost || f.drCost || f.medCost) ? (
            <Section title="💸 वासरे - खर्च">
              {f.jaliCost > 0     && <Row l="🌾 चारा (जाळी)" r={fmt(f.jaliCost)} rc="red" />}
              {f.dr_came==='yes'   && <Row l="🩺 डॉक्टर" r={fmt(f.drCost)}  rc="red" />}
              {f.med_bought==='yes' && <Row l="💊 मेडिकल" r={fmt(f.medCost)} rc="red" />}
              <Row l="वासरे एकूण खर्च" r={fmt(f.totalExpense)} bold rc="red" />
            </Section>
          ) : null}
        </>
      )}

      <Section title="📊 आजचा एकत्रित सारांश" green={net >= 0} red={net < 0}>
        <Row l="💰 एकूण उत्पन्न (दूध)" r={fmt(totalInc)} rc="green" bold />
        <Row l="💸 एकूण खर्च (चारा/डॉक्टर/खाद्य)" r={fmt(totalExp)} rc="red" bold />
        <div className={styles.netRow}>
          <span>📈 निव्वळ (नफा / तोटा)</span>
          <span className={net >= 0 ? styles.green : styles.red}>{fmt(net)}</span>
        </div>
      </Section>

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
