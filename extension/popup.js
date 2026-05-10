document.addEventListener('DOMContentLoaded', ()=>{
  const raw = document.getElementById('raw');
  const preview = document.getElementById('preview');
  const copyBtn = document.getElementById('copyBtn');
  const parseBtn = document.getElementById('parseBtn');
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const title = document.getElementById('title');
  const bugIdInput = document.getElementById('bugId');
  const reportAtInput = document.getElementById('reportAt');
  const orgIdInput = document.getElementById('orgId');
  const companyInput = document.getElementById('company');
  const pageUrlInput = document.getElementById('pageUrl');
  const errorPathInput = document.getElementById('errorPath');
  const impactInput = document.getElementById('impact');
  const expectedInput = document.getElementById('expected');
  const actualInput = document.getElementById('actual');
  const stepsInput = document.getElementById('steps');
  const variablesInput = document.getElementById('variables');
  const observationsInput = document.getElementById('observations');
  const hypothesisInput = document.getElementById('hypothesis');
  const urlHint = document.getElementById('urlHint');

  let stepsAutoFilled = true;

  function pad(n){ return String(n).padStart(2, '0'); }

  function toYmd(date){
    return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}`;
  }

  function getReportTimestamp(){
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const readable = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return `${timezone} | ${readable}`;
  }

  function stripEmoji(text){
    const value = String(text || '');
    try{
      return value.replace(/\p{Extended_Pictographic}/gu, '');
    }catch(e){
      return value;
    }
  }

  function sanitizeLine(text){
    return stripEmoji(String(text || '').replace(/\r/g, '')).trim();
  }

  function sanitizeMultiline(text){
    return stripEmoji(String(text || '').replace(/\r/g, ''))
      .split('\n')
      .map(line => line.replace(/\s+$/g, ''))
      .join('\n')
      .trim();
  }

  function parseUrlDetails(urlText){
    if(!urlText) return null;
    try{
      const url = new URL(urlText);
      const path = url.pathname || '';
      const adminMatch = path.match(/\/admin\/org\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/\?]+))?/i);
      const queryParams = {};
      url.searchParams.forEach((value, key)=>{
        queryParams[key] = value;
      });
      return {
        origin: url.origin,
        path,
        orgId: adminMatch ? adminMatch[1] : '',
        page: adminMatch ? (adminMatch[2] || '') : '',
        subpage: adminMatch ? (adminMatch[3] || '') : '',
        queryParams
      };
    }catch(e){
      return null;
    }
  }

  function buildVariablesJson(urlText, orgId, errorPath){
    const details = parseUrlDetails(urlText) || {};
    const payload = {
      orgId: sanitizeLine(orgId || details.orgId || ''),
      path: sanitizeLine(details.path || errorPath || ''),
      query: details.queryParams || {}
    };
    return JSON.stringify(payload, null, 2);
  }

  function inferCompanyFromTitle(pageTitle){
    const clean = sanitizeLine(pageTitle);
    if(!clean) return '';
    const chunks = clean.split(/[-|]/).map(s => s.trim()).filter(Boolean);
    if(chunks.length > 1) return chunks[chunks.length - 1];
    return '';
  }

  function buildDefaultSteps(data){
    const steps = [];
    if(data.pageUrl){
      steps.push(`1. Acessar a URL: ${sanitizeLine(data.pageUrl)}`);
    }else{
      steps.push('1. Acessar a tela afetada no admin.');
    }
    if(data.path){
      steps.push(`2. Navegar para o caminho: ${sanitizeLine(data.path)}`);
    }else{
      steps.push('2. Navegar até a funcionalidade onde o erro ocorre.');
    }
    steps.push('3. Executar a ação que dispara o bug (ex.: buscar, filtrar, aprovar ou salvar).');
    steps.push('4. Verificar o resultado observado em tela e nos logs de erro.');
    return steps.join('\n');
  }

  function buildAutoActual(context){
    const lines = [];
    const errors = context && context.issues && Array.isArray(context.issues.errors) ? context.issues.errors : [];
    const network = context && context.issues && Array.isArray(context.issues.networkSignals) ? context.issues.networkSignals : [];
    if(errors.length){
      lines.push('Erros de console capturados:');
      errors.slice(-6).forEach(err => lines.push(`- ${sanitizeLine(err)}`));
    }
    if(network.length){
      if(lines.length) lines.push('');
      lines.push('Sinais de requisicoes GraphQL/API:');
      network.slice(-6).forEach(item => lines.push(`- ${sanitizeLine(item)}`));
    }
    if(!lines.length){
      lines.push('Sem sinais automáticos de erro no momento da coleta. Descreva o comportamento visual observado.');
    }
    return lines.join('\n');
  }

  function buildAutoObservations(context){
    const notes = [];
    if(context && context.title) notes.push(`Titulo da pagina: ${sanitizeLine(context.title)}`);
    if(context && context.path) notes.push(`Caminho detectado: ${sanitizeLine(context.path)}`);
    if(context && context.queryKeys && context.queryKeys.length){
      notes.push(`Query params na URL: ${context.queryKeys.join(', ')}`);
    }
    if(context && context.issues && context.issues.networkSignals && context.issues.networkSignals.length){
      notes.push('Ha chamadas de rede relevantes para investigacao (GraphQL/API).');
    }
    return notes.join('\n');
  }

  function validateRequired(){
    if(!sanitizeMultiline(impactInput.value)){
      alert('O campo Impacto é obrigatório.');
      impactInput.focus();
      return false;
    }
    return true;
  }

  function render(){
    const state = {
      title: sanitizeLine(title.value),
      bugId: sanitizeLine(bugIdInput.value),
      reportAt: sanitizeLine(reportAtInput.value),
      orgId: sanitizeLine(orgIdInput.value),
      company: sanitizeLine(companyInput.value),
      pageUrl: sanitizeLine(pageUrlInput.value),
      impact: sanitizeMultiline(impactInput.value),
      expected: sanitizeMultiline(expectedInput.value),
      actual: sanitizeMultiline(actualInput.value),
      steps: sanitizeMultiline(stepsInput.value),
      variables: sanitizeMultiline(variablesInput.value),
      observations: sanitizeMultiline(observationsInput.value),
      hypothesis: sanitizeMultiline(hypothesisInput.value)
    };
    preview.textContent = window.formatThread(state);
  }

  function saveState(){
    const state = {
      raw: raw.value,
      title: title.value,
      bugId: bugIdInput.value,
      reportAt: reportAtInput.value,
      orgId: orgIdInput.value,
      company: companyInput.value,
      pageUrl: pageUrlInput.value,
      errorPath: errorPathInput.value,
      impact: impactInput.value,
      expected: expectedInput.value,
      actual: actualInput.value,
      steps: stepsInput.value,
      stepsAutoFilled,
      variables: variablesInput.value,
      observations: observationsInput.value,
      hypothesis: hypothesisInput.value
    };
    chrome.storage && chrome.storage.local.set({ lastThreadState: state });
  }

  function generateBugId(callback){
    const dateKey = toYmd(new Date());
    chrome.storage.local.get(['bugCounter'], (res)=>{
      const counter = res && res.bugCounter ? res.bugCounter : { date: dateKey, seq: 0 };
      const next = (counter.date === dateKey) ? (Number(counter.seq || 0) + 1) : 1;
      const updated = { date: dateKey, seq: next };
      chrome.storage.local.set({ bugCounter: updated }, ()=>{
        callback(`BUG-${dateKey}-${String(next).padStart(4, '0')}`);
      });
    });
  }

  function setUrlDerivedFields(urlText, forceSteps){
    const details = parseUrlDetails(urlText);
    if(!details){
      urlHint.textContent = urlText ? 'URL inválida' : '';
      return;
    }
    urlHint.textContent = details.orgId
      ? `OrgID detectado: ${details.orgId}${details.page ? ` • Página: ${details.page}` : ''}${details.subpage ? ` • Subpágina: ${details.subpage}` : ''}`
      : 'URL fora do padrão /admin/org/{OrgID}/...';
    if(details.orgId && !orgIdInput.value.trim()) orgIdInput.value = details.orgId;
    if(!errorPathInput.value.trim()) errorPathInput.value = details.path || '';
    variablesInput.value = buildVariablesJson(urlText, orgIdInput.value, errorPathInput.value);
    if(!stepsInput.value.trim() || stepsAutoFilled || forceSteps){
      stepsInput.value = buildDefaultSteps({ pageUrl: urlText, path: details.path });
      stepsAutoFilled = true;
    }
  }

  parseBtn.addEventListener('click', ()=>{
    const parsed = window.parseRawInput(raw.value);
    if(parsed.title) title.value = parsed.title;
    if(parsed.orgId) orgIdInput.value = parsed.orgId;
    if(parsed.company) companyInput.value = parsed.company;
    if(parsed.pageUrl) pageUrlInput.value = parsed.pageUrl;
    if(parsed.impact) impactInput.value = parsed.impact;
    if(parsed.expected) expectedInput.value = parsed.expected;
    if(parsed.actual) actualInput.value = parsed.actual;
    if(parsed.steps){
      stepsInput.value = parsed.steps;
      stepsAutoFilled = false;
    }
    if(parsed.variables) variablesInput.value = parsed.variables;
    if(parsed.observations) observationsInput.value = parsed.observations;
    if(parsed.hypothesis) hypothesisInput.value = parsed.hypothesis;
    setUrlDerivedFields(pageUrlInput.value, false);
    render();
    saveState();
  });

  function applyImportedContext(c){
    if(!c) return;
    if(c.selection) raw.value = raw.value ? `${c.selection}\n\n${raw.value}` : c.selection;
    if(c.title && !title.value.trim()) title.value = c.title;
    if(c.url) pageUrlInput.value = c.url;
    if(c.path && !errorPathInput.value.trim()) errorPathInput.value = c.path;
    if(c.orgId && !orgIdInput.value.trim()) orgIdInput.value = c.orgId;
    if(c.company && !companyInput.value.trim()) companyInput.value = c.company;
    if(!companyInput.value.trim() && c.title) companyInput.value = inferCompanyFromTitle(c.title);
    if(!actualInput.value.trim()) actualInput.value = buildAutoActual(c);
    if(!observationsInput.value.trim()) observationsInput.value = buildAutoObservations(c);
    setUrlDerivedFields(c.url || pageUrlInput.value, true);
    render();
    saveState();
  }

  importBtn.addEventListener('click', ()=>{
    chrome.tabs.query({active:true,currentWindow:true}, (tabs)=>{
      if(!tabs || !tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, {type:'GET_CONTEXT'}, (resp)=>{
        if(!resp || !resp.context) return;
        generateBugId((bugId)=>{
          bugIdInput.value = bugId;
          reportAtInput.value = getReportTimestamp();
          applyImportedContext(resp.context);
        });
      });
    });
  });

  copyBtn.addEventListener('click', async ()=>{
    if(!validateRequired()) return;
    render();
    try{
      await navigator.clipboard.writeText(preview.textContent);
      copyBtn.textContent = 'Copiado';
      setTimeout(()=>copyBtn.textContent = 'Copiar', 1200);
    }catch(e){
      console.error('copy failed', e);
    }
  });

  exportBtn.addEventListener('click', ()=>{
    if(!validateRequired()) return;
    render();
    const data = preview.textContent || '';
    const blob = new Blob([data], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (sanitizeLine(title.value) || 'bug-report') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  });

  [
    raw, title, orgIdInput, companyInput, pageUrlInput, errorPathInput, impactInput,
    expectedInput, actualInput, stepsInput, variablesInput, observationsInput, hypothesisInput
  ].forEach(el=>{
    el.addEventListener('input', ()=>{
      if(el === stepsInput) stepsAutoFilled = false;
      if(el === pageUrlInput) setUrlDerivedFields(pageUrlInput.value, false);
      if(el === orgIdInput || el === errorPathInput){
        variablesInput.value = buildVariablesJson(pageUrlInput.value, orgIdInput.value, errorPathInput.value);
      }
      render();
      saveState();
    });
  });

  chrome.storage.local.get(['lastThreadState'], (res)=>{
    const s = res && res.lastThreadState ? res.lastThreadState : null;
    if(s){
      raw.value = s.raw || '';
      title.value = s.title || '';
      bugIdInput.value = s.bugId || '';
      reportAtInput.value = s.reportAt || '';
      orgIdInput.value = s.orgId || '';
      companyInput.value = s.company || '';
      pageUrlInput.value = s.pageUrl || '';
      errorPathInput.value = s.errorPath || '';
      impactInput.value = s.impact || '';
      expectedInput.value = s.expected || '';
      actualInput.value = s.actual || '';
      stepsInput.value = s.steps || '';
      stepsAutoFilled = s.stepsAutoFilled !== false;
      variablesInput.value = s.variables || '';
      observationsInput.value = s.observations || '';
      hypothesisInput.value = s.hypothesis || '';
    }

    if(!reportAtInput.value.trim()) reportAtInput.value = getReportTimestamp();
    if(!bugIdInput.value.trim()){
      generateBugId((bugId)=>{
        bugIdInput.value = bugId;
        setUrlDerivedFields(pageUrlInput.value, false);
        if(!variablesInput.value.trim()){
          variablesInput.value = buildVariablesJson(pageUrlInput.value, orgIdInput.value, errorPathInput.value);
        }
        render();
        saveState();
      });
      return;
    }

    setUrlDerivedFields(pageUrlInput.value, false);
    if(!variablesInput.value.trim()){
      variablesInput.value = buildVariablesJson(pageUrlInput.value, orgIdInput.value, errorPathInput.value);
    }
    render();
    saveState();
  });
});
