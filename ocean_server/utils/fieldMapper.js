/**
 * Field Mapper Utility
 * Transforms field names between frontend expectations and backend database structure
 * 
 * This utility handles:
 * - Request field name mapping (frontend → backend)
 * - Response field name mapping (backend → frontend)
 * - Nested object transformation
 * - Array transformations
 */

// ========================================
// FIELD MAPPINGS CONFIGURATION
// ========================================

const FIELD_MAPPINGS = {
  // Authentication & Login
  login: {
    response: {
      // Add missing fields that frontend expects
      addFields: ['profilePicture', 'username', 'bio', 'location', 'emailVerified']
    }
  },

  // Profile
  profile: {
    response: {
      // Rename root key from 'profileInfo' to 'user'
      rootKey: 'user', // Changes profileInfo to user
      addFields: ['emailVerified', 'phoneNumber', 'website', 'updatedAt']
    }
  },

  // Products
  products: {
    request: {
      // Accept both 'name' and 'title' for backward compatibility
      name: 'title',
      acceptBoth: ['name', 'title']
    },
    response: {
      title: 'name',
      // Wrap response in products array if needed
      wrapInArray: false // Controller handles this separately
    }
  },

  // Products List - Wrap in products key
  productsList: {
    response: {
      wrapKey: 'products' // Transform data from array to {products: [...]}
    }
  },

  // Feed Posts
  feedPosts: {
    response: {
      content: 'caption',
      type: 'category',
      // Transform images array to media array structure
      transformImages: true,
      // Transform pagination fields
      pagination: {
        currentPage: 'page',
        totalPosts: 'totalCount',
        hasPrevPage: 'hasPreviousPage'
      }
    }
  },

  // Distress Sales
  distressSales: {
    response: {
      title: 'productName'
    }
  },

  // Auctions
  auctions: {
    response: {
      startingPrice: 'startingBid',
      currentPrice: 'currentBid'
    }
  },

  // Group Buys / Bulk Purchases
  groupBuys: {
    response: {
      group_price: 'pricePerUnit',
      deadline: 'endDate'
    }
  },

  // Swap Deals
  swapDeals: {
    response: {
      productToSwap: 'myProductName'
    }
  },

  // Buyer Needs / Demand Posts
  buyerNeeds: {
    response: {
      title: 'caption'
    }
  },

  // Notifications
  notifications: {
    response: {
      message: 'body',
      // isRead stays as isRead (frontend expects this)
      metadata: 'data'
    }
  },

  // OTP Verification
  verifyResetCode: {
    request: {
      otp: 'resetCode', // Accept 'otp', map to 'resetCode'
      acceptBoth: ['otp', 'resetCode']
    }
  }
};

// ========================================
// TRANSFORMATION FUNCTIONS
// ========================================

/**
 * Transform request body from frontend field names to backend field names
 * @param {Object} data - Request body data
 * @param {String} mappingKey - Key from FIELD_MAPPINGS config
 * @returns {Object} - Transformed data with backend field names
 */
function mapRequestFields(data, mappingKey) {
  if (!data || typeof data !== 'object') return data;
  if (!FIELD_MAPPINGS[mappingKey]?.request) return data;

  const mapping = FIELD_MAPPINGS[mappingKey].request;
  const transformed = { ...data };

  // Handle acceptBoth - accept multiple field names and map to one
  if (mapping.acceptBoth) {
    for (const field of mapping.acceptBoth) {
      if (transformed[field] !== undefined) {
        const targetField = mapping[field];
        if (targetField) {
          transformed[targetField] = transformed[field];
          if (field !== targetField) {
            delete transformed[field];
          }
        }
      }
    }
  }

  // Standard field mapping
  Object.keys(transformed).forEach(key => {
    if (mapping[key] && key !== 'acceptBoth') {
      transformed[mapping[key]] = transformed[key];
      if (key !== mapping[key]) {
        delete transformed[key];
      }
    }
  });

  return transformed;
}

/**
 * Transform response data from backend field names to frontend field names
 * @param {Object} data - Response data
 * @param {String} mappingKey - Key from FIELD_MAPPINGS config
 * @returns {Object} - Transformed data with frontend field names
 */
function mapResponseFields(data, mappingKey) {
  if (!data || typeof data !== 'object') return data;
  if (!FIELD_MAPPINGS[mappingKey]?.response) return data;

  const mapping = FIELD_MAPPINGS[mappingKey].response;
  let transformed = { ...data };

  // Handle root key rename (e.g., profileInfo → user)
  if (mapping.rootKey && transformed[mapping.rootKey]) {
    const rootData = transformed[mapping.rootKey];
    delete transformed[mapping.rootKey];
    transformed = { ...transformed, ...rootData };
  }

  // Handle array wrapping (e.g., data → {products: data})
  if (mapping.wrapKey && Array.isArray(transformed)) {
    transformed = { [mapping.wrapKey]: transformed };
  }

  // Add missing fields
  if (mapping.addFields) {
    mapping.addFields.forEach(field => {
      if (!transformed[field] && transformed[field] !== false) {
        transformed[field] = null;
      }
    });
  }

  // Standard field mapping
  Object.keys(mapping).forEach(key => {
    if (transformed[key] !== undefined && key !== 'rootKey' && key !== 'wrapKey' && key !== 'addFields' && key !== 'transformImages' && key !== 'pagination') {
      transformed[mapping[key]] = transformed[key];
      if (key !== mapping[key]) {
        delete transformed[key];
      }
    }
  });

  // Handle nested transformations
  if (transformed.pagination && mapping.pagination) {
    transformed.pagination = mapNestedFields(transformed.pagination, mapping.pagination);
  }

  // Handle images → media transformation for posts
  if (mapping.transformImages && Array.isArray(transformed.images)) {
    transformed.media = transformed.images.map((url, index) => ({
      id: `media_${Date.now()}_${index}`,
      type: 'image',
      url: url,
      thumbnailUrl: url
    }));
    delete transformed.images;
  }

  return transformed;
}

/**
 * Transform array of items (for lists)
 * @param {Array} array - Array of objects to transform
 * @param {String} mappingKey - Key from FIELD_MAPPINGS config
 * @returns {Array} - Transformed array
 */
function mapArrayFields(array, mappingKey) {
  if (!Array.isArray(array)) return array;
  return array.map(item => mapResponseFields(item, mappingKey));
}

/**
 * Map nested fields (for pagination, etc.)
 * @param {Object} data - Nested object data
 * @param {Object} mapping - Mapping configuration
 * @returns {Object} - Transformed nested object
 */
function mapNestedFields(data, mapping) {
  const transformed = { ...data };
  
  Object.keys(mapping).forEach(key => {
    if (transformed[key] !== undefined) {
      transformed[mapping[key]] = transformed[key];
      if (key !== mapping[key]) {
        delete transformed[key];
      }
    }
  });

  return transformed;
}

/**
 * Wrap products list in proper structure
 * @param {Object} response - Current response object
 * @returns {Object} - Wrapped response with products key
 */
function wrapProductsList(response) {
  if (response.data && Array.isArray(response.data) && response.data.length > 0) {
    return {
      ...response,
      data: {
        products: response.data,
        pagination: response.pagination
      }
    };
  }
  return response;
}

/**
 * Map entire response object for specific endpoints
 * @param {Object} responseData - Full response object
 * @param {String} mappingKey - Key from FIELD_MAPPINGS config
 * @returns {Object} - Completely transformed response
 */
function mapFullResponse(responseData, mappingKey) {
  if (!responseData || typeof responseData !== 'object') return responseData;

  let mapped = { ...responseData };

  // Special handling for data object
  if (mapped.data) {
    // If data is an array, map each item
    if (Array.isArray(mapped.data)) {
      mapped.data = mapArrayFields(mapped.data, mappingKey);
      
      // Special case: products list wrapping
      if (mappingKey === 'productsList') {
        mapped = wrapProductsList(mapped);
      }
    } 
    // If data is an object, map it
    else if (typeof mapped.data === 'object') {
      mapped.data = mapResponseFields(mapped.data, mappingKey);
    }
  }

  // Handle posts with stories in feed
  if (mapped.data?.posts) {
    mapped.data.posts = mapped.data.posts.map(post => {
      const mappedPost = mapResponseFields(post, 'feedPosts');
      // Handle nested pagination if it exists
      if (mappedPost.pagination) {
        mappedPost.pagination = mapNestedFields(mappedPost.pagination, FIELD_MAPPINGS.feedPosts.response.pagination);
      }
      return mappedPost;
    });
  }

  return mapped;
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  mapRequestFields,
  mapResponseFields,
  mapArrayFields,
  mapFullResponse,
  mapNestedFields,
  wrapProductsList,
  FIELD_MAPPINGS // Export for reference
};

