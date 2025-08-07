import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { 
  createTestIMAPService, 
  testConnection, 
  checkTestEnvironment 
} from '@/tests/helpers/email-test-utils'
import type { ImapEmailService } from '@/app/email/lib/email-service/mail-imap/email-service'

describe('IMAP 连接集成测试', () => {
  let imapService: ImapEmailService
  
  beforeAll(() => {
    // 检查测试环境
    const envCheck = checkTestEnvironment()
    if (!envCheck.isReady) {
      console.warn('⚠️ 测试环境未完全准备好:', envCheck.issues)
      // 在 CI 环境中可能需要 skip 测试
      if (process.env.CI === 'true') {
        console.log('CI 环境，跳过集成测试')
        return
      }
    }
  })
  
  beforeEach(() => {
    imapService = createTestIMAPService()
  })
  
  afterEach(async () => {
    if (imapService) {
      try {
        await imapService.disconnect()
      } catch (error) {
        console.warn('断开连接时出错:', error)
      }
    }
  })

  it('应该能够成功连接到 IMAP 服务器', async () => {
    const result = await testConnection(imapService, 'IMAP')
    
    expect(result.success).toBe(true)
    expect(result.duration).toBeLessThan(15000) // 15秒内完成连接
    expect(result.error).toBeNull()
    
    // 验证连接状态
    const status = imapService.getConnectionStatus()
    expect(status.connected).toBe(true)
    expect(status.serverInfo.host).toBeTruthy()
    expect(status.serverInfo.username).toBeTruthy()
  })

  it('应该能够列出邮件文件夹', async () => {
    await imapService.connect()
    
    const folders = await imapService.listFolders()
    
    expect(folders).toBeDefined()
    expect(Array.isArray(folders)).toBe(true)
    expect(folders.length).toBeGreaterThan(0)
    
    // 检查是否有收件箱
    const inbox = folders.find(folder => 
      folder.name.toLowerCase() === 'inbox' || 
      folder.path.toLowerCase() === 'inbox'
    )
    expect(inbox).toBeDefined()
    
    console.log('📁 可用文件夹:', folders.map(f => f.path))
  })

  it('应该能够获取邮件列表', async () => {
    await imapService.connect()
    
    const emails = await imapService.fetchEmails({ 
      limit: 5,
      folder: 'INBOX'
    })
    
    expect(Array.isArray(emails)).toBe(true)
    console.log(`📧 收件箱中有 ${emails.length} 封邮件`)
    
    if (emails.length > 0) {
      const firstEmail = emails[0]
      expect(firstEmail.uid).toBeDefined()
      expect(firstEmail.subject).toBeDefined()
      expect(firstEmail.from).toBeDefined()
      expect(firstEmail.date).toBeDefined()
      
      console.log('📩 最新邮件:', {
        subject: firstEmail.subject,
        from: firstEmail.from,
        date: firstEmail.date
      })
    }
  })

  it('应该能够处理错误的连接信息', async () => {
    // 创建错误配置的服务
    const { ImapEmailService } = await import('@/app/email/lib/email-service/mail-imap/email-service')
    const wrongService = new ImapEmailService({
      host: 'wrong-server.example.com',
      port: 993,
      username: 'wrong@example.com',
      password: 'wrongpassword',
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    })
    
    const result = await testConnection(wrongService, 'IMAP (错误配置)')
    
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    
    console.log('❌ 预期的错误信息:', result.error)
  })

  it('应该能够处理连接超时', async () => {
    // 创建超时配置的服务
    const { ImapEmailService } = await import('@/app/email/lib/email-service/mail-imap/email-service')
    const timeoutService = new ImapEmailService({
      host: process.env.RWTH_MAIL_SERVER || '',
      port: parseInt(process.env.RWTH_MAIL_SERVER_IMAP_PORT || '993'),
      username: process.env.TEST_EMAIL_USERNAME || '',
      password: process.env.TEST_EMAIL_PASSWORD || '',
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 1000, // 1秒超时，可能太短
      authTimeout: 1000
    })
    
    const startTime = Date.now()
    const result = await testConnection(timeoutService, 'IMAP (超时测试)')
    const duration = Date.now() - startTime
    
    // 超时测试可能成功也可能失败，主要测试是否在合理时间内返回
    expect(duration).toBeLessThan(10000) // 10秒内必须有结果
    
    if (!result.success) {
      console.log('⏰ 超时测试结果:', result.error)
    }
  }, 15000) // 这个测试本身允许15秒

  it('应该能够正确断开连接', async () => {
    await imapService.connect()
    expect(imapService.getConnectionStatus().connected).toBe(true)
    
    await imapService.disconnect()
    expect(imapService.getConnectionStatus().connected).toBe(false)
  })
}) 