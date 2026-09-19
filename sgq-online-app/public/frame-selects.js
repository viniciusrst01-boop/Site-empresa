(() => {
  const menuClass = "qp-select-menu";
  let openMenu = null;

  const styles = `
    .qp-select { position: relative; display: block; min-width: 0; }
    .qp-select > select { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
    .qp-select-trigger { display: flex; width: 100%; min-height: 38px; align-items: center; justify-content: space-between; gap: 10px; padding: 0 13px; border: 1px solid var(--border-strong); border-radius: 7px; color: var(--text-primary); background: var(--bg-panel); font: inherit; font-size: 12px; font-weight: 700; text-align: left; cursor: pointer; }
    .qp-select-trigger:hover, .qp-select-trigger[aria-expanded="true"] { border-color: #2aaeff; box-shadow: 0 0 0 2px rgba(42, 174, 255, .12); }
    .qp-select-trigger:disabled { cursor: not-allowed; opacity: .62; }
    .qp-select-chevron { width: 16px; height: 16px; flex: 0 0 16px; fill: none; stroke: #4cc7ff; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.4; }
    .${menuClass} { position: fixed; z-index: 2200; display: none; max-height: min(420px, calc(100vh - 24px)); overflow-y: auto; padding: 4px; border: 1px solid #18aaff; border-radius: 11px; background: linear-gradient(180deg, #0b3155, #081c35); box-shadow: 0 14px 32px rgba(0, 0, 0, .42), 0 0 0 1px rgba(60, 198, 255, .16); }
    .${menuClass}.is-open { display: grid; }
    .qp-select-option { min-height: 28px; padding: 5px 12px; border: 0; border-bottom: 1px solid rgba(112, 190, 255, .12); color: #e2f2ff; background: transparent; font: inherit; font-size: 12px; text-align: left; cursor: pointer; }
    .qp-select-option:last-child { border-bottom: 0; }
    .qp-select-option:hover, .qp-select-option[aria-selected="true"] { border-radius: 6px; color: #fff; background: linear-gradient(90deg, rgba(35, 157, 234, .48), rgba(35, 157, 234, .2)); }
    html[data-theme="white"] .qp-select-trigger { border-color: #b9cde1; background: #f6f9fc; color: #172b45; }
    html[data-theme="white"] .qp-select-trigger:hover, html[data-theme="white"] .qp-select-trigger[aria-expanded="true"] { border-color: #159fe8; box-shadow: 0 0 0 2px rgba(21, 159, 232, .14); }
    html[data-theme="white"] .${menuClass} { border-color: #72b8df; background: linear-gradient(180deg, #f8fbff, #e7eef5); box-shadow: 0 14px 30px rgba(25, 72, 111, .22); }
    html[data-theme="white"] .qp-select-option { border-bottom-color: rgba(25, 72, 111, .12); color: #172033; }
    html[data-theme="white"] .qp-select-option:hover, html[data-theme="white"] .qp-select-option[aria-selected="true"] { color: #075985; background: #d9effd; }
    body.embedded .qp-select-trigger { min-height: 29px; padding: 0 9px; border-radius: 7px; font-size: 11px; }
  `;

  function close() {
    if (!openMenu) return;
    openMenu.menu.classList.remove("is-open");
    openMenu.trigger.setAttribute("aria-expanded", "false");
    openMenu = null;
  }

  function place(menu, trigger) {
    const rect = trigger.getBoundingClientRect();
    menu.style.width = `${rect.width}px`;
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8))}px`;
    menu.style.top = `${rect.bottom + 7}px`;
    menu.classList.add("is-open");
    const menuHeight = menu.getBoundingClientRect().height;
    if (rect.bottom + 7 + menuHeight > window.innerHeight - 8) {
      menu.style.top = `${Math.max(8, rect.top - menuHeight - 7)}px`;
    }
  }

  function enhance(select) {
    if (select.closest(".qp-select") || select.dataset.nativeSelect === "true") return;
    const wrapper = document.createElement("span");
    wrapper.className = "qp-select";
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "qp-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const menu = document.createElement("div");
    menu.className = menuClass;
    menu.setAttribute("role", "listbox");

    const sync = () => {
      const selected = select.options[select.selectedIndex];
      trigger.disabled = select.disabled;
      trigger.innerHTML = `<span>${selected?.textContent || ""}</span><svg class="qp-select-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
      menu.querySelectorAll("[role=option]").forEach((option) => option.setAttribute("aria-selected", String(option.dataset.value === select.value)));
    };

    Array.from(select.options).forEach((option) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "qp-select-option";
      item.dataset.value = option.value;
      item.disabled = option.disabled;
      item.setAttribute("role", "option");
      item.textContent = option.textContent;
      item.addEventListener("click", () => {
        select.value = item.dataset.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        close();
      });
      menu.appendChild(item);
    });

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      if (openMenu?.menu === menu) return close();
      close();
      place(menu, trigger);
      trigger.setAttribute("aria-expanded", "true");
      openMenu = { menu, trigger };
    });
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
      if ((event.key === "Enter" || event.key === " ") && !trigger.disabled) trigger.click();
    });

    wrapper.append(trigger);
    document.body.append(menu);
    select.addEventListener("change", sync);
    sync();
  }

  function enhanceAll(root = document) {
    root.querySelectorAll?.("select.input-basic").forEach(enhance);
  }

  const start = () => {
    if (!document.querySelector("style[data-frame-selects]")) {
      const style = document.createElement("style");
      style.dataset.frameSelects = "true";
      style.textContent = styles;
      document.head.append(style);
    }
    enhanceAll();
    new MutationObserver(() => enhanceAll()).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".qp-select") && !event.target.closest(`.${menuClass}`)) close();
    });
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
