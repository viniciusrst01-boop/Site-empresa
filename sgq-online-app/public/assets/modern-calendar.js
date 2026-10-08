(() => {
  if (window.qpCalendarLoaded) return;
  window.qpCalendarLoaded = true;
  for (const href of ['/assets/flatpickr/flatpickr.min.css', '/assets/modern-calendar.css']) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  }
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  load('/assets/flatpickr/flatpickr.min.js').then(() => load('/assets/flatpickr/pt.js')).then(setup).catch(() => {});

  function setup() {
    let active = null;
    const popup = document.createElement('div');
    popup.className = 'qp-calendar';
    popup.setAttribute('popover', 'auto');
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', 'Selecionar data');
    const proxy = document.createElement('input');
    proxy.className = 'qp-calendar-proxy';
    proxy.tabIndex = -1;
    proxy.setAttribute('aria-hidden', 'true');
    popup.append(proxy);
    document.body.append(popup);
    const picker = flatpickr(proxy, {
      inline: true, disableMobile: true, dateFormat: 'Y-m-d',
      locale: { ...flatpickr.l10ns.pt, firstDayOfWeek: 0 },
      onChange: (_dates, value) => commit(value),
    });
    for (const [selector, title] of [['.flatpickr-prev-month', 'M\u00eas anterior'], ['.flatpickr-next-month', 'Pr\u00f3ximo m\u00eas']]) {
      const button = popup.querySelector(selector);
      button.setAttribute('role', 'button');
      button.setAttribute('aria-label', title);
      button.title = title;
      button.tabIndex = 0;
      button.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); button.click(); }
      });
    }
    const footer = document.createElement('div');
    footer.className = 'qp-calendar-footer';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'Limpar';
    clear.addEventListener('click', () => commit(''));
    const today = document.createElement('button');
    today.type = 'button';
    today.textContent = 'Hoje';
    today.addEventListener('click', () => commit(picker.formatDate(new Date(), 'Y-m-d')));
    footer.append(clear, today);
    popup.append(footer);

    function permitted(value) {
      if (!active) return false;
      const field = active.cloneNode();
      field.value = value;
      return !field.validity.rangeUnderflow && !field.validity.rangeOverflow && !field.validity.stepMismatch;
    }
    function close(restoreFocus = false) {
      const field = active;
      active = null;
      if (popup.matches(':popover-open')) popup.hidePopover();
      if (restoreFocus && field?.isConnected) field.focus({ preventScroll: true });
    }
    function commit(value) {
      if (!active || active.disabled || active.readOnly || !permitted(value)) return;
      const field = active;
      close();
      field.blur();
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function position() {
      if (!active || !popup.matches(':popover-open')) return;
      const rect = active.getBoundingClientRect();
      const width = popup.offsetWidth;
      const height = popup.offsetHeight;
      popup.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px`;
      const top = rect.bottom + height + 8 <= innerHeight ? rect.bottom + 6 : rect.top - height - 6;
      popup.style.top = `${Math.max(8, Math.min(top, innerHeight - height - 8))}px`;
    }
    function open(field) {
      if (field.disabled || field.readOnly) return;
      active = field;
      picker.set('minDate', field.min || null);
      picker.set('maxDate', field.max || null);
      picker.set('disable', [date => !permitted(picker.formatDate(date, 'Y-m-d'))]);
      picker.setDate(field.value || null, false);
      picker.jumpToDate(field.value || new Date());
      today.disabled = !permitted(picker.formatDate(new Date(), 'Y-m-d'));
      if (!popup.matches(':popover-open')) popup.showPopover();
      position();
      (popup.querySelector('.flatpickr-day.selected:not(.flatpickr-disabled)') || popup.querySelector('.flatpickr-day.today:not(.flatpickr-disabled)') || popup.querySelector('.flatpickr-day:not(.flatpickr-disabled)'))?.focus();
    }
    document.addEventListener('click', event => {
      const field = event.target.closest('input[type="date"]');
      if (!field || field.disabled || field.readOnly) return;
      event.preventDefault();
      open(field);
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && popup.matches(':popover-open')) {
        event.preventDefault(); event.stopPropagation(); close(true);
      } else if (event.target.matches('input[type="date"]') && (event.key === 'F4' || (event.altKey && event.key === 'ArrowDown'))) {
        event.preventDefault(); open(event.target);
      }
    }, true);
    window.addEventListener('resize', position);
    document.addEventListener('scroll', event => { if (!popup.contains(event.target)) position(); }, true);
    document.addEventListener('reset', () => close());
    new MutationObserver(() => {
      if (active && (!active.isConnected || !active.getClientRects().length)) close();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    document.documentElement.classList.add('qp-calendar-ready');
  }
})();
