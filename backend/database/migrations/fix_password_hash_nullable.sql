-- Allow NULL password_hash for Microsoft 365 users (no password)
ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;
