/* Minimal pure formatter for the thread. Exposes two functions on window:
   - window.parseRawInput(raw) -> partial state
   - window.formatThread(state) -> string
*/
(function(){
  function normalizeLines(text){
    if(!text) return [];
    return text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  }

  function parseRawInput(raw){
    const text = (raw||"").trim();
    const lines = normalizeLines(text);
    const out = {};
    const titleMatch = text.match(/(?:Thread nova:\s*|Título[:\-]\s*)(.+?)(?:\s*OrgID:|\s*Link:|\s*\|)/i);
    if(titleMatch) out.threadTitle = titleMatch[1].trim();
    const orgMatch = text.match(/OrgID[:\s]+([a-z0-9\-]+)/i);
    if(orgMatch) out.orgId = orgMatch[1].trim();
    const urlMatch = text.match(/https?:\/\/[^\s)]+/i);
    if(urlMatch) out.pageUrl = urlMatch[0].trim();
    const humanMatch = text.match(/Texto humanizado:\s*([\s\S]*?)(?:\n\s*Agradecimentos finais:|\n\s*Arquivos de logs:|$)/i);
    if(humanMatch) out.humanText = humanMatch[1].trim();
    const logsIndex = lines.findIndex(l=>/Arquivos de logs/i.test(l));
    if(logsIndex>=0) out.logs = lines.slice(logsIndex+1).join('\n');
    return out;
  }

  function formatLogs(logs){
    if(!logs) return '';
    return normalizeLines(logs).map(l=>'    '+l).join('\n');
  }

  function formatThread(state){
    state = state || {};
    const title = state.threadTitle || state.title || '';
    const orgId = state.orgId || '';
    const company = state.company || '';
    const pageUrl = state.pageUrl || '';
    const mentions = state.mentions || '';
    const humanText = state.humanText || '';
    const gratitude = state.gratitude || '';
    const pageTitle = state.pageTitle || '';
    const logs = formatLogs(state.logs || '');

    const parts = [];
    let head = `[THREAD] ${title}`;
    if(orgId) head += ` OrgID: ${orgId}`;
    if(company) head += ` | Empresa responsável: ${company}`;
    if(pageUrl) head += ` | Link: ${pageUrl}`;
    parts.push(head);
    parts.push('');
    if(mentions) parts.push(`[Pessoas para marcar na thread] ${mentions}`);
    parts.push('');
    if(pageTitle) parts.push(`Página: ${pageTitle}`);
    parts.push('');
    if(humanText) parts.push(`Texto humanizado: ${humanText}`);
    parts.push('');
    if(gratitude) parts.push(`Agradecimentos finais: ${gratitude}`);
    parts.push('');
    parts.push('Arquivos de logs:');
    if(logs) parts.push(logs);
    return parts.join('\n').replace(/\n{3,}/g,'\n\n').trim();
  }

  window.parseRawInput = parseRawInput;
  window.formatThread = formatThread;
})();
