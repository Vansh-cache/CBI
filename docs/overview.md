# Cache BI Overview

Cache BI is a modern, web-based analytics and dashboard builder designed to give teams a Power BI-class authoring experience in a lightweight, self-hostable product. It combines a rich visual canvas, strong governance controls, and flexible data modeling so business and technical users can build, share, and manage dashboards faster.

## Project Status

**Production-Ready** - Cache BI is feature-complete for core dashboard building workflows:

| Component | Status |
|-----------|--------|
| Dashboard Builder | ✅ Complete |
| Chart Visualizations | ✅ Complete (17+ chart types) |
| Filters & Slicers | ✅ Complete |
| Bookmarks & State Management | ✅ Complete |
| Export (PNG, PDF, PowerPoint) | ✅ Complete |
| Undo/Redo System | ✅ Complete |
| Keyboard Shortcuts | ✅ Complete |
| Multi-page Reports | ✅ Complete |
| Mobile Layout Editor | ✅ Complete |
| Role-Based Access Control | ✅ Complete |
| Audit Logging | ✅ Complete |
| Microsoft 365 SSO | ✅ Complete |
| API Data Sources | ✅ Complete |
| Excel/CSV Upload | ✅ Complete |

## What the app does

Cache BI provides an end-to-end analytics workflow:

- **Dashboard builder**: Drag-and-drop visuals, snap-to-grid layout, resizing, alignment tools, multi-page reports, and mobile layouts.
- **Data modeling and fields**: Define fields and measures, bind them to visuals, and manage datasets across the app.
- **Interactive analytics**: Filters, slicers, bookmarks, drill navigation, and cross-filtering for exploratory analysis.
- **Formatting and styling**: A format pane for fine-grained visual controls and conditional formatting rules.
- **Export and sharing**: Export dashboards to PNG, PDF, or PowerPoint and enable quick sharing for stakeholders.
- **Administration and governance**: Role-based access control, audit logs, user management, and data source management.

## Business Justification: Why Cache BI Over Zoho Analytics

Even with an existing Zoho Analytics premium subscription, Cache BI provides strategic value for your organization:

### 1. Data Residency & Compliance Control
- **Self-hosting** keeps all data and access logs within your organization's boundaries
- Reduces compliance exposure and third-party vendor risk
- Full control over data retention, backup, and encryption policies

### 2. Governance You Own
- Role-based access, audit logs, and org-specific policies can be tailored to internal processes
- Not constrained by vendor defaults or feature gates
- Clear visibility into who accessed what data and when

### 3. Extensibility & Integration
- Add org-specific data sources, security rules, and workflows faster
- No waiting on vendor roadmaps for custom requirements
- Open codebase allows deep integration with internal systems

### 4. Predictable Long-Term Costs
- No per-seat or usage-based fees that scale unpredictably
- Infrastructure costs can be forecasted and controlled internally
- Avoids vendor price increases or licensing changes

### 5. Workflow-Optimized UX
- The builder can be optimized for how your teams actually work
- Power BI-class authoring experience with precision layout tools
- Reduced training and context-switching during dashboard creation

### 6. Strategic Independence
- Reduces vendor lock-in risk
- Supports future migration or multi-tool strategies
- IP remains within the organization

## How it compares to Zoho Analytics

| Capability | Cache BI | Zoho Analytics |
|------------|----------|----------------|
| Self-hosted deployment | ✅ Yes | ❌ SaaS only |
| Power BI-like authoring | ✅ Yes | ⚠️ Limited |
| Custom governance policies | ✅ Full control | ⚠️ Vendor-defined |
| Undo/redo with history | ✅ 50-state history | ⚠️ Basic |
| Multi-select alignment | ✅ Yes | ⚠️ Limited |
| Keyboard shortcuts | ✅ 20+ shortcuts | ⚠️ Basic |
| Per-seat licensing cost | ✅ None | ❌ Per-seat |
| Ecosystem lock-in | ✅ None | ⚠️ Zoho ecosystem |

### Where Zoho Analytics may still be a good fit

- **Turnkey SaaS**: Faster initial adoption for teams that don't need self-hosting
- **Zoho ecosystem**: Native integrations for organizations standardized on Zoho products

## Ideal users

- **Analytics teams** that need fast, precise dashboard authoring
- **Organizations with data residency or compliance constraints** that prefer self-hosted analytics
- **Product teams** building custom analytics experiences into their offerings
- **Enterprises** seeking to reduce vendor lock-in and control costs

## Key outcomes

- Faster dashboard creation with less layout friction
- Better governance for data access and auditing
- Greater flexibility for customization and deployment
- Predictable costs without per-seat licensing
- Strategic independence from SaaS vendors

---

## Technical Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO (real-time updates)
- **Database**: MySQL 8
- **Authentication**: JWT + Microsoft 365 SSO
- **Charts**: Recharts + custom Power BI-style components

## Supported Chart Types

1. Bar / Column charts
2. Stacked bar / column
3. 100% stacked bar / column
4. Line charts
5. Area charts
6. Pie / Donut charts
7. Scatter plots
8. Cards / KPIs
9. Tables / Matrix
10. Gauges
11. Waterfall charts
12. Funnel charts
13. Treemaps
14. Slicers (dropdown, list, date range)
15. Text boxes
16. Shapes
17. Images

## Supported Data Sources

- **File uploads**: Excel (.xlsx, .xls), CSV
- **API connections**: REST APIs with configurable headers, auth, and refresh schedules
- **Database connections**: MySQL (expandable to other databases)

## Getting Started

```bash
# Install dependencies
npm run install-all

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Initialize database
cd backend && node database/initDatabase.js

# Start development servers
npm run dev
```

Default admin credentials after initialization:
- Email: `admin@biplatform.com`
- Password: `Admin123!`

**Change these credentials in production!**
