/**
 * Simple password authentication middleware
 * Checks for password in header, query, or body
 */
const passwordAuth = (req, res, next) => {
  // Get password from different sources
  const password = 
    req.headers['x-admin-password'] || 
    req.query.password || 
    req.body.password;

  // Check if password matches
  if (password === process.env.ADMIN_PASSWORD) {
    return next();
  }

  // Unauthorized response
  return res.status(401).json({
    success: false,
    message: 'Unauthorized. Invalid admin password.'
  });
};

module.exports = passwordAuth;
