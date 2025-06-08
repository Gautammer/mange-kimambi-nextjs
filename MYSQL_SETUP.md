# MySQL Setup Guide for Mangekimambi

This guide will help you set up MySQL database for the Mangekimambi Admin Panel.

## MySQL Database Configuration

### 1. MySQL Connection String Format

The `DATABASE_URL` in your `.env.local` file should follow this format:

```
DATABASE_URL="mysql://username:password@host:port/database_name"
```

Example:
```
DATABASE_URL="mysql://root:mypassword@localhost:3306/mangekimambi"
```

### 2. Create Database

First, create a database for the project:

```sql
CREATE DATABASE mangekimambi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Environment Variables

Create a `.env.local` file in your project root with the following content:

```env
# Database (MySQL)
DATABASE_URL="mysql://root:yourpassword@localhost:3306/mangekimambi"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# Encryption (MUST match Laravel values exactly)
ENCRYPTION_KEY="x1e8a1c1cf412b27ecd7a87db49f830g"
ENCRYPTION_IV="g9f051fdf0e6388x"

# Client API Key
API_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_API_CLIENT_SECRET="your-client-secret"

# Other configurations...
```

### 4. Run Migrations

After setting up your database connection, run the following commands:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate dev --name init

# Seed the database with initial data
npm run prisma:seed
```

## MySQL Requirements

- MySQL 5.7 or higher (8.0 recommended)
- InnoDB storage engine (default in modern MySQL)
- utf8mb4 character set for full Unicode support

## Common Issues and Solutions

### 1. Authentication Plugin Error

If you encounter authentication errors with MySQL 8.0, you might need to change the authentication plugin:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yourpassword';
FLUSH PRIVILEGES;
```

### 2. Access Denied Error

Make sure your MySQL user has all necessary privileges:

```sql
GRANT ALL PRIVILEGES ON mangekimambi.* TO 'youruser'@'localhost';
FLUSH PRIVILEGES;
```

### 3. BigInt Serialization

The schema uses BigInt for IDs. When working with BigInt in JavaScript, you might need to handle serialization:

```javascript
// In your API responses, BigInt values need to be converted to strings
JSON.stringify(data, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
);
```

## Prisma Studio

To visually explore your database, you can use Prisma Studio:

```bash
npm run prisma:studio
```

This will open a web interface at http://localhost:5555 where you can view and edit your data.

## Production Considerations

For production deployments:

1. Use a dedicated MySQL user with limited privileges
2. Enable SSL/TLS for database connections
3. Use connection pooling for better performance
4. Regular backups and monitoring

Example production connection string:
```
DATABASE_URL="mysql://user:password@db.example.com:3306/mangekimambi?ssl=true&sslaccept=strict"
``` 