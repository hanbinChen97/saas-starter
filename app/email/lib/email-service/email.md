# 邮件系统架构与流程文档

## 1. 系统架构概述

### 1.1 核心组件
- **前端**: EmailList 组件 + useMailCache Hook
- **缓存层**: IndexedDB (EmailCache)
- **API层**: `/api/emails` 路由
- **服务层**: ImapEmailService (node-imap + nodemailer)
- **邮件服务器**: IMAP (收件) + SMTP (发件)

### 1.2 技术栈
- **IMAP客户端**: node-imap (邮件接收)
- **SMTP客户端**: nodemailer (邮件发送)  
- **邮件解析**: mailparser/simpleParser
- **本地存储**: IndexedDB (邮件缓存)
- **无状态连接**: 每次操作都是 连接 → 执行 → 断开

## 2. 渐进式加载策略 ✨

### 2.1 加载设计
```
阶段1: 快速响应 (50封) → 阶段2: 后台扩展 (200封)
```


### 2.2 缓存优先策略
1. **检查缓存**: 如果有>=50封缓存邮件，立即显示
2. **智能同步**: 后台检查服务器更新
3. **增量更新**: 只同步新邮件，避免重复下载

## 4. API调用详细说明

### 4.1 主要API端点
- **端点**: `POST /api/emails`
- **认证**: 每次请求都需要提供完整的邮件凭据

### 4.2 核心API操作

#### syncEmails - 同步邮件
```javascript
POST /api/emails
{
  "action": "syncEmails",
  "folder": "INBOX",
  "limit": 50,
  "credentials": {
    "username": "yw612241@rwth-aachen.de",  // 登录用户名
    "password": "********",
    "emailAddress": "hanbin.chen@rwth-aachen.de", // 显示邮箱
    "host": "mail.rwth-aachen.de",
    "port": 993,
    "encryption": "SSL"
  }
}
```

#### getEmailBody - 获取邮件正文
```javascript
POST /api/emails
{
  "action": "getEmailBody",
  "folder": "INBOX",
  "uid": 12345,
  "credentials": {...}
}
```

#### markAsRead - 标记已读
```javascript
POST /api/emails
{
  "action": "markAsRead",
  "folder": "INBOX", 
  "uid": 12345,
  "isRead": true,
  "credentials": {...}
}
```

### 4.3 IMAP操作流程
1. **连接**: 建立到IMAP服务器的SSL/TLS连接
2. **认证**: 使用用户名密码验证
3. **选择文件夹**: 打开指定邮件文件夹 (如INBOX)
4. **搜索邮件**: 根据条件搜索邮件 (如最新N封)
5. **获取数据**: 下载邮件头部和正文
6. **解析邮件**: 使用mailparser解析邮件结构
7. **断开连接**: 清理资源，断开IMAP连接

## 5. 数据格式说明

### 5.1 EmailMessage结构
```typescript
interface EmailMessage {
  id: string;          // 唯一标识
  uid: number;         // IMAP UID
  subject: string;     // 主题
  from: string;        // 发件人
  to: string[];        // 收件人
  date: string;        // 日期
  preview: string;     // 预览文本
  isRead: boolean;     // 是否已读
  isFlagged: boolean;  // 是否标记
  folder: string;      // 文件夹
}
```

### 5.2 邮件解析流程
```
原始邮件 (RFC822) → mailparser/simpleParser → ParsedMail对象 → EmailMessage
```

- **subject**: 邮件主题
- **from/to/cc/bcc**: 发件人/收件人信息  
- **date**: 邮件时间戳
- **text**: 纯文本正文
- **html**: HTML格式正文
- **attachments**: 附件数组



## 7. 安全与认证

### 7.1 凭据管理
- **用户名**: `yw612241@rwth-aachen.de` (用于IMAP/SMTP登录)
- **邮箱地址**: `hanbin.chen@rwth-aachen.de` (用于邮件显示)
- **密码**: 不在localStorage中存储，仅内存保存
- **传输安全**: 所有API调用通过HTTPS

### 7.2 IMAP/SMTP配置
| 协议 | 服务器 | 端口 | 加密方式 |
|------|--------|------|----------|
| IMAP | mail.rwth-aachen.de | 993 | SSL |
| SMTP | mail.rwth-aachen.de | 587 | TLS |
