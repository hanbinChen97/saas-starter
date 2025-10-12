import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { checkExistingProfile } from '@/app/lib/db/queries'
import { db } from '@/app/lib/db/drizzle'
import { appointmentProfiles, users } from '@/app/lib/db/schema'
import { eq } from 'drizzle-orm'

describe('supac 用户注册重复检查', () => {
  let testUserId: number
  let createdProfileIds: number[] = []

  beforeEach(async () => {
    // 创建测试用户
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      passwordHash: 'test-hash',
      role: 'member'
    }).returning()
    
    testUserId = testUser.id
  })

  afterEach(async () => {
    // 清理测试数据
    if (createdProfileIds.length > 0) {
      for (const profileId of createdProfileIds) {
        await db.delete(appointmentProfiles).where(eq(appointmentProfiles.id, profileId))
      }
      createdProfileIds = []
    }
    
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId))
    }
  })

  it('应该检测到完全相同的用户（姓名和生日都相同）', async () => {
    // 创建第一个 profile
    const [profile1] = await db.insert(appointmentProfiles).values({
      userId: testUserId,
      vorname: 'Max',
      nachname: 'Mustermann',
      email: 'max@example.com',
      phone: '01234567890',
      geburtsdatumDay: 15,
      geburtsdatumMonth: 6,
      geburtsdatumYear: 1990
    }).returning()
    
    createdProfileIds.push(profile1.id)

    // 检查是否存在相同的用户
    const exists = await checkExistingProfile(
      'Max',
      'Mustermann',
      15,
      6,
      1990
    )

    expect(exists).toBe(true)
  })

  it('应该忽略大小写差异（姓名转小写比较）', async () => {
    // 创建 profile，使用小写
    const [profile] = await db.insert(appointmentProfiles).values({
      userId: testUserId,
      vorname: 'max',
      nachname: 'mustermann',
      email: 'max@example.com',
      phone: '01234567890',
      geburtsdatumDay: 20,
      geburtsdatumMonth: 8,
      geburtsdatumYear: 1995
    }).returning()
    
    createdProfileIds.push(profile.id)

    // 使用大写查询
    const exists1 = await checkExistingProfile('MAX', 'MUSTERMANN', 20, 8, 1995)
    expect(exists1).toBe(true)

    // 使用混合大小写查询
    const exists2 = await checkExistingProfile('Max', 'Mustermann', 20, 8, 1995)
    expect(exists2).toBe(true)

    // 使用首字母大写查询
    const exists3 = await checkExistingProfile('Max', 'Mustermann', 20, 8, 1995)
    expect(exists3).toBe(true)
  })

  it('应该允许同名但不同生日的用户注册', async () => {
    // 创建第一个 profile
    const [profile1] = await db.insert(appointmentProfiles).values({
      userId: testUserId,
      vorname: 'Anna',
      nachname: 'Schmidt',
      email: 'anna1@example.com',
      phone: '01234567890',
      geburtsdatumDay: 10,
      geburtsdatumMonth: 3,
      geburtsdatumYear: 1992
    }).returning()
    
    createdProfileIds.push(profile1.id)

    // 检查同名但不同生日的用户 - 应该不存在
    const exists = await checkExistingProfile(
      'Anna',
      'Schmidt',
      11,  // 不同的日期
      3,
      1992
    )

    expect(exists).toBe(false)
  })

  it('应该允许同生日但不同姓名的用户注册', async () => {
    // 创建第一个 profile
    const [profile1] = await db.insert(appointmentProfiles).values({
      userId: testUserId,
      vorname: 'Peter',
      nachname: 'Mueller',
      email: 'peter@example.com',
      phone: '01234567890',
      geburtsdatumDay: 5,
      geburtsdatumMonth: 12,
      geburtsdatumYear: 1988
    }).returning()
    
    createdProfileIds.push(profile1.id)

    // 检查不同姓名但同生日的用户 - 应该不存在
    const exists = await checkExistingProfile(
      'Hans',  // 不同的名字
      'Mueller',
      5,
      12,
      1988
    )

    expect(exists).toBe(false)
  })

  it('应该检查所有生日字段（日、月、年）', async () => {
    // 创建 profile
    const [profile] = await db.insert(appointmentProfiles).values({
      userId: testUserId,
      vorname: 'Maria',
      nachname: 'Weber',
      email: 'maria@example.com',
      phone: '01234567890',
      geburtsdatumDay: 25,
      geburtsdatumMonth: 11,
      geburtsdatumYear: 1985
    }).returning()
    
    createdProfileIds.push(profile.id)

    // 同名，但年份不同
    const exists1 = await checkExistingProfile('Maria', 'Weber', 25, 11, 1986)
    expect(exists1).toBe(false)

    // 同名，但月份不同
    const exists2 = await checkExistingProfile('Maria', 'Weber', 25, 10, 1985)
    expect(exists2).toBe(false)

    // 同名，但日期不同
    const exists3 = await checkExistingProfile('Maria', 'Weber', 24, 11, 1985)
    expect(exists3).toBe(false)

    // 完全匹配
    const exists4 = await checkExistingProfile('Maria', 'Weber', 25, 11, 1985)
    expect(exists4).toBe(true)
  })

  it('应该处理特殊字符和空格的姓名', async () => {
    // 创建带特殊字符的 profile
    const [profile] = await db.insert(appointmentProfiles).values({
      userId: testUserId,
      vorname: 'Jean-Pierre',
      nachname: "O'Connor",
      email: 'jean@example.com',
      phone: '01234567890',
      geburtsdatumDay: 1,
      geburtsdatumMonth: 1,
      geburtsdatumYear: 1990
    }).returning()
    
    createdProfileIds.push(profile.id)

    // 检查是否能正确识别特殊字符
    const exists = await checkExistingProfile(
      'jean-pierre',  // 小写
      "o'connor",     // 小写
      1,
      1,
      1990
    )

    expect(exists).toBe(true)
  })

  it('在数据库为空时应该返回 false', async () => {
    const exists = await checkExistingProfile(
      'Nonexistent',
      'User',
      1,
      1,
      2000
    )

    expect(exists).toBe(false)
  })

  it('应该处理数据库中姓名为大写的情况', async () => {
    // 创建大写姓名的 profile
    const [profile] = await db.insert(appointmentProfiles).values({
      userId: testUserId,
      vorname: 'THOMAS',
      nachname: 'SCHNEIDER',
      email: 'thomas@example.com',
      phone: '01234567890',
      geburtsdatumDay: 30,
      geburtsdatumMonth: 4,
      geburtsdatumYear: 1993
    }).returning()
    
    createdProfileIds.push(profile.id)

    // 使用小写查询
    const exists1 = await checkExistingProfile('thomas', 'schneider', 30, 4, 1993)
    expect(exists1).toBe(true)

    // 使用首字母大写查询
    const exists2 = await checkExistingProfile('Thomas', 'Schneider', 30, 4, 1993)
    expect(exists2).toBe(true)
  })
})
