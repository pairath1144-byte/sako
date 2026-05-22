const CONFIG = {
  sheetId: '1a9eLRW599Lv2bPHrYtYUz6fKZaPmszXTaDoIpaUQmCM',
  sheetName: 'ชีต1'
};

let allRows = [];
let charts = {};

const $ = (id) => document.getElementById(id);
const norm = (v) => String(v ?? '').trim();
const num = (v) => Number(String(v ?? '').replace(/[^0-9.]/g,'')) || 0;

function pick(row, keys){
  const found = Object.keys(row).find(k => keys.some(x => k.replace(/\s/g,'').includes(x)));
  return found ? row[found] : '';
}

function mapRow(row){
  const supervisor = pick(row, ['ชื่อผู้นิเทศ','ผู้นิเทศ','supervisor']) || 'ไม่ระบุ';
  const subject = pick(row, ['วิชา','subject']) || 'ไม่ระบุ';
  const classLevel = pick(row, ['ชั้น','ระดับชั้น','class']) || 'ไม่ระบุ';
  const date = pick(row, ['วันที่','date']) || '';
  const comment = pick(row, ['ความคิดเห็น','ข้อเสนอแนะ','comment']) || '';
  const learning = num(pick(row, ['จัดการเรียนรู้','learning'])) || num(pick(row, ['คะแนน','score']));
  const student = num(pick(row, ['ผู้เรียน','student']));
  const innovation = num(pick(row, ['นวัตกรรม','innovation']));
  const scores = [learning, student, innovation].filter(Boolean);
  const avg = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : num(pick(row, ['คะแนนเฉลี่ย','เฉลี่ย','avg'])) || 0;
  return {supervisor, subject, classLevel, date, comment, learning, student, innovation, avg};
}

async function loadSheet(){
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.sheetName)}`;
  try{
    const text = await fetch(url).then(r => r.text());
    const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}')+1));
    const cols = json.table.cols.map((c,i)=> c.label || `col${i+1}`);
    const rows = json.table.rows.map(r => Object.fromEntries(cols.map((c,i)=>[c, r.c[i]?.f ?? r.c[i]?.v ?? '']))).map(mapRow);
    allRows = rows.filter(r => r.supervisor !== 'ไม่ระบุ' || r.subject !== 'ไม่ระบุ');
    if(!allRows.length) throw new Error('empty');
  }catch(e){
    allRows = sampleRows();
    $('aiSummary').textContent = 'ยังไม่พบข้อมูลจริงในชีต หรือสิทธิ์ชีตยังไม่เปิดสาธารณะ ระบบจึงแสดงข้อมูลตัวอย่างก่อน';
  }
  render();
}

function sampleRows(){
  return [
    {supervisor:'นายอภิชิตน์ พรหมมา', subject:'คณิตศาสตร์', classLevel:'ม.2', date:'2568-05-17', comment:'จัดกิจกรรมได้ดี นักเรียนมีส่วนร่วม', learning:5, student:4, innovation:4, avg:4.33},
    {supervisor:'นายมูฮำหมัด', subject:'วิทยาศาสตร์', classLevel:'ป.6', date:'2568-05-16', comment:'ควรเพิ่มสื่อดิจิทัล', learning:4, student:4, innovation:5, avg:4.33},
    {supervisor:'น.ส.กุหลาบ', subject:'ภาษาไทย', classLevel:'ป.3', date:'2568-05-15', comment:'บรรยากาศการเรียนรู้ดี', learning:4, student:5, innovation:4, avg:4.33}
  ];
}

function render(){
  renderCards();
  renderCharts();
  renderRecords(allRows);
}

function renderCards(){
  const uniqueSupervisors = new Set(allRows.map(r=>r.supervisor));
  const avg = allRows.reduce((s,r)=>s+r.avg,0)/(allRows.length||1);
  const subjectCount = countBy(allRows,'subject');
  const top = Object.entries(subjectCount).sort((a,b)=>b[1]-a[1])[0] || ['-',0];
  $('totalCount').textContent = allRows.length;
  $('teacherCount').textContent = uniqueSupervisors.size;
  $('avgScore').textContent = avg.toFixed(2);
  $('topSubject').textContent = top[0];
  $('topSubjectCount').textContent = `${top[1]} ครั้ง`;
  $('aiSummary').textContent = `มีการนิเทศทั้งหมด ${allRows.length} ครั้ง คะแนนเฉลี่ยรวม ${avg.toFixed(2)} วิชาที่นิเทศมากที่สุดคือ ${top[0]} เหมาะต่อการนำผลไปคุย PLC ต่อแบบชิล ๆ แต่ได้งานจริง`;
}

function countBy(rows,key){return rows.reduce((o,r)=>(o[r[key]]=(o[r[key]]||0)+1,o),{});}
function avgBy(rows,key){
  const o = {};
  rows.forEach(r => { if(!o[r[key]]) o[r[key]]=[]; o[r[key]].push(r.avg); });
  return Object.fromEntries(Object.entries(o).map(([k,v])=>[k, v.reduce((a,b)=>a+b,0)/v.length]));
}

function renderCharts(){
  const bySubject = avgBy(allRows,'subject');
  const labels = Object.keys(bySubject);
  const values = Object.values(bySubject).map(v=>v.toFixed(2));
  drawChart('subjectChart','bar',labels,values,'คะแนนเฉลี่ย');
  const sorted = [...allRows].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  drawChart('trendChart','line',sorted.map((r,i)=> r.date || `ครั้งที่ ${i+1}`),sorted.map(r=>r.avg.toFixed(2)),'คะแนนเฉลี่ย');
}

function drawChart(id,type,labels,data,label){
  if(charts[id]) charts[id].destroy();
  charts[id] = new Chart($(id), {type, data:{labels, datasets:[{label,data,borderWidth:3,tension:.35}]}, options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:5}}}});
}

function renderRecords(rows){
  $('recordList').innerHTML = rows.map(r=>`
    <article class="record">
      <div class="record-head"><h4>${r.supervisor}</h4><span class="badge">${r.avg.toFixed(2)}</span></div>
      <p><b>${r.subject}</b> | ชั้น ${r.classLevel} | ${r.date || '-'}</p>
      <p>${r.comment || 'ไม่มีข้อเสนอแนะ'}</p>
    </article>`).join('') || '<p>ไม่พบข้อมูล</p>';
}

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab,.screen').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active'); $(btn.dataset.screen).classList.add('active');
}));

$('searchInput').addEventListener('input', e=>{
  const q = e.target.value.toLowerCase();
  renderRecords(allRows.filter(r => Object.values(r).join(' ').toLowerCase().includes(q)));
});
$('refreshBtn').addEventListener('click', loadSheet);
$('supervisionForm').addEventListener('submit', e=>{
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target).entries());
  const avg = (num(fd.learning)+num(fd.student)+num(fd.innovation))/3;
  allRows.unshift({supervisor:fd.supervisor, subject:fd.subject, classLevel:fd.classLevel, date:fd.date, comment:fd.comment, learning:num(fd.learning), student:num(fd.student), innovation:num(fd.innovation), avg});
  localStorage.setItem('localSupervisionRows', JSON.stringify(allRows));
  render(); alert('บันทึกลงเครื่องเรียบร้อย');
});

if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{});} 
loadSheet();
