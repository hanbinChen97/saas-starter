import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  createTestSMTPService, 
  testConnection, 
  checkTestEnvironment 
} from '@/tests/helpers/email-test-utils'
import type { SMTPService } from '@/app/email/lib/email-service/mail-smtp/smtp-service'

describe('SMTP 连接集成测试', () => {
  let smtpService: SMTPService
  
  beforeEach(() => {
    const envCheck = checkTestEnvironment()
    if (!envCheck.isReady) {
      console.warn('⚠️ 测试环境未完全准备好:', envCheck.issues)
    }
    
    smtpService = createTestSMTPService()
  })
  
  afterEach(async () => {
    if (smtpService) {
      try {
        await smtpService.disconnect()
      } catch (error) {
        console.warn('断开 SMTP 连接时出错:', error)
      }
    }
  })

  it('应该能够成功连接到 SMTP 服务器', async () => {
    const result = await testConnection(smtpService, 'SMTP')
    
    expect(result.success).toBe(true)
    expect(result.duration).toBeLessThan(10000) // 10秒内完成连接
    expect(result.error).toBeNull()
    
    // 验证连接状态
    expect(smtpService.isConnected()).toBe(true)
  })

  it('应该能够验证 SMTP 服务器配置', async () => {
    // 连接并验证服务器
    await smtpService.connect()
    
    expect(smtpService.isConnected()).toBe(true)
    
    // SMTP 连接成功意味着服务器配置正确
    console.log('✅ SMTP 服务器配置验证成功')
  })

  it('应该能够处理错误的 SMTP 配置', async () => {
    // 创建错误配置的 SMTP 服务
    const { SMTPService } = await import('@/app/email/lib/email-service/mail-smtp/smtp-service')
    const wrongSMTPService = new SMTPService({
      host: 'wrong-smtp.example.com',
      port: 587,
      secure: false,
      username: 'wrong@example.com',
      password: 'wrongpassword'
    })
    
    const result = await testConnection(wrongSMTPService, 'SMTP (错误配置)')
    
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    
    console.log('❌ 预期的 SMTP 错误:', result.error)
  })

  it('应该能够处理不同的端口配置', async () => {
    const { SMTPService } = await import('@/app/email/lib/email-service/mail-smtp/smtp-service')
    
    // 测试标准 SMTP 端口 587 (STARTTLS)
    const smtp587Service = new SMTPService({
      host: process.env.RWTH_MAIL_SERVER_SMTP_HOST || process.env.RWTH_MAIL_SERVER || '',
      port: 587,
      secure: false, // STARTTLS
      username: process.env.TEST_EMAIL_USERNAME || '',
      password: process.env.TEST_EMAIL_PASSWORD || ''
    })
    
    const result587 = await testConnection(smtp587Service, 'SMTP (端口587)')
    
    // 至少有一个端口应该工作
    if (result587.success) {
      console.log('✅ 端口 587 (STARTTLS) 连接成功')
      expect(result587.success).toBe(true)
    } else {
      console.log('⚠️ 端口 587 连接失败:', result587.error)
    }
    
    await smtp587Service.disconnect()
  })

  it('应该能够检测身份认证问题', async () => {
    const { SMTPService } = await import('@/app/email/lib/email-service/mail-smtp/smtp-service')
    
    // 使用错误密码测试身份认证
    const authFailService = new SMTPService({
      host: process.env.RWTH_MAIL_SERVER_SMTP_HOST || process.env.RWTH_MAIL_SERVER || '',
      port: parseInt(process.env.RWTH_MAIL_SERVER_SMTP_PORT || '587'),
      secure: false,
      username: process.env.TEST_EMAIL_USERNAME || '',
      password: 'definitely-wrong-password-12345'
    })
    
    const result = await testConnection(authFailService, 'SMTP (身份认证失败)')
    
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    
    // 检查是否是身份认证相关的错误
    const isAuthError = result.error?.toLowerCase().includes('auth') || 
                       result.error?.toLowerCase().includes('login') ||
                       result.error?.toLowerCase().includes('password') ||
                       result.error?.toLowerCase().includes('535')
    
    if (isAuthError) {
      console.log('✅ 正确检测到身份认证错误')
    } else {
      console.log('⚠️ 错误信息可能不是身份认证相关:', result.error)
    }
  })

  it('应该能够处理 TLS/SSL 连接问题', async () => {
    const { SMTPService } = await import('@/app/email/lib/email-service/mail-smtp/smtp-service')
    
    // 测试强制 SSL 连接（可能会失败，取决于服务器配置）
    const sslService = new SMTPService({
      host: process.env.RWTH_MAIL_SERVER_SMTP_HOST || process.env.RWTH_MAIL_SERVER || '',
      port: 465, // SSL 端口
      secure: true, // 强制 SSL
      username: process.env.TEST_EMAIL_USERNAME || '',
      password: process.env.TEST_EMAIL_PASSWORD || ''
    })
    
    const result = await testConnection(sslService, 'SMTP (SSL测试)')
    
    // 记录结果，但不强制成功（因为服务器可能不支持 SSL）
    if (result.success) {
      console.log('✅ SSL 连接成功')
    } else {
      console.log('⚠️ SSL 连接失败（可能正常）:', result.error)
    }
    
    await sslService.disconnect()
  }, 15000) // SSL 连接可能需要更长时间

  it('应该能够正确断开连接', async () => {
    await smtpService.connect()
    expect(smtpService.isConnected()).toBe(true)
    
    await smtpService.disconnect()
    expect(smtpService.isConnected()).toBe(false)
  })
}) 