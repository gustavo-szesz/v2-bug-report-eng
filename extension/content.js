// Content script: responds to GET_CONTEXT messages with page context
(()=>{
  function extractOrgIdFromUrl(url){
    // simple heuristic: look for /org/<id>
    try{
      const m = url.match(/\/org\/(?:id=)?([a-z0-9\-]{8,})/i);
      return m?m[1]:'';
    }catch(e){return ''}
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
    if(msg && msg.type === 'GET_CONTEXT'){
      const selection = (window.getSelection && window.getSelection().toString()) || '';
      const ctx = {
        url: location.href,
        title: document.title || '',
        selection: selection,
        orgId: extractOrgIdFromUrl(location.href)
      };
      sendResponse({ok:true, context: ctx});
    }
    // indicate we will respond asynchronously if needed
    return true;
  });
})();
