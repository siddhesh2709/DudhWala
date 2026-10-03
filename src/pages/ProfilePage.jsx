import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import RecordDetail from '../components/RecordDetail';
import styles from './ProfilePage.module.css';
import { fmt, fmtDate } from '../store';

export default function ProfilePage({ onSwitchTab, showToast }) {
  const { state, updatePrices, updateAnimals, setProfile, logout, resetData } = useApp();
  const { profile, records } = state;
  
  // History State handling
  const [showHishob, setShowHishobState] = useState(false);
  const [detailDateKey, setDetailDateKeyState] = useState(null);

  // 2-Step Verification Modal State for Reset Data
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deletePass, setDeletePass] = useState('');
  const [deleteErr, setDeleteErr] = useState('');

  useEffect(() => {
    const handlePopState = (e) => {
      const st = e.state || {};
      setDetailDateKeyState(st.profDetailKey || null);
      setShowHishobState(!!st.profHishob);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openHishob = () => {
    window.history.pushState({ ...window.history.state, profHishob: true }, '');
    setShowHishobState(true);
  };

  const closeHishob = () => {
    if (window.history.state?.profHishob) {
      window.history.back();
    } else {
      setShowHishobState(false);
    }
  };

  const openProfDetail = (d) => {
    window.history.pushState({ ...window.history.state, profHishob: true, profDetailKey: d }, '');
    setDetailDateKeyState(d);
  };

  const closeProfDetail = () => {
    if (window.history.state?.profDetailKey) {
      window.history.back();
    } else {
      setDetailDateKeyState(null);
    }
  };

  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [animalForm, setAnimalForm] = useState({ milking: profile?.milking||0, nonMilk: profile?.nonMilk||0, calves: profile?.calves||0 });
  const [prices, setPrices] = useState({
    jaliRate: profile?.prices?.jaliRate || 50,
    jali_kg: profile?.jali_kg || 15,
    kadhai_kg: profile?.kadhai_kg || 2,
    khadya_rate: profile?.prices?.khadya_rate || 24,
    kargil: profile?.prices?.kargil || 1250,
    trans: profile?.prices?.trans || 1100,
    maina8: profile?.prices?.maina8 || 950
  });

  const allDates = Object.keys(records).filter(d => records[d]?.cow?.saved || records[d]?.calf?.saved).sort().reverse();

  // If a specific date detail is opened
  if (detailDateKey) {
    return (
      <RecordDetail
        dateKey={detailDateKey}
        type="all"
        record={records[detailDateKey]}
        onBack={closeProfDetail}
      />
    );
  }

  // If Hishob history page is open
  if (showHishob) {
    return (
      <div className={styles.page}>
        <div className={styles.hishobHeader}>
          <button className={styles.backBtn} onClick={closeHishob}>← मागे</button>
          <div className={styles.hishobHeaderTitle}>📖 मागील नोंदी (हिशोब)</div>
          <span className={styles.countBadge}>{allDates.length} दिवस</span>
        </div>

        <div className={styles.section} style={{ paddingTop: 16 }}>
          {allDates.length === 0 ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>📭</div>
              <p>अद्याप कोणत्याही तारखेचा हिशोब उपलब्ध नाही</p>
            </div>
          ) : (
            <div className={styles.dateList}>
              {allDates.map(d => {
                const r = records[d];
                const cowM = r.cow?.totalMilk || 0;
                const inc  = r.cow?.milkIncome || 0;
                const exp  = (r.cow?.totalExpense || 0) + (r.calf?.totalExpense || 0);
                const net  = inc - exp;
                return (
                  <div key={d} className={styles.dateRow} onClick={() => openProfDetail(d)}>
                    <div className={styles.dateLeft}>
                      <div className={styles.dateTitle}>{fmtDate(d)}</div>
                      <div className={styles.dateMini}>
                        <span>🥛 {cowM.toFixed(1)}L</span>
                        <span>💰 {fmt(inc)}</span>
                        <span>💸 {fmt(exp)}</span>
                      </div>
                    </div>
                    <div className={styles.dateRight}>
                      <div className={`${styles.dateNet} ${net >= 0 ? styles.green : styles.red}`}>{fmt(net)}</div>
                      <div className={styles.arr}>›</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ height: 80 }} />
        <BottomNav active="profile" onSwitch={onSwitchTab} />
      </div>
    );
  }

  function saveAnimals() {
    updateAnimals({ milking: Number(animalForm.milking)||0, nonMilk: Number(animalForm.nonMilk)||0, calves: Number(animalForm.calves)||0 });
    setShowAnimalModal(false);
    showToast('✅ जनावरांची संख्या जतन झाली!','ok');
  }

  function savePrices() {
    const updatedPrices = {
      jaliRate: Number(prices.jaliRate) || 50,
      khadya_rate: Number(prices.khadya_rate) || 24,
      kargil: Number(prices.kargil) || 1250,
      trans: Number(prices.trans) || 1100,
      maina8: Number(prices.maina8) || 950
    };
    updatePrices(updatedPrices);
    setProfile({
      ...profile,
      jali_kg: Number(prices.jali_kg) || 15,
      kadhai_kg: Number(prices.kadhai_kg) || 2,
      prices: {
        ...profile?.prices,
        ...updatedPrices
      }
    });
    showToast('💾 किमती व दर जतन झाले!','ok');
  }

  function doLogout() {
    if (confirm('लॉगआउट करायचे का?\n\n(तुमचा सर्व डेटा सुरक्षित राहील. पुन्हा लॉगइन करण्यासाठी हेच ३ नाव व पासवर्ड वापरा.)')) {
      logout();
    }
  }

  function openDeleteModal() {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setDeletePass('');
    setDeleteErr('');
  }

  function handleConfirmDelete() {
    setDeleteErr('');
    const actualPass = profile?.password ? String(profile.password).trim() : '';
    if (deletePass.trim() === actualPass) {
      resetData();
      if (showToast) showToast('🗑️ सर्व डेटा मिटवला आहे!', 'ok');
      setTimeout(() => window.location.reload(), 400);
    } else {
      setDeleteErr('❌ चुकीचा पासवर्ड! अचूक पासवर्ड प्रविष्ट करा.');
    }
  }

  return (
    <div className={styles.page}>
      <TopBar icon="👤" farmName="प्रोफाइल" />

      {/* Profile Hero */}
      <div className={styles.hero}>
        <div className={styles.avatar}>🐄</div>
        <div className={styles.farmName}>{profile?.farmName || '--'}</div>
        <div className={styles.ownerName}>👤 {profile?.ownerName || '--'}</div>
      </div>

      {/* Main Hishob Button Section */}
      <div className={styles.section}>
        <div className={styles.secTitle}>दैनिक नोंद इतिहास</div>
        <div className={styles.hishobCard} onClick={openHishob}>
          <div className={styles.hishobIcon}>📖</div>
          <div className={styles.hishobContent}>
            <div className={styles.hishobTitle}>हिशोब (मागील नोंदी)</div>
            <div className={styles.hishobSub}>सर्व दिवसांचा दूध, उत्पन्न व खर्चाचा हिशोब पहा</div>
          </div>
          <div className={styles.hishobBadge}>
            <span>{allDates.length} नोंदी</span>
            <span className={styles.hishobArr}>›</span>
          </div>
        </div>
      </div>

      {/* Animals summary */}
      <div className={styles.section}>
        <div className={styles.secTitle}>जनावरे माहिती</div>
        <div className={styles.animalsBar}>
          <AnimalItem em="🐄" num={profile?.milking} lbl="दूध देणाऱ्या" />
          <AnimalItem em="🐂" num={profile?.nonMilk} lbl="न देणाऱ्या" />
          <AnimalItem em="🐮" num={profile?.calves}  lbl="वासरे" />
        </div>
        <ProfRow icon="✏️" label="जनावरांची संख्या बदला" right="बदला →" onClick={() => { setAnimalForm({milking:profile?.milking||0,nonMilk:profile?.nonMilk||0,calves:profile?.calves||0}); setShowAnimalModal(true); }} />
      </div>

      {/* Feed Prices Form */}
      <div className={styles.section}>
        <div className={styles.secTitle}>खाद्य व चाऱ्याचे दर आणि माप</div>
        <div className={styles.priceForm}>
          {[
            ['jaliRate','1 जाळी चाऱ्याचा दर (₹)'],
            ['jali_kg','1 जाळी चाऱ्याचे वजन (KG)'],
            ['kadhai_kg','कढई/भांड्याचे माप (KG)'],
            ['khadya_rate','खाद्याचा दर (₹/KG)'],
            ['kargil','Kargil गोणी दर (₹)'],
            ['trans','Transaction गोणी दर (₹)'],
            ['maina8','8 Maina Wali गोणी दर (₹)']
          ].map(([k,l]) => (
            <div className={styles.group} key={k}>
              <label className={styles.fLabel}>{l}</label>
              <input className={styles.fInput} type="number" inputMode="numeric" pattern="[0-9]*"
                value={prices[k]} onChange={e => setPrices(p => ({...p,[k]:e.target.value}))} />
            </div>
          ))}
          <button className={styles.btnGreen} onClick={savePrices}>💾 किमती जतन करा</button>
        </div>
      </div>

      {/* Data & Device Sync */}
      <div className={styles.section}>
        <div className={styles.secTitle}>डेटा व डिव्हाइस सिंक</div>
        
        <div className={styles.syncCard}>
          <div className={styles.syncCardHeader}>
            <span>☁️ ऑनलाईन डिव्हाइस सिंक चालू आहे</span>
            <span className={styles.syncDot}>●</span>
          </div>
          <div className={styles.syncCardBody}>
            <div><b>फार्मचे नाव:</b> {profile?.farmName || '--'}</div>
            <div><b>मालकाचे नाव:</b> {profile?.ownerName || '--'}</div>
            <div><b>पासवर्ड:</b> {profile?.password ? '••••••' : 'नाही'}</div>
          </div>
          <p className={styles.syncHintText}>
            💡 कोणत्याही दुसऱ्या मोबाईलवर हेच ३ नाव व पासवर्ड टाकल्यास तुमची सर्व माहिती आपोआप उघडेल.
          </p>
        </div>

        <ProfRow icon="🗑️" label="सर्व डेटा मिटवा" right="!" danger onClick={openDeleteModal} />
      </div>

      {/* Logout Action at the very bottom */}
      <div className={styles.section} style={{ paddingBottom: 110 }}>
        <button className={styles.btnLogoutBottom} onClick={doLogout}>
          🚪 प्रोफाइल लॉगआउट करा
        </button>
      </div>

      <BottomNav active="profile" onSwitch={onSwitchTab} />

      {/* Animal Modal */}
      {showAnimalModal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowAnimalModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>🐄 जनावरांची संख्या<button className={styles.modalClose} onClick={() => setShowAnimalModal(false)}>✕</button></div>
            {[['milking','दूध देणाऱ्या गायी'],['nonMilk','न देणाऱ्या गायी'],['calves','वासरे']].map(([k,l]) => (
              <div className={styles.group} key={k}>
                <label className={styles.fLabel}>{l}</label>
                <input className={`${styles.fInput} ${styles.numBig}`} type="number" inputMode="numeric" pattern="[0-9]*"
                  value={animalForm[k]} onChange={e => setAnimalForm(f => ({...f,[k]:e.target.value}))} />
              </div>
            ))}
            <button className={styles.btnGreen} onClick={saveAnimals}>💾 जतन करा</button>
          </div>
        </div>
      )}

      {/* 2-Step Verification Delete Modal */}
      {showDeleteModal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className={styles.deleteModal}>
            {deleteStep === 1 ? (
              <>
                <div className={styles.modalHeaderRow}>
                  <div className={styles.modalTitleAlert}>🚨 सर्व डेटा मिटवायचा आहे का?</div>
                  <span className={styles.stepBadgeDanger}>स्टेप १/२</span>
                </div>

                <div className={styles.dangerAlertBox}>
                  <div className={styles.dangerAlertTitle}>⚠️ सावधगिरीचा इशारा!</div>
                  <p className={styles.dangerAlertText}>
                    हा डेटा मिटवल्यास तुमचा सर्व दैनंदिन हिशोब, दूध नोंदी व जमा-खर्च कायमचा नष्ट होईल.
                  </p>
                  <ul className={styles.dangerList}>
                    <li>❌ मागील सर्व नोंदी मिटवल्या जातील</li>
                    <li>❌ हा बदल पूर्ववत करता येणार नाही</li>
                  </ul>
                </div>

                <div className={styles.modalBtnRow}>
                  <button className={styles.btnCancelModal} onClick={() => setShowDeleteModal(false)}>
                    रद्द करा
                  </button>
                  <button className={styles.btnDangerNext} onClick={() => setDeleteStep(2)}>
                    होय, पुढे जा (स्टेप २) →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.modalHeaderRow}>
                  <div className={styles.modalTitleAlert}>🔒 पासवर्ड पडताळणी</div>
                  <span className={styles.stepBadgeDanger}>स्टेप २/२</span>
                </div>

                <p className={styles.passSubtext}>
                  डेटा कायमचा मिटवण्याची पुष्टी करण्यासाठी तुमचा प्रोफाइल पासवर्ड প্রविष्ट करा:
                </p>

                <div className={styles.group}>
                  <label className={styles.fLabel}>प्रोफाइल पासवर्ड</label>
                  <input
                    type="password"
                    className={styles.fInput}
                    placeholder="तुमचा पासवर्ड टाका"
                    value={deletePass}
                    onChange={e => { setDeleteErr(''); setDeletePass(e.target.value); }}
                    autoFocus
                  />
                </div>

                {deleteErr && <div className={styles.deleteErrorBanner}>{deleteErr}</div>}

                <div className={styles.modalBtnRow}>
                  <button className={styles.btnCancelModal} onClick={() => setDeleteStep(1)}>
                    ← मागे
                  </button>
                  <button
                    className={styles.btnFinalDelete}
                    onClick={handleConfirmDelete}
                  >
                    🗑️ सर्व डेटा कायमचा मिटवा
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AnimalItem({ em, num, lbl }) {
  return (
    <div style={{flex:1,textAlign:'center',padding:'12px 8px'}}>
      <div style={{fontSize:20}}>{em}</div>
      <div style={{fontSize:20,fontWeight:900}}>{num ?? '-'}</div>
      <div style={{fontSize:11,color:'var(--text3)',fontWeight:600}}>{lbl}</div>
    </div>
  );
}
function ProfRow({ icon, label, right, onClick, danger }) {
  return (
    <div className={styles.profRow} onClick={onClick}>
      <div className={styles.prL}>
        <div className={styles.prIcon} style={danger?{background:'var(--red-lt)'}:{}}>{icon}</div>
        <span className={styles.prLbl} style={danger?{color:'var(--red)'}:{}}>{label}</span>
      </div>
      <span className={styles.prR} style={danger?{color:'var(--red)'}:{}}>{right}</span>
    </div>
  );
}
