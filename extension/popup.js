document.addEventListener('DOMContentLoaded', ()=>{
  const raw = document.getElementById('raw');
  const preview = document.getElementById('preview');
  const copyBtn = document.getElementById('copyBtn');
  const parseBtn = document.getElementById('parseBtn');
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const title = document.getElementById('title');
  const mentions = document.getElementById('mentions');
  const mentionsDropdown = document.getElementById('mentionsDropdown');
  const orgIdInput = document.getElementById('orgId');
  const companyInput = document.getElementById('company');
  const pageUrlInput = document.getElementById('pageUrl');
  const errorPathInput = document.getElementById('errorPath');
  const urlHint = document.getElementById('urlHint');
  const addFieldBtn = document.getElementById('addFieldBtn');
  const customFieldsContainer = document.getElementById('customFields');

  const MOCK_MENTIONS = [
    {label: 'Vini Mendes', handle: '@vinimendes'},
    {label: 'Gabriel Ribeiro', handle: '@gabrielribeiro'},
    {label: 'Ana Souza', handle: '@anasouza'},
    {label: 'João Lima', handle: '@joaolima'}
  ];

  function render(){
    const state = {
      threadTitle: title.value.trim(),
      mentions: mentions.value.trim(),
      humanText: raw.value.trim(),
      orgId: orgIdInput.value.trim(),
      company: companyInput.value.trim(),
      pageUrl: pageUrlInput.value.trim(),
      errorPath: errorPathInput.value.trim(),
      customFields: getCustomFields()
    };
    preview.textContent = window.formatThread(state);
  }

  // persistence: load saved state
  chrome.storage && chrome.storage.local.get(['lastThreadState'], (res)=>{
    try{
      const s = res && res.lastThreadState ? res.lastThreadState : null;
      if(s){
        if(s.raw) raw.value = s.raw;
        if(s.title) title.value = s.title;
        if(s.mentions) mentions.value = s.mentions;
        render();
      }
    }catch(e){/* ignore */}
  });

  function saveState(){
    const s = { raw: raw.value, title: title.value, mentions: mentions.value, orgId: orgIdInput.value, company: companyInput.value, pageUrl: pageUrlInput.value, errorPath: errorPathInput.value, customFields: getCustomFields() };
    chrome.storage && chrome.storage.local.set({ lastThreadState: s });
  }

  parseBtn.addEventListener('click', ()=>{
    const parsed = window.parseRawInput(raw.value);
    if(parsed.threadTitle) title.value = parsed.threadTitle;
    if(parsed.orgId) orgIdInput.value = parsed.orgId;
    if(parsed.pageUrl) pageUrlInput.value = parsed.pageUrl;
    if(parsed.company) companyInput.value = parsed.company;
    render();
    saveState();
  });

  copyBtn.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(preview.textContent);
      copyBtn.textContent = 'Copiado';
      setTimeout(()=>copyBtn.textContent = 'Copiar',1200);
    }catch(e){
      console.error('copy failed',e);
    }
  });

  exportBtn.addEventListener('click', ()=>{
    const data = preview.textContent || '';
    const blob = new Blob([data], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (title.value.trim() || 'thread') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', ()=>{
    // ask active tab for context
    chrome.tabs.query({active:true,currentWindow:true}, (tabs)=>{
      if(!tabs||!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, {type:'GET_CONTEXT'}, (resp)=>{
        if(!resp || !resp.context) return;
        const c = resp.context;
        // prefill fields
        if(c.selection) raw.value = c.selection + '\n\n' + raw.value;
        if(c.title) title.value = c.title;
        if(c.url) pageUrlInput.value = c.url;
        if(c.orgId) orgIdInput.value = c.orgId;
        // try parse url to show hint
        handleUrlChange(c.url);
        render();
        saveState();
      });
    });
  });

  // live render
  raw.addEventListener('input', render);
  title.addEventListener('input', render);
  mentions.addEventListener('input', render);
  pageUrlInput.addEventListener('input', (e)=>{ handleUrlChange(e.target.value); saveState(); render(); });

  function handleUrlChange(u){
    if(!u){ urlHint.textContent = ''; return; }
    try{
      const url = new URL(u);
      const path = url.pathname || '';
      // pattern: /admin/org/{orgId}/{page}/{subpage}
      const m = path.match(/\/admin\/org\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/\?]+))?/);
      if(m){
        const org = m[1];
        const page = m[2] || '';
        const sub = m[3] || '';
        urlHint.textContent = `OrgID detectado: ${org}${page?(' • Página: '+page):''}${sub?(' • Subpágina: '+sub):''}`;
        if(!orgIdInput.value) orgIdInput.value = org;
      } else {
        urlHint.textContent = 'URL não corresponde ao padrão /admin/org/{OrgID}/...';
      }
    }catch(e){ urlHint.textContent = 'URL inválida'; }
  }

  // mentions autocomplete logic (simple)
  function clearDropdown(){ mentionsDropdown.innerHTML = ''; }

  mentions.addEventListener('input', (e)=>{
    const q = e.target.value.trim().toLowerCase();
    if(!q){ clearDropdown(); return; }
    const list = MOCK_MENTIONS.filter(m => m.handle.includes(q) || m.label.toLowerCase().includes(q));
    if(list.length === 0){ clearDropdown(); return; }
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.background = 'rgba(0,0,0,0.8)';
    box.style.border = '1px solid rgba(255,255,255,0.06)';
    box.style.borderRadius = '8px';
    box.style.padding = '6px';
    box.style.zIndex = 9999;
    list.forEach(item=>{
      const el = document.createElement('div');
      el.textContent = `${item.handle} — ${item.label}`;
      el.style.padding = '6px 8px';
      el.style.cursor = 'pointer';
      el.style.color = '#fff';
      el.addEventListener('click', ()=>{
        // append mention if not present
        const cur = mentions.value.trim();
        const parts = cur ? cur.split(/\s+/) : [];
        if(!parts.includes(item.handle)) parts.push(item.handle);
        mentions.value = parts.join(' ');
        clearDropdown();
        render();
        saveState();
      });
      box.appendChild(el);
    });
    mentionsDropdown.innerHTML = '';
    mentionsDropdown.appendChild(box);
  });

  document.addEventListener('click', (ev)=>{
    if(ev.target !== mentions) clearDropdown();
  });

  // custom fields helpers
  function getCustomFields(){
    const rows = customFieldsContainer.querySelectorAll('.custom-row');
    const out = [];
    rows.forEach(r=>{
      const k = r.querySelector('.cf-key').value.trim();
      const v = r.querySelector('.cf-val').value.trim();
      if(k) out.push({key:k, value:v});
    });
    return out;
  }

  function addCustomField(key='', value=''){
    const row = document.createElement('div');
    row.className = 'custom-row';
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.marginBottom = '6px';
    const k = document.createElement('input'); k.className='cf-key'; k.placeholder='campo'; k.value = key; k.style.flex='1';
    const v = document.createElement('input'); v.className='cf-val'; v.placeholder='valor'; v.value = value; v.style.flex='2';
    const rm = document.createElement('button'); rm.textContent='Rem'; rm.className='btn'; rm.style.padding='6px'; rm.addEventListener('click', ()=>{ row.remove(); saveState(); render(); });
    [k,v,rm].forEach(el=>el.addEventListener && el.addEventListener('input' , ()=>{ saveState(); render(); }));
    row.appendChild(k); row.appendChild(v); row.appendChild(rm);
    customFieldsContainer.appendChild(row);
  }

  addFieldBtn.addEventListener('click', ()=>{ addCustomField(); });

  // load persisted custom fields
  chrome.storage && chrome.storage.local.get(['lastThreadState'], (res)=>{
    try{
      const s = res && res.lastThreadState ? res.lastThreadState : null;
      if(s){
        if(s.orgId) orgIdInput.value = s.orgId;
        if(s.company) companyInput.value = s.company;
        if(s.pageUrl) { pageUrlInput.value = s.pageUrl; handleUrlChange(s.pageUrl); }
        if(s.errorPath) errorPathInput.value = s.errorPath;
        if(s.customFields && Array.isArray(s.customFields)){
          customFieldsContainer.innerHTML = '';
          s.customFields.forEach(cf=> addCustomField(cf.key, cf.value));
        }
        render();
      }
    }catch(e){/* ignore */}
  });

  // initial render
  render();
});
