# 📚 Drizzle ORM 学习指南

> 这是一个面向新手的 Drizzle ORM 完整学习文档，涵盖基本概念、开发工作流程和最佳实践。

## 🎯 什么是 Drizzle ORM？

Drizzle 是一个现代化的 TypeScript ORM，具有以下特点：
- **类型安全**：完全的 TypeScript 支持，编译时类型检查
- **轻量级**：零依赖，包体积小
- **SQL-like**：接近原生 SQL 的查询语法
- **性能优异**：编译时优化，运行时高效

## 🏗️ 项目中的 Drizzle 架构

```
app/lib/db/
├── schema.ts          # 数据库模式定义（表结构、关系）
├── drizzle.ts         # Drizzle 客户端配置
├── queries.ts         # 复用的查询函数
├── setup.ts           # 环境配置脚本
├── seed.ts            # 初始数据填充脚本
└── migrations/        # 数据库迁移文件目录
    ├── meta/          # 迁移元数据
    └── *.sql          # SQL 迁移文件
```

### 核心文件说明

**`schema.ts`** - 数据模式定义
```typescript
// 定义表结构
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // ...
});

// 定义表关系
export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
}));
```

**`drizzle.ts`** - 数据库连接
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
export const db = drizzle(sql, { schema });
```

## 🛠️ 开发命令详解

### 1. `pnpm db:setup` - 环境初始化

**作用**：交互式配置开发环境
**执行文件**：`app/lib/db/setup.ts`

**具体功能**：
- ✅ 检查并配置 Stripe CLI
- ✅ 设置 PostgreSQL（本地 Docker 或远程）
- ✅ 生成 Stripe webhook 密钥
- ✅ 创建 `.env` 环境变量文件
- ✅ 生成安全密钥

**使用场景**：
- 🎯 **首次克隆项目后**
- 🎯 **重新配置开发环境**
- 🎯 **切换数据库连接**

**交互流程**：
```bash
pnpm db:setup
# → 检查 Stripe CLI 安装状态
# → 选择本地/远程数据库
# → 输入 Stripe 密钥
# → 自动生成 webhook 和认证密钥
# → 创建完整的 .env 文件
```

### 2. `pnpm db:generate` - 生成迁移文件

**作用**：基于 schema.ts 变更生成 SQL 迁移文件
**工具**：`drizzle-kit generate`

**工作原理**：
1. 比较当前 `schema.ts` 与上次快照
2. 检测变更（新表、字段修改、索引变化等）
3. 生成对应的 SQL 迁移文件
4. 更新元数据快照

**使用场景**：
- 🔄 **修改了 schema.ts 后**
- 🔄 **添加新表或字段**
- 🔄 **修改现有表结构**

**实际例子**：
```typescript
// 在 schema.ts 中添加新字段
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  // 新增字段 ⬇️
  avatar: text('avatar'),
});
```

```bash
pnpm db:generate
# → 生成类似 0001_add_avatar_to_users.sql 的迁移文件
```

### 3. `pnpm db:migrate` - 执行数据库迁移

**作用**：将生成的迁移文件应用到数据库
**工具**：`drizzle-kit migrate`

**工作原理**：
1. 读取 `migrations/` 目录下的 SQL 文件
2. 按顺序执行未应用的迁移
3. 更新数据库中的迁移记录表

**使用场景**：
- ⚡ **生成迁移文件后**
- ⚡ **部署到生产环境前**
- ⚡ **团队成员同步数据库结构**

**安全提示**：
```bash
# 开发环境
pnpm db:migrate

# 生产环境（建议先备份）
pnpm db:migrate --config=drizzle.prod.config.ts
```

### 4. `pnpm db:seed` - 填充初始数据

**作用**：为数据库添加初始测试数据
**执行文件**：`app/lib/db/seed.ts`

**功能详解**：
- 👤 创建默认用户：`test@test.com` / `admin123`
- 🏢 创建测试团队：`Test Team`
- 💳 创建 Stripe 产品和价格
- 🔗 建立用户-团队关联关系

**使用场景**：
- 🌱 **首次设置开发环境**
- 🌱 **重置开发数据库**
- 🌱 **为新功能准备测试数据**

**自定义种子数据**：
```typescript
// 在 seed.ts 中添加更多初始数据
await db.insert(users).values([
  { email: 'admin@example.com', role: 'admin' },
  { email: 'user@example.com', role: 'member' },
]);
```

### 5. `pnpm db:studio` - 数据库可视化界面

**作用**：启动 Drizzle Studio Web 界面
**工具**：`drizzle-kit studio`

**功能特性**：
- 📊 **可视化浏览表数据**
- ✏️ **直接编辑数据记录**
- 🔍 **查看表结构和关系**
- 📝 **执行自定义 SQL 查询**

**访问地址**：通常是 `https://local.drizzle.studio`

**使用场景**：
- 🔍 **调试数据问题**
- 🔍 **快速查看数据状态**
- 🔍 **手动修改测试数据**
- 🔍 **验证迁移结果**

## 🔄 完整开发工作流程

### 初次设置（新项目/新成员）
```bash
# 1. 配置环境
pnpm db:setup

# 2. 应用数据库结构
pnpm db:migrate

# 3. 填充初始数据
pnpm db:seed

# 4. 启动开发服务器
pnpm dev
```

### 日常开发流程
```bash
# 1. 修改 schema.ts（添加/修改表结构）
# 2. 生成迁移文件
pnpm db:generate

# 3. 应用迁移
pnpm db:migrate

# 4. 检查结果（可选）
pnpm db:studio
```

### 团队协作流程
```bash
# 拉取最新代码后
git pull origin main

# 应用新的迁移
pnpm db:migrate

# 如果有新的种子数据
pnpm db:seed
```

## 📚 Drizzle 核心概念学习

### 1. Schema Definition（模式定义）
```typescript
// 基本表定义
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 外键关系
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  authorId: integer('author_id').references(() => users.id),
  title: text('title').notNull(),
});
```

### 2. Relations（关系定义）
```typescript
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts), // 一对多关系
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

### 3. Type Inference（类型推导）
```typescript
// 自动推导类型
export type User = typeof users.$inferSelect;  // 查询类型
export type NewUser = typeof users.$inferInsert; // 插入类型

// 使用示例
const newUser: NewUser = {
  name: 'John',
  email: 'john@example.com',
};
```

### 4. Query Examples（查询示例）
```typescript
// 基本查询
const allUsers = await db.select().from(users);

// 条件查询
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'test@test.com'));

// 关联查询
const usersWithPosts = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId));

// 插入数据
const [newUser] = await db
  .insert(users)
  .values({ name: 'Alice', email: 'alice@example.com' })
  .returning();
```

## 🚨 常见问题和解决方案

### 问题 1：迁移失败
```bash
Error: relation "users" already exists
```
**解决方案**：
- 检查数据库是否已有相同的表
- 使用 `DROP TABLE IF EXISTS` 或重置数据库
- 检查迁移文件的顺序

### 问题 2：类型错误
```typescript
// ❌ 错误
const user = { name: 'John' }; // 缺少必需字段

// ✅ 正确
const user: NewUser = { 
  name: 'John', 
  email: 'john@example.com' 
};
```

### 问题 3：环境变量问题
```bash
Error: POSTGRES_URL is not defined
```
**解决方案**：
- 确保 `.env` 文件存在
- 检查环境变量格式：`postgres://user:password@host:port/database`
- 重新运行 `pnpm db:setup`

## 🎯 最佳实践

### 1. Schema 设计
- ✅ 使用描述性的表名和字段名
- ✅ 合理设置字段长度限制
- ✅ 添加必要的索引和约束
- ✅ 使用 TypeScript 类型推导

### 2. 迁移管理
- ✅ 每次 schema 变更都生成迁移
- ✅ 迁移文件不要手动修改
- ✅ 生产环境部署前先在测试环境验证
- ✅ 定期备份数据库

### 3. 查询优化
- ✅ 使用 `select()` 指定需要的字段
- ✅ 合理使用 `where()` 条件
- ✅ 对大量数据使用分页
- ✅ 利用 `with` 进行复杂关联查询

## 🔗 有用的资源

- 📖 [Drizzle 官方文档](https://orm.drizzle.team/)
- 🎥 [Drizzle 视频教程](https://www.youtube.com/@DrizzleORM)
- 💬 [Drizzle Discord 社区](https://discord.gg/yfjTbVXMW4)
- 🔧 [Drizzle Studio 文档](https://orm.drizzle.team/drizzle-studio/overview)

## 🚀 下一步学习

1. **熟悉基本查询操作**：增删改查
2. **学习复杂关联查询**：joins, subqueries
3. **掌握事务处理**：transaction handling
4. **性能优化技巧**：索引、查询优化
5. **生产环境部署**：迁移策略、监控

---

**快速开始**：
```bash
pnpm db:setup    # 首次使用
pnpm db:migrate  # 应用结构
pnpm db:seed     # 添加测试数据
pnpm db:studio   # 打开可视化界面
```