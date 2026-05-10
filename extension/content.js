(()=>{
  const MAX_ISSUES = 20;
  const runtimeIssues = {
    errors: []
  };

  function pushIssue(message){
    if(!message) return;
    runtimeIssues.errors.push(message);
    if(runtimeIssues.errors.length > MAX_ISSUES){
      runtimeIssues.errors = runtimeIssues.errors.slice(-MAX_ISSUES);
    }
  }

  function ts(){
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  window.addEventListener('error', (ev)=>{
    const msg = `${ts()} | ${ev.message || 'Erro de script'} ${ev.filename ? `(${ev.filename}:${ev.lineno || 0}:${ev.colno || 0})` : ''}`.trim();
    pushIssue(msg);
  });

  window.addEventListener('unhandledrejection', (ev)=>{
    const reason = ev && ev.reason
      ? (ev.reason.message || String(ev.reason))
      : 'Promise rejeitada sem detalhe';
    pushIssue(`${ts()} | UnhandledRejection: ${reason}`);
  });

  function extractOrgIdFromUrl(url){
    try{
      const m = url.match(/\/org\/(?:id=)?([a-z0-9\-]{8,})/i);
      return m ? m[1] : '';
    }catch(e){
      return '';
    }
  }

  function extractCompanyFromDocument(){
    const byMeta = document.querySelector('meta[property="og:site_name"]');
    if(byMeta && byMeta.content) return byMeta.content.trim();
    const title = (document.title || '').trim();
    if(!title) return '';
    const parts = title.split(/[-|]/).map(s => s.trim()).filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  function extractNetworkSignals(){
    try{
      const entries = performance.getEntriesByType('resource') || [];
      return entries
        .filter(e => /graphql|api/i.test(e.name || ''))
        .slice(-12)
        .map(e => `${e.initiatorType || 'resource'} ${e.name}`);
    }catch(e){
      return [];
    }
  }

  function getContext(){
    const selection = (window.getSelection && window.getSelection().toString()) || '';
    const url = location.href;
    let path = '';
    let queryKeys = [];
    try{
      const u = new URL(url);
      path = u.pathname || '';
      queryKeys = Array.from(u.searchParams.keys());
    }catch(e){
      path = location.pathname || '';
    }

    return {
      url,
      path,
      title: document.title || '',
      selection,
      orgId: extractOrgIdFromUrl(url),
      company: extractCompanyFromDocument(),
      queryKeys,
      issues: {
        errors: runtimeIssues.errors.slice(-10),
        networkSignals: extractNetworkSignals()
      }
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
    if(msg && msg.type === 'GET_CONTEXT'){
      sendResponse({ok:true, context: getContext()});
    }
    return true;
  });
})();
