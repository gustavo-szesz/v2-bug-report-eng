document.addEventListener('DOMContentLoaded', ()=>{
  const raw = document.getElementById('raw');
  const preview = document.getElementById('preview');
  const copyBtn = document.getElementById('copyBtn');
  const parseBtn = document.getElementById('parseBtn');
  const importBtn = document.getElementById('importBtn');
  const title = document.getElementById('title');
  const mentions = document.getElementById('mentions');

  function render(){
    const state = {
      threadTitle: title.value.trim(),
      mentions: mentions.value.trim(),
      humanText: raw.value.trim()
    };
    preview.textContent = window.formatThread(state);
  }

  parseBtn.addEventListener('click', ()=>{
    const parsed = window.parseRawInput(raw.value);
    if(parsed.threadTitle) title.value = parsed.threadTitle;
    if(parsed.orgId) raw.value = raw.value; // keep
    render();
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
        // simple insert of url
        raw.value = raw.value + '\n\nLink: ' + c.url;
        render();
      });
    });
  });

  // live render
  raw.addEventListener('input', render);
  title.addEventListener('input', render);
  mentions.addEventListener('input', render);

  // initial render
  render();
});
