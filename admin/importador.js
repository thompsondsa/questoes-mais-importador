import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const $ = (id) => document.getElementById(id);
const answerKeys = new Map();
let questionCount = 0;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(id, message, kind='') { const el=$(id); el.textContent=message; el.className=kind ? 'status-'+kind : ''; }
async function readPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({data}).promise;
  const pages=[];
  for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n), content=await page.getTextContent();
    const items=content.items.filter(x=>typeof x.str==='string' && x.str.trim());
    let lines=[], current='', lastY=null;
    for(const item of items){
      const y=Math.round(item.transform[5]);
      if(lastY!==null && Math.abs(y-lastY)>3){ if(current.trim()) lines.push(current.trim()); current=''; }
      current += (current ? ' ' : '') + item.str; lastY=y;
    }
    if(current.trim()) lines.push(current.trim());
    pages.push('--- Página '+n+' ---\n'+lines.join('\n'));
  }
  return pages.join('\n\n');
}
$('readPdfs').addEventListener('click',async()=>{
  const exam=$('examPdf').files[0], key=$('keyPdf').files[0];
  if(!exam && !key){status('readStatus','Selecione ao menos um PDF.','error');return;}
  status('readStatus','Lendo os arquivos... aguarde.');
  try{
    if(exam) $('examText').value=await readPdf(exam);
    if(key){
      $('keyText').value=await readPdf(key);
      answerKeys.clear();
      const re=/(?:^|\n)\s*(\d{1,3})\s*[.)\-:]?\s*([A-E])\b/gim; let m;
      while((m=re.exec($('keyText').value))) answerKeys.set(Number(m[1]),m[2].toUpperCase());
      document.querySelectorAll('[data-qnum]').forEach(el=>{const a=answerKeys.get(Number(el.dataset.qnum));if(a)el.value='ABCDE'.indexOf(a);});
    }
    status('readStatus','Leitura concluída. Confira os textos e revise cada questão.','ok');
  }catch(e){status('readStatus','Não foi possível ler o PDF: '+e.message,'error');}
});
function addQuestion(seed={}){
  const n=++questionCount, box=document.createElement('article');box.className='qcard';box.dataset.card='1';
  const alts=Array.from({length:5},(_,i)=>seed.alts?.[i]||'');
  box.innerHTML=`<div class="qhead"><strong>Questão <span class="qnumber">${n}</span></strong><button type="button" class="remove">Remover</button></div>
  <div class="qgrid">
  <label>Número na prova<input class="qnum" type="number" min="1" value="${esc(seed.number||n)}"></label>
  <label>Disciplina<select class="disc">${['Português','Raciocínio Lógico','Informática','Direito Constitucional','Direito Administrativo','Conhecimentos Gerais'].map(x=>'<option '+(x===(seed.disc||$('discipline').value)?'selected':'')+'>'+x+'</option>').join('')}</select></label>
  <label class="full">Enunciado<textarea class="stem" rows="3" placeholder="Digite ou revise o enunciado">${esc(seed.stem||'')}</textarea></label>
  ${alts.map((a,i)=>'<label class="altrow"><b>'+('ABCDE'[i])+'</b><input class="alt" data-letter="'+('ABCDE'[i])+'" value="'+esc(a)+'" placeholder="Texto da alternativa '+('ABCDE'[i])+'"></label>').join('')}
  <label>Gabarito<select class="ans" data-qnum="${esc(seed.number||n)}"><option value="">Não confirmado</option>${'ABCDE'.split('').map((a,i)=>'<option value="'+i+'" '+(seed.ans===i?'selected':'')+'>'+a+'</option>').join('')}</select></label>
  <label>Página da prova<input class="page" type="number" min="1" placeholder="Opcional" value="${esc(seed.page||'')}"></label>
  <label class="full">Explicação / comentário revisado<textarea class="com" rows="3" placeholder="Não invente uma explicação. Informe a fonte ou deixe pendente para revisão.">${esc(seed.com||'')}</textarea></label>
  </div>`;
  box.querySelector('.remove').onclick=()=>box.remove();
  box.querySelector('.qnum').addEventListener('change',e=>{box.querySelector('.ans').dataset.qnum=e.target.value;const a=answerKeys.get(Number(e.target.value));if(a)box.querySelector('.ans').value='ABCDE'.indexOf(a);});
  $('questions').append(box);
}
$('addQuestion').addEventListener('click',()=>addQuestion());
function makeId(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);}
$('exportPack').addEventListener('click',()=>{
  status('exportStatus','Validando pacote...');
  if(!$('rightsConfirmed').checked){status('exportStatus','Antes de gerar o pacote, confirme que a reprodução integral está autorizada ou possui fundamento válido. Em caso de dúvida, deixe pendente.','error');return;}
  const exam={ano:Number($('year').value),banca:$('board').value.trim(),orgao:$('agency').value.trim(),cargo:$('role').value.trim(),concurso:$('examName').value.trim()};
  const cards=[...$('questions').querySelectorAll('[data-card]')], errors=[];
  if(!Number.isInteger(exam.ano)||exam.ano<1900||exam.ano>2100)errors.push('Informe um ano válido.');
  for(const [k,v] of Object.entries({banca:100,orgao:200,cargo:200,concurso:200}))if(!exam[k]||exam[k].length>v)errors.push('Confira o campo '+k+'.');
  if(!cards.length)errors.push('Adicione pelo menos uma questão.');
  const questions=cards.map((card,i)=>{
    const rawAlts=[...card.querySelectorAll('.alt')].map(x=>x.value.trim());
    const last=rawAlts.reduce((found,value,index)=>value?index:found,-1);
    const alts=rawAlts.slice(0,last+1);
    const ans=card.querySelector('.ans').value;
    const packPrefix=makeId(exam.concurso).slice(0,40)||'prova';
    const q={id:packPrefix+'-'+String(i+1).padStart(6,'0'),disc:card.querySelector('.disc').value,stem:card.querySelector('.stem').value.trim(),alts,ans:ans===''?-1:Number(ans),com:card.querySelector('.com').value.trim(),sourcePage:card.querySelector('.page').value?Number(card.querySelector('.page').value):null};
    if(!q.stem)errors.push('Questão '+(i+1)+': falta o enunciado.');
    if(alts.length<2||alts.length>5||alts.some(a=>!a))errors.push('Questão '+(i+1)+': informe de 2 a 5 alternativas, sem espaços vazios entre elas.');
    if(alts.some(a=>a.length>2000))errors.push('Questão '+(i+1)+': alternativa acima de 2.000 caracteres.');
    if(q.ans<0||q.ans>4||!alts[q.ans])errors.push('Questão '+(i+1)+': gabarito não confirmado.');
    if(!q.com)errors.push('Questão '+(i+1)+': falta explicação/comentário revisado.');
    return q;
  });
  if(errors.length){status('exportStatus',errors.join(' '),'error');return;}
  const pack={id:makeId(exam.concurso)+'-'+exam.ano,title:exam.concurso+' — '+exam.ano,exam,source:{examFile:$('examPdf').files[0]?.name||'',answerKeyFile:$('keyPdf').files[0]?.name||'',url:$('sourceUrl').value.trim(),answerKeyReference:$('keyReference').value.trim(),reviewNotes:$('reviewNotes').value.trim(),reviewRequired:true,reproductionPermissionConfirmed:true},questions};
  const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=pack.id+'.json';a.click();URL.revokeObjectURL(url);
  status('exportStatus','Pacote JSON gerado. Antes de publicar, confira o gabarito definitivo e a permissão de reprodução das questões.','ok');
});
addQuestion();
