-- Cache BI Platform Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS bi_platform;
USE bi_platform;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSON NOT NULL COMMENT 'Dashboard configuration (widgets, layout, filters)',
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dashboard assignments (who can view/edit which dashboards)
CREATE TABLE IF NOT EXISTS dashboard_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dashboard_id INT NOT NULL,
    user_id INT NOT NULL,
    permission_type ENUM('view', 'edit') NOT NULL DEFAULT 'view',
    assigned_by INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (dashboard_id, user_id),
    INDEX idx_user (user_id),
    INDEX idx_dashboard (dashboard_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datasets table (for uploaded Excel data and API data)
CREATE TABLE IF NOT EXISTS datasets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type ENUM('excel', 'api') NOT NULL,
    source_config JSON COMMENT 'Configuration for data source (file path, API endpoint, etc.)',
    schema_definition JSON COMMENT 'Column definitions and data types',
    row_count INT DEFAULT 0,
    connection_status ENUM('connected', 'error', 'disconnected') DEFAULT NULL COMMENT 'Connection status for API data sources',
    last_error TEXT DEFAULT NULL COMMENT 'Last error message if connection failed',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_source_type (source_type),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dataset data table (stores actual data rows)
CREATE TABLE IF NOT EXISTS dataset_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT NOT NULL,
    row_data JSON NOT NULL COMMENT 'Stores row data as JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    INDEX idx_dataset (dataset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API configurations (for external API data sources)
CREATE TABLE IF NOT EXISTS api_configurations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    endpoint VARCHAR(500),
    method ENUM('GET', 'POST', 'PUT', 'DELETE') DEFAULT 'GET',
    headers JSON COMMENT 'Request headers including auth tokens',
    auth_type ENUM('none', 'bearer', 'api_key', 'basic') DEFAULT 'none',
    auth_config JSON COMMENT 'Authentication configuration',
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INT DEFAULT 60,
    timeout_ms INT DEFAULT 30000,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Excel upload metadata
CREATE TABLE IF NOT EXISTS excel_upload_metadata (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_dataset (dataset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INT,
    details JSON COMMENT 'Additional action details',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Full system access including user management and API configuration'),
('developer', 'Can create dashboards, upload data, and assign dashboards to users'),
('viewer', 'Can only view assigned dashboards')
ON DUPLICATE KEY UPDATE name=name;

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
('users.create', 'Create new users'),
('users.read', 'View users'),
('users.update', 'Update users'),
('users.delete', 'Delete users'),
('dashboards.create', 'Create dashboards'),
('dashboards.read', 'View dashboards'),
('dashboards.update', 'Update dashboards'),
('dashboards.delete', 'Delete dashboards'),
('dashboards.assign', 'Assign dashboards to users'),
('data.upload', 'Upload Excel files'),
('data.read', 'View datasets'),
('api.config', 'Manage API configurations'),
('audit.read', 'View audit logs')
ON DUPLICATE KEY UPDATE name=name;

-- Assign permissions to roles
-- Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Developer: Dashboard and data permissions (including API config read for fetching data)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN (
    'dashboards.create', 'dashboards.read', 'dashboards.update', 'dashboards.delete',
    'dashboards.assign', 'data.upload', 'data.read', 'users.read', 'api.config'
)
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Viewer: Read-only dashboard access and data reading (for viewing dashboards with API data)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN ('dashboards.read', 'data.read')
ON DUPLICATE KEY UPDATE role_id=role_id;
