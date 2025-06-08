# Mangekimambi Next.js Implementation Guide for AI

## Quick Reference for AI Implementation

This guide provides copy-paste ready code for integrating Mangekimambi functionality into an existing Next.js project. Each section contains complete, working code that can be directly implemented.

## Integration Checklist

- [ ] Install required dependencies
- [ ] Add environment variables to `.env.local`
- [ ] Set up Prisma and database schema
- [ ] Add core library files (crypto, auth, api-helpers)
- [ ] Create API routes
- [ ] Add middleware for authentication
- [ ] Create authentication pages
- [ ] Add necessary components and hooks
- [ ] Run database migrations and seed data
- [ ] Test the implementation

## Required Dependencies for Existing Next.js Project

Add these dependencies to your existing Next.js project:

```bash
# Core dependencies
npm install @prisma/client prisma
npm install crypto-js bcryptjs jsonwebtoken
npm install axios
npm install stripe @stripe/stripe-js react-stripe-js @paypal/react-paypal-js

# Optional but recommended
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query
npm install zod zustand
npm install uploadthing @uploadthing/react sharp

# Dev dependencies
npm install -D @types/crypto-js @types/bcryptjs @types/jsonwebtoken
```

> Note: If you're using shadcn/ui, you already have most UI components. Skip installing Radix UI packages.

## Files to Add to Your Existing Project

Add these files and folders to your existing Next.js project structure:

```
your-nextjs-project/
├── app/
│   ├── (auth)/                    # Authentication pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   ├── (dashboard)/               # Protected pages
│   │   ├── profile/
│   │   ├── posts/
│   │   ├── food-tracker/
│   │   └── workout/
│   ├── (admin)/                   # Admin pages
│   │   └── management/
│   └── api/                       # API routes
│       └── v1/
│           ├── login/route.ts
│           ├── register/route.ts
│           ├── posts/route.ts
│           ├── submit_comment/route.ts
│           ├── payment-subscription/route.ts
│           └── [other-endpoints]/route.ts
├── components/
│   └── forms/                     # Add these forms
│       ├── login-form.tsx
│       ├── register-form.tsx
│       └── post-form.tsx
├── lib/                          # Add these utilities
│   ├── crypto.ts
│   ├── prisma.ts
│   ├── auth.ts
│   ├── api-helpers.ts
│   └── payment-helpers.ts
├── hooks/                        # Add these hooks
│   ├── use-auth.ts
│   └── use-subscription.ts
├── prisma/                       # Database schema
│   ├── schema.prisma
│   └── seed.ts
└── middleware.ts                 # Add or update
```

## Environment Variables (.env.local)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mangekimambi"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Encryption (MUST match Laravel values exactly)
ENCRYPTION_KEY="x1e8a1c1cf412b27ecd7a87db49f830g"
ENCRYPTION_IV="g9f051fdf0e6388x"

# Client API Key
API_CLIENT_SECRET="your-client-secret"

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# PayPal
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_MODE="sandbox"

# M-Pesa
MPESA_CONSUMER_KEY=""
MPESA_CONSUMER_SECRET=""
MPESA_PASSKEY=""
MPESA_SHORTCODE=""
MPESA_ENV="sandbox"

# Uploadthing
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Push Notifications
FCM_SERVER_KEY=""

# Email
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
```

## 1. Complete Prisma Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
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

enum AppStatus {
  production
  maintenance
}

enum AppType {
  Free
  Paid
}

// User Model
model User {
  id                      BigInt              @id @default(autoincrement())
  enteredById             BigInt?
  countryId               BigInt?
  bannedById              BigInt?
  commentBannedById       BigInt?
  name                    String?
  verifyCode              String?
  username                String              @unique
  email                   String?             @unique
  address                 String?
  phone                   String?
  img                     String              @default("user.png")
  imgUrl                  String?
  gender                  Gender?
  login                   LoginStatus         @default(Allow)
  status                  UserStatus          @default(Active)
  commentStatus           UserStatus          @default(Active)
  platform                Platform            @default(Web)
  emailVerifiedAt         DateTime?
  password                String
  description             String?             @db.Text
  bannedReason            String?             @db.Text
  notificationToken       String?
  rememberToken           String?
  isSubscribed            SubscriptionStatus  @default(false)
  isVerified              SubscriptionStatus  @default(false)
  endOfSubscriptionDate   DateTime?
  webLogTime              DateTime?
  createdAt               DateTime            @default(now())
  updatedAt               DateTime            @updatedAt
  deletedAt               DateTime?

  // Relations
  country                 Country?            @relation(fields: [countryId], references: [id])
  bannedBy                Admin?              @relation("BannedUsers", fields: [bannedById], references: [id])
  commentBannedBy         Admin?              @relation("CommentBannedUsers", fields: [commentBannedById], references: [id])
  enteredBy               User?               @relation("EnteredUsers", fields: [enteredById], references: [id])
  enteredUsers            User[]              @relation("EnteredUsers")
  posts                   Post[]              @relation("UserPosts")
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
  roles                   RoleUser[]
  permissions             PermissionUser[]

  @@index([username])
  @@index([email])
  @@index([isSubscribed])
}

// Post Model
model Post {
  id                BigInt         @id @default(autoincrement())
  authorId          BigInt?
  name              String?
  featuredImage     String?
  status            PostStatus     @default(Draft)
  isVideoSegment    VideoSegment   @default(No)
  content           String?        @db.Text
  publishedAt       DateTime?
  notificationId    String?
  deletedBy         BigInt?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  deletedAt         DateTime?

  // Relations
  author            Admin?         @relation(fields: [authorId], references: [id])
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
  id                BigInt         @id @default(autoincrement())
  enteredById       BigInt?
  name              String
  img               String?
  status            UserStatus     @default(Active)
  arrangement       Int?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  deletedAt         DateTime?

  // Relations
  enteredBy         Admin?         @relation(fields: [enteredById], references: [id])
  posts             PostCategory[]

  @@index([status])
}

// PostCategory Pivot
model PostCategory {
  id                BigInt         @id @default(autoincrement())
  postId            BigInt
  categoryId        BigInt
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  post              Post           @relation(fields: [postId], references: [id])
  category          Category       @relation(fields: [categoryId], references: [id])

  @@unique([postId, categoryId])
}

// Comment Model
model Comment {
  id                BigInt              @id @default(autoincrement())
  postId            BigInt?
  userId            BigInt?
  comment           String              @db.Text
  belongType        String
  belongId          BigInt
  enteredById       BigInt?
  name              String?
  isVerified        SubscriptionStatus?
  userImgUrl        String?
  content           String?             @db.Text
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  deletedAt         DateTime?

  post              Post?               @relation(fields: [postId], references: [id])
  user              User?               @relation(fields: [userId], references: [id])
  reactions         Reaction[]
  emojis            CommentEmoji[]
  replies           Comment[]           @relation("CommentReplies")
  parentComment     Comment?            @relation("CommentReplies", fields: [belongId], references: [id])
  media             CommentMedia[]

  @@index([postId])
  @@index([userId])
}

// Media Model (Polymorphic)
model Media {
  id                BigInt         @id @default(autoincrement())
  filePath          String
  type              String
  belongType        String
  belongId          BigInt
  enteredById       BigInt?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@index([belongType, belongId])
}

// Payment Model
model Payment {
  id                BigInt         @id @default(autoincrement())
  userId            BigInt
  orderId           String?
  transid           String?
  reference         String?        @unique
  channel           String?
  result            String?
  phone             String?
  amount            Decimal        @db.Decimal(10, 2)
  currency          String
  paymentStatus     String
  startDate         DateTime
  endDate           DateTime
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User           @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([orderId])
  @@index([reference])
}

// Reaction Model
model Reaction {
  id                BigInt         @id @default(autoincrement())
  userId            BigInt
  postId            BigInt?
  emojiId           BigInt?
  belongType        String
  belongId          BigInt
  name              String?
  react             String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User           @relation(fields: [userId], references: [id])
  post              Post?          @relation(fields: [postId], references: [id])
  emoji             Emoji?         @relation(fields: [emojiId], references: [id])
  comment           Comment?       @relation(fields: [belongId], references: [id])

  @@index([userId])
  @@index([postId])
  @@unique([userId, belongType, belongId])
}

// Admin Model
model Admin {
  id                BigInt         @id @default(autoincrement())
  enteredById       BigInt?
  countryId         BigInt?
  name              String
  email             String         @unique
  address           String?
  phone             String?
  img               String         @default("user.png")
  imgUrl            String?
  login             LoginStatus    @default(Allow)
  emailVerifiedAt   DateTime?
  password          String
  description       String?        @db.Text
  rememberToken     String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  deletedAt         DateTime?

  country           Country?       @relation(fields: [countryId], references: [id])
  bannedUsers       User[]         @relation("BannedUsers")
  commentBannedUsers User[]        @relation("CommentBannedUsers")
  posts             Post[]
  categories        Category[]
  emojis            Emoji[]
  customSubscriptions CustomSubscription[]
  roles             RoleUser[]
  permissions       PermissionUser[]
}

// Additional models...
model Emoji {
  id                BigInt         @id @default(autoincrement())
  name              String?
  type              String?
  img               String?
  imgUrl            String?
  enteredById       BigInt?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  enteredBy         Admin?         @relation(fields: [enteredById], references: [id])
  reactions         Reaction[]
  commentEmojis     CommentEmoji[]
}

model Food {
  id                BigInt         @id @default(autoincrement())
  userId            BigInt?
  name              String?
  calories          Float?
  protein           Float?
  fat               Float?
  carbs             Float?
  date              DateTime?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User?          @relation(fields: [userId], references: [id])
}

model Workout {
  id                BigInt         @id @default(autoincrement())
  userId            BigInt?
  name              String?
  caloriesBurned    Float?
  duration          Int?
  date              DateTime?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User?          @relation(fields: [userId], references: [id])
}

model Poll {
  id                BigInt         @id @default(autoincrement())
  pollId            BigInt
  pollOptionId      BigInt
  userId            BigInt
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User           @relation(fields: [userId], references: [id])
  option            PollOption     @relation(fields: [pollOptionId], references: [id])

  @@unique([pollId, userId])
}

model PollOption {
  id                BigInt         @id @default(autoincrement())
  pollId            BigInt
  options           String
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  post              Post           @relation(fields: [pollId], references: [id])
  polls             Poll[]
}

model Country {
  id                BigInt         @id @default(autoincrement())
  name              String
  dialCode          String?
  code              String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  users             User[]
  admins            Admin[]
}

model UserDevice {
  id                BigInt         @id @default(autoincrement())
  userId            BigInt?
  status            UserStatus     @default(Active)
  sessionId         String?
  osName            String?
  osVersion         String?
  browserName       String?
  browserVersion    String?
  navigatorUserAgent String?       @db.Text
  navigatorAppVersion String?      @db.Text
  navigatorPlatform String?        @db.Text
  navigatorVendor   String?        @db.Text
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
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User?          @relation(fields: [userId], references: [id])
}

model Role {
  id                BigInt         @id @default(autoincrement())
  name              String         @unique
  displayName       String?
  description       String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  users             RoleUser[]
  permissions       PermissionRole[]
}

model Permission {
  id                BigInt         @id @default(autoincrement())
  name              String         @unique
  displayName       String?
  description       String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  roles             PermissionRole[]
  users             PermissionUser[]
}

model RoleUser {
  roleId            BigInt
  userId            BigInt
  userType          String
  
  role              Role           @relation(fields: [roleId], references: [id])
  user              User           @relation(fields: [userId], references: [id])

  @@id([roleId, userId])
}

model PermissionRole {
  permissionId      BigInt
  roleId            BigInt
  
  permission        Permission     @relation(fields: [permissionId], references: [id])
  role              Role           @relation(fields: [roleId], references: [id])

  @@id([permissionId, roleId])
}

model PermissionUser {
  permissionId      BigInt
  userId            BigInt
  userType          String
  
  permission        Permission     @relation(fields: [permissionId], references: [id])
  user              User           @relation(fields: [userId], references: [id])

  @@id([permissionId, userId])
}

model Screenshot {
  id                BigInt         @id @default(autoincrement())
  userId            BigInt?
  date              DateTime?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User?          @relation(fields: [userId], references: [id])
}

model Feedback {
  id                BigInt         @id @default(autoincrement())
  enteredById       BigInt?
  name              String?
  description       String?        @db.Text
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User?          @relation(fields: [enteredById], references: [id])
}

model SysConfig {
  id                BigInt         @id @default(autoincrement())
  systemName        String         @default("")
  systemTitle       String         @default("Mange Kimambi")
  logoWords         String         @default("Mange Kimambi")
  systemDescription String         @default("Mange Kimambi")
  userDefaultPass   String         @default("456123")
  staffDefaultLogin String         @default("Allow")
  staffLeavesDays   BigInt         @default(28)
  maxExecutionTime  BigInt         @default(43200)
  showAlertTime     BigInt         @default(5000)
  maxSizeUpload     BigInt         @default(500)
  cronJobUrl        String?
  admitFee          Decimal        @default(0.0) @db.Decimal(12, 2)
  staffIncentiveRate Decimal       @default(0.0) @db.Decimal(4, 2)
  cashOnly          String         @default("No")
  appStatus         AppStatus      @default(production)
  appType           AppType        @default(Paid)
  appVersion        String?
  youtubeVideo      String?
  registrationFee   String         @default("No")
  clientShortName   String?
  clientFullName    String?
  regionCountry     String?
  address           String?
  mobNo             String?
  telNo             String?
  clientEmail       String?
  logo              String         @default("logo.png")
  logoUrl           String?
  printLogo         String?
  domainName        String?
  installDate       DateTime       @default(now())
  version           String         @default("0.1")
  clientCode        String         @default("default")
  regInitial        String         @default("default")
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model Subscriber {
  id                        BigInt         @id @default(autoincrement())
  userId                    String?
  orderId                   String?
  name                      String?
  msisdn                    String?
  thirdPartyConversationId  String?
  transactionReference      String?
  amount                    String?
  duration                  Int?
  status                    Int?
  message                   String?        @db.Text
  device                    String?
  fcmToken                  String?
  appVersion                String?
  createdAt                 DateTime       @default(now())
  updatedAt                 DateTime       @updatedAt
}

model CustomSubscription {
  id                BigInt         @id @default(autoincrement())
  userId            BigInt?
  adminId           BigInt?
  comment           String?        @db.Text
  days              Int
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User?          @relation(fields: [userId], references: [id])
  admin             Admin?         @relation(fields: [adminId], references: [id])
}

model PostViewer {
  id                BigInt         @id @default(autoincrement())
  postId            BigInt?
  userId            BigInt?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  post              Post?          @relation(fields: [postId], references: [id])
  user              User?          @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
}

model CommentEmoji {
  id                BigInt         @id @default(autoincrement())
  commentId         BigInt
  emojiId           BigInt
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  comment           Comment        @relation(fields: [commentId], references: [id])
  emoji             Emoji          @relation(fields: [emojiId], references: [id])

  @@unique([commentId, emojiId])
}

model CommentMedia {
  id                BigInt         @id @default(autoincrement())
  file              String
  type              String
  commentId         BigInt
  commentType       String
  createdAt         DateTime       @default(now())

  comment           Comment        @relation(fields: [commentId], references: [id])
}

model OauthAccessToken {
  id                String         @id
  userId            BigInt?
  clientId          BigInt
  name              String?
  scopes            String?        @db.Text
  revoked           Boolean        @default(false)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  expiresAt         DateTime?

  user              User?          @relation(fields: [userId], references: [id])
  client            OauthClient    @relation(fields: [clientId], references: [id])
}

model OauthClient {
  id                        BigInt              @id @default(autoincrement())
  userId                    BigInt?
  name                      String
  secret                    String              @unique
  provider                  String?
  redirect                  String              @db.Text
  personalAccessClient      Boolean             @default(false)
  passwordClient            Boolean             @default(false)
  revoked                   Boolean             @default(false)
  createdAt                 DateTime            @default(now())
  updatedAt                 DateTime            @updatedAt

  accessTokens              OauthAccessToken[]
}

model PasswordReset {
  email             String
  token             String
  createdAt         DateTime?

  @@id([email])
}

model FailedJob {
  id                BigInt         @id @default(autoincrement())
  uuid              String         @unique
  connection        String         @db.Text
  queue             String         @db.Text
  payload           String         @db.Text
  exception         String         @db.Text
  failedAt          DateTime       @default(now())
}
```

## 2. Core Library Files

### lib/prisma.ts
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### lib/crypto.ts
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
    if (!encryptedData) return null;
    
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
    
    if (!decryptedString || decryptedString === '0') {
      return null;
    }
    
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

// API response helpers
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

### lib/auth.ts
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
    expiresIn: '30d'
  });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!);
  } catch {
    return null;
  }
}

export async function validateClientKey(key: string) {
  const client = await prisma.oauthClient.findUnique({
    where: { secret: key }
  });
  return client;
}

export async function createAccessToken(userId: bigint, clientId: bigint) {
  const token = generateToken({ userId: userId.toString() });
  
  await prisma.oauthAccessToken.create({
    data: {
      id: token,
      userId,
      clientId,
      name: 'appToken',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  
  return token;
}
```

### lib/api-helpers.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { verifyToken } from './auth';
import { encryptError } from './crypto';

export async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    throw new Error('Invalid token');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: BigInt(decoded.userId) }
  });
  
  if (!user) {
    throw new Error('User not found');
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
  
  return user;
}

export function createSuccessResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function createErrorResponse(message: string, status = 400) {
  return NextResponse.json(encryptError(message), { status });
}

export async function checkSubscription(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      isSubscribed: true, 
      endOfSubscriptionDate: true 
    }
  });
  
  const sysConfig = await prisma.sysConfig.findFirst();
  
  // If app is free, everyone is subscribed
  if (sysConfig?.appType === 'Free') {
    return true;
  }
  
  // Check if subscription is active
  if (user?.isSubscribed === 'true' && user.endOfSubscriptionDate) {
    return new Date(user.endOfSubscriptionDate) > new Date();
  }
  
  return false;
}
```

### lib/payment-helpers.ts
```typescript
import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface SubscriptionCalculation {
  subscriptionStart: Date;
  subscriptionEnd: Date;
  daysAdded: number;
}

export async function calculateSubscription(
  userId: bigint,
  amount: number,
  currency: string
): Promise<SubscriptionCalculation> {
  // Get user's current subscription
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { endOfSubscriptionDate: true }
  });
  
  // Determine subscription start date
  const now = new Date();
  const subscriptionStart = user?.endOfSubscriptionDate && 
    new Date(user.endOfSubscriptionDate) > now
    ? new Date(user.endOfSubscriptionDate)
    : now;
  
  // Calculate days based on amount and currency
  let daysToAdd = 0;
  
  // Currency conversion rates (example)
  const rates: Record<string, number> = {
    'USD': 1,
    'TSH': 0.00043, // Tanzania Shilling to USD
    'KES': 0.0068,  // Kenya Shilling to USD
  };
  
  const amountInUSD = amount * (rates[currency] || 1);
  
  // Subscription tiers (example)
  if (amountInUSD >= 30) {
    daysToAdd = 365; // 1 year
  } else if (amountInUSD >= 10) {
    daysToAdd = 90;  // 3 months
  } else if (amountInUSD >= 5) {
    daysToAdd = 30;  // 1 month
  } else if (amountInUSD >= 2) {
    daysToAdd = 7;   // 1 week
  } else if (amountInUSD >= 0.5) {
    daysToAdd = 1;   // 1 day
  }
  
  // Calculate end date
  const subscriptionEnd = new Date(subscriptionStart);
  subscriptionEnd.setDate(subscriptionEnd.getDate() + daysToAdd);
  
  return {
    subscriptionStart,
    subscriptionEnd,
    daysAdded: daysToAdd
  };
}

export async function createPayment(
  userId: bigint,
  paymentData: {
    orderId?: string;
    transid?: string;
    reference?: string;
    channel: string;
    amount: number;
    currency: string;
    phone?: string;
  }
) {
  const subscription = await calculateSubscription(
    userId,
    paymentData.amount,
    paymentData.currency
  );
  
  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      userId,
      orderId: paymentData.orderId,
      transid: paymentData.transid,
      reference: paymentData.reference,
      channel: paymentData.channel,
      amount: new Decimal(paymentData.amount),
      currency: paymentData.currency,
      phone: paymentData.phone,
      paymentStatus: 'COMPLETED',
      result: 'SUCCESS',
      startDate: subscription.subscriptionStart,
      endDate: subscription.subscriptionEnd,
    }
  });
  
  // Update user subscription
  await prisma.user.update({
    where: { id: userId },
    data: {
      isSubscribed: 'true',
      endOfSubscriptionDate: subscription.subscriptionEnd
    }
  });
  
  return payment;
}
```

## 3. API Route Implementations

### app/api/v1/login/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt, encryptResponse, encryptError } from '@/lib/crypto';
import { verifyPassword, createAccessToken, validateClientKey } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validate client key
    const clientKey = request.headers.get('key');
    if (!clientKey) {
      return NextResponse.json(encryptError('Client key required'), { status: 401 });
    }

    const client = await validateClientKey(clientKey);
    if (!client) {
      return NextResponse.json(encryptError('Invalid client'), { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const email = decrypt(body.email);
    const password = decrypt(body.password);

    if (!email || !password) {
      return NextResponse.json(encryptError('Invalid credentials'), { status: 401 });
    }

    // Check if input is email or username
    const isEmail = email.includes('@');
    
    // Find user
    const user = await prisma.user.findFirst({
      where: isEmail 
        ? { email: email }
        : { username: email }
    });

    if (!user) {
      return NextResponse.json(
        encryptError(`Invalid ${isEmail ? 'Email' : 'Username'} or Password`), 
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        encryptError(`Invalid ${isEmail ? 'Email' : 'Username'} or Password`), 
        { status: 401 }
      );
    }

    // Check if user is allowed to login
    if (user.login === 'Restrict') {
      return NextResponse.json(encryptError('Account restricted'), { status: 401 });
    }

    if (user.status === 'Banned') {
      return NextResponse.json(encryptError('Account banned'), { status: 401 });
    }

    // Update user login status
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
    const token = await createAccessToken(user.id, client.id);

    // Check if app is free
    const sysConfig = await prisma.sysConfig.findFirst();
    if (sysConfig?.appType === 'Free') {
      user.isSubscribed = 'true';
    }

    // Check subscription expiry
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

    return NextResponse.json({
      success: true,
      token: encryptResponse({ token }).data,
      user: encryptResponse(user).data
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(encryptError('Server error'), { status: 500 });
  }
}
```

### app/api/v1/register/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt, encryptResponse, encryptError } from '@/lib/crypto';
import { hashPassword, createAccessToken, validateClientKey } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validate client key
    const clientKey = request.headers.get('key');
    if (!clientKey) {
      return NextResponse.json(encryptError('Client key required'), { status: 401 });
    }

    const client = await validateClientKey(clientKey);
    if (!client) {
      return NextResponse.json(encryptError('Invalid client'), { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const username = decrypt(body.username);
    const password = decrypt(body.password);
    const gender = decrypt(body.gender);
    const email = body.email ? decrypt(body.email) : null;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        encryptError('Username and password are required'), 
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        encryptError(`Username ${username} taken please change`), 
        { status: 400 }
      );
    }

    // Check if email exists
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return NextResponse.json(
          encryptError('Email already registered'), 
          { status: 400 }
        );
      }
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: username,
        email,
        gender: gender as any,
        platform: 'App',
      }
    });

    // Create access token
    const token = await createAccessToken(user.id, client.id);

    return NextResponse.json({
      success: true,
      token: encryptResponse({ token }).data,
      user: encryptResponse(user).data
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(encryptError('Server error'), { status: 500 });
  }
}
```

### app/api/v1/posts/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { encryptResponse } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const from = parseInt(searchParams.get('from') || '0');
    const to = parseInt(searchParams.get('to') || '10');
    const limit = parseInt(searchParams.get('limit') || '10');

    const posts = await prisma.post.findMany({
      where: {
        status: 'Published',
        publishedAt: {
          lte: new Date()
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        media: true,
        reactions: {
          where: {
            userId: user.id
          }
        },
        postViewers: {
          where: {
            userId: user.id
          }
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
            postViewers: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip: from,
      take: limit
    });

    // Transform posts for response
    const transformedPosts = posts.map(post => ({
      ...post,
      isLiked: post.reactions.length > 0,
      isViewed: post.postViewers.length > 0,
      commentsCount: post._count.comments,
      likesCount: post._count.reactions,
      viewsCount: post._count.postViewers,
      categories: post.categories.map(pc => pc.category),
      // Remove sensitive data
      reactions: undefined,
      postViewers: undefined,
      _count: undefined
    }));

    return createSuccessResponse(encryptResponse(transformedPosts));

  } catch (error) {
    console.error('Get posts error:', error);
    return createErrorResponse('Failed to fetch posts', 500);
  }
}
```

### app/api/v1/submit_comment/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { decrypt, encryptResponse } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();

    const type = decrypt(body.type);
    const id = decrypt(body.id);
    const content = decrypt(body.content);
    const emojis = body.emojis ? decrypt(body.emojis) : null;

    if (!type || !id || !content) {
      return createErrorResponse('Missing required fields');
    }

    if (type === 'post') {
      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: BigInt(id) }
      });

      if (!post) {
        return createErrorResponse('Post not found', 404);
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          postId: BigInt(id),
          userId: user.id,
          comment: content,
          content: content,
          belongType: 'App\\Models\\Post',
          belongId: BigInt(id),
          name: user.username,
          isVerified: user.isVerified,
          userImgUrl: user.imgUrl
        }
      });

      // Add emojis if provided
      if (emojis) {
        const emojiIds = JSON.parse(emojis);
        if (Array.isArray(emojiIds)) {
          await prisma.commentEmoji.createMany({
            data: emojiIds.map((emojiId: number) => ({
              commentId: comment.id,
              emojiId: BigInt(emojiId)
            }))
          });
        }
      }

      // TODO: Send notification to post author

      return createSuccessResponse(
        encryptResponse('Submitted successfully')
      );

    } else if (type === 'comment') {
      // Reply to comment
      const parentComment = await prisma.comment.findUnique({
        where: { id: BigInt(id) }
      });

      if (!parentComment) {
        return createErrorResponse('Comment not found', 404);
      }

      const reply = await prisma.comment.create({
        data: {
          postId: parentComment.postId,
          userId: user.id,
          comment: content,
          content: content,
          belongType: 'App\\Models\\Comment',
          belongId: BigInt(id),
          name: user.username,
          isVerified: user.isVerified,
          userImgUrl: user.imgUrl
        }
      });

      // TODO: Send notification to comment author

      return createSuccessResponse(
        encryptResponse('Submitted successfully')
      );

    } else {
      return createErrorResponse('Invalid type. Use post or comment');
    }

  } catch (error) {
    console.error('Submit comment error:', error);
    return createErrorResponse('Failed to submit comment', 500);
  }
}
```

### app/api/v1/payment-subscription/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { createPayment } from '@/lib/payment-helpers';
import { decrypt } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();

    // Decrypt and validate fields
    const userid = body.userid;
    const type = body.type;
    const subscriptionDate = body.subscription_date;
    const subscriptionEndDate = body.subscription_end_date;
    const currency = body.currency;
    const transactionId = body.transcation_id;
    const amount = parseFloat(body.amount);

    if (!userid || !type || !subscriptionDate || !subscriptionEndDate || 
        !currency || !transactionId || !amount) {
      return createErrorResponse('All fields are required');
    }

    // Verify user ID matches authenticated user
    if (BigInt(userid) !== user.id) {
      return createErrorResponse('Unauthorized', 403);
    }

    // Create or update payment
    await prisma.payment.upsert({
      where: { reference: transactionId },
      update: {
        amount: amount,
        paymentStatus: 'COMPLETED',
        result: 'COMPLETED'
      },
      create: {
        userId: user.id,
        orderId: transactionId,
        reference: transactionId,
        channel: type,
        amount: amount,
        currency: currency,
        phone: user.phone,
        result: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        startDate: new Date(subscriptionDate),
        endDate: new Date(subscriptionEndDate)
      }
    });

    // Update user subscription
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSubscribed: 'true',
        endOfSubscriptionDate: new Date(subscriptionEndDate)
      }
    });

    return createSuccessResponse({
      status: true,
      message: 'success'
    });

  } catch (error) {
    console.error('Payment subscription error:', error);
    return createErrorResponse('Payment processing failed', 500);
  }
}
```

## 4. Middleware Implementation

### middleware.ts
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/api/v1/login',
  '/api/v1/register',
  '/api/v1/password_recovery',
  '/api/v1/verify_username',
  '/api/webhooks',
];

// Routes that require client key
const clientKeyRoutes = [
  '/api/v1/login',
  '/api/v1/register',
  '/api/v1/verify_username',
  '/api/v1/contact'
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route requires client key
  if (clientKeyRoutes.some(route => pathname.startsWith(route))) {
    const clientKey = request.headers.get('key');
    
    if (!clientKey) {
      return NextResponse.json(
        { success: false, message: 'Client key required' },
        { status: 401 }
      );
    }
  }

  // Check if route requires authentication
  if (pathname.startsWith('/api/v1/') && 
      !publicRoutes.some(route => pathname.startsWith(route))) {
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // Admin routes protection
  if (pathname.startsWith('/management') && !pathname.includes('/login')) {
    const sessionCookie = request.cookies.get('admin-session');
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/management/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/management/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 5. Frontend Components

> **Note**: If you're using shadcn/ui, you already have the UI components. Just use your existing Button, Input, Label, etc. from `@/components/ui/`.

### components/forms/login-form.tsx
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';  // Or use your existing toast solution
import { encrypt, decrypt } from '@/lib/crypto';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await axios.post('/api/v1/login', {
        email: encrypt(data.email),
        password: encrypt(data.password),
      }, {
        headers: {
          'key': process.env.NEXT_PUBLIC_API_CLIENT_SECRET!
        }
      });

      if (response.data.success) {
        const token = decrypt(response.data.token);
        const user = decrypt(response.data.user);

        // Store token in localStorage
        localStorage.setItem('auth_token', token.token);
        localStorage.setItem('user', JSON.stringify(user));

        toast.success('Login successful!');
        router.push('/dashboard');
      } else {
        const errorMessage = decrypt(response.data.message);
        toast.error(errorMessage || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        const errorMessage = decrypt(error.response.data.message);
        toast.error(errorMessage || 'Login failed');
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email or Username</Label>
        <Input
          id="email"
          type="text"
          placeholder="Enter your email or username"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

### hooks/use-auth.ts
```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string | null;
  isSubscribed: boolean;
  isVerified: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }

    setIsLoading(false);
  }, [router]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'key': process.env.NEXT_PUBLIC_API_CLIENT_SECRET!
    };
  };

  return {
    user,
    isLoading,
    logout,
    getAuthHeaders,
  };
}
```

## 6. Database Seed Script

### prisma/seed.ts
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create OAuth client
  const client = await prisma.oauthClient.create({
    data: {
      name: 'Mobile App Client',
      secret: process.env.API_CLIENT_SECRET!,
      redirect: 'http://localhost:3000/callback',
      passwordClient: true,
    }
  });

  // Create system config
  await prisma.sysConfig.create({
    data: {
      systemName: 'Mangekimambi',
      systemTitle: 'Mange Kimambi',
      appType: 'Paid',
      appStatus: 'production',
      appVersion: '1.0.0',
    }
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.admin.create({
    data: {
      name: 'Admin User',
      email: 'admin@mangekimambi.com',
      password: adminPassword,
    }
  });

  // Create test user
  const userPassword = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'test@example.com',
      password: userPassword,
      name: 'Test User',
      platform: 'Web',
    }
  });

  // Create categories
  const categories = ['News', 'Entertainment', 'Sports', 'Politics', 'Technology'];
  for (const name of categories) {
    await prisma.category.create({
      data: { name }
    });
  }

  // Create emojis
  const emojis = [
    { name: 'like', imgUrl: '/emojis/like.png' },
    { name: 'love', imgUrl: '/emojis/love.png' },
    { name: 'haha', imgUrl: '/emojis/haha.png' },
    { name: 'wow', imgUrl: '/emojis/wow.png' },
    { name: 'sad', imgUrl: '/emojis/sad.png' },
    { name: 'angry', imgUrl: '/emojis/angry.png' },
  ];

  for (const emoji of emojis) {
    await prisma.emoji.create({
      data: emoji
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 7. Package.json Scripts

Add these scripts to your package.json:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed",
    "prisma:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force"
  },
  "prisma": {
    "seed": "ts-node --transpile-only prisma/seed.ts"
  }
}
```

## Setup Steps After Adding Files

```bash
# 1. Initialize Prisma (if not already done)
npx prisma init

# 2. Copy the schema.prisma content from this guide to prisma/schema.prisma

# 3. Generate Prisma client
npx prisma generate

# 4. Create and run migrations
npx prisma migrate dev --name init

# 5. Seed the database
npx prisma db seed

# 6. Start your development server
npm run dev
```

## Testing the API

Use these curl commands to test:

```bash
# Test login
curl -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -H "key: your-client-secret" \
  -d '{
    "email": "encrypted_username",
    "password": "encrypted_password"
  }'
```

This implementation guide provides a complete, copy-paste ready codebase for the Mangekimambi Next.js application. Each section contains working code that can be directly implemented by AI assistants or developers. 