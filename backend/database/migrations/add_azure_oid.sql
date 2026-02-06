-- Add Microsoft Entra ID (Azure AD) support for organization-only sign-in
-- Run this migration before enabling Microsoft 365 auth

ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN azure_oid VARCHAR(36) NULL UNIQUE AFTER email;
CREATE INDEX idx_azure_oid ON users(azure_oid);
