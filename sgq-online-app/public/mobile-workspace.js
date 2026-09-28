(() => {
  const nav = document.createElement('nav');
  nav.className = 'mobile-workspace-nav';
  nav.setAttribute('aria-label', 'Navegacao principal mobile');
  const items = [
    ['inicio', 'Inicio', 'inicio'],
    ['modulos', 'Modulos', 'modulos'],
    ['relatorios', 'Relatórios', 'relatorios'],
    ['menu', 'Menu', null],
  ];
  for (const [id, label, source] of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.mobileView = id;
    const icon = source
      ? document.querySelector(`.sb-nav [data-view="${source}"] .icon`)
      : document.querySelector(id === 'menu' ? '.menu-toggle .icon' : '[data-notification-badge]')?.closest('button')?.querySelector('.icon');
    const resolved = id === 'menu' ? document.querySelector('.menu-toggle .icon') : icon;
    if (resolved) button.append(resolved.cloneNode(true));
    const text = document.createElement('span');
    text.textContent = label;
    button.append(text);
    button.addEventListener('click', () => {
      if (id === 'menu') {
        document.body.classList.toggle('mobile-menu-open');
        button.setAttribute('aria-expanded', String(document.body.classList.contains('mobile-menu-open')));
      } else {
        closeMenu();
        render(id);
      }
    });
    if (id === 'menu') button.setAttribute('aria-expanded', 'false');
    nav.append(button);
  }
  const backdrop = document.createElement('button');
  backdrop.className = 'mobile-menu-backdrop';
  backdrop.setAttribute('aria-label', 'Fechar menu');
  function closeMenu() {
    document.body.classList.remove('mobile-menu-open');
    nav.querySelector('[data-mobile-view="menu"]').setAttribute('aria-expanded', 'false');
  }
  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.querySelector('.sb-nav').addEventListener('click', closeMenu);
  document.body.append(backdrop, nav);
  const searchButton = document.createElement('button');
  searchButton.type = 'button';
  searchButton.className = 'mobile-search-toggle tb-icon-btn';
  searchButton.setAttribute('aria-label', 'Pesquisar');
  searchButton.setAttribute('aria-expanded', 'false');
  searchButton.append(document.querySelector('.topbar-search .icon').cloneNode(true));
  document.querySelector('.topbar-right').prepend(searchButton);
  searchButton.addEventListener('click', () => {
    const open = document.body.classList.toggle('mobile-search-open');
    searchButton.setAttribute('aria-expanded', String(open));
    if (open) document.getElementById('dashboardGlobalSearch').focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.body.classList.remove('mobile-search-open');
      searchButton.setAttribute('aria-expanded', 'false');
    }
  });
  function sync() {
    const active = document.querySelector('.sb-nav .nav-item.active')?.dataset.view;
    nav.querySelectorAll('[data-mobile-view]').forEach(button => {
      if (button.dataset.mobileView === active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }
  new MutationObserver(sync).observe(document.querySelector('.sb-nav'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  matchMedia('(max-width: 760px)').addEventListener('change', closeMenu);
  sync();
})();
