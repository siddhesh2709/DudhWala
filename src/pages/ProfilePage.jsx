import { useState } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import styles from './ProfilePage.module.css';
import { fmt, p2, fmtMonth, MR_MONTHS } from '../store';

export default function ProfilePage({ onSwitchTab, showToast }) {
  const { state, updatePrices, updateAnimals, importData, resetData } = useApp();
  const { profile, records } = state;
  const now = new Date();
  const [repMonth, setRepMonth] = useState(new Date());
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [animalForm, setAnimalForm] = useState({ milking: profile?.milking||0, nonMilk: profile?.nonMilk||0, calves: profile?.calves||0 });
  const [prices, setPrices] = useState({ kargil: profile?.prices?.kargil||1250, trans: profile?.prices?.trans||1100, maina8: profile?.prices?.maina8||950 });

  const ms = `${repMonth.getFullYear()}-${p2(repMonth.getMonth()+1)}`;
  let mM=0, mI=0, mE=0, fE=0, dE=0, mdE=0, cfE=0, days=0;
  Object.entries(records).forEach(([d,r]) => {
    if (!d.startsWith(ms)) return;
    days++; mM += r.totalMilk||0; mI += r.totalIncome||0; mE += r.totalExpense||0;
    if (r.cow)  { fE += r.cow.goniCost||0; dE += r.cow.drCost||0; mdE += r.cow.medCost||0; }
    if (r.calf)   cfE += r.calf.totalExpense||0;
  });
  const net = mI - mE;
  const maxC = Math.max(fE,dE,mdE,cfE,1);
  const maxB = Math.max(mI,mE,1);

  function saveAnimals() {
    updateAnimals({ milking: Number(animalForm.milking)||0, nonMilk: Number(animalForm.nonMilk)||0, calves: Number(animalForm.calves)||0 });
    setShowAnimalModal(false);
    showToast('✅ जतन झाले!','ok');
  }
  function savePrices() {
    updatePrices({ kargil: Number(prices.kargil)||1250, trans: Number(prices.trans)||1100, maina8: Number(prices.maina8)||950 });
    showToast('💾 किमती जतन झाल्या!','ok');
  }
  function exportData() {
    const b = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const u = URL.createObjectURL(b), a = document.createElement('a');
    const d = new Date();
    a.href = u; a.download = `dairy_${d.getFullYear()}${p2(d.getMonth()+1)}${p2(d.getDate())}.json`;
    a.click(); URL.revokeObjectURL(u); showToast('📤 Export झाले!','ok');
  }
  function handleImport(e) {
    const file = e.target.files[0]; if(!file) return;
    const rd = new FileReader();
    rd.onload = ev => {
      try { const d = JSON.parse(ev.target.result); if(!d.profile) throw 0; importData(d); showToast('📥 Import झाले!','ok'); }
      catch { showToast('❌ चुकीचा डेटा!','err'); }
    };
    rd.readAsText(file); e.target.value='';
  }
  function doReset() {
    if (confirm('सर्व डेटा मिटवायचा का? हे पूर्ववत होणार नाही!')) { resetData(); window.location.reload(); }
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

      {/* Animals bar */}
      <div className={styles.section}>
        <div className={styles.secTitle}>जनावरे</div>
        <div className={styles.animalsBar}>
          <AnimalItem em="🐄" num={profile?.milking} lbl="Milking" />
          <AnimalItem em="🐂" num={profile?.nonMilk} lbl="Non-Milk" />
          <AnimalItem em="🐮" num={profile?.calves}  lbl="Calves" />
        </div>
        <ProfRow icon="✏️" label="जनावरांची संख्या बदला" right="→" onClick={() => { setAnimalForm({milking:profile?.milking||0,nonMilk:profile?.nonMilk||0,calves:profile?.calves||0}); setShowAnimalModal(true); }} />
      </div>

      {/* Monthly report */}
      <div className={styles.section}>
        <div className={styles.secTitle}>मासिक अहवाल</div>
        <div className={styles.monthPick}>
          <button className={styles.mNav} onClick={() => setRepMonth(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}>‹</button>
          <span className={styles.mLbl}>{fmtMonth(repMonth)}</span>
          <button className={styles.mNav} onClick={() => setRepMonth(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}>›</button>
        </div>
        {days === 0
          ? <div className={styles.empty}><div className={styles.emptyIcon}>📊</div><p>या महिन्यासाठी डेटा नाही</p></div>
          : <>
              <div className={styles.repBox}>
                <div className={styles.repTitle}>📅 {days} दिवसांचा डेटा</div>
                <div className={styles.repGrid}>
                  <RepCard icon="🥛" lbl="दूध" val={mM.toFixed(1)+'L'} cls="blue" />
                  <RepCard icon="💰" lbl="उत्पन्न" val={fmt(mI)} cls="green" />
                  <RepCard icon="💸" lbl="खर्च" val={fmt(mE)} cls="red" />
                  <RepCard icon="📈" lbl="निव्वळ" val={fmt(net)} cls={net>=0?'green':'red'} />
                </div>
              </div>
              <div className={styles.repBox}>
                <div className={styles.repTitle}>💸 खर्च विश्लेषण</div>
                <BarRow lbl="खाद्य"  pct={(fE/maxC)*100}  val={fmt(fE)}  color="#d97706,#f59e0b" cls="yellow" />
                <BarRow lbl="डॉक्टर" pct={(dE/maxC)*100}  val={fmt(dE)}  color="#2563eb,#3b82f6" cls="blue" />
                <BarRow lbl="मेडिकल" pct={(mdE/maxC)*100} val={fmt(mdE)} color="#7c3aed,#a855f7" cls="purple" />
                <BarRow lbl="वासरे"  pct={(cfE/maxC)*100} val={fmt(cfE)} color="#0d9488,#14b8a6" cls="teal" />
              </div>
              <div className={styles.repBox}>
                <div className={styles.repTitle}>📊 दैनंदिन सरासरी</div>
                <BarRow lbl="दूध/दिवस"  pct={100} val={(mM/days).toFixed(1)+'L'} color="#2563eb,#3b82f6" cls="blue" />
                <BarRow lbl="उत्पन्न"   pct={(mI/maxB)*100} val={fmt(Math.round(mI/days))} color="#16a34a,#22c55e" cls="green" />
                <BarRow lbl="खर्च"      pct={(mE/maxB)*100} val={fmt(Math.round(mE/days))} color="#dc2626,#ef4444" cls="red" />
              </div>
            </>
        }
      </div>

      {/* Feed Prices */}
      <div className={styles.section}>
        <div className={styles.secTitle}>खाद्य किमती</div>
        <div className={styles.priceForm}>
          {[['kargil','Kargil गोणी (₹)'],['trans','Transaction गोणी (₹)'],['maina8','8 Maina Wali गोणी (₹)']].map(([k,l]) => (
            <div className={styles.group} key={k}>
              <label className={styles.fLabel}>{l}</label>
              <input className={styles.fInput} type="number" inputMode="numeric"
                value={prices[k]} onChange={e => setPrices(p => ({...p,[k]:e.target.value}))} />
            </div>
          ))}
          <button className={styles.btnGreen} onClick={savePrices}>💾 किमती जतन करा</button>
        </div>
      </div>

      {/* Data */}
      <div className={styles.section} style={{paddingBottom:100}}>
        <div className={styles.secTitle}>डेटा</div>
        <ProfRow icon="📤" label="डेटा Export करा" right="JSON" onClick={exportData} />
        <ProfRow icon="📥" label="डेटा Import करा" right="JSON" onClick={() => document.getElementById('imp-file').click()} />
        <input type="file" id="imp-file" accept=".json" style={{display:'none'}} onChange={handleImport} />
        <ProfRow icon="🗑️" label="सर्व डेटा मिटवा" right="!" danger onClick={doReset} />
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
                <input className={`${styles.fInput} ${styles.numBig}`} type="number" inputMode="numeric"
                  value={animalForm[k]} onChange={e => setAnimalForm(f => ({...f,[k]:e.target.value}))} />
              </div>
            ))}
            <button className={styles.btnGreen} onClick={saveAnimals}>💾 जतन करा</button>
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
      <div style={{fontSize:10,color:'var(--text3)',fontWeight:600}}>{lbl}</div>
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
function RepCard({ icon, lbl, val, cls }) {
  const colors = { blue:'var(--blue-lt)', green:'var(--green-lt)', red:'var(--red-lt)', yellow:'var(--yellow-lt)' };
  const textColors = { blue:'var(--blue)', green:'var(--green)', red:'var(--red)', yellow:'var(--yellow)' };
  return (
    <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:12,boxShadow:'var(--shadow)'}}>
      <div style={{width:32,height:32,borderRadius:8,background:colors[cls]||'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginBottom:7}}>{icon}</div>
      <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:2}}>{lbl}</div>
      <div style={{fontSize:16,fontWeight:800,color:textColors[cls]||'var(--text)'}}>{val}</div>
    </div>
  );
}
function BarRow({ lbl, pct, val, color, cls }) {
  const textColors = { blue:'var(--blue)', green:'var(--green)', red:'var(--red)', yellow:'var(--yellow)', purple:'var(--purple)', teal:'var(--teal)' };
  return (
    <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>
      <div style={{fontSize:12,color:'var(--text2)',fontWeight:600,width:65,textAlign:'right',flexShrink:0}}>{lbl}</div>
      <div style={{flex:1,background:'var(--bg2)',borderRadius:99,height:9,overflow:'hidden',border:'1px solid var(--border)'}}>
        <div style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${color})`,width:`${Math.max(pct,0)}%`,transition:'width 0.65s cubic-bezier(0.4,0,0.2,1)'}} />
      </div>
      <div style={{fontSize:12,fontWeight:700,width:62,flexShrink:0,color:textColors[cls]||'var(--text)'}}>{val}</div>
    </div>
  );
}
