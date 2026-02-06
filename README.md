# Cache BI Visualization Platform

A production-ready Cache BI visualization platform inspired by Power BI, built with React, Node.js, Express, and MySQL.

## Architecture

- **Frontend**: React with Material-UI
- **Backend**: Node.js + Express
- **Database**: MySQL
- **Real-time**: Socket.IO (WebSockets)
- **Authentication**: JWT with RBAC

## Features

### Developer Mode
- Create and manage users with roles (Admin/Developer/Viewer)
- Upload Excel files for data visualization
- Build dashboards with multiple chart types
- Add filters and slicers
- Assign dashboards to users with view/edit permissions

### Viewer Mode
- View assigned dashboards only
- Interact with filters and slicers
- Real-time updates when developers make changes

### Admin Panel
- Manage API data sources
- Configure endpoints, headers, tokens
- Enable/disable APIs
- Rotate tokens

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

3. Create MySQL database:
```bash
mysql -u root -p
CREATE DATABASE bi_platform;
```

4. Run database migrations:
```bash
cd backend
node scripts/initDatabase.js
```

5. Start the application:
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend app on http://localhost:3000

## Default Admin Credentials

After running the database initialization:
- Email: admin@biplatform.com
- Password: Admin123!

**⚠️ Change these credentials in production!**

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users (Admin/Developer)
- `POST /api/users` - Create user (Admin/Developer)
- `PUT /api/users/:id` - Update user (Admin/Developer)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Dashboards
- `GET /api/dashboards` - List dashboards (filtered by role)
- `POST /api/dashboards` - Create dashboard (Developer)
- `PUT /api/dashboards/:id` - Update dashboard (Developer)
- `DELETE /api/dashboards/:id` - Delete dashboard (Developer)
- `GET /api/dashboards/:id` - Get dashboard details

### Data
- `POST /api/data/upload` - Upload Excel file (Developer)
- `GET /api/data/datasets` - List datasets
- `GET /api/data/datasets/:id` - Get dataset data

### Admin
- `GET /api/admin/api-configs` - List API configurations
- `POST /api/admin/api-configs` - Create API configuration
- `PUT /api/admin/api-configs/:id` - Update API configuration
- `DELETE /api/admin/api-configs/:id` - Delete API configuration

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection prevention
- CORS configuration
- Rate limiting
- Audit logging

## License

Proprietary - Internal Use Only
