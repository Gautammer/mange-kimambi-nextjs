import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full access to all resources',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      displayName: 'User',
      description: 'Regular user with limited access',
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: {
      name: 'editor',
      displayName: 'Editor',
      description: 'Can edit and publish content',
    },
  });

  console.log('Roles created:', { adminRole, userRole, editorRole });

  // Create default permissions
  const permissions = [
    {
      name: 'manage_users',
      displayName: 'Manage Users',
      description: 'Create, update, and delete users',
    },
    {
      name: 'manage_posts',
      displayName: 'Manage Posts',
      description: 'Create, update, and delete posts',
    },
    {
      name: 'manage_comments',
      displayName: 'Manage Comments',
      description: 'Moderate comments',
    },
    {
      name: 'manage_categories',
      displayName: 'Manage Categories',
      description: 'Create, update, and delete categories',
    },
    {
      name: 'view_analytics',
      displayName: 'View Analytics',
      description: 'Access analytics dashboard',
    },
    {
      name: 'manage_subscriptions',
      displayName: 'Manage Subscriptions',
      description: 'Manage user subscriptions',
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log('Permissions created');

  // Assign permissions to roles
  await prisma.permissionRole.deleteMany({
    where: { roleId: adminRole.id },
  });

  const adminPermissions = await prisma.permission.findMany();
  for (const permission of adminPermissions) {
    await prisma.permissionRole.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@mangekimambi.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@mangekimambi.com',
      password: hashedPassword,
      description: 'Default administrator account',
    },
  });

  console.log('Admin created:', admin);

  // Assign admin role to admin user
  await prisma.roleUser.upsert({
    where: {
      roleId_userId: {
        roleId: adminRole.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      userId: admin.id,
      userType: 'admin',
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'test@example.com',
      password: userPassword,
      name: 'Test User',
      isSubscribed: 'false',
      isVerified: 'false',
    },
  });

  console.log('Test user created:', user);

  // Assign user role to test user
  await prisma.roleUser.upsert({
    where: {
      roleId_userId: {
        roleId: userRole.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      roleId: userRole.id,
      userId: user.id,
      userType: 'user',
    },
  });

  // Create default categories
  const categories = [
    { name: 'News', arrangement: 1 },
    { name: 'Lifestyle', arrangement: 2 },
    { name: 'Sports', arrangement: 3 },
    { name: 'Health', arrangement: 4 },
    { name: 'Technology', arrangement: 5 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { 
        id: BigInt(0) // This is a workaround since we can't use unique name here
      },
      update: {},
      create: {
        name: category.name,
        arrangement: category.arrangement,
        enteredById: admin.id,
      },
      // Skip the creation if already exists
      skipDuplicates: true,
    });
  }

  console.log('Categories created');

  // Create system config
  await prisma.sysConfig.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      systemName: 'Mange Kimambi',
      systemTitle: 'Mange Kimambi',
      logoWords: 'Mange Kimambi',
      systemDescription: 'Content Management and Subscription Platform',
      userDefaultPass: '456123',
      staffDefaultLogin: 'Allow',
      staffLeavesDays: BigInt(28),
      maxExecutionTime: BigInt(43200),
      showAlertTime: BigInt(5000),
      maxSizeUpload: BigInt(500),
    },
  });

  console.log('System config created');

  // Create OAuth clients for API authentication
  const webClient = await prisma.oauthClient.upsert({
    where: { name: 'Web Client' },
    update: {},
    create: {
      name: 'Web Client',
      secret: 'mangekimambi-web-client-secret-2024',
      redirect: 'http://localhost:3000',
      personalAccessClient: false,
      passwordClient: true,
      revoked: false,
    },
  });

  const mobileClient = await prisma.oauthClient.upsert({
    where: { name: 'Mobile Client' },
    update: {},
    create: {
      name: 'Mobile Client',
      secret: 'mangekimambi-mobile-client-secret-2024',
      redirect: 'mangekimambi://auth',
      personalAccessClient: false,
      passwordClient: true,
      revoked: false,
    },
  });

  console.log('OAuth clients created:', { webClient, mobileClient });

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 