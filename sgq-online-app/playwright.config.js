const fs = require("fs");
const os = require("os");
const path = require("path");
const { defineConfig } = require("@playwright/test");

const port = 4197;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sgq-browser-test-"));

module.exports = defineConfig({
  testDir: "./test/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    launchOptions: process.platform === "win32" ? { channel: "msedge" } : {},
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node server.js",
    url: `http://127.0.0.1:${port}/login`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      SGQ_DATABASE_MODE: "local",
      SGQ_DATA_DIR: dataDir,
      SGQ_LOGIN_USER: "browser.owner@example.com",
      SGQ_USER_PASSWORD: "Browser-Teste-123",
      SGQ_COMPANY_NAME: "Empresa Browser Teste",
      SGQ_ADMIN_USER: "platform-admin-not-used",
      SGQ_EXTRA_LOGINS: "",
      SGQ_EXPOSE_TEST_TOKENS: "true",
      SESSION_SECRET: "segredo-browser-com-tamanho-suficiente-123456",
    },
  },
});
