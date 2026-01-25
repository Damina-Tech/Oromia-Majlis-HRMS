# Chiro HRMS Portal

A comprehensive Human Resource Management System (HRMS) built with modern web technologies. This system provides a complete solution for managing employees, attendance, payroll, leaves, assets, documents, and more.

## 🚀 Features

### Core Modules

- **👥 Employee Management** - Complete employee lifecycle management with profiles, documents, and organizational hierarchy
- **📅 Leave Management** - Leave requests, approvals, balances, and policy management with carry-over support
- **⏰ Attendance Tracking** - GPS-based check-in/check-out with location verification and work timer
- **💰 Payroll System** - Comprehensive payroll processing with salary grades, loans, advances, allowances, tax & pension
- **📊 Reports & Analytics** - Customizable reports and dashboard widgets for insights
- **📋 Task Management** - Task assignment, tracking, Kanban board, and time logging
- **📁 Document Management** - Template-based document generation, requests, and settings
- **🏢 Asset Management** - Asset tracking, assignments, maintenance, and disposal
- **💳 Expense Management** - Expense submission, approval workflows, and tracking
- **📢 Announcements** - Company-wide announcements with read tracking
- **🔔 Notifications** - Real-time notifications with preferences and delivery logs
- **📈 Dashboard** - Comprehensive dashboard with KPIs and analytics
- **🌐 Multi-language Support** - English, Oromo, and Amharic localization
- **🌓 Dark/Light Theme** - System-wide theme switching

### Security & Access Control

- **🔐 Role-Based Access Control (RBAC)** - Granular permissions system
- **👤 User Roles** - Admin, Manager, HR, Employee roles with different access levels
- **🔒 JWT Authentication** - Secure token-based authentication
- **🔑 Password Reset** - Secure password reset flow with email tokens
- **🌍 OAuth Integration** - Google and Facebook login support (configurable)

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **ShadCN UI** - Accessible component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **i18next** - Internationalization
- **next-themes** - Theme management
- **Axios** - HTTP client
- **Zustand** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe backend development
- **Prisma** - Modern ORM
- **PostgreSQL** - Relational database
- **Redis** - Caching and job queue
- **BullMQ** - Job queue management
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Zod** - Schema validation
- **Nodemailer** - Email sending
- **PDFKit** - PDF generation
- **Multer** - File uploads

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 16+
- **Redis** 7+ (for job queues and caching)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HRMS
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file (create .env based on your setup)
cp docker.env .env

# Update .env with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/chiro_hrms"
# REDIS_URL="redis://localhost:6379"
# JWT_SECRET="your-secret-key"
# FRONTEND_URL="http://localhost:5173"

# Run database migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed the database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
# Create .env file with:
# VITE_API_URL=http://localhost:3000

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Using Docker (Optional)

```bash
# Start PostgreSQL and Redis
cd backend
docker-compose up -d

# Then follow backend setup steps above
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chiro_hrms"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"

# Server
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:5173"

# Email (for notifications and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Location Services (for attendance)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
OFFICE_LATITUDE=9.1450
OFFICE_LONGITUDE=38.7617
OFFICE_RADIUS_METERS=100
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

## 📁 Project Structure

```
HRMS/
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── employees/    # Employee management
│   │   │   ├── attendance/   # Attendance tracking
│   │   │   ├── leaves/       # Leave management
│   │   │   ├── payroll/      # Payroll system
│   │   │   ├── tasks/        # Task management
│   │   │   ├── documents/    # Document management
│   │   │   ├── assets/        # Asset management
│   │   │   ├── expenses/     # Expense management
│   │   │   ├── reports/      # Reports & analytics
│   │   │   └── ...
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Utility functions
│   │   └── server.ts         # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── migrations/       # Database migrations
│   │   └── seed.ts           # Database seeding
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # ShadCN UI components
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service functions
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── i18n/            # Internationalization
│   │   └── types/           # TypeScript types
│   └── package.json
│
└── README.md
```

## 🔐 Default Test Credentials

See `TEST_CREDENTIALS.md` for test user credentials with different roles.

**Admin User:**
- Email: `admin@ciro.gov.et`
- Password: `Admin12345!`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

### Employee Management

- `GET /api/v1/employees` - List employees
- `POST /api/v1/employees` - Create employee
- `GET /api/v1/employees/:id` - Get employee details
- `PUT /api/v1/employees/:id` - Update employee
- `DELETE /api/v1/employees/:id` - Delete employee

### Attendance

- `POST /api/v1/attendance/check-in` - Check in
- `POST /api/v1/attendance/check-out` - Check out
- `GET /api/v1/attendance/today` - Get today's attendance
- `GET /api/v1/attendance` - List attendance records
- `GET /api/v1/attendance/stats` - Get attendance statistics

### Leave Management

- `GET /api/v1/leaves` - List leave requests
- `POST /api/v1/leaves` - Create leave request
- `PUT /api/v1/leaves/:id` - Update leave request
- `POST /api/v1/leaves/:id/approve` - Approve leave
- `POST /api/v1/leaves/:id/reject` - Reject leave
- `GET /api/v1/leave-balances` - Get leave balances
- `GET /api/v1/leave-policies` - List leave policies
- `POST /api/v1/leave-policies/renew` - Renew leave balances

### Payroll

- `GET /api/v1/payroll/runs` - List payroll runs
- `POST /api/v1/payroll/runs` - Create payroll run
- `GET /api/v1/payroll/salary-grades` - List salary grades
- `GET /api/v1/payroll/loans` - List loans
- `POST /api/v1/payroll/loans` - Create loan

For complete API documentation, refer to the API routes in `backend/src/routes/index.ts`

## 🧪 Testing

### Running Tests

```bash
# Backend tests (if available)
cd backend
npm test

# Frontend tests (if available)
cd frontend
npm test
```

## 🚢 Deployment

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ directory with a web server (nginx, Apache, etc.)
```

### Docker Deployment

See `backend/docker-compose.yml` for Docker configuration.

### cPanel Deployment

See `backend/CPANEL_DEPLOYMENT.md` and `frontend/CPANEL_DEPLOYMENT.md` for cPanel-specific deployment instructions.

## 🔧 Development

### Database Migrations

```bash
# Create a new migration
cd backend
npm run prisma:migrate

# Apply migrations in production
npm run prisma:migrate:deploy

# Reset database (development only)
npx prisma migrate reset
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code linting
- Prettier for code formatting (if configured)

## 📝 Key Features Explained

### Role-Based Access Control

The system implements a granular permission system:
- **Admin**: Full system access
- **Manager**: Department management and reporting
- **HR**: Employee and leave management
- **Employee**: Limited access to personal data and requests

### Attendance System

- GPS-based check-in/check-out
- Location verification (office vs remote)
- Automatic late detection
- Work timer tracking
- Attendance history and statistics

### Leave Management

- Multiple leave types (Annual, Sick, Casual, etc.)
- Leave policy configuration
- Automatic balance renewal
- Carry-over support
- Approval workflows

### Payroll System

- Salary grade management
- Loan and advance tracking
- Allowance configuration
- Tax and pension calculations
- Payslip generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

See `LICENSE` file for details.

## 🆘 Support

For issues, questions, or contributions, please open an issue on the repository.

## 📖 Additional Documentation

- `TEST_CREDENTIALS.md` - Test user credentials
- `backend/PAYROLL_SYSTEM.md` - Payroll system documentation
- `backend/EMAIL_SETUP.md` - Email configuration guide
- `backend/LOCATION_CONFIGURATION.md` - Location services setup
- `backend/README_MIGRATIONS.md` - Database migration guide
- `frontend/PAYROLL_FRONTEND_IMPLEMENTATION.md` - Frontend payroll docs

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with external payroll systems
- [ ] Biometric attendance support
- [ ] Advanced document workflow
- [ ] Multi-tenant support

---

**Built with ❤️ for Chiro Municipality**
