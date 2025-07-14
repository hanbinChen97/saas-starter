# Flowchart
```mermaid
flowchart TD
    A[页面渲染: EmailsPage] --login --> D[认证成功]
    D --> E[useMailCache 初始化]    
    E --> F[useMailCache: 自动/手动 syncEmails, refreshEmails]
    
    F --> G[<EmailList> 展示邮件列表]
    G --> H{用户操作}
    H -- 选择邮件 --> I[setSelectedEmail → <EmailView>]
    I --> J[onMarkAsRead → markAsRead]
    H -- 加载更多/切换文件夹 --> F
    I -- 标记/删除/回复 --> K[onMarkAsFlagged/onDelete/onReplyToggle]
    K --> F
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