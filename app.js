const SHEET_ID = '1-kDCASxS6zj9NdTlhhy0-eZ-yVjnO5TgnapHYRP0rPw';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`;
const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
let chart;

function showView(id, btn){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
}

function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"' && q && n==='"'){cell+='"'; i++;}
    else if(c==='"'){q=!q;}
    else if(c===',' && !q){row.push(cell); cell='';}
    else if((c==='\n'||c==='\r') && !q){ if(cell || row.length){row.push(cell); rows.push(row); row=[]; cell='';} if(c==='\r'&&n==='\n') i++; }
    else cell+=c;
  }
  if(cell || row.length){row.push(cell); rows.push(row)}
  return rows;
}

async function loadSheetData(){
  try{
    const res = await fetch(CSV_URL, {cache:'no-store'});
    const text = await res.text();
    const rows = parseCSV(text).filter(r=>r.length>1);
    const data = rows.slice(1).map(r=>({
      timestamp:r[0]||'', supervisor:r[1]||'', teacher:r[2]||'', subject:r[3]||'', grade:r[4]||'', date:r[5]||'', score:Number(String(r[6]||'').replace(/[^0-9.]/g,''))||0, comment:r[7]||'', suggestion:r[8]||''
    })).filter(x=>x.supervisor || x.teacher || x.subject);
    updateDashboard(data);
  }catch(e){
    updateDashboard(sampleData());
  }
}

function sampleData(){
  return [
    {teacher:'ครูตัวอย่าง 1',subject:'คณิตศาสตร์',grade:'ป.4',score:4,date:'2569-05-18'},
    {teacher:'ครูตัวอย่าง 2',subject:'ภาษาไทย',grade:'ป.2',score:5,date:'2569-05-19'},
    {teacher:'ครูตัวอย่าง 3',subject:'วิทยาศาสตร์',grade:'ป.6',score:4,date:'2569-05-20'},
    {teacher:'ครูตัวอย่าง 4',subject:'สังคมศึกษา',grade:'ม.2',score:3,date:'2569-05-21'}
  ];
}

function updateDashboard(data){
  const total = data.length;
  const avg = total ? data.reduce((s,x)=>s+x.score,0)/total : 0;
  document.getElementById('totalCount').textContent = total;
  document.getElementById('avgScore').textContent = avg.toFixed(2);

  const subjectMap = {};
  data.forEach(x=>{ if(!x.subject) return; subjectMap[x.subject] = subjectMap[x.subject] || []; subjectMap[x.subject].push(x.score); });
  const labels = Object.keys(subjectMap);
  const values = labels.map(k=> subjectMap[k].reduce((a,b)=>a+b,0)/subjectMap[k].length );
  const ctx = document.getElementById('subjectChart');
  if(chart) chart.destroy();
  chart = new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'คะแนนเฉลี่ย',data:values,borderWidth:1}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:5}}}});

  const latest = data.slice(-5).reverse();
  document.getElementById('latestList').innerHTML = latest.length ? latest.map(x=>`<div class="item"><b>${x.teacher || 'ไม่ระบุครู'} · ${x.subject || 'ไม่ระบุวิชา'}</b><span>${x.grade || '-'} | คะแนน ${x.score || '-'} | ${x.date || '-'}</span></div>`).join('') : '<div class="empty">ยังไม่มีข้อมูล</div>';
}

async function submitForm(){
  const data = {
    supervisor:document.getElementById('supervisor').value.trim(),
    teacher:document.getElementById('teacher').value.trim(),
    subject:document.getElementById('subject').value.trim(),
    grade:document.getElementById('grade').value,
    date:document.getElementById('date').value,
    score:document.getElementById('score').value,
    comment:document.getElementById('comment').value.trim(),
    suggestion:document.getElementById('suggestion').value.trim()
  };
  if(!data.supervisor || !data.teacher || !data.subject || !data.score){ alert('กรุณากรอก ชื่อผู้นิเทศ / ครู / วิชา / คะแนน ให้ครบ'); return; }
  if(APPS_SCRIPT_URL.includes('YOUR_')){ alert('ยังไม่ได้ใส่ Google Apps Script URL ในไฟล์ app.js'); return; }
  try{
    await fetch(APPS_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});
    alert('บันทึกข้อมูลสำเร็จ');
    document.querySelectorAll('input, textarea').forEach(el=>el.value='');
    document.getElementById('grade').value=''; document.getElementById('score').value='';
    setTimeout(loadSheetData,1200);
  }catch(e){ alert('บันทึกไม่สำเร็จ กรุณาตรวจสอบ Apps Script URL'); }
}

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{})); }
loadSheetData();
