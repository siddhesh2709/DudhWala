import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import styles from './QuestionnairePage.module.css';
import { COW_QS, CALF_QS } from '../questions';
import { fmt, todayKey } from '../store';

export default function QuestionnairePage({ type, onBack, showToast }) {
  const { state, saveCowEntry, saveCalfEntry } = useApp();
  const QS = type === 'cow' ? COW_QS : CALF_QS;
  const dk = todayKey();
  const existing = type === 'cow' ? state.records[dk]?.cow : state.records[dk]?.calf;

  const [entry, setEntry] = useState(() => existing ? { ...existing } : {});
  const [showSummary, setShowSummary] = useState(false);
  const [ynPick, setYnPick] = useState(null);
  const [selPick, setSelPick] = useState(null);

  const visQ = QS.filter(q => !q.when || q.when(entry));
  const [step, setStep] = useState(0);
  const q = visQ[step];
  const total = visQ.length;
  const isLast = step === total - 1;
  const prices = state.profile?.prices || {};

  const getVal = useCallback(() => {
    if (q.type === 'yn') return ynPick;
    if (q.type === 'sel') return selPick;
    const el = document.getElementById('qinp');
    return el ? el.value : null;
  }, [q, ynPick, selPick]);

  function goNext() {
    const v = getVal();
    if (v === null || v === '' || v === undefined) { showToast('कृपया उत्तर द्या!', 'err'); return; }
    const newEntry = { ...entry, [q.id]: v };
    setEntry(newEntry);
    setYnPick(null); setSelPick(null);
    if (step < total - 1) setStep(s => s + 1);
    else setShowSummary(true);
  }

  function goBack() {
    setYnPick(null); setSelPick(null);
    if (step > 0) setStep(s => s - 1);
    else onBack();
  }

  function pickYN(val) {
    setYnPick(val);
    setTimeout(() => {
      const v = val;
      const newEntry = { ...entry, [q.id]: v };
      setEntry(newEntry);
      setYnPick(null); setSelPick(null);
      const nextVis = QS.filter(qq => !qq.when || qq.when(newEntry));
      const nextStep = step + 1;
      if (nextStep < nextVis.length) setStep(nextStep);
      else setShowSummary(true);
    }, 280);
  }

  function save() {
    if (type === 'cow') {
      const e = entry;
      const tMilk  = (parseFloat(e.milk_morn)||0) + (parseFloat(e.milk_eve)||0);
      const mInc   = (parseFloat(e.milk_morn)||0)*(parseFloat(e.morn_rate)||0) + (parseFloat(e.milk_eve)||0)*(parseFloat(e.eve_rate)||0);
      const jaliC  = (parseFloat(e.jali)||0) * (parseFloat(e.jali_rate)||(prices.jaliRate||50));
      const drC    = e.dr_came === 'yes'    ? parseFloat(e.dr_cost)||0 : 0;
      const gnC    = e.goni_bought === 'yes' ? (parseInt(e.goni_cnt)||0)*(prices[e.goni_type]||0) : 0;
      const mdC    = e.med_bought === 'yes'  ? parseFloat(e.med_cost)||0 : 0;
      const tExp   = jaliC + drC + gnC + mdC;
      saveCowEntry(dk, { ...e, totalMilk:tMilk, milkIncome:mInc, jaliCost:jaliC, drCost:drC, goniCost:gnC, medCost:mdC, totalExpense:tExp });
    } else {
      const e = entry;
      const jaliC  = (parseFloat(e.jali)||0) * (parseFloat(e.jali_rate)||(prices.jaliRate||50));
      const drC    = e.dr_came === 'yes'   ? parseFloat(e.dr_cost)||0 : 0;
      const mdC    = e.med_bought === 'yes' ? parseFloat(e.med_cost)||0 : 0;
      const tExp   = jaliC + drC + mdC;
      saveCalfEntry(dk, { ...e, jaliCost:jaliC, drCost:drC, medCost:mdC, totalExpense:tExp });
    }
    showToast(`✅ ${type === 'cow' ? 'गाय' : 'वासरे'} नोंद जतन झाली!`, 'ok');
    onBack();
  }

  if (showSummary) return <SummaryView type={type} entry={entry} prices={prices} onBack={() => { setShowSummary(false); setStep(total-1); }} onSave={save} />;

  const chipClass = type === 'cow' ? styles.chipCow : styles.chipCalf;
  const icon = type === 'cow' ? '🐄' : '🐮';
  const title = type === 'cow' ? 'गाय नोंद' : 'वासरे नोंद';

  return (
    <div className={styles.page}>
      <TopBar icon={icon} farmName={title} onBack={goBack} right={<span className={chipClass}>आजची नोंद</span>} />

      {/* Progress */}
      <div className={styles.sticky}>
        <div className={styles.progBar}><div className={styles.progFill} style={{width:`${((step+1)/total)*100}%`}} /></div>
        <div className={styles.metaRow}>
          <span className={styles.stepTxt}>प्रश्न {step+1} / {total}</span>
          <span className={chipClass}>{icon} {type === 'cow' ? 'गायी' : 'वासरे'}</span>
        </div>
      </div>

      {/* Question */}
      <div className={styles.body}>
        <div className={styles.qCard}>
          <div className={styles.qNum}>{q.id.toUpperCase()}</div>
          <div className={styles.qText}>{q.q}</div>
          <QuestionInput q={q} entry={entry} ynPick={ynPick} selPick={selPick} onYN={pickYN} onSel={setSelPick} prices={prices} type={type} step={step} />
        </div>
      </div>

      {/* Bottom bar (hidden for YN — auto-advance) */}
      {q.type !== 'yn' && (
        <div className={styles.actionBar}>
          <button className={styles.backBtn} onClick={goBack} disabled={step===0}>←</button>
          <button className={styles.nextBtn} onClick={goNext}>{isLast ? '✅ सारांश बघा' : 'पुढे →'}</button>
        </div>
      )}
    </div>
  );
}

function QuestionInput({ q, entry, ynPick, selPick, onYN, onSel, prices, type, step }) {
  const inpRef = useRef(null);
  const [calcHint, setCalcHint] = useState(() => {
    if (q.calc && entry[q.id] !== undefined) {
      try { return q.calc(entry, fmt, prices); } catch { return ''; }
    }
    return '';
  });

  useEffect(() => {
    if (inpRef.current) {
      inpRef.current.focus();
      if (typeof inpRef.current.select === 'function') {
        inpRef.current.select();
      }
    }
  }, [type, step, q.id]);

  function handleInput(e) {
    if (q.calc) {
      try { setCalcHint(q.calc({ ...entry, [q.id]: parseFloat(e.target.value) }, fmt, prices)); } catch {}
    }
  }

  if (q.type === 'yn') {
    return (
      <div className={styles.ynRow}>
        <button className={`${styles.btnYes} ${ynPick === 'yes' ? styles.ynActive : ''}`} onClick={() => onYN('yes')}>हो ✓</button>
        <button className={`${styles.btnNo}  ${ynPick === 'no'  ? styles.ynActive : ''}`} onClick={() => onYN('no')}>नाही ✗</button>
      </div>
    );
  }

  if (q.type === 'sel') {
    return (
      <div className={styles.opts}>
        {q.opts.map(o => (
          <div key={o.v} className={`${styles.opt} ${(selPick||entry[q.id]) === o.v ? styles.optSel : ''}`} onClick={() => onSel(o.v)}>
            <div className={styles.optRadio}></div>
            {o.l}
          </div>
        ))}
      </div>
    );
  }

  const isDec = q.type === 'dec';

  return (
    <div className={styles.inpWrap}>
      {q.pre && <span className={styles.pre}>{q.pre}</span>}
      <input
        ref={inpRef}
        id="qinp"
        key={`${type}-${step}`}
        type="number"
        inputMode={isDec ? "decimal" : "numeric"}
        pattern={isDec ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
        step={isDec ? "0.5" : "1"}
        min="0"
        defaultValue={entry[q.id] ?? ''}
        placeholder="0"
        className={styles.inp}
        style={{ paddingLeft: q.pre ? 44 : 16, paddingRight: q.suf ? 64 : 16 }}
        onFocus={(e) => e.target.select()}
        onClick={(e) => e.target.select()}
        onInput={handleInput}
        autoComplete="off"
      />
      {q.suf && <span className={styles.suf}>{q.suf}</span>}
      {calcHint && <div className={styles.calcHint}>🧮 {calcHint}</div>}
    </div>
  );
}

function SummaryView({ type, entry: e, prices, onBack, onSave }) {
  const gn = { kargil:'Kargil', trans:'Transaction', maina8:'8 Maina Wali' };
  let content;

  if (type === 'cow') {
    const tMilk  = (parseFloat(e.milk_morn)||0)+(parseFloat(e.milk_eve)||0);
    const mInc   = (parseFloat(e.milk_morn)||0)*(parseFloat(e.morn_rate)||0)+(parseFloat(e.milk_eve)||0)*(parseFloat(e.eve_rate)||0);
    const jaliC  = (parseFloat(e.jali)||0) * (parseFloat(e.jali_rate)||(prices.jaliRate||50));
    const drC    = e.dr_came==='yes'    ? parseFloat(e.dr_cost)||0 : 0;
    const gnC    = e.goni_bought==='yes' ? (parseInt(e.goni_cnt)||0)*(prices[e.goni_type]||0) : 0;
    const mdC    = e.med_bought==='yes'  ? parseFloat(e.med_cost)||0 : 0;
    const tExp   = jaliC+drC+gnC+mdC; const net = mInc-tExp;
    content = <>
      <SumCard title="🥛 दूध उत्पन्न">
        <SumRow l="सकाळ" r={`${e.milk_morn||0}L × ₹${e.morn_rate||0} = ${fmt((e.milk_morn||0)*(e.morn_rate||0))}`} rc="blue" />
        <SumRow l="संध्याकाळ" r={`${e.milk_eve||0}L × ₹${e.eve_rate||0} = ${fmt((e.milk_eve||0)*(e.eve_rate||0))}`} rc="blue" />
        <SumRow l="एकूण दूध" r={`${tMilk.toFixed(1)} L`} bold rc="blue" />
      </SumCard>
      <SumCard title="🌾 चारा">
        <SumRow l="जाळी (वजन)" r={`${e.jali||0} जाळी × ${e.jali_kg||0}KG = ${((e.jali||0)*(e.jali_kg||0)).toFixed(1)} KG`} />
        {jaliC > 0 && <SumRow l="जाळी खर्च" r={`${e.jali||0} जाळी × ₹${e.jali_rate||prices.jaliRate||50} = ${fmt(jaliC)}`} rc="red" />}
        {e.kadhai > 0 && <SumRow l="कढई" r={`${e.kadhai||0}×${e.kadhai_kg||0}KG=${((e.kadhai||0)*(e.kadhai_kg||0)).toFixed(1)}KG`} />}
      </SumCard>
      <SumCard title="💸 एकूण खर्च">
        {jaliC > 0            && <SumRow l="🌾 चारा (जाळी)" r={fmt(jaliC)} rc="red" />}
        {e.dr_came==='yes'     && <SumRow l="🩺 डॉक्टर" r={fmt(drC)} rc="red" />}
        {e.goni_bought==='yes' && <SumRow l={`📦 ${gn[e.goni_type]||''} ×${e.goni_cnt}`} r={fmt(gnC)} rc="red" />}
        {e.med_bought==='yes'  && <SumRow l="💊 मेडिकल" r={fmt(mdC)} rc="red" />}
      </SumCard>
      <div className={styles.sumTotals}>
        <TotRow l="💰 दूध उत्पन्न" r={fmt(mInc)} rc="green" />
        <TotRow l="💸 एकूण खर्च"  r={fmt(tExp)} rc="red" />
        <TotRow l="📈 निव्वळ" r={fmt(net)} rc={net>=0?'green':'red'} big />
      </div>
    </>;
  } else {
    const tFeed = ((parseFloat(e.jali)||0)*(parseFloat(e.jali_kg)||0)).toFixed(1);
    const jaliC = (parseFloat(e.jali)||0) * (parseFloat(e.jali_rate)||(prices.jaliRate||50));
    const drC   = e.dr_came==='yes'   ? parseFloat(e.dr_cost)||0 : 0;
    const mdC   = e.med_bought==='yes' ? parseFloat(e.med_cost)||0 : 0;
    const tExp  = jaliC+drC+mdC;
    content = <>
      <SumCard title="🌾 चारा">
        <SumRow l="जाळी" r={`${e.jali||0}×${e.jali_kg||0}KG=${tFeed}KG`} />
        {jaliC > 0 && <SumRow l="जाळी खर्च" r={fmt(jaliC)} rc="red" />}
        {e.milk_fed==='yes' && <SumRow l="🥛 दूध" r={`${e.calves_fed||0} वासरांना, ${e.milk_liters||0}L`} rc="blue" />}
      </SumCard>
      <SumCard title="💸 एकूण खर्च">
        {jaliC > 0            && <SumRow l="🌾 चारा (जाळी)" r={fmt(jaliC)} rc="red" />}
        {e.dr_came==='yes'   && <SumRow l="🩺 डॉक्टर" r={fmt(drC)} rc="red" />}
        {e.med_bought==='yes' && <SumRow l="💊 मेडिकल" r={fmt(mdC)} rc="red" />}
      </SumCard>
      <div className={styles.sumTotals}>
        <TotRow l="💸 एकूण खर्च" r={fmt(tExp)} rc="red" big />
      </div>
    </>;
  }

  return (
    <div className={styles.page} style={{paddingBottom:110}}>
      <div className={styles.sumHeader}>
        <button className={styles.sumBack} onClick={onBack}>← बदल करा</button>
        <h2 className={styles.sumTitle}>📋 सारांश</h2>
      </div>
      <div className={styles.body}>{content}</div>
      <div className={styles.actionBar}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <button className={styles.nextBtn} onClick={onSave}>💾 नोंद जतन करा</button>
      </div>
    </div>
  );
}

function SumCard({ title, children }) {
  return (
    <div className={styles.sumCard}>
      <div className={styles.sumCardHead}>{title}</div>
      {children}
    </div>
  );
}
function SumRow({ l, r, rc, bold }) {
  const colors = { blue:'var(--blue)', green:'var(--green)', red:'var(--red)' };
  return (
    <div className={styles.sumRow}>
      <span style={bold?{fontWeight:800}:{}}>{l}</span>
      <span style={{fontWeight:bold?800:700,color:colors[rc]||'var(--text)'}}>{r}</span>
    </div>
  );
}
function TotRow({ l, r, rc, big }) {
  const colors = { green:'var(--green)', red:'var(--red)' };
  return (
    <div className={styles.totRow} style={big?{fontSize:18,fontWeight:900,borderTop:'1px solid var(--border)',marginTop:8,paddingTop:10}:{}}>
      <span>{l}</span>
      <span style={{color:colors[rc]||'var(--text)'}}>{r}</span>
    </div>
  );
}
