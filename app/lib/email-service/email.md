# 邮件系统流程文档

## 1. 渐进式加载策略 ✨（新增）

### 1.1 核心设计思路
- **快速响应**：优先加载前20封邮件，1-2秒内显示给用户
- **后台加载**：无感知继续加载到200封邮件
- **按需扩展**：用户下拉时才加载更多邮件
- **连接监控**：检测IMAP连接状态，断开时引导重新登录

### 1.2 渐进式加载流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 界面
    participant Cache as useMailCache
    participant LocalDB as IndexedDB缓存
    participant API as /api/emails
    participant IMAP as IMAP服务器

    Note over User,IMAP: === 渐进式加载流程 ===
    User->>UI: 进入邮件页面
    UI->>Cache: progressiveLoadEmails()
    
    Cache->>Cache: 检查缓存
    Cache->>LocalDB: getCachedEmails(folder, 200)
    
    alt 缓存充足（≥20封）
        LocalDB-->>Cache: 返回缓存邮件
        Cache->>UI: 立即显示缓存邮件
        UI-->>User: 快速显示邮件列表 🚀
        
        Note over Cache,IMAP: 后台智能同步
        Cache->>API: smartSync() (后台执行)
        API->>IMAP: 检查最新20封邮件
        IMAP-->>API: 最新邮件数据
        API->>Cache: 更新缓存
        Cache->>UI: 更新界面（如有新邮件）
        
    else 缓存不足（<20封）
        Cache->>UI: 显示加载状态
        UI-->>User: "快速加载前20封邮件..."
        
        Note over Cache,IMAP: 快速加载阶段
        Cache->>API: syncEmails(folder, 20)
        API->>IMAP: 连接→获取20封→断开
        IMAP-->>API: 20封邮件数据
        API-->>Cache: 返回邮件
        Cache->>LocalDB: 缓存邮件
        Cache->>UI: 显示20封邮件
        UI-->>User: 快速显示首批邮件 ⚡
        
        Note over Cache,IMAP: 后台加载阶段
        Cache->>Cache: 500ms后启动后台加载
        Cache->>UI: 显示"后台加载中"状态
        Cache->>API: syncEmails(folder, 200)
        API->>IMAP: 连接→获取200封→断开
        IMAP-->>API: 200封邮件数据
        API-->>Cache: 返回完整邮件
        Cache->>LocalDB: 更新缓存
        Cache->>UI: 更新邮件列表
        UI-->>User: 完整邮件列表（200封）
    end
    
    Note over User,IMAP: === 下拉加载更多 ===
    User->>UI: 下拉到底部
    UI->>Cache: loadMoreEmails()
    Cache->>API: syncEmails(folder, currentLimit + 50)
    API->>IMAP: 获取更多邮件
    IMAP-->>API: 更多邮件数据
    API-->>Cache: 返回邮件
    Cache->>UI: 追加显示更多邮件
    UI-->>User: 加载更多邮件完成
```

### 1.3 连接状态监控

```mermaid
flowchart TD
    A[API调用] --> B{检查响应}
    B --成功--> C[正常执行]
    B --失败--> D{错误类型}
    
    D --连接错误--> E[设置connectionError=true]
    D --认证错误--> E
    D --超时错误--> E
    D --IMAP错误--> E
    D --其他错误--> F[显示一般错误]
    
    E --> G[显示重试按钮]
    G --> H[用户点击重试]
    H --> I[retryConnection]
    I --> A
    
    F --> J[错误提示]
    
    style E fill:#ffebee
    style G fill:#fff3e0
    style C fill:#e8f5e8
```

### 1.4 性能优化特点

| 特性 | 传统加载 | ✨ 渐进式加载 |
|------|----------|-------------|
| **首屏显示时间** | 3-5秒 | **1-2秒** |
| **用户感知** | 长时间等待 | **立即响应** |
| **后台加载** | 无 | **无感知继续加载** |
| **错误恢复** | 重新加载全部 | **智能重试机制** |
| **缓存策略** | 简单缓存 | **智能缓存+增量更新** |
| **网络流量** | 一次性大量 | **分批次加载** |

## 2. 用户登录流程

```mermaid
flowchart TD
    A[页面渲染: EmailsPage] --login --> D[认证成功]
    D --> E[useMailCache 初始化]    
    E --> F[progressiveLoadEmails: 渐进式加载]
    
    F --> G[<EmailList> 展示邮件列表]
    G --> H{用户操作}
    H -- 选择邮件 --> I[setSelectedEmail → <EmailView>]
    I --> J[onMarkAsRead → markAsRead]
    H -- 下拉加载更多 --> K[loadMoreEmails]
    K --> F
    I -- 标记/删除/回复 --> L[onMarkAsFlagged/onDelete/onReplyToggle]
    L --> F
```

## 1. 用户处理登录，没有 cache 数据

```mermaid
sequenceDiagram
    participant User as 用户
    participant Auth as useEmailAuth
    participant MailCache as useMailCache 
    participant API as /api/emails
    participant Session as emailSessions(内存)
    participant IMAP as IMAP服务器
    participant LocalDB as IndexedDB缓存

    Note over User,LocalDB: === 初次登录流程 ===
    User->>Auth: 输入邮件凭据
    Auth->>API: authenticate(credentials)
    API->>IMAP: 测试连接
    IMAP-->>API: 连接成功
    API->>Session: 创建sessionId + 存储ImapService
    Session-->>API: sessionId
    API-->>Auth: {success: true, sessionId}
    Auth->>LocalDB: localStorage.setItem('email_session_id')
    Auth-->>User: 认证成功，跳转到邮件页面

    Note over User,LocalDB: === 初次加载邮件流程 ===
    User->>MailCache: 进入邮件页面
    MailCache->>MailCache: 检查isAuthenticated=true
    MailCache->>LocalDB: 尝试从缓存加载
    LocalDB-->>MailCache: 返回空数组(新用户)
    MailCache->>API: getEmails(folder='INBOX', limit=50)
    
    Note over API,Session: === 问题出现点 ===
    API->>Session: getEmailService(sessionId)
    
    alt Session存在且连接有效
        Session-->>API: 返回ImapService
        API->>IMAP: fetchEmails()
        IMAP-->>API: 邮件数据
        API-->>MailCache: 邮件列表
        MailCache->>LocalDB: 缓存邮件
        MailCache-->>User: 显示邮件列表
    else Session不存在或连接失效
        Session-->>API: null (session expired)
        API-->>MailCache: Error: "Email session expired"
        MailCache-->>User: 显示错误信息
        Note over User: 用户被迫重新登录
    end
```

## 1.1 问题根因分析

```mermaid
flowchart TD
    A[客户端页面刷新/重启] --> B[useEmailAuth初始化]
    B --> C{localStorage有sessionId?}
    C --是--> D[设置isAuthenticated=true]
    C --否--> E[设置isAuthenticated=false]
    
    D --> F[useMailCache开始加载]
    F --> G[调用API获取邮件]
    G --> H{服务端session存在?}
    
    H --是--> I[返回邮件数据]
    H --否--> J[返回session expired错误]
    
    K[服务器重启] --> L[内存中的emailSessions被清空]
    L --> H
    
    style J fill:#ffebee
    style L fill:#ffebee
```

## 1.2 修复后的流程 - 带session验证

```mermaid
sequenceDiagram
    participant User as 用户
    participant Auth as useEmailAuth
    participant MailCache as useMailCache 
    participant API as /api/emails
    participant Session as emailSessions(内存)
    participant IMAP as IMAP服务器
    participant LocalDB as IndexedDB缓存

    Note over User,LocalDB: === 页面刷新/重启后的自动验证 ===
    User->>Auth: 页面加载
    Auth->>Auth: 检查localStorage中的sessionId
    
    alt 有sessionId
        Auth->>API: validateSession(sessionId)
        API->>Session: getEmailService(sessionId)
        
        alt Session存在且有效
            Session-->>API: 返回ImapService
            API-->>Auth: {success: true, valid: true}
            Auth-->>User: 认证状态=true，进入邮件页面
            Note over User: 无缝体验，直接显示邮件
        else Session不存在或无效
            Session-->>API: null
            API-->>Auth: {success: true, valid: false}
            Auth->>LocalDB: 清除localStorage sessionId
            Auth-->>User: 认证状态=false，跳转到登录页面
        end
    else 无sessionId
        Auth-->>User: 认证状态=false，跳转到登录页面
    end

    Note over User,LocalDB: === 验证成功后的邮件加载 ===
    User->>MailCache: useMailCache (isAuthenticated=true)
    MailCache->>LocalDB: 从缓存加载
    LocalDB-->>MailCache: 返回缓存数据
    MailCache->>API: getEmails() 增量同步
    API->>Session: getEmailService(sessionId) ✅验证过的session
    Session-->>API: 返回有效的ImapService
    API->>IMAP: fetchEmails()
    IMAP-->>API: 邮件数据
    API-->>MailCache: 新邮件列表
    MailCache->>LocalDB: 更新缓存
         MailCache-->>User: 显示最新邮件列表
```

## 2. ✅ 简化后的「按需连接」策略

### 2.1 核心设计思路

- **一次性连接**：每次操作都是 连接 → 执行 → 断开
- **无Session管理**：不在内存中保持连接状态
- **简单可靠**：避免复杂的重连和session过期问题
- **本地缓存**：使用IndexedDB缓存邮件，减少重复请求

### 2.2 简化后的认证和同步流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Auth as useEmailAuth
    participant MailCache as useMailCache
    participant API as /api/emails
    participant IMAP as IMAP服务器
    participant LocalDB as IndexedDB缓存

    Note over User,LocalDB: === 简化认证流程 ===
    User->>Auth: 输入邮件凭据
    Auth->>API: authenticate(credentials)
    API->>IMAP: 测试连接（立即断开）
    IMAP-->>API: 连接成功
    API-->>Auth: {success: true}
    Auth->>LocalDB: localStorage存储用户名等非敏感信息
    Auth-->>User: 认证成功

    Note over User,LocalDB: === 一次性邮件同步 ===
    User->>MailCache: 进入邮件页面
    MailCache->>LocalDB: 加载缓存邮件
    LocalDB-->>MailCache: 返回缓存数据（如有）
    MailCache->>API: syncEmails(credentials, folder, limit)
    
    Note over API,IMAP: === 按需连接模式 ===
    API->>IMAP: 建立新连接
    API->>IMAP: 登录认证
    API->>IMAP: 获取邮件列表
    API->>IMAP: 立即断开连接 ✨
    API-->>MailCache: 返回邮件数据
    
    MailCache->>LocalDB: 缓存新邮件
    MailCache-->>User: 显示邮件列表

    Note over User,LocalDB: === 邮件操作（标记/删除） ===
    User->>MailCache: 标记邮件已读
    MailCache->>API: markAsRead(credentials, uid, isRead)
    API->>IMAP: 连接 → 标记 → 断开 ✨
    API-->>MailCache: 操作成功
    MailCache->>LocalDB: 更新本地缓存
    MailCache-->>User: 界面更新
```

### 2.3 关键优势对比

| 特性 | 之前的Session模式 | ✅ 简化后的按需连接 |
|------|------------------|-------------------|
| **连接管理** | 复杂的session生命周期 | 每次操作独立连接 |
| **内存占用** | 需要维护连接池 | 无持久连接 |
| **错误处理** | session过期、重连逻辑 | 简单的连接失败重试 |
| **可靠性** | 受服务器重启影响 | 每次都是新连接，更稳定 |
| **实现复杂度** | 高（需要管理状态） | 低（无状态设计） |
| **安全性** | 需要管理session安全 | 每次验证，更安全 |

### 2.4 API设计变化

#### 之前（Session模式）
```typescript
// 需要先认证获取sessionId
const {sessionId} = await authenticate(credentials);

// 后续操作需要传递sessionId
await getEmails(sessionId, folder, limit);
await markAsRead(sessionId, uid, isRead);
```

#### ✅ 现在（按需连接）
```typescript
// 每次操作都传递完整credentials
await syncEmails(credentials, folder, limit);
await markAsRead(credentials, uid, isRead);
```

### 2.5 性能考虑

**连接开销**：
- IMAP连接建立时间：~200-500ms
- 对于低频操作（用户手动刷新），开销可接受
- 本地缓存减少不必要的网络请求

**适用场景**：
- ✅ 适合：个人邮件管理，低并发场景
- ❌ 不适合：高频实时同步，大量并发用户

## 3. IMAP Session 处理机制详解（已废弃）

### 2.1 Session 生命周期管理

```mermaid
graph TB
    A[用户认证] --> B[创建ImapEmailService实例]
    B --> C[测试IMAP连接]
    C --> D{连接成功?}
    D --是--> E[生成sessionId]
    D --否--> F[返回认证失败]
    
    E --> G[存储到emailSessions Map]
    G --> H[清理旧session]
    H --> I[返回sessionId给客户端]
    
    subgraph "Session存储结构"
        J[emailSessions: Map<string, ImapEmailService>]
        K["sessionId → ImapEmailService实例"]
        K --> L[包含IMAP连接配置]
        K --> M[包含连接状态]
    end
    
    I --> J
```

### 2.2 IMAP 连接配置和特性

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `keepalive` | `false` | **不保持连接** - 连接会在空闲时断开 |
| `authTimeout` | `10000ms` | 认证超时时间 |
| `connTimeout` | `15000ms` | 连接超时时间 |
| `tlsOptions` | `{rejectUnauthorized: false}` | TLS配置，允许自签名证书 |

### 2.3 连接状态检查和重连机制

```mermaid
sequenceDiagram
    participant Client as 客户端请求
    participant Auth as email-auth.ts
    participant Service as ImapEmailService
    participant IMAP as IMAP服务器

    Client->>Auth: getEmailService(sessionId)
    Auth->>Auth: emailSessions.get(sessionId)
    
    alt Session存在
        Auth->>Service: getConnectionStatus()
        Service-->>Auth: {connected: boolean}
        
        alt 连接已断开
            Auth->>Service: service.connect()
            Service->>IMAP: 重新建立连接
            
            alt 重连成功
                IMAP-->>Service: 连接成功
                Service-->>Auth: 返回service实例
                Auth-->>Client: 返回有效service
            else 重连失败
                IMAP-->>Service: 连接失败
                Auth->>Auth: emailSessions.delete(sessionId)
                Auth-->>Client: 返回null (session无效)
            end
        else 连接正常
            Auth-->>Client: 返回有效service
        end
    else Session不存在
        Auth-->>Client: 返回null
    end
```

### 2.4 Session 清理策略

```typescript
function cleanupOldSessions(): void {
  // 简单的清理策略：当session数量超过10个时
  if (emailSessions.size > 10) {
    // 删除前5个session (FIFO策略)
    const sessionsToRemove = Array.from(emailSessions.keys()).slice(0, 5);
    for (const sessionId of sessionsToRemove) {
      const service = emailSessions.get(sessionId);
      if (service) {
        service.disconnect().catch(console.error);
        emailSessions.delete(sessionId);
      }
    }
  }
}
```

### 2.5 关键问题和限制

#### ❌ 当前存在的问题：

1. **内存存储** - `emailSessions` 存储在内存中，服务器重启后丢失
2. **无时间戳跟踪** - 无法按实际时间清理过期session
3. **keepalive=false** - IMAP连接不保持活跃，空闲时断开
4. **简单清理策略** - 只按数量清理，不按时间或使用频率

#### ⚠️ 连接行为特点：

- IMAP连接是**按需重连**的短连接模式
- 每次API调用会检查连接状态，断开时自动重连
- 连接失败的session会被立即清理
- 多个用户session可能同时存在

### 2.6 实际运行流程

```mermaid
flowchart TD
    A[API请求] --> B[获取sessionId]
    B --> C[从emailSessions获取service]
    C --> D{service存在?}
    
    D --否--> E[返回session expired错误]
    D --是--> F[检查连接状态]
    
    F --> G{已连接?}
    G --是--> H[执行IMAP操作]
    G --否--> I[尝试重连]
    
    I --> J{重连成功?}
    J --是--> H
    J --否--> K[删除session]
    K --> E
    
    H --> L[返回操作结果]
    
    subgraph "IMAP操作类型"
        M[fetchEmails - 获取邮件列表]
        N[markAsRead - 标记已读]
        O[deleteEmail - 删除邮件]
        P[fetchEmailBody - 获取邮件内容]
    end
    
    H --> M
    H --> N  
    H --> O
    H --> P
```





# Sequence Diagram
```mermaid
sequenceDiagram
    participant User as 用户
    participant Page as EmailsPage
    participant Hook as useMailCache
    participant API as /api/emails
    participant Service as ImapEmailService
    participant IMAP as IMAP服务器

    User->>Page: 访问邮件页面
    Page->>Hook: useMailCache({folder, ...})
    Hook->>API: fetch('/api/emails?folder=INBOX')
    API->>Service: fetchEmails({folder: 'INBOX', ...})
    Service->>IMAP: connect()
    Service->>IMAP: openBox('INBOX')
    Service->>IMAP: search(['ALL'])
    IMAP-->>Service: 邮件UID列表
    Service->>IMAP: fetch(UIDs)
    IMAP-->>Service: 邮件原始数据
    Service->>Service: simpleParser/parseEmail
    Service-->>API: 邮件对象数组
    API-->>Hook: 邮件对象数组
    Hook-->>Page: setEmails(邮件对象数组)
    Page-->>User: 展示邮件列表
```



# node-imap 收件 邮件数据格式
IMAP fetch 拉回的是原始邮件（RFC822 格式），内容是纯文本（包括头部、正文、附件等）。
mailparser/simpleParser 解析后，得到结构化的 ParsedMail 对象，常用字段有：
subject：主题
from、to、cc、bcc：发件人、收件人
date：时间
text：纯文本正文
html：HTML 正文
attachments：附件数组


# nodemailer 发件流程概述
nodemailer 是 Node.js 下最流行的邮件发送库，主要用于通过 SMTP 协议发送邮件。
在你的 ImapEmailService 里，发件流程大致如下：
步骤一：初始化 SMTP 连接
创建 nodemailer.createTransport 实例，配置 SMTP 服务器地址、端口、用户名、密码、加密方式（SSL/TLS）。
这个 transporter 实例会和 SMTP 服务器建立连接（通常是短连接，发完邮件即断开）。


| Protocol | Server Name | Port | Encryption Method |
| --- | --- | --- | --- |
| POP | mail.rwth-aachen.de | 995 | SSL |
| IMAP | mail.rwth-aachen.de | 993 | SSL |
| SMTP | mail.rwth-aachen.de | 587 | TLS |