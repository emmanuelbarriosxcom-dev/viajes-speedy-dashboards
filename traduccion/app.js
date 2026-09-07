const PAYLOAD_PARTS=['https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p01.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p02.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p03.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p04.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p05.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p06.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p07.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p08.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p09.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p10.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p11.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p12.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p13.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p14.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p15.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p16.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p17.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p18.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p19.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p20.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p21.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p22.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p23.txt','https://raw.githubusercontent.com/emmanuelbarriosxcom-dev/viajes-speedy-dashboards/main/traduccion/p24.txt'];
const decode=b64=>new TextDecoder().decode(Uint8Array.from(atob(b64),c=>c.charCodeAt(0)));

async function decodeGzipBase64(b64){
  if(!('DecompressionStream' in window)){
    throw new Error('Este navegador no soporta DecompressionStream. Abre el archivo en Chrome, Edge o Safari actualizado.');
  }
  const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

let cards=[];
const STORAGE='viajes-speedy-es-implementacion-v2';
let saved={};
try{saved=JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch(e){saved={}}
let currentId='home';
let currentOpenCode=null;

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const list=(items,ordered=false)=>{
  if(!items||!items.length)return '<p style="margin:0;color:#8A949B;font-size:9px">Sin datos adicionales.</p>';
  const tag=ordered?'ol':'ul';
  return `<${tag}>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</${tag}>`;
};
const sourceText=s=>s==='recuperado'?'Recuperado':s==='pendiente_fuente'?'Falta fuente exacta':'No aprobado';
const sourceClass=s=>s==='recuperado'?'ok':s==='pendiente_fuente'?'warn':'danger';

function stateFor(id){return saved[id]||{status:'pendiente',notes:'',date:''}}
function saveField(id,key,val){
  saved[id]=saved[id]||{status:'pendiente',notes:'',date:''};
  saved[id][key]=val;
  localStorage.setItem(STORAGE,JSON.stringify(saved));
  renderNav();
}

function filteredCards(){
  const q=document.getElementById('search').value.trim().toLowerCase();
  const type=document.getElementById('typeFilter').value;
  const follow=document.getElementById('followFilter').value;
  const source=document.getElementById('sourceFilter').value;
  return cards.filter(c=>{
    const st=stateFor(c.id);
    const hay=(c.es+' '+c.en+' '+c.type+' '+c.version+' '+c.origin+' '+c.action).toLowerCase();
    return (!q||hay.includes(q))&&(!type||c.type===type)&&(!follow||st.status===follow)&&(!source||c.source_state===source);
  });
}

function renderNav(){
  const nav=document.getElementById('sideNav');
  const visible=new Set(filteredCards().map(c=>c.id));
  nav.innerHTML='';
  cards.forEach(c=>{
    const b=document.createElement('button');
    b.className=(c.id===currentId?'active ':'')+(visible.has(c.id)?'':'hidden');
    b.innerHTML=`<span>${esc(c.es)}</span><i class="dot ${esc(c.source_state)}"></i>`;
    b.onclick=()=>{currentId=c.id;currentOpenCode=null;renderNav();renderPiece();window.scrollTo({top:0,behavior:'smooth'})};
    nav.appendChild(b);
  });
  if(!visible.has(currentId)){
    const first=filteredCards()[0];
    if(first){currentId=first.id;currentOpenCode=null;renderPiece();}
  }
}

function renderPiece(){
  const root=document.getElementById('piece');
  const c=cards.find(x=>x.id===currentId);
  if(!c){root.innerHTML='<div class="empty"><h2>Sin resultados</h2><p>Ajusta los filtros de la izquierda.</p></div>';return;}
  const st=stateFor(c.id);

  root.innerHTML=`
    <div class="piece-head">
      <div>
        <div class="piece-kickers">
          <span class="badge ${sourceClass(c.source_state)}">${sourceText(c.source_state)}</span>
          <span class="badge">${esc(c.type)}</span>
        </div>
        <h2>${esc(c.es)} <small>/ ${esc(c.en)}</small></h2>
        <div class="version">${esc(c.version)} · ${esc(c.origin)}</div>
      </div>
      <div class="track">
        <select id="statusSel">
          <option value="pendiente" ${st.status==='pendiente'?'selected':''}>Pendiente</option>
          <option value="colocado" ${st.status==='colocado'?'selected':''}>Colocado</option>
          <option value="probado" ${st.status==='probado'?'selected':''}>Probado</option>
        </select>
        <input id="dateInput" type="date" value="${esc(st.date||'')}">
      </div>
    </div>

    <div class="piece-body">
      <div class="meta-grid">
        <div class="meta"><span>ACCIÓN</span><strong>${esc(c.action)}</strong></div>
        <div class="meta"><span>UBICACIÓN</span><p>${esc(c.location)}</p></div>
        <div class="meta"><span>ORIGEN / URL EN</span><p>${esc(c.url_en)}</p></div>
        <div class="meta"><span>DESTINO ES</span><p>${esc(c.url_es)}</p></div>
        <div class="meta"><span>PRODUCCIÓN</span><p>${esc(c.prod)}</p></div>
        <div class="meta"><span>TRADUCCIÓN / DINÁMICO</span><p>${esc(c.translation)}</p></div>
      </div>

      ${c.shortcode?`<div class="shortcode">${esc(c.shortcode)}</div>`:''}

      <div class="grid2">
        <div class="panel"><h3>Pasos</h3>${list(c.steps,true)}</div>
        <div class="panel"><h3>Comprobaciones</h3>${list(c.checks,false)}</div>
      </div>

      <div class="panel dep"><h3>Dependencias</h3>${list(c.dependencies,false)}</div>

      ${c.missing?`<div class="missing"><b>Fuente exacta necesaria</b>${esc(c.missing)}</div>`:''}

      ${c.codes&&c.codes.length?`<div class="codes">${c.codes.map((x,i)=>`
        <section class="code-card">
          <div class="code-head">
            <div><strong>${esc(x.label||x.filename||('Código '+(i+1)))}</strong><small>${esc(x.filename||'')}</small></div>
            <div class="code-actions">
              <button data-show="${i}">${currentOpenCode===i?'Ocultar código':'Mostrar código'}</button>
              <button data-copy="${i}">Copiar código</button>
              <button data-download="${i}">Descargar</button>
            </div>
          </div>
          <pre class="code-preview ${currentOpenCode===i?'open':''}" data-code="${i}"></pre>
        </section>
      `).join('')}</div>`:''}

      <div class="notes">
        <label>NOTAS DE IMPLEMENTACIÓN</label>
        <textarea id="notesInput" placeholder="Anota URL final, problemas, ajustes, pruebas…">${esc(st.notes||'')}</textarea>
      </div>
    </div>`;

  document.getElementById('statusSel').onchange=e=>saveField(c.id,'status',e.target.value);
  document.getElementById('dateInput').onchange=e=>saveField(c.id,'date',e.target.value);
  document.getElementById('notesInput').oninput=e=>saveField(c.id,'notes',e.target.value);

  root.querySelectorAll('[data-show]').forEach(btn=>btn.onclick=()=>{
    const i=Number(btn.dataset.show);
    currentOpenCode=currentOpenCode===i?null:i;
    renderPiece();
  });

  root.querySelectorAll('[data-copy]').forEach(btn=>btn.onclick=async()=>{
    const i=Number(btn.dataset.copy);
    const item=c.codes[i];
    const downloadText=decode(item.source_b64);
    const text=item.copy_mode==='same'
      ?downloadText
      :item.copy_mode==='strip_php'
        ?downloadText.replace(/^\s*<\?php\s*/,'')
        :decode(item.copy_alt_b64);
    try{
      await navigator.clipboard.writeText(text);
      toast('Código copiado');
    }catch(e){
      const ta=document.createElement('textarea');
      ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
      toast('Código copiado');
    }
  });

  root.querySelectorAll('[data-download]').forEach(btn=>btn.onclick=()=>{
    const i=Number(btn.dataset.download);
    download(c.codes[i].filename,decode(c.codes[i].source_b64));
  });

  if(currentOpenCode!==null){
    const pre=root.querySelector(`[data-code="${currentOpenCode}"]`);
    if(pre){
      const item=c.codes[currentOpenCode];
      const downloadText=decode(item.source_b64);
      pre.textContent=item.copy_mode==='same'
        ?downloadText
        :item.copy_mode==='strip_php'
          ?downloadText.replace(/^\s*<\?php\s*/,'')
          :decode(item.copy_alt_b64);
    }
  }
}

function toast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1200);
}

function download(name,text){
  const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name||'codigo.txt';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),800);
}

['search','typeFilter','followFilter','sourceFilter'].forEach(id=>{
  const el=document.getElementById(id);
  el.addEventListener(id==='search'?'input':'change',()=>{renderNav();});
});

document.getElementById('exportBtn').onclick=()=>download(
  'viajes-speedy-es-seguimiento.json',
  JSON.stringify({exportedAt:new Date().toISOString(),storageKey:STORAGE,data:saved},null,2)
);

document.getElementById('importInput').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const x=JSON.parse(r.result);saved=x.data||x||{};
      localStorage.setItem(STORAGE,JSON.stringify(saved));
      renderNav();renderPiece();toast('Seguimiento importado');
    }catch(err){alert('JSON no válido')}
  };
  r.readAsText(f);e.target.value='';
};

async function boot(){
  const piece=document.getElementById('piece');
  piece.innerHTML='<div class="empty"><h2>Cargando dashboard…</h2><p>Preparando inventario y códigos recuperados.</p></div>';

  try{
    const responses=await Promise.all(PAYLOAD_PARTS.map(url=>fetch(url,{cache:'no-store'})));
    responses.forEach((r,i)=>{if(!r.ok)throw new Error('No se pudo cargar la parte '+(i+1)+' del dashboard.');});
    const packed=(await Promise.all(responses.map(r=>r.text()))).join('').trim();
    cards=JSON.parse(await decodeGzipBase64(packed));
    renderNav();
    renderPiece();
  }catch(err){
    console.error(err);
    piece.innerHTML='<div class="empty"><h2>No se pudo abrir el dashboard</h2><p>'+esc(err.message||err)+'</p><p>Prueba abrir el archivo descargado directamente en Chrome o Edge.</p></div>';
  }
}

boot();