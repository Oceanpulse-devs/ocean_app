const { SellersTable } = require('../../models');

/**
 * Get seller's country from userId
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Country name or null
 */
async function getSellerCountry(userId) {
  try {
    const seller = await SellersTable.findOne({
      where: { userId },
      attributes: ['country']
    });
    return seller?.country || null;
  } catch (error) {
    console.error('Error getting seller country:', error);
    return null;
  }
}

/**
 * Determine currency based on seller country
 * @param {string} userId - User ID
 * @returns {Promise<'NGN'|'USD'>} Currency code
 */
async function getSellerCurrency(userId) {
  const country = await getSellerCountry(userId);
  
  if (!country) {
    return 'NGN'; // Default to NGN if country not found
  }
  
  const countryLower = country.toLowerCase().trim();
  
  // Check if Nigeria
  if (countryLower.includes('nigeria') || 
      countryLower.includes('ng') || 
      countryLower === 'ng' ||
      countryLower === 'naija' ||
      countryLower === 'nigerian') {
    return 'NGN';
  }
  
  // All other countries use USD
  return 'USD';
}

module.exports = {
  getSellerCountry,
  getSellerCurrency
};

