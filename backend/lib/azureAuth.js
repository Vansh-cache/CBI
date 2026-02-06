/**
 * Microsoft Entra ID (Azure AD) token validation
 * Validates ID tokens from MSAL.js for organization-only sign-in
 */

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 600000, // 10 min
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Validate Microsoft ID token and return decoded payload
 * @param {string} idToken - ID token from MSAL
 * @returns {Promise<{ oid: string, email?: string, name?: string, given_name?: string, family_name?: string }>}
 */
function validateMicrosoftToken(idToken) {
  return new Promise((resolve, reject) => {
    const clientId = process.env.AZURE_CLIENT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;

    if (!clientId || !tenantId) {
      return reject(new Error('Azure configuration missing: AZURE_CLIENT_ID, AZURE_TENANT_ID'));
    }

    const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    const audience = clientId;

    jwt.verify(idToken, getKey, {
      algorithms: ['RS256'],
      audience,
      issuer,
      ignoreExpiration: false,
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

module.exports = { validateMicrosoftToken };
