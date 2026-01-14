/**
 * Helper function to get Flutterwave plan ID from environment variables
 * @param {string} planName - Plan name (drift, wave, tide, surge)
 * @param {string} currency - Currency code (NGN or USD)
 * @returns {string|null} Flutterwave plan ID or null if not found
 */
function getFlutterwavePlanId(planName, currency = 'NGN') {
  const planNameUpper = planName.toUpperCase();
  const currencyUpper = currency.toUpperCase();
  
  const envVarName = `FLW_PLAN_ID_${planNameUpper}_${currencyUpper}`;
  const planId = process.env[envVarName];
  
  if (!planId) {
    console.warn(`⚠️ Flutterwave plan ID not found for ${planName} (${currency}). Environment variable ${envVarName} is not set.`);
    return null;
  }
  
  return planId.trim();
}

/**
 * Get all Flutterwave plan IDs for a given plan (both NGN and USD)
 * @param {string} planName - Plan name (drift, wave, tide, surge)
 * @returns {Object} Object with ngn and usd plan IDs
 */
function getAllFlutterwavePlanIds(planName) {
  return {
    ngn: getFlutterwavePlanId(planName, 'NGN'),
    usd: getFlutterwavePlanId(planName, 'USD')
  };
}

/**
 * Validate that all required Flutterwave plan IDs are set
 * @returns {Object} Validation result with missing plans
 */
function validateFlutterwavePlanIds() {
  const plans = ['drift', 'wave', 'tide', 'surge'];
  const currencies = ['NGN', 'USD'];
  const missing = [];
  
  for (const plan of plans) {
    for (const currency of currencies) {
      const planId = getFlutterwavePlanId(plan, currency);
      if (!planId) {
        missing.push(`FLW_PLAN_ID_${plan.toUpperCase()}_${currency}`);
      }
    }
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
}

module.exports = {
  getFlutterwavePlanId,
  getAllFlutterwavePlanIds,
  validateFlutterwavePlanIds
};
