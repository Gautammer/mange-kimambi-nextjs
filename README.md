# Mangekimambi Admin Panel

A Next.js implementation of the Mangekimambi content management and subscription platform, migrated from Laravel.

## Features

- 🔐 **Authentication System** - Secure login with encrypted API communication
- 📝 **Content Management** - Posts, categories, and media management
- 💳 **Payment Integration** - Stripe, PayPal, M-Pesa support
- 👥 **User Management** - Role-based access control
- 📱 **Mobile API Support** - Encrypted API endpoints for mobile apps
- 🏋️ **Health Tracking** - Food and workout logging
- 💬 **Social Features** - Comments, reactions, and polls
- 🔔 **Notifications** - Push notification support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **Authentication**: JWT with custom encryption
- **Payment**: Stripe, PayPal, M-Pesa integrations
- **State Management**: Zustand
- **API**: REST with encrypted payloads

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database (5.7+ or 8.0+)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd admin_panel
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials and API keys.

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database:
```bash
npm run prisma:seed
```

7. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
admin_panel/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── api/v1/            # API routes
│   └── dashboard/         # Protected pages
├── components/            # React components
│   ├── forms/            # Form components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
│   ├── crypto.ts         # Encryption/decryption
│   ├── auth.ts           # Authentication helpers
│   ├── prisma.ts         # Prisma client
│   └── api-helpers.ts    # API utilities
├── hooks/                 # Custom React hooks
├── prisma/                # Database schema
└── middleware.ts          # API middleware
```

## API Encryption

The API uses AES-256-CBC encryption for request/response data:

- **Encryption Key**: `x1e8a1c1cf412b27ecd7a87db49f830g`
- **IV**: `g9f051fdf0e6388x`

All API requests must include a client key in the header:
```
key: your-client-secret
```

## Default Credentials

After seeding the database:

- **Admin**: admin@mangekimambi.com / admin123
- **User**: testuser / password123

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with initial data
- `npm run prisma:studio` - Open Prisma Studio

## API Endpoints

### Authentication
- `POST /api/v1/login` - User login
- `POST /api/v1/register` - User registration

### Content (Protected)
- `GET /api/v1/posts` - Get all posts
- `POST /api/v1/submit_comment` - Submit comment
- `POST /api/v1/payment-subscription` - Process payment

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
