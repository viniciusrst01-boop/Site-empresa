const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../public/app.js"), "utf8");
const initialize = source.slice(source.indexOf("async function initializeApp()"), source.indexOf("async function loadRemoteData()"));

for (const isAdmin of [true, false]) {
  for (const entry of ["?entry=login", ""]) {
    test(`initial view respects role: admin=${isAdmin}, entry=${entry}`, async () => {
      const rendered = [];
      const context = vm.createContext({
        currentUser: { isAdmin }, URLSearchParams,
        LAST_VIEW_STORAGE_KEY: "last-view",
        localStorage: { getItem: () => "inicio" },
        loadRemoteData: async () => false,
        window: { location: { pathname: "/", search: entry }, history: { replaceState: (state) => assert.equal(state.sgqView, isAdmin ? "gerenciamento" : "inicio") }, addEventListener() {} },
        document: { body: { classList: { remove() {} } } },
        render: (view) => rendered.push(view),
        updateNotificationBadge() {}, updateOperationalStatus() {},
      });
      vm.runInContext(initialize, context);
      await context.initializeApp();
      assert.deepEqual(rendered, [isAdmin ? "gerenciamento" : "inicio"]);
    });
  }
}

test("master home navigation is redirected before saving the active view", () => {
  const render = source.slice(source.indexOf('function render(view = "inicio")'), source.indexOf("function scrollPageToTop()"));
  const prefix = render.slice(0, render.indexOf("  activeView = view;"));
  const context = vm.createContext({ currentUser: { isAdmin: true }, canViewStoreReport: () => true });
  vm.runInContext(`${prefix}\nreturn view;\n}`, context);
  assert.equal(context.render("inicio"), "gerenciamento");
  assert.equal(context.render("admin-empresas"), "admin-empresas");
  assert.equal(context.render("notificacoes"), "notificacoes");
  assert.equal(context.render("admin-suporte"), "admin-suporte");
});

test("master badge counts unread events and updates after reading", async () => {
  const button = { setAttribute() {} };
  const badge = { closest: () => button };
  const ctx = vm.createContext({
    document: { querySelector: () => badge }, currentUser: { isAdmin: true },
    state: { notifications: ["unrelated"] },
    localStorage: { getItem: () => "{}" },
    fetch: async () => ({ ok: true, json: async () => ({ notifications: [
      { id: 1, metadata: { status: "open" } }, { id: 2, metadata: { status: "in_progress" } },
    ] }) }),
  });
  vm.runInContext(source.slice(source.indexOf("async function updateNotificationBadge()"), source.indexOf("function leadershipRoleForPerson(")), ctx);
  vm.runInContext(source.slice(source.indexOf("function adminNotificationReadState()"), source.indexOf("async function renderMasterNotifications()")), ctx);
  await ctx.updateNotificationBadge();
  assert.equal(badge.textContent, "2");
  assert.equal(badge.hidden, false);
  const item = { id: 1, metadata: { status: "open" } };
  ctx.localStorage.getItem = () => JSON.stringify({ 1: ctx.adminNotificationVersion(item) });
  ctx.updateAdminNotificationCount([item]);
  assert.equal(badge.hidden, true);
  item.metadata.status = "in_progress";
  ctx.localStorage.getItem = () => JSON.stringify({ 1: "old-version" });
  ctx.updateAdminNotificationCount([item]);
  assert.equal(badge.textContent, "1");
  ctx.currentUser.isAdmin = false;
  await ctx.updateNotificationBadge();
  assert.equal(badge.textContent, "1");
});
