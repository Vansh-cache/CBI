# Cache BI Platform - Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MySQL** (v8.0 or higher)
3. **npm** or **yarn**

## Installation Steps

### 1. Install Dependencies

From the root directory, run:

```bash
npm run install-all
```

This will install dependencies for:
- Root package (concurrently for running both servers)
- Backend (Express, MySQL, Socket.IO, etc.)
- Frontend (React, Material-UI, Recharts, etc.)

### 2. Database Setup

#### Create MySQL Database

```bash
mysql -u root -p
```

Then in MySQL:

```sql
CREATE DATABASE bi_platform;
EXIT;
```

#### Initialize Database Schema

```bash
cd backend
node database/initDatabase.js
```

This will:
- Create all required tables
- Insert default roles (admin, developer, viewer)
- Insert default permissions
- Create default admin user

**Default Admin Credentials:**
- Email: `admin@biplatform.com`
- Password: `Admin123!`

⚠️ **IMPORTANT:** Change these credentials in production!

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bi_platform
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:5173

# Microsoft 365 (organization-only sign-in)
AZURE_CLIENT_ID=your-application-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-client-secret
```

For the frontend, create `frontend/.env` with:
```
VITE_API_URL=http://localhost:5000
VITE_AZURE_CLIENT_ID=your-application-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

### 3a. Microsoft 365 Integration (Organization-Only Sign-In)

To restrict access to users from your Microsoft 365 organization:

1. Create an app registration in [Azure Portal](https://portal.azure.com) > Microsoft Entra ID > App registrations
2. Set **Supported account types** to "Accounts in this organizational directory only"
3. Add **Single-page application** redirect URI: `http://localhost:3000` (dev) or your production URL
4. Create a **Client secret** under Certificates & secrets
5. Add **API permissions**: `User.Read`, `openid` (Delegated), `User.Read.All` (Application) — grant admin consent
6. Run the database migration: `mysql -u root -p bi_platform < backend/database/migrations/add_azure_oid.sql`
7. Add your admin user: `INSERT INTO users (email, password_hash, first_name, last_name, role_id) VALUES ('admin@yourorg.com', NULL, 'Admin', 'User', 1);`
8. Sign in with Microsoft — the admin will be matched by email and `azure_oid` will be set

### 4. Create Upload Directory

```bash
mkdir -p backend/uploads
```

### 5. Start the Application

From the root directory:

```bash
npm run dev
```

This will start:
- **Backend server** on `http://localhost:5000`
- **Frontend app** on `http://localhost:3000`

Alternatively, start them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## First Login

1. Open `http://localhost:3000` in your browser
2. **With Microsoft 365**: Click "Sign in with Microsoft" (requires Azure app registration)
3. **Without Microsoft 365** (dev): Use default admin credentials:
   - Email: `admin@biplatform.com`
   - Password: `Admin123!`

## Application Structure

```
cache-bi-platform/
├── backend/
│   ├── controllers/      # Request handlers
│   ├── database/         # DB schema and connection
│   ├── middleware/       # Auth, RBAC, audit logging
│   ├── routes/           # API routes
│   ├── uploads/          # Excel file uploads
│   └── server.js         # Main server file
├── frontend/
│   ├── public/           # Static files
│   └── src/
│       ├── components/   # React components
│       ├── contexts/     # Auth & Socket contexts
│       ├── pages/        # Page components
│       └── utils/        # Utilities (API client)
└── README.md
```

## Features Overview

### Developer Mode
- Create and manage users
- Upload Excel files for visualization
- Build dashboards with multiple chart types
- Assign dashboards to users

### Viewer Mode
- View assigned dashboards
- Interact with filters
- Real-time updates

### Admin Panel
- Manage API data source configurations
- View audit logs
- System administration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user (Admin only)
- `POST /api/auth/login` - Sign in with Microsoft (sends `id_token`)
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Dashboards
- `GET /api/dashboards` - List dashboards
- `POST /api/dashboards` - Create dashboard
- `PUT /api/dashboards/:id` - Update dashboard
- `DELETE /api/dashboards/:id` - Delete dashboard
- `POST /api/dashboards/:id/assign` - Assign dashboard to user

### Data
- `POST /api/data/upload` - Upload Excel file
- `GET /api/data/datasets` - List datasets
- `GET /api/data/datasets/:id` - Get dataset data
- `POST /api/data/fetch-api` - Fetch data from API

### Admin
- `GET /api/admin/organization-users` - List Microsoft 365 org users (admin only)
- `POST /api/admin/organization-users/assign` - Assign org user to Cache BI with role
- `PUT /api/admin/organization-users/:id/role` - Update user role
- `GET /api/admin/api-configs` - List API configurations
- `POST /api/admin/api-configs` - Create API configuration
- `PUT /api/admin/api-configs/:id` - Update API configuration
- `DELETE /api/admin/api-configs/:id` - Delete API configuration
- `GET /api/admin/audit-logs` - Get audit logs

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check `.env` file has correct credentials
- Ensure database `bi_platform` exists

### Port Already in Use
- Change `PORT` in `backend/.env`
- Update `CORS_ORIGIN` if frontend port changes

### Excel Upload Fails
- Check file size (max 50MB)
- Ensure file is valid Excel (.xlsx, .xls) or CSV
- Check `backend/uploads` directory exists and is writable

### Socket.IO Connection Issues
- Verify backend is running
- Check CORS settings in `backend/server.js`
- Ensure token is valid

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Change `JWT_SECRET` to a strong random string
3. Update `CORS_ORIGIN` to your production domain
4. Use environment-specific database credentials
5. Enable HTTPS
6. Set up proper file storage (S3, etc.) instead of local uploads
7. Configure reverse proxy (nginx)
8. Set up process manager (PM2)
9. Enable database backups
10. Configure monitoring and logging

## Security Notes

- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days (configurable)
- Role-based access control enforced on backend
- SQL injection prevention via parameterized queries
- CORS configured for specific origins
- Rate limiting enabled
- Audit logging for all actions

## Support

For issues or questions, refer to the main README.md file.
