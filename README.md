# Attendance & Center Management System 🚀

An enterprise-grade, production-ready educational center management system. Designed for high speed, reliability, and ease of use, featuring offline-capable PWA capabilities, high-performance QR scanning, and robust payment tracking.

## 🌟 Features

- **Blazing Fast QR Attendance:** Sub-second scanning with audio/visual feedback, designed to handle hundreds of students efficiently.
- **Comprehensive Student Management:** Detailed profiles, strict validation, and archive capabilities.
- **Student Portal:** A dedicated space for students to view their attendance, payment history, and download their dynamic ID card.
- **Advanced Printing System:** Generate and export pixel-perfect, highly customized PDF student cards in bulk.
- **Financial Tracking:** Robust payment tracking (Generations, Paid/Partial/Unpaid states).
- **Internationalization:** Full RTL Arabic support.
- **Secure & Role-Based:** Distinguishes between Admin and Assistant roles for safe delegation.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite (via Prisma ORM)
- **Styling:** Tailwind CSS + Shadcn UI
- **QR Engine:** html5-qrcode
- **PDF Generation:** React-to-PDF / jsPDF
- **Icons:** Lucide React

## 📂 Architecture & Folder Structure

The project follows a strict domain-driven architecture:

```text
app/                 # Next.js App Router (Pages, Layouts, API Routes)
components/          # Reusable React components separated by domain
  ├── attendance/
  ├── students/
  ├── payments/
  ├── shared/        # Highly reusable components (buttons, search, tables)
  └── ui/            # Shadcn base components
actions/             # Next.js Server Actions grouped by domain
lib/                 # Core utilities, constants, validators, and Prisma client
types/               # Centralized TypeScript definitions
docs/                # Extensive project documentation
scripts/             # Maintenance and diagnostic scripts
```

## 🚀 Installation & Getting Started

1. **Clone & Install Dependencies**
   ```bash
   git clone <repo_url>
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secret-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔐 Authentication & Roles

Authentication is handled via custom JWT tokens stored in HTTP-only cookies.
- **Admin**: Has full destructive rights and can view financial reports.
- **Assistant**: Restricted to operational duties (taking attendance, recording payments).
- **Student**: Accessed via mobile number and ID, isolated to the `/student` portal.

## 📦 Deployment

Optimized for Vercel. 
Ensure `NEXT_PUBLIC_APP_URL` is set to your production domain.
Run the pre-flight check before deployment:
```bash
npm run build
```

## 📝 Troubleshooting & FAQ

- **QR Scanner Not Working?** Ensure the site is served over HTTPS (camera API requirement).
- **Build Failing on Vercel?** Verify that all `import` statements correctly resolve to the refactored domain folders in `components/` and `actions/`.

## 📜 License & Credits

Proprietary Software. Developed for strict educational center management. 
