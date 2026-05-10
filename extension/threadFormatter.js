/* Formatter for bug report output in Slack-friendly plain text. */
(function(){
  function clean(text){
    return String(text || '').replace(/\r/g, '').trim();
  }

  function normalizeHeading(name){
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function getHeadingRegex(name){
    const normalized = normalizeHeading(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return new RegExp('^\\s*(?:\\d+\\s*\\.\\s*)?(?:\\[\\s*)?' + normalized + '(?:\\s*\\])?\\s*$', 'i');
  }

  const KNOWN_HEADINGS = [
    'Título',
    'Contexto',
    'Impacto',
    'Comportamento esperado',
    'Comportamento atual',
    'Passo - Passo',
    'Variaveis',
    'Variables',
    'Observações',
    'Hipotese',
    'Hipótese'
  ].map(normalizeHeading);

  function isKnownHeadingLine(line){
    const normalized = normalizeHeading(line.replace(/^\s*\d+\s*\.\s*/, '').replace(/^\[\s*/, '').replace(/\s*\]\s*$/, ''));
    return KNOWN_HEADINGS.includes(normalized);
  }

  function extractByHeading(text, heading){
    const lines = clean(text).split('\n');
    const headingRgx = getHeadingRegex(heading);
    let start = -1;

    for(let i = 0; i < lines.length; i++){
      if(headingRgx.test(normalizeHeading(lines[i])) || headingRgx.test(lines[i])){
        start = i + 1;
        break;
      }
    }
    if(start < 0) return '';

    const out = [];
    for(let i = start; i < lines.length; i++){
      const line = lines[i];
      if(isKnownHeadingLine(line) && out.length) break;
      out.push(line);
    }
    return clean(out.join('\n'));
  }

  function extractContextBlock(text){
    return extractByHeading(text, 'Contexto');
  }

  function extractContextValue(contextBlock, key){
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rgx = new RegExp('^\\s*\\|?\\s*' + escaped + '\\s*:\\s*(.+)$', 'im');
    const m = contextBlock.match(rgx);
    return m ? clean(m[1]) : '';
  }

  function sectionRegex(name){
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('\\[' + escaped + '\\]\\s*([\\s\\S]*?)(?=\\n\\s*\\[[^\\]]+\\]|$)', 'i');
  }

  function extractSection(text, name){
    const match = clean(text).match(sectionRegex(name));
    if(!match) return '';
    return clean(match[1]);
  }

  function parseRawInput(raw){
    const text = clean(raw);
    if(!text) return {};
    const context = extractContextBlock(text) || extractSection(text, 'Contexto');
    const parsedTitle = (extractByHeading(text, 'Título') || extractSection(text, 'Título')).replace(/^\|\s*/, '');
    let fallbackTitle = '';
    if(!parsedTitle){
      const firstLine = text.split('\n').map(l => clean(l)).find(Boolean) || '';
      if(firstLine && !isKnownHeadingLine(firstLine)) fallbackTitle = firstLine;
    }
    return {
      title: parsedTitle || fallbackTitle,
      bugId: extractContextValue(context, 'BugID'),
      orgId: extractContextValue(context, 'OrgID'),
      company: extractContextValue(context, 'Cliente'),
      pageUrl: extractContextValue(context, 'Link de reprodução do erro'),
      reportAt: extractContextValue(context, 'Timezone/Horário do report'),
      impact: extractByHeading(text, 'Impacto') || extractSection(text, 'Impacto'),
      expected: extractByHeading(text, 'Comportamento esperado') || extractSection(text, 'Comportamento esperado'),
      actual: extractByHeading(text, 'Comportamento atual') || extractSection(text, 'Comportamento atual'),
      steps: extractByHeading(text, 'Passo - Passo') || extractSection(text, 'Passo - Passo'),
      variables: extractByHeading(text, 'Variaveis') || extractByHeading(text, 'Variables') || extractSection(text, 'Variables'),
      observations: extractByHeading(text, 'Observações') || extractSection(text, 'Observações'),
      hypothesis: extractByHeading(text, 'Hipotese') || extractByHeading(text, 'Hipótese') || extractSection(text, 'Hipótese')
    };
  }

  function formatThread(state){
    state = state || {};
    const title = clean(state.title || '');
    const bugId = clean(state.bugId || '');
    const orgId = clean(state.orgId || '');
    const company = clean(state.company || '');
    const pageUrl = clean(state.pageUrl || '');
    const reportAt = clean(state.reportAt || '');
    const impact = clean(state.impact || '');
    const expected = clean(state.expected || '');
    const actual = clean(state.actual || '');
    const steps = clean(state.steps || '');
    const variables = clean(state.variables || '{}');
    const observations = clean(state.observations || '');
    const hypothesis = clean(state.hypothesis || '');

    const parts = [
      title,
      '',
      'Contexto',
      `BugID: ${bugId}`,
      `OrgID: ${orgId}`,
      `Cliente: ${company}`,
      `Link de reprodução do erro: ${pageUrl}`,
      `Timezone/Horário do report: ${reportAt}`,
      '',
      'Impacto',
      impact,
      '',
      '2. Comportamento esperado',
      expected,
      '',
      '3. Comportamento atual',
      actual,
      '',
      '4. Passo - Passo',
      steps,
      '',
      '5. Variaveis',
      variables,
      '',
      '5. Observações',
      observations
    ];

    if(hypothesis){
      parts.push('', '5. Hipotese', hypothesis);
    }

    return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  window.parseRawInput = parseRawInput;
  window.formatThread = formatThread;
})();
