import { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './SetupPage.module.css';

const STEPS = [
  { tag: 'Step 1 of 3', heading: '🏡 फार्म माहिती' },
  { tag: 'Step 2 of 3', heading: '🐄 जनावरांची संख्या' },
  { tag: 'Step 3 of 3', heading: '⚙️ खाद्य किमती' },
];

export default function SetupPage({ onDone }) {
  const { setProfile } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    farmName: '', ownerName: '',
    milking: 0, nonMilk: 0, calves: 0,
    jali_kg: 15, jaliRate: 50,
    kadhai_kg: 2, khadya_rate: 24,
    pkargil: 1250, ptrans: 1100, pmaina: 950,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const next = () => {
    if (step === 0 && (!form.farmName.trim() || !form.ownerName.trim())) return;
    if (step < 2) setStep(s => s + 1);
    else finish();
  };

  const finish = () => {
    setProfile({
      farmName: form.farmName.trim(),
      ownerName: form.ownerName.trim(),
      milking: Number(form.milking) || 0,
      nonMilk: Number(form.nonMilk) || 0,
      calves:  Number(form.calves)  || 0,
      jali_kg: Number(form.jali_kg) || 15,
      kadhai_kg: Number(form.kadhai_kg) || 2,
      prices: {
        jaliRate: Number(form.jaliRate) || 50,
        khadya_rate: Number(form.khadya_rate) || 24,
        kargil: Number(form.pkargil) || 1250,
        trans:  Number(form.ptrans)  || 1100,
        maina8: Number(form.pmaina)  || 950,
      },
    });
    onDone();
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroIcon}>🐄</div>
        <h1 className={styles.heroTitle}>माझी डेअरी फार्म</h1>
        <p className={styles.heroSub}>My Dairy Farm Manager</p>
      </div>

      <div className={styles.card}>
        {/* Step dots */}
        <div className={styles.dots}>
          {[0,1,2].map(i => (
            <div key={i} className={`${styles.dot} ${i < step ? styles.done : ''} ${i === step ? styles.active : ''}`} />
          ))}
        </div>

        <div className={styles.stepTag}>{STEPS[step].tag}</div>
        <h2 className={styles.stepHead}>{STEPS[step].heading}</h2>

        {step === 0 && (
          <>
            <div className={styles.group}>
              <label className={styles.label}>फार्मचे नाव — Farm Name</label>
              <input className={styles.input} placeholder="उदा. श्री गणेश डेअरी"
                value={form.farmName} onChange={e => set('farmName', e.target.value)} />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>मालकाचे नाव — Owner Name</label>
              <input className={styles.input} placeholder="उदा. रामराव पाटील"
                value={form.ownerName} onChange={e => set('ownerName', e.target.value)} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            {[['milking','दूध देणाऱ्या गायी — Milking'],['nonMilk','न देणाऱ्या गायी — Non-Milking'],['calves','वासरे — Calves']].map(([k,l]) => (
              <div className={styles.group} key={k}>
                <label className={styles.label}>{l}</label>
                <input className={`${styles.input} ${styles.numBig}`} type="number" inputMode="numeric" pattern="[0-9]*"
                  value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <p className={styles.hint}>नंतर Profile मध्ये बदलता येतील.</p>
            {[
              ['jaliRate','1 जाळी चाऱ्याचा दर (₹)'],
              ['jali_kg','1 जाळीचे वजन (KG)'],
              ['kadhai_kg','कढई/भांड्याचे माप (KG)'],
              ['khadya_rate','खाद्याचा दर (₹/KG)'],
              ['pkargil','Kargil गोणी दर (₹)'],
              ['ptrans','Transaction गोणी दर (₹)'],
              ['pmaina','8 Maina Wali गोणी दर (₹)']
            ].map(([k,l]) => (
              <div className={styles.group} key={k}>
                <label className={styles.label}>{l}</label>
                <input className={styles.input} type="number" inputMode="numeric" pattern="[0-9]*"
                  value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </>
        )}

        <div className={styles.actions}>
          {step > 0 && (
            <button className={styles.btnBack} onClick={() => setStep(s => s - 1)}>← मागे</button>
          )}
          <button className={styles.btnNext} onClick={next}>
            {step === 2 ? '🌾 फार्म तयार करा!' : 'पुढे →'}
          </button>
        </div>
      </div>
    </div>
  );
}
