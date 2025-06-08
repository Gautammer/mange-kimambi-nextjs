# Mangekimambi Laravel to Next.js Migration Documentation

## AI Implementation Guide
This document is structured to enable AI assistants to recreate the entire application. Each section contains implementation-ready code and specific instructions.

## Table of Contents
1. [Quick Start Implementation](#quick-start)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Database Schema with Prisma Models](#database-schema)
5. [API Implementation Guide](#api-structure)
6. [Core Features Implementation](#core-features)
7. [Authentication Implementation](#authentication-authorization)
8. [Payment Integration Code](#payment-integration)
9. [Media & File Handling](#media-file-handling)
10. [Complete Next.js Architecture](#nextjs-architecture)

## Quick Start Implementation

### Step 1: Initialize Next.js Project
```bash
npx create-next-app@latest mangekimambi --typescript --tailwind --app
cd mangekimambi
```

### Step 2: Install Required Dependencies
```bash
# Core dependencies
npm install @prisma/client prisma @next-auth/prisma-adapter next-auth
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next
npm install zod zustand @tanstack/react-query
npm install stripe @stripe/stripe-js react-stripe-js
npm install @paypal/react-paypal-js
npm install sharp multer cloudinary uploadthing
npm install crypto-js jsonwebtoken bcryptjs
npm install axios react-hook-form
npm install date-fns react-hot-toast
npm install @radix-ui/react-* # Install all Radix UI components

# Dev dependencies
npm install -D @types/crypto-js @types/bcryptjs @types/multer
```

### Step 3: Environment Variables (.env.local)
```env
# Database
DATABASE_URL="your-database-url"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret"

# Encryption (MUST match Laravel values)
ENCRYPTION_KEY="x1e8a1c1cf412b27ecd7a87db49f830g"
ENCRYPTION_IV="g9f051fdf0e6388x"

# Payment Gateways
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
MPESA_CONSUMER_KEY=""
MPESA_CONSUMER_SECRET=""
MPESA_PASSKEY=""
MPESA_SHORTCODE=""

# File Storage
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Push Notifications
FCM_SERVER_KEY=""
```

## Project Overview

Mangekimambi is a content management and subscription-based platform built with Laravel. The application appears to be a social media/content platform with the following key features:

- User authentication and management
- Content posting (posts, videos, polls)
- Subscription-based access
- Payment processing (PayPal, Stripe, Vodacom M-Pesa, Selcom)
- Social features (comments, reactions, post viewing)
- Food and workout tracking
- Admin panel for content moderation

## Technology Stack

### Current Laravel Stack
- **Framework**: Laravel 8.x
- **PHP**: 7.3+ or 8.0+
- **Authentication**: Laravel Passport (OAuth2)
- **Authorization**: Laratrust (Role-based permissions)
- **Image Processing**: Intervention Image
- **Payment Gateways**: 
  - PayPal SDK
  - Stripe PHP SDK
  - Custom Vodacom M-Pesa integration
  - Selcom integration
- **Database**: MySQL/MariaDB (assumed from migrations)
- **Frontend**: Laravel UI (Bootstrap-based)

### Recommended Next.js Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js or Clerk
- **Database ORM**: Prisma or Drizzle
- **State Management**: Zustand or Redux Toolkit
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Payment Processing**: 
  - Stripe SDK for React
  - PayPal React SDK
  - Custom integrations for M-Pesa/Selcom
- **Image Processing**: Sharp + Uploadthing or Cloudinary
- **API**: tRPC or REST with Next.js API routes

## Database Schema with Prisma Models

### Implementation Instructions
Create `prisma/schema.prisma` file with the following complete schema:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "mysql" based on your choice
  url      = env("DATABASE_URL")
}

// Enums
enum Gender {
  Female
  Male
}

enum LoginStatus {
  Allow
  Restrict
}

enum UserStatus {
  Active
  Banned
}

enum Platform {
  Web
  App
}

enum PostStatus {
  Draft
  Published
  Ban
}

enum VideoSegment {
  Yes
  No
}

enum SubscriptionStatus {
  true
  false
}

// Main User Model
model User {
  id                      BigInt      @id @default(autoincrement())
  enteredById             BigInt?
  countryId               BigInt?
  bannedById              BigInt?
  commentBannedById       BigInt?
  name                    String?
  verifyCode              String?
  username                String      @unique
  email                   String?     @unique
  address                 String?
  phone                   String?
  img                     String      @default("user.png")
  imgUrl                  String?
  gender                  Gender?
  login                   LoginStatus @default(Allow)
  status                  UserStatus  @default(Active)
  commentStatus           UserStatus  @default(Active)
  platform                Platform    @default(Web)
  emailVerifiedAt         DateTime?
  password                String
  description             String?     @db.Text
  bannedReason            String?     @db.Text
  notificationToken       String?
  rememberToken           String?
  isSubscribed            SubscriptionStatus @default(false)
  isVerified              SubscriptionStatus @default(false)
  endOfSubscriptionDate   DateTime?
  webLogTime              DateTime?
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt
  deletedAt               DateTime?

  // Relations
  country                 Country?    @relation(fields: [countryId], references: [id])
  bannedBy                Admin?      @relation("BannedUsers", fields: [bannedById], references: [id])
  commentBannedBy         Admin?      @relation("CommentBannedUsers", fields: [commentBannedById], references: [id])
  enteredBy               User?       @relation("EnteredUsers", fields: [enteredById], references: [id])
  enteredUsers            User[]      @relation("EnteredUsers")
  
  posts                   Post[]      @relation("UserPosts")
  comments                Comment[]
  reactions               Reaction[]
  payments                Payment[]
  devices                 UserDevice[]
  screenshots             Screenshot[]
  foods                   Food[]
  workouts                Workout[]
  customSubscriptions     CustomSubscription[]
  feedbacks               Feedback[]
  postViewers             PostViewer[]
  polls                   Poll[]
  subscribers             Subscriber[]
  oauthAccessTokens       OauthAccessToken[]
  
  // Role relations
  roles                   RoleUser[]
  permissions             PermissionUser[]

  @@index([username])
  @@index([email])
  @@index([isSubscribed])
}

// Post Model
model Post {
  id                BigInt      @id @default(autoincrement())
  authorId          BigInt?
  name              String?
  featuredImage     String?
  status            PostStatus  @default(Draft)
  isVideoSegment    VideoSegment @default(No)
  content           String?     @db.Text
  publishedAt       DateTime?
  notificationId    String?
  deletedBy         BigInt?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  deletedAt         DateTime?

  // Relations
  author            Admin?      @relation(fields: [authorId], references: [id])
  categories        PostCategory[]
  media             Media[]
  comments          Comment[]
  reactions         Reaction[]
  postViewers       PostViewer[]
  pollOptions       PollOption[]

  @@index([status])
  @@index([publishedAt])
}

// Category Model
model Category {
  id                BigInt      @id @default(autoincrement())
  enteredById       BigInt?
  name              String
  img               String?
  status            UserStatus  @default(Active)
  arrangement       Int?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  deletedAt         DateTime?

  // Relations
  enteredBy         Admin?      @relation(fields: [enteredById], references: [id])
  posts             PostCategory[]

  @@index([status])
}

// PostCategory Pivot Model
model PostCategory {
  id                BigInt      @id @default(autoincrement())
  postId            BigInt
  categoryId        BigInt
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  post              Post        @relation(fields: [postId], references: [id])
  category          Category    @relation(fields: [categoryId], references: [id])

  @@unique([postId, categoryId])
}

// Comment Model
model Comment {
  id                BigInt      @id @default(autoincrement())
  postId            BigInt?
  userId            BigInt?
  comment           String      @db.Text
  belongType        String
  belongId          BigInt
  enteredById       BigInt?
  name              String?
  isVerified        SubscriptionStatus?
  userImgUrl        String?
  content           String?     @db.Text
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  deletedAt         DateTime?

  // Relations
  post              Post?       @relation(fields: [postId], references: [id])
  user              User?       @relation(fields: [userId], references: [id])
  reactions         Reaction[]
  emojis            CommentEmoji[]
  replies           Comment[]   @relation("CommentReplies")
  parentComment     Comment?    @relation("CommentReplies", fields: [belongId], references: [id])
  media             CommentMedia[]

  @@index([postId])
  @@index([userId])
}

// Media Model
model Media {
  id                BigInt      @id @default(autoincrement())
  filePath          String
  type              String
  belongType        String
  belongId          BigInt
  enteredById       BigInt?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Polymorphic relations
  post              Post?       @relation(fields: [belongId], references: [id])
  feedback          Feedback?   @relation(fields: [belongId], references: [id])

  @@index([belongType, belongId])
}

// Payment Model
model Payment {
  id                BigInt      @id @default(autoincrement())
  userId            BigInt
  orderId           String?
  transid           String?
  reference         String?     @unique
  channel           String?
  result            String?
  phone             String?
  amount            Decimal     @db.Decimal(10, 2)
  currency          String
  paymentStatus     String
  startDate         DateTime
  endDate           DateTime
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  user              User        @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([orderId])
  @@index([reference])
}

// Reaction Model
model Reaction {
  id                BigInt      @id @default(autoincrement())
  userId            BigInt
  postId            BigInt?
  emojiId           BigInt?
  belongType        String
  belongId          BigInt
  name              String?
  react             String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  user              User        @relation(fields: [userId], references: [id])
  post              Post?       @relation(fields: [postId], references: [id])
  emoji             Emoji?      @relation(fields: [emojiId], references: [id])
  comment           Comment?    @relation(fields: [belongId], references: [id])

  @@index([userId])
  @@index([postId])
  @@unique([userId, belongType, belongId])
}

// Continue with remaining models...
```

### Complete Prisma Schema (Part 2)
```prisma
// Admin Model
model Admin {
  id                BigInt      @id @default(autoincrement())
  enteredById       BigInt?
  countryId         BigInt?
  name              String
  email             String      @unique
  address           String?
  phone             String?
  img               String      @default("user.png")
  imgUrl            String?
  login             LoginStatus @default(Allow)
  emailVerifiedAt   DateTime?
  password          String
  description       String?     @db.Text
  rememberToken     String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  deletedAt         DateTime?

  // Relations
  country           Country?    @relation(fields: [countryId], references: [id])
  bannedUsers       User[]      @relation("BannedUsers")
  commentBannedUsers User[]     @relation("CommentBannedUsers")
  posts             Post[]
  categories        Category[]
  emojis            Emoji[]
  customSubscriptions CustomSubscription[]

  // Role relations
  roles             RoleUser[]
  permissions       PermissionUser[]
}

// Emoji Model
model Emoji {
  id                BigInt      @id @default(autoincrement())
  name              String?
  type              String?
  img               String?
  imgUrl            String?
  enteredById       BigInt?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  enteredBy         Admin?      @relation(fields: [enteredById], references: [id])
  reactions         Reaction[]
  commentEmojis     CommentEmoji[]
}

// Food Model
model Food {
  id                BigInt      @id @default(autoincrement())
  userId            BigInt?
  name              String?
  calories          Float?
  protein           Float?
  fat               Float?
  carbs             Float?
  date              DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  user              User?       @relation(fields: [userId], references: [id])
}

// Workout Model
model Workout {
  id                BigInt      @id @default(autoincrement())
  userId            BigInt?
  name              String?
  caloriesBurned    Float?
  duration          Int?
  date              DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  user              User?       @relation(fields: [userId], references: [id])
}

// Poll Model
model Poll {
  id                BigInt      @id @default(autoincrement())
  pollId            BigInt
  pollOptionId      BigInt
  userId            BigInt
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  user              User        @relation(fields: [userId], references: [id])
  option            PollOption  @relation(fields: [pollOptionId], references: [id])

  @@unique([pollId, userId])
}

// PollOption Model
model PollOption {
  id                BigInt      @id @default(autoincrement())
  pollId            BigInt
  options           String
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  post              Post        @relation(fields: [pollId], references: [id])
  polls             Poll[]
}

// Additional Models...
model Country {
  id                BigInt      @id @default(autoincrement())
  name              String
  dialCode          String?
  code              String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  users             User[]
  admins            Admin[]
}

model UserDevice {
  id                BigInt      @id @default(autoincrement())
  userId            BigInt?
  status            UserStatus  @default(Active)
  sessionId         String?
  osName            String?
  osVersion         String?
  browserName       String?
  browserVersion    String?
  navigatorUserAgent String?    @db.Text
  navigatorAppVersion String?   @db.Text
  navigatorPlatform String?     @db.Text
  navigatorVendor   String?     @db.Text
  ip                String?
  countryName       String?
  countryCode       String?
  regionCode        String?
  regionName        String?
  cityName          String?
  zipCode           String?
  isoCode           String?
  postalCode        String?
  latitude          String?
  longitude         String?
  areaCode          String?
  metroCode         String?
  logoutTime        DateTime?
  googleLat         String?
  googleLong        String?
  googleStreet      String?
  googleRegion      String?
  googleDistrict    String?
  googleCity        String?
  googleCountry     String?
  locationRequest   String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  user              User?       @relation(fields: [userId], references: [id])
}

// Role-based access control models
model Role {
  id                BigInt      @id @default(autoincrement())
  name              String      @unique
  displayName       String?
  description       String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  users             RoleUser[]
  permissions       PermissionRole[]
}

model Permission {
  id                BigInt      @id @default(autoincrement())
  name              String      @unique
  displayName       String?
  description       String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  roles             PermissionRole[]
  users             PermissionUser[]
}

// Pivot tables
model RoleUser {
  roleId            BigInt
  userId            BigInt
  userType          String
  
  role              Role        @relation(fields: [roleId], references: [id])
  user              User        @relation(fields: [userId], references: [id])

  @@id([roleId, userId])
}

model PermissionRole {
  permissionId      BigInt
  roleId            BigInt
  
  permission        Permission  @relation(fields: [permissionId], references: [id])
  role              Role        @relation(fields: [roleId], references: [id])

  @@id([permissionId, roleId])
}

model PermissionUser {
  permissionId      BigInt
  userId            BigInt
  userType          String
  
  permission        Permission  @relation(fields: [permissionId], references: [id])
  user              User        @relation(fields: [userId], references: [id])

  @@id([permissionId, userId])
}

// Other models...
model Screenshot {
  id                BigInt      @id @default(autoincrement())
  userId            BigInt?
  date              DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  user              User?       @relation(fields: [userId], references: [id])
}

model Feedback {
  id                BigInt      @id @default(autoincrement())
  enteredById       BigInt?
  name              String?
  description       String?     @db.Text
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  user              User?       @relation(fields: [enteredById], references: [id])
  media             Media[]
}

model SysConfig {
  id                BigInt      @id @default(autoincrement())
  systemName        String      @default("")
  systemTitle       String      @default("Mange Kimambi")
  logoWords         String      @default("Mange Kimambi")
  systemDescription String      @default("Mange Kimambi")
  userDefaultPass   String      @default("456123")
  appVersion        String?
  appStatus         String      @default("production")
  appType           String      @default("Paid")
  youtubeVideo      String?
  // Add other fields as needed
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

// Additional tables
model Subscriber {
  id                        BigInt      @id @default(autoincrement())
  userId                    String?
  orderId                   String?
  name                      String?
  msisdn                    String?
  thirdPartyConversationId  String?
  transactionReference      String?
  amount                    String?
  duration                  Int?
  status                    Int?
  message                   String?     @db.Text
  device                    String?
  fcmToken                  String?
  appVersion                String?
  createdAt                 DateTime    @default(now())
  updatedAt                 DateTime    @updatedAt

  user                      User?       @relation(fields: [userId], references: [id])
}

model CustomSubscription {
  id                BigInt      @id @default(autoincrement())
  userId            BigInt?
  adminId           BigInt?
  comment           String?     @db.Text
  days              Int
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  user              User?       @relation(fields: [userId], references: [id])
  admin             Admin?      @relation(fields: [adminId], references: [id])
}

model PostViewer {
  id                BigInt      @id @default(autoincrement())
  postId            BigInt?
  userId            BigInt?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  post              Post?       @relation(fields: [postId], references: [id])
  user              User?       @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
}

model CommentEmoji {
  id                BigInt      @id @default(autoincrement())
  commentId         BigInt
  emojiId           BigInt
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  comment           Comment     @relation(fields: [commentId], references: [id])
  emoji             Emoji       @relation(fields: [emojiId], references: [id])

  @@unique([commentId, emojiId])
}

model CommentMedia {
  id                BigInt      @id @default(autoincrement())
  file              String
  type              String
  commentId         BigInt
  commentType       String
  createdAt         DateTime    @default(now())

  comment           Comment     @relation(fields: [commentId], references: [id])
}

model OauthAccessToken {
  id                String      @id
  userId            BigInt?
  clientId          BigInt
  name              String?
  scopes            String?     @db.Text
  revoked           Boolean     @default(false)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  expiresAt         DateTime?

  user              User?       @relation(fields: [userId], references: [id])
}

model OauthClient {
  id                        BigInt      @id @default(autoincrement())
  userId                    BigInt?
  name                      String
  secret                    String      @unique
  provider                  String?
  redirect                  String      @db.Text
  personalAccessClient      Boolean     @default(false)
  passwordClient            Boolean     @default(false)
  revoked                   Boolean     @default(false)
  createdAt                 DateTime    @default(now())
  updatedAt                 DateTime    @updatedAt
}
```

### Database Setup Commands
```bash
# Initialize Prisma
npx prisma init

# After creating schema.prisma, generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

## Implementation Code

### 1. Encryption Utilities
Create `lib/crypto.ts`:

```typescript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'x1e8a1c1cf412b27ecd7a87db49f830g';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'g9f051fdf0e6388x';

export const encrypt = (data: any): string => {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(
    dataString,
    CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY),
    {
      iv: CryptoJS.enc.Utf8.parse(ENCRYPTION_IV),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );
  return encrypted.toString();
};

export const decrypt = (encryptedData: string): any => {
  try {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData,
      CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY),
      {
        iv: CryptoJS.enc.Utf8.parse(ENCRYPTION_IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Try to parse as JSON, if fails return as string
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Middleware for API routes
export const encryptResponse = (data: any) => {
  return {
    success: true,
    data: encrypt(data)
  };
};

export const encryptError = (message: string) => {
  return {
    success: false,
    message: encrypt(message)
  };
};
```

### 2. Authentication Setup
Create `lib/auth.ts`:

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { decrypt } from '@/lib/crypto';
import { User } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string | null;
      isSubscribed: boolean;
      isVerified: boolean;
      platform: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email/Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Decrypt credentials
        const email = decrypt(credentials.email);
        const password = decrypt(credentials.password);

        // Check if input is email or username
        const isEmail = email.includes('@');
        
        const user = await prisma.user.findFirst({
          where: isEmail 
            ? { email: email }
            : { username: email }
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Check if user is allowed to login
        if (user.login === 'Restrict') {
          throw new Error('Account restricted');
        }

        if (user.status === 'Banned') {
          throw new Error('Account banned');
        }

        // Update login status
        await prisma.user.update({
          where: { id: user.id },
          data: { login: 'Restrict' }
        });

        return {
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          isSubscribed: user.isSubscribed === 'true',
          isVerified: user.isVerified === 'true',
          platform: user.platform
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.isSubscribed = user.isSubscribed;
        token.isVerified = user.isVerified;
        token.platform = user.platform;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string | null;
        session.user.isSubscribed = token.isSubscribed as boolean;
        session.user.isVerified = token.isVerified as boolean;
        session.user.platform = token.platform as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error'
  }
};
```

### 3. API Route Implementation
Create `app/api/v1/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encrypt, decrypt, encryptResponse, encryptError } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate client key
    const clientKey = request.headers.get('key');
    if (!clientKey) {
      return NextResponse.json(encryptError('Client key required'), { status: 401 });
    }

    const client = await prisma.oauthClient.findUnique({
      where: { secret: clientKey }
    });

    if (!client) {
      return NextResponse.json(encryptError('Invalid client'), { status: 401 });
    }

    // Decrypt credentials
    const email = decrypt(body.email);
    const password = decrypt(body.password);

    if (!email || !password) {
      return NextResponse.json(encryptError('Invalid credentials'), { status: 401 });
    }

    // Check if input is email or username
    const isEmail = email.includes('@');
    
    const user = await prisma.user.findFirst({
      where: isEmail 
        ? { email: email }
        : { username: email },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        encryptError(`Invalid ${isEmail ? 'Email' : 'Username'} or Password`), 
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        encryptError(`Invalid ${isEmail ? 'Email' : 'Username'} or Password`), 
        { status: 401 }
      );
    }

    // Check subscription status
    if (user.endOfSubscriptionDate && new Date(user.endOfSubscriptionDate) < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isSubscribed: 'false',
          endOfSubscriptionDate: null
        }
      });
      user.isSubscribed = 'false';
    }

    // Update login status
    await prisma.user.update({
      where: { id: user.id },
      data: { login: 'Restrict' }
    });

    // Revoke existing tokens
    await prisma.oauthAccessToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true }
    });

    // Create new access token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        email: user.email
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '30d' }
    );

    // Save token to database
    await prisma.oauthAccessToken.create({
      data: {
        id: token,
        userId: user.id,
        clientId: client.id,
        name: 'appToken',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Check if app is free
    const sysConfig = await prisma.sysConfig.findFirst();
    let finalUser = user;
    
    if (sysConfig?.appType === 'Free') {
      finalUser = { ...user, isSubscribed: 'true' };
    }

    return NextResponse.json({
      success: true,
      token: encrypt({ token }),
      user: encrypt(finalUser)
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      encryptError('Server error occurred'), 
      { status: 500 }
    );
  }
}
```

### 4. Middleware for API Authentication
Create `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Paths that require authentication
const protectedPaths = [
  '/api/v1/get_data',
  '/api/v1/update_user',
  '/api/v1/submit_comment',
  '/api/v1/submit_likes',
  '/api/v1/get_all_post',
  '/api/v1/payment',
  // Add all protected routes
];

// Paths that require client key
const clientKeyPaths = [
  '/api/v1/login',
  '/api/v1/register',
  '/api/v1/verify_username',
  // Add all public API routes
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if path requires client key
  if (clientKeyPaths.some(path => pathname.startsWith(path))) {
    const clientKey = request.headers.get('key');
    
    if (!clientKey) {
      return NextResponse.json(
        { success: false, message: 'Client key required' },
        { status: 401 }
      );
    }

    // Validate client key in the route handler
  }

  // Check if path requires authentication
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      
      // Add user ID to request headers for use in route handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId.toString());
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 5. API Route Helper
Create `lib/api-helpers.ts`:

```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export function createApiResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
```

## API Structure

### Base URL Structure
```
/api/v1/
```

### Authentication Endpoints

#### 1. Login
- **POST** `/api/v1/login`
- **Body**: 
  ```json
  {
    "email": "encrypted_email_or_username",
    "password": "encrypted_password"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "token": "encrypted_token_object",
    "user": "encrypted_user_object"
  }
  ```

#### 2. Register
- **POST** `/api/v1/register`
- **Body**:
  ```json
  {
    "username": "encrypted_username",
    "password": "encrypted_password",
    "gender": "encrypted_gender",
    "email": "encrypted_email (optional)"
  }
  ```

#### 3. Password Recovery
- **POST** `/api/v1/password_recovery`
- **Body**:
  ```json
  {
    "email": "encrypted_email"
  }
  ```

### User Management Endpoints

#### 1. Get User Data
- **GET** `/api/v1/get_data` (Authenticated)
- Returns current user data with subscription status

#### 2. Update User Profile
- **POST** `/api/v1/update_user` (Authenticated)
- **Body**:
  ```json
  {
    "name": "encrypted_name",
    "address": "encrypted_address",
    "gender": "encrypted_gender",
    "email": "encrypted_email",
    "description": "encrypted_description",
    "img_url": "base64_encoded_image"
  }
  ```

#### 3. Change Password
- **POST** `/api/v1/change_password` (Authenticated)

#### 4. Email Verification
- **POST** `/api/v1/add_email_for_user` (Authenticated)
- **POST** `/api/v1/add_verification_for_user` (Authenticated)

### Content Endpoints

#### 1. Posts
- **GET** `/api/v1/get_all_post/{from}/{to}/{limit}` (Authenticated)
- **GET** `/api/v1/get_all_video/{from}/{to}/{limit}` (Authenticated)
- **GET** `/api/v1/get_all_post_by_categories/{from}/{to}/{limit}/{category_id}` (Authenticated)
- **GET** `/api/v1/get_post_by_id/{id}` (Authenticated)
- **POST** `/api/v1/search_post` (Authenticated)

#### 2. Categories
- **GET** `/api/v1/get_categories` (Authenticated)

#### 3. Comments & Reactions
- **POST** `/api/v1/submit_comment` (Authenticated)
- **GET** `/api/v1/get_post_comments/{id}` (Authenticated)
- **POST** `/api/v1/submit_likes` (Authenticated)
- **GET** `/api/v1/get_emoj` (Authenticated)

#### 4. Food & Workout Tracking
- **GET** `/api/v1/get_food/{date}` (Authenticated)
- **GET** `/api/v1/get_workout/{date}` (Authenticated)

#### 5. Polls
- **POST** `/api/v1/poll` (Authenticated)
- **Body**:
  ```json
  {
    "poll_id": "encrypted_poll_id",
    "poll_option_id": "encrypted_option_id"
  }
  ```

#### 6. Special Post Queries
- **GET** `/api/v1/get_post_custom/{id}/{category_id}/{status}/{count}` (Authenticated)
- Get posts with custom filters

### Payment Endpoints

#### 1. Payment Processing
- **POST** `/api/v1/payment-api` (Authenticated)
- **POST** `/api/v1/payment-subscription` (Authenticated)

#### 2. Webhooks
- **POST** `/api/webhock/selcom/{id}` (Public webhook)
- **POST** `/api/revenue-web-hook` (Public webhook)

### Utility Endpoints

#### 1. App Information
- **GET** `/api/v1/get_app_info` (Authenticated)
- Returns app version, status, and YouTube video

#### 2. Notification Token
- **POST** `/api/v1/submit_notification_token` (Authenticated)

#### 3. Web URL Generation
- **GET** `/api/v1/get_web_url` (Authenticated)
- Generates encrypted URL for web login

#### 4. User Screenshots
- **GET** `/api/v1/submit_user_screenshots` (Authenticated)
- Records user screenshot activity

#### 5. User Support/Feedback
- **POST** `/api/v1/user_support` (Authenticated)
- Submit feedback with optional media attachments

#### 6. Username Verification
- **GET** `/api/v1/verify_username/{name}` (Public with key header)
- Check if username is available

#### 7. Get User Data
- **GET** `/api/v1/get_user_data/{id}` (Public)
- Get specific user data by ID

#### 8. Update Email
- **POST** `/api/v1/update_my_email` (Authenticated)
- Update user email address

#### 9. Refresh Last Payment
- **GET** `/api/v1/refresh_last_payment` (Authenticated)
- Refresh user's last payment information

#### 10. Contact Information
- **GET** `/api/v1/contact` (Public with key header)
- Returns contact information

### Web Routes (Admin Panel & User Web Interface)

#### Authentication Routes
- **POST** `/login` - User login
- **POST** `/register` - User registration
- **POST** `/logout` - User logout
- **POST** `/password/reset` - Password reset request
- **POST** `/email_reset_password` - Email password reset
- **GET** `/get_recovery_password/{token}` - Password recovery page
- **GET** `/verify_email/{id}` - Email verification
- **GET** `/verify_username/{id}` - Username verification
- **GET** `/verify_phone/{id}` - Phone verification
- **GET** `/log_user_to_web/{user}/{time}` - Web login from app

#### Payment Routes (Web)
- **GET** `/payments` - List payments
- **POST** `/mobile_payments` - Mobile payment processing
- **POST** `/card_payments` - Card payment processing
- **POST** `/process_paypal` - PayPal payment processing
- **GET** `/processSuccess` - PayPal success callback
- **GET** `/processCancel` - PayPal cancel callback
- **POST** `/stripe` - Stripe payment
- **POST** `/stripeInfo` - Stripe payment info
- **GET** `/stripe-info/{id}` - Stripe payment details
- **POST** `/paymentIntent` - Stripe payment intent
- **POST** `/paymentStatus` - Stripe payment status

#### Admin Panel Routes (`/management`)

**Authentication:**
- **GET** `/management/login` - Admin login page
- **POST** `/management/login` - Admin login submission

**Dashboard & Management:**
- **GET** `/management/dashboard` - Admin dashboard
- **GET** `/management/admins` - Admin users management
- **GET** `/management/users` - User management
- **GET** `/management/sys_configs` - System configuration

**Content Management:**
- **Resource** `/management/post` - Post CRUD operations
- **Resource** `/management/categories` - Category CRUD operations
- **Resource** `/management/emojis` - Emoji CRUD operations
- **Resource** `/management/food` - Food CRUD operations
- **Resource** `/management/workouts` - Workout CRUD operations
- **GET** `/management/poll` - Poll management
- **POST** `/management/addPoll` - Add new poll

**User Management:**
- **GET** `/management/view_user_route/{id}` - View user details
- **POST** `/management/edit_user` - Edit user details
- **POST** `/management/block_user_submit` - Block/unban user
- **GET** `/management/remove_subscriptions/{id}` - Remove user subscription
- **GET** `/management/verify_status_sent/{id}/{status}` - Update verification status
- **GET** `/management/chenge_comment_banned_status/{id}/{status}` - Change comment ban status

**Reports & Analytics:**
- **GET** `/management/filter_users_report/{verification_type}/{subscription_type}/{status_type}/{screenshot_status}/{subscription_time}/{registered_time_range}` - User reports with filters
- **GET** `/management/complete_payments/{time}` - Completed payments report
- **GET** `/management/customs_subscriptions/{time}` - Custom subscriptions report
- **GET** `/management/screenshots_report/{time}` - Screenshots report
- **GET** `/management/new_subscriptions/{time}` - New subscriptions report

### External Webhooks

#### Vodacom M-Pesa
- **POST** `/v1/payments/m-pesa` - M-Pesa payment callback
- **GET** `/vodacom_web_verification/{user_id}/{orderId}` - Vodacom payment verification

#### Revenue Cat
- **POST** `/api/revenue-web-hook` - Revenue Cat webhook for subscription events

## API Response Format & Encryption

### Encryption Details
The API uses custom AES-256-CBC encryption for all request and response data:

```php
// Encryption parameters
$cipher = "aes-256-cbc"; 
$encryption_key = "x1e8a1c1cf412b27ecd7a87db49f830g";  
$iv = "g9f051fdf0e6388x";
```

### Request Format
All API requests must include:
1. **Header**: `key` - OAuth client secret for authentication
2. **Body**: All sensitive data must be encrypted using the above parameters

### Response Format
Standard success response:
```json
{
  "success": true,
  "data": "encrypted_data_string"
}
```

Standard error response:
```json
{
  "success": false,
  "message": "encrypted_error_message"
}
```

### Middleware
- **responsekey**: Validates client secret in header
- **auth:api**: Validates OAuth token for authenticated routes

## Core Features

### 1. User Authentication & Management
- **Encryption**: Custom AES-256-CBC encryption for API data
- **OAuth2**: Laravel Passport implementation
- **Multi-platform**: Support for Web and App platforms
- **User Status**: Active/Banned states
- **Verification**: Email and phone verification system

### 2. Content Management
- **Post Types**: Regular posts and video segments
- **Categories**: Hierarchical category system
- **Media**: Multiple media attachments per post
- **Status**: Draft, Published, Ban states
- **Reactions**: Custom emoji reactions system
- **Comments**: Nested comments with emoji support
- **View Tracking**: Post viewer analytics

### 3. Subscription System
- **Free/Paid Modes**: Configurable via SysConfig
- **Subscription Status**: Tracked per user
- **Auto-expiry**: Automatic subscription expiry handling
- **Payment Integration**: Multiple payment gateways

### 4. Social Features
- **User Profiles**: Customizable profiles with images
- **Following System**: User relationships
- **Notifications**: Push notification support
- **User Support**: Feedback system with media attachments

### 5. Health Tracking
- **Food Logging**: Calorie and macro tracking
- **Workout Tracking**: Exercise logging with calorie burn

## Authentication & Authorization

### Current Implementation
1. **Laravel Passport**: OAuth2 server implementation
2. **Token Management**: Personal access tokens with revocation
3. **Encryption Layer**: Custom encryption for all API data
4. **Role-Based Access**: Laratrust integration for permissions

### Next.js Migration Strategy
1. **JWT Implementation**:
   ```typescript
   // Use NextAuth.js with JWT strategy
   export default NextAuth({
     providers: [
       CredentialsProvider({
         // Custom login logic
       })
     ],
     session: {
       strategy: "jwt"
     },
     callbacks: {
       // Custom JWT and session callbacks
     }
   })
   ```

2. **Encryption Middleware**:
   ```typescript
   // Create custom middleware for data encryption/decryption
   export function encryptionMiddleware(handler: NextApiHandler) {
     return async (req: NextApiRequest, res: NextApiResponse) => {
       // Decrypt request data
       // Process request
       // Encrypt response data
     }
   }
   ```

## Payment Integration

### Current Payment Gateways

1. **PayPal**: Using srmklive/paypal package
2. **Stripe**: Direct Stripe PHP SDK
3. **Vodacom M-Pesa**: Custom integration
4. **Selcom**: Webhook-based integration

### Payment Flow
1. User initiates payment
2. Payment processed through gateway
3. Webhook confirms payment
4. Subscription updated based on amount
5. User gains access to premium content

### Next.js Implementation
```typescript
// Example Stripe integration
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

// Payment component
export function PaymentForm() {
  // Implement payment UI with Stripe Elements
}

// Webhook handler
export async function POST(req: Request) {
  // Verify webhook signature
  // Update user subscription
  // Return success response
}
```

## Media & File Handling

### Current Implementation
- **Image Upload**: Base64 encoding for profile images
- **Media Storage**: Local file system in public directory
- **Image Processing**: Intervention Image for manipulation
- **File Types**: Images, videos, documents

### Next.js Migration
1. **Cloud Storage**: Use AWS S3, Cloudinary, or Uploadthing
2. **Image Optimization**: Next.js Image component
3. **CDN Integration**: Automatic with cloud providers
4. **Progressive Upload**: Chunked uploads for large files

## Next.js Architecture Recommendations

### 1. Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── profile/
│   │   ├── posts/
│   │   ├── food-tracker/
│   │   └── workout/
│   ├── api/
│   │   ├── auth/
│   │   ├── posts/
│   │   ├── payments/
│   │   └── webhooks/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   └── layouts/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── crypto/
│   └── utils/
├── hooks/
├── types/
└── middleware.ts
```

### 2. Database Integration
```typescript
// Use Prisma for type-safe database access
// prisma/schema.prisma
model User {
  id                    BigInt      @id @default(autoincrement())
  username              String      @unique
  email                 String?     @unique
  password              String
  isSubscribed          Boolean     @default(false)
  subscriptionEndDate   DateTime?
  posts                 Post[]
  payments              Payment[]
  // ... other fields
}
```

### 3. API Design
```typescript
// Use tRPC for type-safe APIs
export const postRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      from: z.number(),
      to: z.number(),
      limit: z.number()
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
  
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    })
});
```

### 4. State Management
```typescript
// Use Zustand for global state
interface AppStore {
  user: User | null;
  setUser: (user: User | null) => void;
  subscription: SubscriptionStatus;
  updateSubscription: (status: SubscriptionStatus) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  subscription: 'free',
  updateSubscription: (subscription) => set({ subscription })
}));
```

### 5. Security Considerations
1. **Environment Variables**: Use `.env.local` for secrets
2. **CORS**: Configure properly for API access
3. **Rate Limiting**: Implement with Vercel Edge or custom middleware
4. **Input Validation**: Use Zod for schema validation
5. **SQL Injection**: Prevented by using Prisma ORM
6. **XSS Protection**: Built-in with React
7. **CSRF**: Implement token-based protection

### 6. Performance Optimizations
1. **Server Components**: Use for static content
2. **Client Components**: Only where interactivity needed
3. **Image Optimization**: Use Next.js Image component
4. **API Routes**: Implement caching strategies
5. **Database Queries**: Optimize with proper indexing
6. **Bundle Size**: Code splitting and lazy loading

### 7. Deployment Recommendations
1. **Platform**: Vercel (optimal for Next.js)
2. **Database**: PlanetScale, Supabase, or Neon
3. **File Storage**: AWS S3 or Cloudinary
4. **Monitoring**: Vercel Analytics + Sentry
5. **CI/CD**: GitHub Actions or Vercel Git integration

## Migration Checklist

### Phase 1: Setup & Authentication
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Prisma and database schema
- [ ] Implement authentication with NextAuth.js
- [ ] Create encryption/decryption utilities
- [ ] Set up API route structure

### Phase 2: Core Features
- [ ] Implement user management
- [ ] Create post CRUD operations
- [ ] Add comment and reaction systems
- [ ] Implement category management
- [ ] Set up media upload handling

### Phase 3: Payment & Subscriptions
- [ ] Integrate Stripe payment
- [ ] Add PayPal support
- [ ] Implement webhook handlers
- [ ] Create subscription management
- [ ] Add payment history

### Phase 4: Additional Features
- [ ] Food tracking system
- [ ] Workout logging
- [ ] Poll functionality
- [ ] Notification system
- [ ] Admin dashboard

### Phase 5: Testing & Deployment
- [ ] Unit tests for critical functions
- [ ] Integration tests for API routes
- [ ] E2E tests for user flows
- [ ] Performance optimization
- [ ] Deploy to production

## Notes on Special Considerations

1. **Data Encryption**: The current Laravel app uses custom AES-256-CBC encryption. You'll need to implement the same encryption/decryption logic in TypeScript.

2. **Mobile App API**: The API is designed for mobile app consumption with encrypted payloads. Maintain this for backward compatibility or plan a migration strategy.

3. **Payment Calculations**: The subscription calculation logic needs to be ported exactly to maintain consistency.

4. **File Storage**: Consider migrating from local storage to cloud storage for better scalability.

5. **Background Jobs**: Laravel queues need to be replaced with Next.js-compatible solutions like Vercel Cron Jobs or external queue services.

## Summary

This documentation covers:
- **29 Database Tables**: Complete schema for all entities including users, posts, payments, and system configurations
- **50+ API Endpoints**: Full REST API documentation including authentication, content management, payments, and admin functions
- **Multiple Payment Gateways**: PayPal, Stripe, Vodacom M-Pesa, Selcom, and Revenue Cat integrations
- **Advanced Features**: Custom encryption, OAuth2 authentication, role-based permissions, and real-time notifications
- **Admin Panel**: Comprehensive admin interface for content and user management
- **Mobile App Support**: API designed for mobile app consumption with encryption
- **Health Tracking**: Food and workout logging functionality
- **Social Features**: Comments, reactions, polls, and user interactions

The application serves as a subscription-based content platform with social features, particularly suited for the East African market with local payment gateway integrations.

This documentation provides a comprehensive overview of the Mangekimambi Laravel application and detailed guidance for migrating to Next.js. Use this as a reference throughout your migration process. 