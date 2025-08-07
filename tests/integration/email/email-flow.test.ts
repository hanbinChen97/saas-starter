import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  createTestIMAPService, 
  createTestSMTPService,
  generateTestEmail,
  waitForEmail,
  cleanupTestEmails,
  checkTestEnvironment 
} from '@/tests/helpers/email-test-utils'
import type { ImapEmailService } from '@/app/email/lib/email-service/mail-imap/email-service'
import type { SMTPService } from '@/app/email/lib/email-service/mail-smtp/smtp-service'

describe('邮件完整流程集成测试', () => {
  let imapService: ImapEmailService
  let smtpService: SMTPService
  let testId: string
  
  beforeEach(() => {
    const envCheck = checkTestEnvironment()
    if (!envCheck.isReady) {
      console.warn('⚠️ 测试环境未完全准备好:', envCheck.issues)
    }
    
    imapService = createTestIMAPService()
    smtpService = createTestSMTPService()
    testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`🧪 开始测试流程，测试ID: ${testId}`)
  })
  
  afterEach(async () => {
    // 清理测试邮件
    if (imapService) {
      await cleanupTestEmails(imapService, testId)
    }
    
    // 断开连接
    try {
      await imapService?.disconnect()
      await smtpService?.disconnect()
    } catch (error) {
      console.warn('断开连接时出错:', error)
    }
  })

  it('应该能够完成发送和接收邮件的完整流程', async () => {
    // 1. 连接到 SMTP 服务器
    console.log('📤 连接 SMTP 服务器...')
    await smtpService.connect()
    expect(smtpService.isConnected()).toBe(true)
    
    // 2. 连接到 IMAP 服务器
    console.log('📥 连接 IMAP 服务器...')
    await imapService.connect()
    expect(imapService.getConnectionStatus().connected).toBe(true)
    
    // 3. 发送测试邮件
    const testEmail = generateTestEmail(testId)
    const recipient = process.env.TEST_EMAIL_USERNAME || ''
    
    console.log('📧 发送测试邮件...')
    await smtpService.sendEmail({
      to: [{ address: recipient, name: '测试接收者' }],
      subject: testEmail.subject,
      text: testEmail.text,
      html: testEmail.html
    })
    
    console.log('✅ 邮件发送成功')
    
    // 4. 等待邮件到达
    console.log('⏳ 等待邮件到达...')
    const emailReceived = await waitForEmail(imapService, testId, 60000) // 等待60秒
    
    expect(emailReceived).toBe(true)
    console.log('📬 邮件已到达！')
    
    // 5. 验证邮件内容
    const emails = await imapService.fetchEmails({ limit: 10 })
    const testEmailReceived = emails.find(email => 
      email.subject.includes(testId) && 
      email.subject.includes('[TEST]')
    )
    
    expect(testEmailReceived).toBeDefined()
    expect(testEmailReceived!.subject).toContain(testId)
    expect(testEmailReceived!.from).toBeTruthy()
    
    console.log('✅ 邮件内容验证成功')
    
  }, 120000) // 整个流程允许2分钟

  it('应该能够发送带有不同格式的邮件', async () => {
    await smtpService.connect()
    await imapService.connect()
    
    // 发送纯文本邮件
    const textTestId = `${testId}-text`
    await smtpService.sendEmail({
      to: [{ address: process.env.TEST_EMAIL_USERNAME || '' }],
      subject: `[TEST] 纯文本邮件 - ${textTestId}`,
      text: `这是纯文本测试邮件，ID: ${textTestId}`
    })
    
    // 发送 HTML 邮件
    const htmlTestId = `${testId}-html`
    await smtpService.sendEmail({
      to: [{ address: process.env.TEST_EMAIL_USERNAME || '' }],
      subject: `[TEST] HTML邮件 - ${htmlTestId}`,
      html: `<h1>HTML测试邮件</h1><p>ID: <strong>${htmlTestId}</strong></p>`
    })
    
    // 等待邮件到达
    await new Promise(resolve => setTimeout(resolve, 10000)) // 等待10秒
    
    const emails = await imapService.fetchEmails({ limit: 20 })
    
    const textEmail = emails.find(email => email.subject.includes(textTestId))
    const htmlEmail = emails.find(email => email.subject.includes(htmlTestId))
    
    expect(textEmail).toBeDefined()
    expect(htmlEmail).toBeDefined()
    
    console.log('✅ 不同格式邮件发送成功')
    
  }, 60000)

  it('应该能够处理邮件操作（标记已读、删除等）', async () => {
    await smtpService.connect()
    await imapService.connect()
    
    // 发送测试邮件
    const operationTestId = `${testId}-operations`
    await smtpService.sendEmail({
      to: [{ address: process.env.TEST_EMAIL_USERNAME || '' }],
      subject: `[TEST] 操作测试邮件 - ${operationTestId}`,
      text: `用于测试邮件操作的邮件，ID: ${operationTestId}`
    })
    
    // 等待邮件到达
    const emailReceived = await waitForEmail(imapService, operationTestId, 30000)
    expect(emailReceived).toBe(true)
    
    // 找到测试邮件
    let emails = await imapService.fetchEmails({ limit: 10 })
    const testEmail = emails.find(email => email.subject.includes(operationTestId))
    expect(testEmail).toBeDefined()
    
    const emailUid = testEmail!.uid
    
    // 测试标记为已读
    await imapService.markAsRead(emailUid)
    console.log('✅ 邮件已标记为已读')
    
    // 测试标记为未读
    await imapService.markAsUnread(emailUid)
    console.log('✅ 邮件已标记为未读')
    
    // 测试删除邮件
    await imapService.deleteEmail(emailUid)
    console.log('✅ 邮件已删除')
    
    // 验证邮件已被删除
    emails = await imapService.fetchEmails({ limit: 10 })
    const deletedEmail = emails.find(email => email.uid === emailUid)
    expect(deletedEmail).toBeUndefined()
    
  }, 60000)

  it('应该能够发送多收件人邮件', async () => {
    await smtpService.connect()
    await imapService.connect()
    
    const multiTestId = `${testId}-multi`
    const primaryRecipient = process.env.TEST_EMAIL_USERNAME || ''
    
    // 发送给多个收件人（这里用同一个邮箱模拟）
    await smtpService.sendEmail({
      to: [
        { address: primaryRecipient, name: '主要收件人' }
      ],
      cc: [
        { address: primaryRecipient, name: '抄送收件人' }
      ],
      subject: `[TEST] 多收件人邮件 - ${multiTestId}`,
      text: `多收件人测试邮件，ID: ${multiTestId}`,
      html: `<p>多收件人测试邮件</p><p>ID: <code>${multiTestId}</code></p>`
    })
    
    const emailReceived = await waitForEmail(imapService, multiTestId, 30000)
    expect(emailReceived).toBe(true)
    
    console.log('✅ 多收件人邮件发送成功')
    
  }, 60000)

  it('应该能够处理邮件发送失败的情况', async () => {
    await smtpService.connect()
    
    // 尝试发送到无效邮箱
    const invalidEmail = 'nonexistent-user-12345@invalid-domain-67890.com'
    
    await expect(async () => {
      await smtpService.sendEmail({
        to: [{ address: invalidEmail }],
        subject: `[TEST] 发送失败测试 - ${testId}`,
        text: '这封邮件应该发送失败'
      })
    }).rejects.toThrow()
    
    console.log('✅ 正确处理了邮件发送失败的情况')
    
  }, 30000)

  it('应该能够获取邮件详细内容', async () => {
    await smtpService.connect()
    await imapService.connect()
    
    const detailTestId = `${testId}-detail`
    const richContent = `
      <html>
        <body>
          <h1>详细内容测试</h1>
          <p>这是一个包含丰富内容的测试邮件</p>
          <ul>
            <li>测试ID: ${detailTestId}</li>
            <li>发送时间: ${new Date().toISOString()}</li>
            <li>内容类型: HTML + 文本</li>
          </ul>
        </body>
      </html>
    `
    
    await smtpService.sendEmail({
      to: [{ address: process.env.TEST_EMAIL_USERNAME || '' }],
      subject: `[TEST] 详细内容测试 - ${detailTestId}`,
      text: `详细内容测试邮件（纯文本版本），ID: ${detailTestId}`,
      html: richContent
    })
    
    const emailReceived = await waitForEmail(imapService, detailTestId, 30000)
    expect(emailReceived).toBe(true)
    
    // 获取邮件列表
    const emails = await imapService.fetchEmails({ limit: 10 })
    const testEmail = emails.find(email => email.subject.includes(detailTestId))
    expect(testEmail).toBeDefined()
    
    // 获取邮件详细内容
    const emailBody = await imapService.fetchEmailBody('INBOX', testEmail!.uid)
    
    expect(emailBody.text).toBeTruthy()
    expect(emailBody.html).toBeTruthy()
    expect(emailBody.text).toContain(detailTestId)
    expect(emailBody.html).toContain(detailTestId)
    
    console.log('✅ 邮件详细内容获取成功')
    
  }, 60000)
}) 