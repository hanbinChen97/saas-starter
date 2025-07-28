# 邮件服务集成测试

这个测试套件专门用于验证 IMAP 和 SMTP 邮件服务的真实连通性和功能。

## 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置测试环境
```bash
# 复制环境配置模板
cp .env.test.example .env.test

# 编辑 .env.test，填入你的测试邮箱账户
# 建议使用专门的测试邮箱，不要使用生产邮箱
```

### 3. 运行测试

```bash
# 运行所有测试
pnpm test

# 只运行单元测试（快速）
pnpm test:unit

# 只运行集成测试（需要网络连接）
pnpm test:integration

# 只运行邮件相关的集成测试
pnpm test:email

# 监听模式（开发时使用）
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

## 测试类型

### 🔌 连接测试
- **IMAP 连接** - 验证收件服务器连通性
- **SMTP 连接** - 验证发件服务器连通性
- **身份认证** - 验证用户名密码正确性
- **端口和加密** - 测试不同的连接配置

### 📧 功能测试
- **发送邮件** - 测试各种格式的邮件发送
- **接收邮件** - 验证邮件能够正确到达
- **邮件操作** - 标记已读、删除等操作
- **完整流程** - 发送→接收→处理的端到端测试

### 🚨 错误处理测试
- **错误配置** - 验证错误处理逻辑
- **网络问题** - 测试超时和连接失败
- **权限问题** - 测试身份认证失败

## 测试文件结构

```
tests/
├── integration/
│   └── email/
│       ├── imap-connection.test.ts    # IMAP 连接测试
│       ├── smtp-connection.test.ts    # SMTP 连接测试
│       └── email-flow.test.ts         # 完整邮件流程测试
├── unit/
│   └── utils/
│       └── email-parser.test.ts       # 邮件解析单元测试
└── helpers/
    ├── test-setup.ts                  # 全局测试设置
    └── email-test-utils.ts            # 邮件测试工具函数
```

## 环境要求

### 必需的环境变量
```bash
# 邮件服务器配置
RWTH_MAIL_SERVER=mail.rwth-aachen.de
RWTH_MAIL_SERVER_IMAP_PORT=993
RWTH_MAIL_SERVER_SMTP_HOST=mail.rwth-aachen.de
RWTH_MAIL_SERVER_SMTP_PORT=587

# 测试账户（强烈建议专用测试账户）
TEST_EMAIL_USERNAME=your-test@rwth-aachen.de
TEST_EMAIL_PASSWORD=your-password
```

### 测试账户建议
- 📧 使用专门的测试邮箱账户
- 🔒 不要使用生产环境的邮箱
- 🧹 测试会自动清理测试邮件，但仍建议使用独立账户
- ⚡ 确保测试账户有发送和接收邮件的权限

## CI/CD 集成

### GitHub Actions 示例
```yaml
name: Email Integration Tests
on: [push, pull_request]

jobs:
  email-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:integration
        env:
          TEST_EMAIL_USERNAME: ${{ secrets.TEST_EMAIL_USERNAME }}
          TEST_EMAIL_PASSWORD: ${{ secrets.TEST_EMAIL_PASSWORD }}
          RWTH_MAIL_SERVER: ${{ secrets.RWTH_MAIL_SERVER }}
```

## 故障排除

### 常见问题

**连接超时**
```bash
# 检查网络连接
ping mail.rwth-aachen.de

# 检查端口开放
telnet mail.rwth-aachen.de 993
telnet mail.rwth-aachen.de 587
```

**身份认证失败**
- 确认用户名和密码正确
- 检查是否需要应用密码（而非登录密码）
- 确认账户未被锁定

**邮件未到达**
- 检查垃圾邮件文件夹
- 增加等待时间（某些服务器延迟较高）
- 确认发送邮箱有权限

### 调试模式
```bash
# 启用详细日志
DEBUG=true pnpm test:email

# 运行单个测试文件
pnpm vitest tests/integration/email/imap-connection.test.ts
```

## 开发指南

### 添加新的邮件测试
1. 在 `tests/integration/email/` 下创建测试文件
2. 使用 `email-test-utils.ts` 中的工具函数
3. 为测试邮件添加唯一标识符
4. 确保清理测试数据

### 测试最佳实践
- ✅ 每个测试使用唯一的测试ID
- ✅ 测试后清理邮件数据
- ✅ 设置合理的超时时间
- ✅ 验证错误处理逻辑
- ❌ 不要依赖特定的邮件数量
- ❌ 不要在测试中使用生产数据

### 性能考虑
- 集成测试比单元测试慢得多
- 网络延迟和邮件服务器响应时间影响测试速度
- 建议在 CI 中并行运行单元测试和集成测试 