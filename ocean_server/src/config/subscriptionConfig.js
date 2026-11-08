/**
 * Subscription System Master Switch
 *
 * Controls whether paid subscription plans (Drift, Wave, Tide, Surge) are enforced
 * or if the platform operates in Open Community Mode.
 *
 * Environment Variables:
 *   SUBSCRIPTION_ENABLED=false  -> Open Community Mode (No plans, all features open, flat 20 demand leads/day)
 *   SUBSCRIPTION_ENABLED=true   -> Paid Subscription Mode (Enforces Drift, Wave, Tide, Surge tiers)
 *   FREE_MODE_DEMAND_LIMIT=20   -> Daily accepted product demand leads limit per seller when subscriptions are off
 */

function isSubscriptionEnabled() {
  const val = String(process.env.SUBSCRIPTION_ENABLED || '').trim().toLowerCase();
  if (val === 'true' || val === '1' || val === 'yes' || val === 'on') {
    return true;
  }
  if (val === 'false' || val === '0' || val === 'no' || val === 'off') {
    return false;
  }
  // Default to false (Open Community Onboarding Mode) unless explicitly enabled
  return false;
}

function getFreeModeDemandLimit() {
  const parsed = parseInt(process.env.FREE_MODE_DEMAND_LIMIT || '20', 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 20 : parsed;
}

module.exports = {
  isSubscriptionEnabled,
  getFreeModeDemandLimit
};
