// Question definitions for Cow daily entry
export const COW_QS = [
  { id: 'jali',       type: 'num', q: 'आज किती जाळी चारा टाकला?',           suf: 'जाळ्या' },
  { id: 'jali_kg',    type: 'num', q: '1 जाळी किती किलो?',                   suf: 'KG',
    calc: e => `एकूण चारा = ${e.jali||0} × ${e.jali_kg||0} = ${((e.jali||0)*(e.jali_kg||0)).toFixed(1)} KG` },
  { id: 'kadhai',     type: 'num', q: 'आज किती कढई खाद्य घातले?',           suf: 'कढई' },
  { id: 'kadhai_kg',  type: 'num', q: '1 कढईमध्ये किती किलो खाद्य असते?',   suf: 'KG',
    calc: e => `एकूण खाद्य = ${e.kadhai||0} × ${e.kadhai_kg||0} = ${((e.kadhai||0)*(e.kadhai_kg||0)).toFixed(1)} KG` },
  { id: 'milk_morn',  type: 'dec', q: 'आज सकाळी किती दूध निघाले?',          suf: 'L' },
  { id: 'morn_rate',  type: 'num', q: 'सकाळच्या दुधाचा भाव किती?',          pre: '₹', suf: '/L',
    calc: (e, fmt) => `उत्पन्न = ${e.milk_morn||0}L × ₹${e.morn_rate||0} = ${fmt((e.milk_morn||0)*(e.morn_rate||0))}` },
  { id: 'milk_eve',   type: 'dec', q: 'आज संध्याकाळी किती दूध निघाले?',     suf: 'L' },
  { id: 'eve_rate',   type: 'num', q: 'संध्याकाळच्या दुधाचा भाव किती?',    pre: '₹', suf: '/L',
    calc: (e, fmt) => `उत्पन्न = ${e.milk_eve||0}L × ₹${e.eve_rate||0} = ${fmt((e.milk_eve||0)*(e.eve_rate||0))}` },
  { id: 'dr_came',    type: 'yn',  q: 'आज डॉक्टर आले होते का?' },
  { id: 'dr_cost',    type: 'num', q: 'डॉक्टरचे किती पैसे झाले?',           pre: '₹', when: e => e.dr_came === 'yes' },
  { id: 'goni_bought',type: 'yn',  q: 'आज खाद्याची गोणी आणली का?' },
  { id: 'goni_type',  type: 'sel', q: 'कोणती गोणी आणली?',                   when: e => e.goni_bought === 'yes',
    opts: [{ v: 'kargil', l: 'Kargil' }, { v: 'trans', l: 'Transaction' }, { v: 'maina8', l: '8 Maina Wali' }] },
  { id: 'goni_cnt',   type: 'num', q: 'किती गोण्या आणल्या?',                suf: 'गोण्या', when: e => e.goni_bought === 'yes',
    calc: (e, fmt, prices) => { const p = (prices||{})[e.goni_type]||0; return `खर्च = ${e.goni_cnt||0} × ₹${p} = ${fmt((e.goni_cnt||0)*p)}`; } },
  { id: 'med_bought', type: 'yn',  q: 'आज मेडिकलमधून काही आणले का?' },
  { id: 'med_cost',   type: 'num', q: 'मेडिकलचा खर्च किती झाला?',           pre: '₹', when: e => e.med_bought === 'yes' },
];

// Question definitions for Calf daily entry
export const CALF_QS = [
  { id: 'jali',       type: 'num', q: 'आज वासरांसाठी किती जाळी चारा टाकला?', suf: 'जाळ्या' },
  { id: 'jali_kg',    type: 'num', q: '1 जाळी किती किलो?',                    suf: 'KG',
    calc: e => `एकूण चारा = ${e.jali||0} × ${e.jali_kg||0} = ${((e.jali||0)*(e.jali_kg||0)).toFixed(1)} KG` },
  { id: 'milk_fed',   type: 'yn',  q: 'आज वासरांना दूध पाजले का?' },
  { id: 'calves_fed', type: 'num', q: 'किती वासरांना दूध पाजले?',            suf: 'वासरे', when: e => e.milk_fed === 'yes' },
  { id: 'milk_liters',type: 'dec', q: 'एकूण किती लिटर दूध पाजले?',           suf: 'L', when: e => e.milk_fed === 'yes',
    calc: e => `${e.calves_fed||0} वासरांना ${e.milk_liters||0}L दूध` },
  { id: 'dr_came',    type: 'yn',  q: 'आज वासरांसाठी डॉक्टर आले होते का?' },
  { id: 'dr_cost',    type: 'num', q: 'डॉक्टरचे किती पैसे झाले?',            pre: '₹', when: e => e.dr_came === 'yes' },
  { id: 'med_bought', type: 'yn',  q: 'मेडिकलमधून काही आणले का?' },
  { id: 'med_cost',   type: 'num', q: 'मेडिकलचा खर्च किती झाला?',            pre: '₹', when: e => e.med_bought === 'yes' },
];
