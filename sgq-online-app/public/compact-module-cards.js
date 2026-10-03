(() => {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/compact-module-cards.css?v=20260928';
  document.head.append(stylesheet);
  const selector = '.module-detail-view .context-kpi-row > .kpi-card, .module-detail-view .risk-kpi-row > .kpi-card, .module-detail-view .climate-kpis > .kpi-card, .module-detail-view .documents-kpis > .documents-kpi, #kpiRow > .kpi-card, #kpiRow > .kpi-solid, #kpiRow > .dash-solid-card';
  const resize = new ResizeObserver(entries => entries.forEach(({ target }) => target.matches('.compact-summary-header, .climate-summary-header') ? alignSummary(target) : contrast(target)));
  const observed = new Set();
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
