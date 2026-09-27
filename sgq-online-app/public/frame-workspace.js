(() => {
  if (window.parent === window) return;
  const desktop = window.parent.matchMedia('(min-width: 981px)');
  const sync = () => document.documentElement.classList.toggle('fixed-workspace', desktop.matches);
  sync();
  desktop.addEventListener('change', sync);
  const style = document.createElement('style');
  style.textContent = `
    html.fixed-workspace,
    html.fixed-workspace body {
      height: 100%; min-height: 0 !important; overflow: hidden;
    }
    html.fixed-workspace .app-shell,
    html.fixed-workspace .main-area {
      height: 100%; min-height: 0 !important;
    }
    html.fixed-workspace .page-content {
      display: flex; flex-direction: column; height: 100%;
      min-height: 0; overflow: hidden;
    }
    html.fixed-workspace .page-content > :not(#tabContent) { flex: 0 0 auto; }
    html.fixed-workspace .page-content > #tabContent {
      flex: 1 1 0; min-height: 0; overflow: auto; overscroll-behavior: contain;
      padding-bottom: 16px;
    }
  `;
  document.head.append(style);
})();
