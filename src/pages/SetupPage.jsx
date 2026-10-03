import { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './SetupPage.module.css';

const STEPS = [
  { tag: 'Step 1 of 3', heading: '🏡 फार्म माहिती व पासवर्ड' },
  { tag: 'Step 2 of 3', heading: '🐄 जनावरांची संख्या' },
  { tag: 'Step 3 of 3', heading: '⚙️ खाद्य किमती' },
];

export default function SetupPage({ onDone }) {
  const { setProfile, loginOrSyncAccount } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    farmName: '', ownerName: '', password: '',
    milking: 0, nonMilk: 0, calves: 0,
    jali_kg: 15, jaliRate: 50,
    kadhai_kg: 2, khadya_rate: 24,
    pkargil: 1250, ptrans: 1100, pmaina: 950,
  });

  const set = (k, v) => {
    setErrorMsg('');
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleLoginSync = async () => {
    if (!form.farmName.trim() || !form.ownerName.trim() || !form.password.trim()) {
      setErrorMsg('कृपया फार्मचे नाव, मालकाचे नाव व पासवर्ड भरा.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await loginOrSyncAccount(
      form.farmName.trim(),
      form.ownerName.trim(),
      form.password.trim()
    );
    setLoading(false);

    if (res.success && !res.isNew) {
      onDone();
    } else if (res.success && res.isNew) {
      // Proceed to step 2 to finish creating new account
      setStep(1);
    } else {
      setErrorMsg(res.message || 'काहीतरी त्रुटी झाली.');
    }
  };

  const next = () => {
    if (step === 0) {
      if (!form.farmName.trim() || !form.ownerName.trim() || !form.password.trim()) {
        setErrorMsg('कृपया फार्मचे नाव, मालकाचे नाव व पासवर्ड भरा.');
        return;
      }
      setStep(1);
    } else if (step < 2) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    setProfile({
      farmName: form.farmName.trim(),
      ownerName: form.ownerName.trim(),
      password: form.password.trim(),
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

        {errorMsg && <div className={styles.errorBanner}>⚠️ {errorMsg}</div>}

        {step === 0 && (
          <>
            <div className={styles.syncHint}>
              💡 <b>डिव्हाइस सिंक टीप:</b> हे ३ नाव व पासवर्ड दुसऱ्या कोणत्याही मोबाईलवर टाकल्यास तुमचे संपूर्ण प्रोफाइल व डेटा आपोआप उघडेल.
            </div>

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

            <div className={styles.group}>
              <label className={styles.label}>पासवर्ड / पिन — Password</label>
              <input className={styles.input} type="password" placeholder="उदा. 1234"
                value={form.password} onChange={e => set('password', e.target.value)} />
            </div>

            <div className={styles.loginBtnGroup}>
              <button
                className={styles.btnLoginSync}
                onClick={handleLoginSync}
                disabled={loading}
              >
                {loading ? '⏳ शोधत आहे...' : '🔓 प्रोफाइल उघडा (Login & Sync)'}
              </button>
              
              <button
                className={styles.btnCreateNew}
                onClick={next}
              >
                ✨ नवीन फार्म बनवा →
              </button>
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

            <div className={styles.actions}>
              <button className={styles.btnBack} onClick={() => setStep(0)}>← मागे</button>
              <button className={styles.btnNext} onClick={next}>पुढे →</button>
            </div>
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

            <div className={styles.actions}>
              <button className={styles.btnBack} onClick={() => setStep(1)}>← मागे</button>
              <button className={styles.btnNext} onClick={finish}>🌾 फार्म तयार करा!</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
