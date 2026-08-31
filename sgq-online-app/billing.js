const crypto = require("crypto");
const Stripe = require("stripe");

let stripeClient;

function planCatalog() {
  return [
    {
      key: "essential",
      name: "Plano Essencial",
      priceId: process.env.STRIPE_PRICE_ESSENTIAL || "",
      accessLimit: 5,
    },
    {
      key: "professional",
      name: "Plano Professional",
      priceId: process.env.STRIPE_PRICE_PROFESSIONAL || "",
      accessLimit: 15,
    },
    {
      key: "premium",
      name: "Plano Premium",
      priceId: process.env.STRIPE_PRICE_PREMIUM || "",
      accessLimit: 50,
    },
  ].filter((plan) => plan.priceId);
}

function isMockMode() {
  return process.env.STRIPE_MOCK_MODE === "true";
}

function isBillingConfigured() {
  return isMockMode() || Boolean(process.env.STRIPE_SECRET_KEY && planCatalog().length);
}

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("stripe_not_configured");
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

function findPlan(planKeyOrPriceId) {
  const value = String(planKeyOrPriceId || "");
  return planCatalog().find((plan) => plan.key === value || plan.priceId === value) || null;
}

async function ensureCustomer(company, owner) {
  if (company.billingCustomerId) return company.billingCustomerId;
  if (isMockMode()) return `cus_mock_${company.id}`;
  const customer = await getStripe().customers.create({
    email: owner.username,
    name: company.name,
    metadata: { companyId: String(company.id) },
  });
  return customer.id;
}

async function createCheckout({ company, owner, plan, successUrl, cancelUrl }) {
  const selectedPlan = findPlan(plan);
  if (!selectedPlan) throw new Error("invalid_billing_plan");
  const customerId = await ensureCustomer(company, owner);
  if (isMockMode()) {
    return {
      id: `cs_mock_${crypto.randomUUID()}`,
      customerId,
      url: `${successUrl}${successUrl.includes("?") ? "&" : "?"}mock_checkout=success`,
    };
  }
  const trialDays = Math.max(0, Math.min(Number(process.env.STRIPE_TRIAL_DAYS) || 14, 90));
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    client_reference_id: String(company.id),
    metadata: { companyId: String(company.id), planKey: selectedPlan.key },
    subscription_data: {
      ...(trialDays ? { trial_period_days: trialDays } : {}),
      metadata: { companyId: String(company.id), planKey: selectedPlan.key },
    },
  });
  return { id: session.id, customerId, url: session.url };
}

async function createPortal({ customerId, returnUrl }) {
  if (!customerId) throw new Error("billing_customer_missing");
  if (isMockMode()) return { url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}mock_portal=open` };
  return getStripe().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
}

async function changeSubscriptionPlan({ subscriptionId, plan }) {
  const selectedPlan = findPlan(plan);
  if (!selectedPlan) throw new Error("invalid_billing_plan");
  if (!subscriptionId) throw new Error("billing_subscription_missing");
  if (isMockMode()) {
    return {
      id: subscriptionId,
      status: "active",
      cancel_at_period_end: false,
      items: { data: [{ price: { id: selectedPlan.priceId }, current_period_end: unixDaysFromNow(30) }] },
    };
  }
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const item = subscription.items?.data?.[0];
  if (!item?.id) throw new Error("billing_subscription_item_missing");
  return stripe.subscriptions.update(subscriptionId, {
    items: [{ id: item.id, price: selectedPlan.priceId }],
    proration_behavior: "create_prorations",
    metadata: { ...subscription.metadata, planKey: selectedPlan.key },
  });
}

async function listInvoices(customerId) {
  if (!customerId) return [];
  if (isMockMode()) return [];
  const result = await getStripe().invoices.list({ customer: customerId, limit: 12 });
  return result.data.map((invoice) => ({
    id: invoice.id,
    number: invoice.number || "",
    status: invoice.status || "",
    amount: invoice.amount_paid || invoice.amount_due || 0,
    currency: invoice.currency || "brl",
    createdAt: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
    url: invoice.hosted_invoice_url || invoice.invoice_pdf || "",
  }));
}

function constructWebhookEvent(rawBody, signature) {
  if (isMockMode()) return JSON.parse(rawBody.toString("utf8"));
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("stripe_webhook_not_configured");
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

function unixDaysFromNow(days) {
  return Math.floor((Date.now() + days * 24 * 60 * 60 * 1000) / 1000);
}

function dateFromUnix(value) {
  const number = Number(value || 0);
  return number ? new Date(number * 1000).toISOString() : null;
}

function billingStatusFromStripe(status) {
  const value = String(status || "").toLowerCase();
  if (value === "trialing") return "Teste";
  if (value === "active") return "Ativo";
  if (["past_due", "unpaid", "paused"].includes(value)) return "Inadimplente";
  if (["canceled", "incomplete_expired"].includes(value)) return "Cancelado";
  return "Pendente";
}

function subscriptionBillingData(subscription) {
  const item = subscription?.items?.data?.[0] || {};
  const priceId = item.price?.id || "";
  const plan = findPlan(priceId);
  return {
    subscriptionId: subscription?.id || "",
    customerId:
      typeof subscription?.customer === "string"
        ? subscription.customer
        : subscription?.customer?.id || "",
    priceId,
    plan: plan?.name,
    accessLimit: plan?.accessLimit,
    billingStatus: billingStatusFromStripe(subscription?.status),
    currentPeriodEnd: dateFromUnix(subscription?.current_period_end || item.current_period_end),
    trialEnd: dateFromUnix(subscription?.trial_end),
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
  };
}

module.exports = {
  billingStatusFromStripe,
  changeSubscriptionPlan,
  constructWebhookEvent,
  createCheckout,
  createPortal,
  findPlan,
  isBillingConfigured,
  isMockMode,
  listInvoices,
  planCatalog,
  subscriptionBillingData,
};
