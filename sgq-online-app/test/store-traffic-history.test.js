const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sgq-store-traffic-history-"));
process.env.SGQ_DATABASE_MODE = "local";
process.env.SGQ_DATA_DIR = dataDir;
process.env.DATABASE_URL = "";

const { listStoreTrafficDays, saveStoreTrafficDay } = require("../db");

test("tráfego diário é persistido, atualizado e consultado por mês", async (t) => {
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));

  await saveStoreTrafficDay({
    date: "2026-10-14",
    pageviews: 21,
    visitors: 13,
    topPages: [{ path: "/", pageviews: 10, visitors: 8 }],
  });
  await saveStoreTrafficDay({
    date: "2026-10-14",
    pageviews: 25,
    visitors: 15,
    topPages: [{ path: "/", pageviews: 12, visitors: 9 }],
  });
  await saveStoreTrafficDay({ date: "2026-11-01", pageviews: 4, visitors: 3 });

  const october = await listStoreTrafficDays("2026-10");
  assert.equal(october.length, 1);
  assert.equal(october[0].pageviews, 25);
  assert.equal(october[0].visitors, 15);
  assert.equal(october[0].topPages[0].path, "/");
  assert.deepEqual(await listStoreTrafficDays("2026-13"), []);
});
