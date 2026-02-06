/**
 * Microsoft Authentication Library (MSAL) configuration
 * For organization-only sign-in with Microsoft 365 / Entra ID
 */

import type { Configuration } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || 'common';
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || `${window.location.origin}`;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    // Enable cookies for Safari/iOS cross-origin redirect support
    storeAuthStateInCookie: true,
  },
  system: {
    // Prevent MSAL from trying to use popups when in restricted contexts
    allowRedirectInIframe: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile'],
};

export const isMsalConfigured = Boolean(clientId && tenantId && tenantId !== 'common');
