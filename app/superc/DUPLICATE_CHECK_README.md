# SuperC 用户注册重复检查实现说明

## 问题描述

每个人只能在 SuperC 注册一次。系统需要检查数据库中是否已存在：
- 相同的姓名（忽略大小写）
- 相同的出生日期（年、月、日）

## 实现方案

### 1. 数据库查询层 (`app/lib/db/queries.ts`)

更新了 `checkExistingProfile` 函数：

```typescript
export async function checkExistingProfile(
  vorname: string, 
  nachname: string,
  geburtsdatumDay: number,
  geburtsdatumMonth: number,
  geburtsdatumYear: number
)
```

**关键特性：**
- 使用 SQL `LOWER()` 函数实现大小写不敏感的姓名比较
- 检查完整的出生日期（日、月、年）
- 只要姓名和出生日期都匹配才认为是重复注册

**SQL 查询逻辑：**
```sql
WHERE 
  LOWER(vorname) = LOWER(input_vorname) AND
  LOWER(nachname) = LOWER(input_nachname) AND
  geburtsdatum_day = input_day AND
  geburtsdatum_month = input_month AND
  geburtsdatum_year = input_year
```

### 2. 业务逻辑层 (`app/superc/main/actions.ts`)

更新了 `createUserProfile` action：
- 在插入新记录前调用 `checkExistingProfile`
- 传递姓名和完整出生日期参数
- 如果发现重复，返回友好的错误消息

**错误消息：**
```
Ein Profil mit diesem Vor- und Nachnamen sowie Geburtsdatum existiert bereits. 
Doppelte Registrierungen sind nicht erlaubt.
```

（带有此姓名和出生日期的个人资料已存在。不允许重复注册。）

### 3. 用户界面 (`app/superc/main/page.tsx`)

表单已正确配置以显示错误消息：
- 成功注册后显示绿色成功消息
- 重复注册时显示红色错误消息
- 表单验证错误显示在相应字段下方

## 测试覆盖

创建了完整的单元测试 (`tests/unit/superc/profile-duplicate-check.test.ts`)：

### 测试场景：

1. **基本重复检测**
   - ✅ 检测完全相同的用户（姓名和生日都相同）

2. **大小写不敏感**
   - ✅ 忽略大小写差异（MAX = max = Max）
   - ✅ 处理数据库中大写姓名的情况

3. **部分匹配不算重复**
   - ✅ 同名但不同生日的用户可以注册
   - ✅ 同生日但不同姓名的用户可以注册

4. **完整日期验证**
   - ✅ 检查所有日期字段（日、月、年）
   - ✅ 任何一个日期字段不同都不算重复

5. **边界情况**
   - ✅ 处理特殊字符和空格的姓名（Jean-Pierre, O'Connor）
   - ✅ 数据库为空时返回 false

## 示例

### 场景 1: 重复注册（会被阻止）
```
用户 A 注册：
- Vorname: "Max"
- Nachname: "Mustermann"  
- Geburtsdatum: 15.06.1990

用户 B 尝试注册：
- Vorname: "MAX" (大写)
- Nachname: "mustermann" (小写)
- Geburtsdatum: 15.06.1990

结果: ❌ 注册失败，显示重复错误消息
```

### 场景 2: 允许注册（不同出生日期）
```
用户 A 注册：
- Vorname: "Max"
- Nachname: "Mustermann"
- Geburtsdatum: 15.06.1990

用户 B 尝试注册：
- Vorname: "Max"
- Nachname: "Mustermann"
- Geburtsdatum: 16.06.1990 (不同日期)

结果: ✅ 注册成功，因为出生日期不同
```

### 场景 3: 允许注册（不同姓名）
```
用户 A 注册：
- Vorname: "Max"
- Nachname: "Mustermann"
- Geburtsdatum: 15.06.1990

用户 B 尝试注册：
- Vorname: "Anna" (不同名字)
- Nachname: "Mustermann"
- Geburtsdatum: 15.06.1990

结果: ✅ 注册成功，因为姓名不同
```

## 技术细节

### 使用的技术栈
- **ORM**: Drizzle ORM
- **数据库**: PostgreSQL
- **验证**: Zod Schema
- **测试框架**: Vitest

### 性能考虑
- 使用数据库索引可进一步优化查询性能
- 当前实现使用 `.limit(1)` 提前终止查询
- SQL `LOWER()` 函数在大多数现代数据库中性能良好

### 安全性
- 所有输入都经过 Zod 验证
- 使用参数化查询防止 SQL 注入
- 服务器端验证（Server Actions）

## 运行测试

```bash
# 运行所有单元测试
pnpm test:unit

# 运行 SuperC 相关测试
pnpm test tests/unit/superc/profile-duplicate-check.test.ts

# 监视模式运行测试
pnpm test:watch
```

## 维护建议

1. **数据库索引**: 考虑在 `vorname`, `nachname`, `geburtsdatum_*` 字段上创建复合索引以提高查询性能
2. **日志记录**: 建议记录重复注册尝试用于分析和安全监控
3. **用户反馈**: 可以考虑提供更详细的错误信息（例如："您已于 XX 日期注册"）
4. **数据清理**: 定期检查和清理测试数据
