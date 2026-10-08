(() => {
  const calendarScript = document.createElement('script');
  calendarScript.src = '/assets/modern-calendar.js';
  document.head.append(calendarScript);
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/compact-module-cards.css?v=20260928';
  document.head.append(stylesheet);
  const selector = '.module-detail-view .context-kpi-row > .kpi-card, .module-detail-view .risk-kpi-row > .kpi-card, .module-detail-view .climate-kpis > .kpi-card, .module-detail-view .documents-kpis > .documents-kpi, #kpiRow > .kpi-card, #kpiRow > .kpi-solid, #kpiRow > .dash-solid-card';
  const resize = new ResizeObserver(entries => entries.forEach(({ target }) => target.matches('.compact-summary-header, .climate-summary-header') ? alignSummary(target) : contrast(target)));
  const observed = new Set();
  function listStatusClass(value) {
    const status = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const groups = {
      complete: ['concluida', 'concluido', 'encerrada', 'encerrado', 'ativo', 'ativa', 'vigente', 'homologado', 'aprovado', 'aprovada', 'atingido', 'atingida', 'respondida', 'respondido', 'em uso'],
      monitoring: ['monitorando', 'em monitoramento', 'agendada', 'agendado', 'programada', 'programado', 'aguardando aprovacao', 'pendente', 'enviada', 'enviado'],
      pending: ['nao iniciada', 'nao iniciado', 'aberta', 'aberto', 'em aberto', 'atrasada', 'atrasado', 'vencida', 'vencido', 'reprovado', 'reprovada'],
      ongoing: ['em andamento', 'em execucao', 'em revisao', 'em analise', 'em tratamento', 'em calibracao'],
    };
    const group = Object.keys(groups).find(key => groups[key].includes(status));
    return group ? `summary-status-${group}` : '';
  }
  // Each provider uses the same records and predicates as its summary counter.
  function listFor(card) {
    let index = [...card.parentElement.children].indexOf(card);
    if (card.closest('.context-kpi-row') && document.querySelector('.context-page-content')) index = ['ctxKpiSwot', 'ctxKpiPartes', 'ctxKpiEscopo', 'ctxKpiProcessos'].findIndex(id => card.querySelector(`#${id}`));
    const pick = (rows, columns) => ({ rows, columns });
    const standard = [['Código', 'id'], ['Descrição', 'descricao'], ['Responsável', 'responsavel'], ['Situação', 'status']];
    if (card.closest('.equipment-summary-row')) return null;
    if (window.parent !== window) {
      if (location.pathname.includes('audits-module')) {
        const rows = store.get('qps_aud') || [];
        return pick(index === 0 ? rows.filter(r => (audInicio(r) || '').startsWith(String(calYear))) : rows.filter(r => r.status === ['','Agendada','Em andamento','Concluída'][index]), [['Código','id'], ['Descrição','descricao'], ['Tipo','tipo'], ['Início',r => audInicio(r)], ['Situação','status']]);
      }
      if (location.pathname.includes('fornecedores-module') && currentTab !== 'indicadores') {
        const rows = getFornecedores();
        return pick(rows.filter(r => index === 0 || index === 1 && r.status === 'Homologado' || index === 2 && r.criticidade === 'Crítico' || index === 3 && temAlerta(r)), [['Código','id'], ['Fornecedor','razao'], ['Criticidade','criticidade'], ['Situação','status']]);
      }
      if (location.pathname.includes('satisfacao-module') && currentTab !== 'indicadores' && (index === 1 || index === 2)) {
        const rows = store.get('qps_sat_pesquisas') || [];
        return pick(rows.filter(r => index === 1 || r.status === 'Respondida'), [['Código','id'], ['Cliente','empresa'], ['E-mail','email'], ['Situação','status']]);
      }
      return null;
    }
    if (card.closest('.context-kpi-row') && document.querySelector('.context-page-content')) {
      if (index === 0) return pick(contextGet('swot').map((row, i) => ({ ...row, numero: String(i + 1).padStart(4, '0') })), [['Nº','numero'], ['Descrição','descricao'], ['Categoria','quadrante'], ['Prioridade','prioridade'], ['Situação','status']]);
      if (index === 1) return pick(contextGet('partes').filter(r => r.monitoramento?.trim()), [['Parte interessada','parte'], ['Monitoramento','monitoramento'], ['Frequência','frequencia']]);
      if (index === 3) return pick(contextGet('processos'), [['Código',r => r.codigo || r.id], ['Processo','nome'], ['Categoria','categoria'], ['Responsável','responsavel'], ['Situação','status']]);
    }
    if (card.closest('#leadershipKpis')) {
      if (index === 1) return pick(leadershipGet('acoes').filter(r => r.status === 'Concluída'), standard);
      if (index === 2) return pick(leadershipGet('comunicacao'), [['Código','id'], ['Data','data'], ['Forma','forma'], ['Setor','setor'], ['Pessoas alcançadas','qtdPessoas']]);
      if (index === 3) return pick(leadershipGet('cargos').filter(r => r.status === 'Ativo'), [['Código','id'], ['Nome','nome'], ['Cargo','cargo'], ['Departamento','departamento'], ['Situação','status']]);
    }
    if (card.closest('.risk-kpi-row')) {
      if (index < 2) return pick(riskGet('riscos').filter(r => index === 0 || Number(r.probabilidade) * Number(r.impacto) >= 10), [['Código','id'], ['Descrição','texto'], ['Tipo','tipo'], ['Responsável','responsavel'], ['Situação','status']]);
      if (index === 2) return pick(riskGet('objetivos').filter(r => r.status === 'Atingido'), [['Código','id'], ['Objetivo',r => r.objetivo || r.descricao], ['Responsável','responsavel'], ['Situação','status']]);
      if (index === 3) return pick(riskGet('mudancas').filter(r => r.status === 'Em execução'), [['Código','id'], ['Mudança','mudanca'], ['Responsável','responsavel'], ['Situação','status']]);
    }
    if (card.closest('.documents-kpis')) {
      const internal = documentsInternal(), all = [...internal, ...documentsExternal()];
      const rows = index === 0 ? all : index === 1 ? all.filter(r => documentEffectiveStatus(r) === 'Vigente') : index === 2 ? internal.filter(r => documentEffectiveStatus(r) === 'Aguardando Aprovação') : all.filter(documentIsLate);
      return pick(rows, [['Código',r => r.codigo || r.id], ['Documento',r => r.titulo || r.nome], ['Revisão','revisao'], ['Situação',r => documentEffectiveStatus(r)]]);
    }
    if (card.closest('.climate-kpis') && index > 0) return pick(climateData().issues.filter(r => index === 1 || index === 2 && r.status === 'Concluída' || index === 3 && climateIsLate(r)), [['Código','id'], ['Descrição','description'], ['Responsável','owner'], ['Prazo','due'], ['Situação','status']]);
    if (card.closest('.nc-progress-kpis')) {
      if (index === 0 || index === 3) return pick(state.ncs.filter(r => index === 0 ? r.status !== 'Encerrado' : r.status === 'Encerrado'), [['Código',r => r.numero || r.id], ['Descrição','descricao'], ['Processo','processo'], ['Situação','status']]);
      return pick(state.ncs.flatMap(r => (r.acoes || []).map(a => ({ ...a, origem: r.numero || r.id }))).filter(r => r.status !== 'Concluída' && (index === 1 || r.prazo && r.prazo < ncToday())), [['RNC','origem'], ['Ação',r => r.descricao || r.acao], ['Responsável','responsavel'], ['Prazo','prazo'], ['Situação','status']]);
    }
    return null;
  }

  function showList(card, data) {
    const doc = window.parent !== window ? window.parent.document : document;
    if (doc.querySelector('#summary-record-list')) return;
    const dialog = doc.createElement('dialog');
    dialog.id = 'summary-record-list';
    dialog.className = 'summary-record-list';
    if (card.querySelector('#ctxKpiPartes')) dialog.classList.add('summary-parties-list');
    dialog.setAttribute('aria-labelledby', 'summary-record-title');
    dialog.innerHTML = '<header><div><h2 id="summary-record-title"></h2><p></p></div><button type="button" data-close aria-label="Fechar lista">×</button></header><div class="summary-record-table"><table><thead></thead><tbody></tbody></table></div><footer><div><button type="button" data-prev aria-label="Página anterior">‹</button><span aria-live="polite"></span><button type="button" data-next aria-label="Próxima página">›</button></div></footer>';
    dialog.querySelector('h2').textContent = card.querySelector('.compact-card-label, .nc-progress-label')?.textContent || 'Registros';
    dialog.querySelector('header p').textContent = `${data.rows.length} registro(s)`;
    const head = doc.createElement('tr');
    data.columns.forEach(([label]) => { const th = doc.createElement('th'); th.textContent = label; head.append(th); });
    dialog.querySelector('thead').append(head);
    let page = 0;
    const pages = Math.max(1, Math.ceil(data.rows.length / 10));
    function draw() {
      const body = dialog.querySelector('tbody'); body.replaceChildren();
      for (const row of data.rows.slice(page * 10, page * 10 + 10)) {
        const tr = doc.createElement('tr');
        data.columns.forEach(([label, field]) => {
          const td = doc.createElement('td');
          const value = typeof field === 'function' ? field(row) : row[field];
          td.textContent = value == null || value === '' ? '—' : String(value);
          const statusClass = label === 'Situação' ? listStatusClass(value) : '';
          if (statusClass) td.classList.add(statusClass);
          tr.append(td);
        });
        body.append(tr);
      }
      if (!data.rows.length) { const tr = doc.createElement('tr'), td = doc.createElement('td'); td.colSpan = data.columns.length; td.textContent = 'Nenhum registro nesta categoria.'; tr.append(td); body.append(tr); }
      dialog.querySelector('footer span').textContent = `Página ${page + 1} de ${pages}`;
      dialog.querySelector('[data-prev]').disabled = page === 0;
      dialog.querySelector('[data-next]').disabled = page === pages - 1;
    }
    dialog.querySelectorAll('[data-close]').forEach(b => b.onclick = () => dialog.close());
    let pressedOutside = false;
    const outside = event => {
      const bounds = dialog.getBoundingClientRect();
      return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    };
    dialog.addEventListener('pointerdown', event => { pressedOutside = event.target === dialog && outside(event); });
    dialog.addEventListener('click', event => { if (pressedOutside && event.target === dialog && outside(event)) dialog.close(); pressedOutside = false; });
    dialog.querySelector('[data-prev]').onclick = () => { page--; draw(); };
    dialog.querySelector('[data-next]').onclick = () => { page++; draw(); };
    dialog.addEventListener('close', () => { dialog.remove(); if (card.isConnected) card.focus(); }, { once: true });
    doc.body.append(dialog);
    if (card.querySelector('#ctxKpiSwot')) {
      dialog.classList.add('summary-swot-map');
      dialog.querySelector('h2').textContent = 'Itens da SWOT';
      dialog.querySelector('footer').remove();
      const grid = dialog.querySelector('.summary-record-table');
      grid.className = 'summary-swot-grid';
      grid.replaceChildren();
      for (const [key, title, color] of [['Força','Forças','strength'], ['Fraqueza','Fraquezas','weakness'], ['Oportunidade','Oportunidades','opportunity'], ['Ameaça','Ameaças','threat']]) {
        const section = doc.createElement('section');
        section.className = `summary-swot-quadrant ${color}`;
        section.dataset.quadrant = key;
        const heading = doc.createElement('h3');
        heading.textContent = title;
        const rows = data.rows.filter(row => row.quadrante === key);
        const count = doc.createElement('span');
        count.textContent = `${rows.length} ${rows.length === 1 ? 'item' : 'itens'}`;
        heading.append(count); section.append(heading);
        if (!rows.length) {
          const empty = doc.createElement('p'); empty.className = 'summary-swot-empty';
          empty.textContent = 'Nenhum item cadastrado.'; section.append(empty);
        }
        for (const row of rows) {
          const item = doc.createElement('article'); item.className = 'summary-swot-item';
          const meta = doc.createElement('div'); meta.className = 'summary-swot-meta';
          const code = doc.createElement('span'); code.textContent = row.id || '';
          const priority = doc.createElement('span'); priority.className = 'summary-swot-priority';
          priority.textContent = `Prioridade: ${row.prioridade || '—'}`;
          meta.append(code, priority); item.append(meta);
          const description = doc.createElement('p'); description.className = 'summary-swot-description';
          description.textContent = row.descricao || '—'; item.append(description);
          const owner = doc.createElement('p'); owner.textContent = `Responsável: ${row.responsavel || '—'}`;
          item.append(owner);
          if (row.planoNecessario === 'Sim') {
            const plan = doc.createElement('p'); plan.textContent = `Plano de ação: ${row.planoAcao || 'Não informado'}`;
            const status = doc.createElement('p'); status.className = 'summary-swot-status';
            status.textContent = row.status || 'Não iniciado';
            const statusClass = listStatusClass(status.textContent);
            if (statusClass) status.classList.add(statusClass);
            item.append(plan, status);
          }
          section.append(item);
        }
        grid.append(section);
      }
    } else draw();
    dialog.showModal();
  }

  function bindLists() {
    const equipmentList = document.querySelector('#modalCategoria');
    if (equipmentList && !equipmentList.dataset.dismissBound) {
      equipmentList.dataset.dismissBound = 'true';
      let backdropPressed = false;
      equipmentList.addEventListener('pointerdown', event => { backdropPressed = event.target === equipmentList; });
      equipmentList.addEventListener('click', event => {
        if (backdropPressed && event.target === equipmentList) closeModal('modalCategoria');
        backdropPressed = false;
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && equipmentList.classList.contains('show')) closeModal('modalCategoria');
      });
    }
    document.querySelectorAll('.compact-summary-header .compact-module-card, .climate-summary-header .compact-module-card, .compact-summary-header .nc-progress-card, .equipment-summary-row > .dash-solid-card').forEach(card => {
      const equipment = card.closest('.equipment-summary-row');
      if (!equipment && !listFor(card)) return;
      if (card.dataset.summaryListBound) return;
      card.dataset.summaryListBound = 'true';
      card.classList.add('summary-list-trigger');
      card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-haspopup', 'dialog');
      const label = card.querySelector('.compact-card-label, .nc-progress-label, .sc-label')?.textContent || 'Registros';
      card.setAttribute('aria-label', `Ver lista: ${label}`);
      if (!equipment) card.addEventListener('click', event => {
        event.preventDefault(); event.stopImmediatePropagation();
        const data = listFor(card); if (data) showList(card, data);
      }, true);
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); } });
    });
  }
  function alignSummary(header) {
    const heading = header.firstElementChild;
    const row = header.lastElementChild;
    const lines = [...heading.querySelectorAll('.breadcrumb, .welcome-eyebrow')].map(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    }).filter(rect => rect.height > 0);
    let offset = 0;
    if (window.matchMedia('(min-width: 1400px)').matches && lines.length) {
      const bounds = row.getBoundingClientRect();
      const previous = parseFloat(row.style.getPropertyValue('--summary-offset')) || 0;
      offset = (Math.min(...lines.map(rect => rect.top)) + Math.max(...lines.map(rect => rect.bottom))) / 2 - (bounds.top + bounds.height / 2) + previous;
    }
    row.style.setProperty('--summary-offset', `${offset}px`);
  }
  function arrangeSummary() {
    const page = document.querySelector('.page-content');
    if (!page || page.querySelector(':scope > .compact-summary-header, :scope > .climate-summary-header')) return;
    const row = page.querySelector(':scope > .context-kpi-row, :scope > .risk-kpi-row, :scope > #ncKpis, :scope > .documents-module > .documents-kpis, :scope > #kpiRow');
    if (!row) return;
    let headings = [...page.querySelectorAll(':scope > .module-breadcrumb, :scope > .module-summary-toolbar, :scope > .breadcrumb, :scope > .welcome-eyebrow, :scope > .welcome-sub')];
    // Embedded modules reuse the host heading while keeping their own live KPI row.
    if (window.parent !== window) {
      const host = window.frameElement?.closest('.page-content');
      host?.classList.add('compact-summary-host');
      page.classList.add('compact-summary-frame');
      const originals = host ? [...host.querySelectorAll(':scope > .module-breadcrumb, :scope > .module-summary-toolbar')] : [];
      if (originals.length) {
        headings.forEach(node => { node.hidden = true; });
        headings = originals.map(original => {
          const copy = original.cloneNode(true);
          copy.hidden = false;
          copy.querySelectorAll('button').forEach((button, index) => button.addEventListener('click', () => original.querySelectorAll('button')[index]?.click()));
          original.hidden = true;
          return copy;
        });
      }
    }
    if (!headings.length) return;
    const header = document.createElement('div');
    header.className = 'compact-summary-header';
    const heading = document.createElement('div');
    heading.className = 'compact-summary-heading';
    page.prepend(header);
    heading.append(...headings);
    header.append(heading, row);
    row.classList.add('compact-summary-kpis');
  }
  function contrast(card) {
    const icon = card.querySelector('.compact-card-icon');
    if (!icon) return;
    const bounds = card.getBoundingClientRect();
    const ratio = Number(card.dataset.compactRatio);
    card.classList.toggle('compact-icon-covered', !card.hasAttribute('data-compact-ratio') || (ratio > 0 && bounds.left + bounds.width * ratio >= icon.getBoundingClientRect().left));
  }
  function refresh() {
    arrangeSummary();
    if (window.parent === window && document.querySelector('.page-content > .compact-summary-header, .page-content > .climate-summary-header')) {
      document.querySelector('.page-content')?.classList.remove('compact-summary-host');
    }
    document.querySelectorAll('.compact-summary-header, .climate-summary-header').forEach(header => {
      if (header.classList.contains('compact-summary-header')) header.lastElementChild.classList.add('compact-summary-kpis');
      if (!observed.has(header)) { resize.observe(header); observed.add(header); }
      alignSummary(header);
    });
    observed.forEach(card => {
      if (!card.isConnected) { resize.unobserve(card); observed.delete(card); }
    });
    document.querySelectorAll(selector).forEach(card => {
      // Equipment and NC already have their approved presentation.
      if (card.closest('.equipment-summary-row')) return;
      if (!card.classList.contains('compact-module-card')) {
        const label = card.querySelector('.kpi-label, .documents-kpi-label, .ks-label, .sc-label');
        const value = card.querySelector('.kpi-value, .documents-kpi-value, .ks-value, .sc-value');
        const caption = card.querySelector('.kpi-caption, .documents-kpi-caption, .ks-caption, .sc-caption');
        const icon = card.querySelector('.kpi-icon, .documents-kpi-icon, .ks-icon, .sc-icon');
        if (!label || !value || !caption || !icon) return;
        const style = getComputedStyle(card);
        card.style.setProperty('--compact-color', style.getPropertyValue('--accent-line').trim() || style.getPropertyValue('--doc-kpi-color').trim() || style.getPropertyValue('--kc').trim() || style.getPropertyValue('--card-bg').trim() || '#4fa3ff');
        const bar = card.querySelector('.ks-bar > span');
        if (bar) card.dataset.kpiProgress = String(parseFloat(bar.style.width) / 100);
        label.classList.add('compact-card-label');
        value.classList.add('compact-card-value');
        caption.classList.add('compact-card-caption');
        icon.classList.add('compact-card-icon');
        const line = document.createElement('div');
        line.className = 'compact-card-line';
        line.append(value, caption);
        card.replaceChildren(label, line, icon);
        card.classList.add('compact-module-card');
        resize.observe(card);
        observed.add(card);
      }
      const value = card.querySelector('.compact-card-value').textContent.trim();
      const fraction = value.match(/^(\d+)\s*\/\s*(\d+)$/);
      let ratio = card.dataset.kpiProgress ?? card.querySelector('[data-kpi-fraction]')?.dataset.kpiFraction;
      if (ratio === undefined && /^\d+(?:[.,]\d+)?%$/.test(value)) ratio = parseFloat(value.replace(',', '.')) / 100;
      if (ratio === undefined && fraction) ratio = Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : 0;
      if (ratio !== undefined && Number.isFinite(Number(ratio))) {
        card.dataset.compactRatio = String(Math.max(0, Math.min(1, Number(ratio))));
        card.style.setProperty('--compact-progress', `${Number(card.dataset.compactRatio) * 100}%`);
      }
      card.classList.toggle('compact-text-value', !/^[\d.,/%+\s-]+$/.test(value));
      contrast(card);
    });
    bindLists();
  }
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; refresh(); });
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-kpi-progress'] });
  refresh();
})();
