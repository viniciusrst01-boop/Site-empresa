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
      inline: true, disableMobile: true, dateFormat: 'Y-m-d', monthSelectorType: 'static',
      locale: { ...flatpickr.l10ns.pt, firstDayOfWeek: 0 },
      onChange: (_dates, value) => commit(value),
    });
    const monthTrigger = popup.querySelector('.cur-month');
    monthTrigger.setAttribute('role', 'button');
    monthTrigger.setAttribute('aria-label', 'Selecionar m\u00eas');
    monthTrigger.setAttribute('aria-haspopup', 'listbox');
    monthTrigger.setAttribute('aria-expanded', 'false');
    monthTrigger.tabIndex = 0;
    const months = document.createElement('div');
    months.className = 'qp-calendar-month-menu';
    months.hidden = true;
    months.setAttribute('role', 'listbox');
    months.setAttribute('aria-label', 'Meses');
    popup.append(months);
    function closeMonths(focus = false) {
      months.hidden = true;
      monthTrigger.setAttribute('aria-expanded', 'false');
      if (focus) monthTrigger.focus();
    }
    function openMonths() {
      months.replaceChildren();
      picker.l10n.months.longhand.forEach((name, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.textContent = name;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(index === picker.currentMonth));
        option.disabled = Boolean((picker.config.minDate && picker.currentYear === picker.config.minDate.getFullYear() && index < picker.config.minDate.getMonth()) || (picker.config.maxDate && picker.currentYear === picker.config.maxDate.getFullYear() && index > picker.config.maxDate.getMonth()));
        option.addEventListener('click', () => { picker.changeMonth(index, false); closeMonths(true); });
        months.append(option);
      });
      months.hidden = false;
      monthTrigger.setAttribute('aria-expanded', 'true');
      months.querySelector('[aria-selected="true"]')?.focus();
    }
    monthTrigger.addEventListener('click', () => months.hidden ? openMonths() : closeMonths());
    monthTrigger.addEventListener('keydown', event => {
      if (['Enter', ' ', 'ArrowDown'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); openMonths(); }
    });
    months.addEventListener('keydown', event => {
      const options = [...months.querySelectorAll('button:not(:disabled)')];
      const index = options.indexOf(document.activeElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[next]?.focus();
      } else if (event.key === 'Tab') closeMonths();
    });
    document.addEventListener('pointerdown', event => {
      if (!months.contains(event.target) && event.target !== monthTrigger) closeMonths();
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
      closeMonths();
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
      closeMonths();
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
        event.preventDefault(); event.stopPropagation();
        if (!months.hidden) closeMonths(true); else close(true);
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
