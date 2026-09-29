(() => {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/compact-module-cards.css?v=20260928';
  document.head.append(stylesheet);
  const selector = '.module-detail-view .context-kpi-row > .kpi-card, .module-detail-view .risk-kpi-row > .kpi-card, .module-detail-view .climate-kpis > .kpi-card, .module-detail-view .documents-kpis > .documents-kpi, #kpiRow > .kpi-card, #kpiRow > .kpi-solid, #kpiRow > .dash-solid-card';
  const resize = new ResizeObserver(entries => entries.forEach(({ target }) => contrast(target)));
  const observed = new Set();
  function contrast(card) {
    const icon = card.querySelector('.compact-card-icon');
    if (!icon) return;
    const bounds = card.getBoundingClientRect();
    const ratio = Number(card.dataset.compactRatio);
    card.classList.toggle('compact-icon-covered', !card.hasAttribute('data-compact-ratio') || (ratio > 0 && bounds.left + bounds.width * ratio >= icon.getBoundingClientRect().left));
  }
  function refresh() {
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
