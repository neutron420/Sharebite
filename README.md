# ShareBite - Food Donation & Hunger Help Platform

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/products/r2/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)

ShareBite is a full-stack platform designed to bridge the gap between food donors (restaurants, hotels, event organizers) and NGOs/Volunteers. Our mission is to reduce food waste and ensure that surplus food reaches those who need it most.

---

## Features

### Role-Based Access Control
- **DONOR**: Post surplus food donations, manage listings, and approve pickup requests.
- **NGO**: Browse available food in real-time, request pickups, and track collected donations.
- **ADMIN**: Monitor platform activity, moderate users, and manage system health.

### Core Functionality
- **Real-time Donation Posting**: Donors can list food with quantity, category, and expiry data.
- **Geolocation Support**: Find nearby donations using precise latitude and longitude coordinates.
- **Media Support**: High-quality food images stored securely on Cloudflare R2.
- **Intuitive Lifecycle**: Track donations from AVAILABLE to REQUESTED to APPROVED to COLLECTED.
- **Review System**: Build community trust through peer-to-peer ratings and feedback.

---

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Hosted on [Neon](https://neon.tech/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: JWT-based Secure Auth
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (S3 Compatible)
- **Runtime**: [Bun](https://bun.sh/)

---

## Project Structure

```bash
├── app/               # Next.js App Router (Pages, Components, API)
├── prisma/            # Database Schema & Migrations
│   ├── schema.prisma  # Core Data Models
│   └── migrations/    # Versioned DB Changes
├── public/            # Static Assets
└── components/        # Reusable UI Components
```

---

## Getting Started

### 1. Prerequisites
Ensure you have [Bun](https://bun.sh/) installed on your machine.

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/sharebite.git
cd sharebite
```

### 3. Environment Setup
Create a .env file in the root directory and add your credentials:
```env
DATABASE_URL="your_postgresql_connection_string"
R2_BUCKET_NAME="your_bucket_name"
# Add other necessary keys here
```

### 4. Install Dependencies
```bash
bun install
```

### 5. Database Setup
```bash
bunx prisma generate
bunx prisma migrate dev
```

### 6. Run the Application
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Scalability Roadmap
- **PostGIS**: Advanced spatial queries for radius-based search.
- **Background Jobs**: Automated expiry status updates using Cron.
- **Real-time Notifications**: WebSockets for instant pickup request alerts.

---

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.
