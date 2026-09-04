const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function integration({ env = {}, priceOverrides = {} } = {}) {
  const calls = [];
  const stripe = {
    prices: { retrieve: async (id) => ({
      id, active: true, currency: "brl", unit_amount: id === "price_annual" ? 297000 : 29700,
      recurring: { interval: id === "price_annual" ? "year" : "month", interval_count: 1, usage_type: "licensed" },
      ...priceOverrides,
    }) },
    checkout: { sessions: { create: async (params) => { calls.push(params); return { id: "cs_test", url: "https://checkout.stripe.com/test" }; } } },
  };
  const context = {
    require: (name) => name === "stripe" ? function Stripe() { return stripe; } : require(name),
    module: { exports: {} },
    process: { env: {
      NODE_ENV: "test", STRIPE_SECRET_KEY: "sk_test_fixture", STRIPE_WEBHOOK_SECRET: "whsec_fixture",
      STRIPE_PRICE_MONTHLY: "price_monthly", STRIPE_PRICE_ANNUAL: "price_annual", ...env,
    } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "billing.js"), "utf8"), context);
  return { billing: context.module.exports, calls };
}

function checkout(billing, plan) {
  return billing.createCheckout({
    company: { id: 1, billingCustomerId: "cus_test" }, owner: {}, plan,
    successUrl: "https://example.com/success", cancelUrl: "https://example.com/cancel",
  });
}

test("checkout uses the agreed monthly and annual prices without a trial when set to zero", async () => {
  const { billing, calls } = integration({ env: { STRIPE_TRIAL_DAYS: "0" } });
  await checkout(billing, "monthly");
  await checkout(billing, "annual");
  assert.equal(calls[0].line_items[0].price, "price_monthly");
  assert.equal(calls[1].line_items[0].price, "price_annual");
  for (const call of calls) {
    assert.equal(call.mode, "subscription");
    assert.equal(call.line_items[0].quantity, 1);
    assert.equal(call.subscription_data.trial_period_days, undefined);
  }
});

test("checkout rejects mismatched or inactive Stripe prices before creating a session", async () => {
  for (const priceOverrides of [
    { unit_amount: 297 }, { currency: "usd" }, { active: false },
    { recurring: { interval: "week", interval_count: 1, usage_type: "licensed" } },
    { recurring: { interval: "month", interval_count: 12, usage_type: "licensed" } },
    { recurring: { interval: "month", interval_count: 1, usage_type: "metered" } },
  ]) {
    const { billing, calls } = integration({ priceOverrides });
    await assert.rejects(checkout(billing, "monthly"), /billing_price_mismatch/);
    assert.equal(calls.length, 0);
  }
});

test("production cannot enable simulated billing or operate with incomplete configuration", () => {
  const { billing } = integration({ env: { NODE_ENV: "production", STRIPE_MOCK_MODE: "true", STRIPE_SECRET_KEY: "" } });
  assert.equal(billing.isMockMode(), false);
  assert.equal(billing.isBillingConfigured(), false);
  assert.equal(integration({ env: { STRIPE_PRICE_ANNUAL: "" } }).billing.isBillingConfigured(), false);
  assert.equal(integration({ env: { STRIPE_WEBHOOK_SECRET: "" } }).billing.isBillingConfigured(), false);
  assert.equal(integration().billing.isBillingConfigured(), true);
  assert.equal(integration().billing.findPlan(""), null);
});

test("annual subscription data retains the single plan and does not overwrite access limits", () => {
  const { billing } = integration();
  const data = billing.subscriptionBillingData({
    id: "sub_test", customer: "cus_test", status: "active", cancel_at_period_end: true,
    items: { data: [{ price: { id: "price_annual" }, current_period_end: 1800000000 }] },
  });
  assert.equal(data.plan, "Plano QualityPro");
  assert.equal(data.accessLimit, undefined);
  assert.equal(data.cancelAtPeriodEnd, true);
  assert.equal(data.billingStatus, "Ativo");
  assert.equal(data.currentPeriodEnd, new Date(1800000000000).toISOString());
});
