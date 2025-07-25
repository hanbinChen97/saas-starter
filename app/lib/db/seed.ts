import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers, appointmentProfiles, activityLogs, invitations } from './schema';
import { hashPassword } from '@/app/lib/auth/session';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  console.log('Cleaning existing data...');
  
  // 清空现有数据（按依赖关系顺序删除）
  await db.delete(activityLogs);
  await db.delete(invitations);
  await db.delete(appointmentProfiles);
  await db.delete(teamMembers);
  await db.delete(teams);
  await db.delete(users);
  
  console.log('Existing data cleaned.');

  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  // 创建多个测试用户
  const testUsers = [
    {
      email: 'test@test.com',
      passwordHash: passwordHash,
      role: "owner",
      name: 'Admin User'
    },
    {
      email: 'zhang.wei@example.com',
      passwordHash: await hashPassword('password123'),
      role: "member",
      name: 'Zhang Wei'
    },
    {
      email: 'li.ming@example.com', 
      passwordHash: await hashPassword('password123'),
      role: "member",
      name: 'Li Ming'
    },
    {
      email: 'wang.fang@example.com',
      passwordHash: await hashPassword('password123'),
      role: "member", 
      name: 'Wang Fang'
    },
    {
      email: 'chen.lei@example.com',
      passwordHash: await hashPassword('password123'),
      role: "member",
      name: 'Chen Lei'
    }
  ];

  const insertedUsers = await db
    .insert(users)
    .values(testUsers)
    .returning();

  console.log(`Created ${insertedUsers.length} test users.`);

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  // 将所有用户添加到团队
  const teamMemberData = insertedUsers.map((user, index) => ({
    teamId: team.id,
    userId: user.id,
    role: index === 0 ? 'owner' : 'member',
  }));

  await db.insert(teamMembers).values(teamMemberData);

  // 为用户创建预约记录
  const appointmentData = [
    {
      userId: insertedUsers[1].id, // Zhang Wei
      vorname: 'Wei',
      nachname: 'Zhang',
      phone: '+49 176 12345678',
      geburtsdatumDay: 15,
      geburtsdatumMonth: 3,
      geburtsdatumYear: 1990,
      preferredLocations: 'superc',
      appointmentStatus: 'waiting',
    },
    {
      userId: insertedUsers[2].id, // Li Ming
      vorname: 'Ming',
      nachname: 'Li',
      phone: '+49 176 87654321',
      geburtsdatumDay: 22,
      geburtsdatumMonth: 8,
      geburtsdatumYear: 1985,
      preferredLocations: 'superc',
      appointmentStatus: 'waiting',
    },
    {
      userId: insertedUsers[3].id, // Wang Fang
      vorname: 'Fang',
      nachname: 'Wang',
      phone: '+49 176 11223344',
      geburtsdatumDay: 8,
      geburtsdatumMonth: 12,
      geburtsdatumYear: 1992,
      preferredLocations: 'superc',
      appointmentStatus: 'booked',
      appointmentDate: new Date('2024-02-15T10:00:00Z'),
    },
    {
      userId: insertedUsers[4].id, // Chen Lei
      vorname: 'Lei',
      nachname: 'Chen',
      phone: '+49 176 55667788',
      geburtsdatumDay: 30,
      geburtsdatumMonth: 6,
      geburtsdatumYear: 1988,
      preferredLocations: 'superc',
      appointmentStatus: 'waiting',
    }
  ];

  const insertedProfiles = await db
    .insert(appointmentProfiles)
    .values(appointmentData)
    .returning();

  console.log(`Created ${insertedProfiles.length} appointment profiles.`);

  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
