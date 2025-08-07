import { ImapEmailService } from '@/app/email/lib/email-service/mail-imap/email-service'
import { SMTPService } from '@/app/email/lib/email-service/mail-smtp/smtp-service'
import type { EmailConnectionConfig } from '@/app/email/lib/email-service/mail-imap/types'
import type { SMTPConfig } from '@/app/email/lib/email-service/mail-smtp/smtp-service'

// 测试邮件配置
export const getTestEmailConfig = (): EmailConnectionConfig => {
  const missingVars: string[] = []
  
  const config = {
    host: process.env.RWTH_MAIL_SERVER || '',
    port: parseInt(process.env.RWTH_MAIL_SERVER_IMAP_PORT || '993'),
    username: process.env.TEST_EMAIL_USERNAME || '',
    password: process.env.TEST_EMAIL_PASSWORD || '',
    tls: process.env.RWTH_MAIL_SERVER_ENCRYPTION === 'SSL',
    tlsOptions: { 
      rejectUnauthorized: false,
      secureProtocol: 'TLSv1_2_method'
    },
    authTimeout: 10000,
    connTimeout: 15000,
    smtpHost: process.env.RWTH_MAIL_SERVER_SMTP_HOST,
    smtpPort: parseInt(process.env.RWTH_MAIL_SERVER_SMTP_PORT || '587'),
    smtpSecure: process.env.RWTH_MAIL_SERVER_SMTP_SECURE === 'true',
  }
  
  // 检查必要字段
  if (!config.host) missingVars.push('RWTH_MAIL_SERVER')
  if (!config.username) missingVars.push('TEST_EMAIL_USERNAME')
  if (!config.password) missingVars.push('TEST_EMAIL_PASSWORD')
  
  if (missingVars.length > 0) {
    throw new Error(`缺少测试环境变量: ${missingVars.join(', ')}`)
  }
  
  return config
}

export const getTestSMTPConfig = (): SMTPConfig => {
  const emailConfig = getTestEmailConfig()
  
  return {
    host: emailConfig.smtpHost || emailConfig.host,
    port: emailConfig.smtpPort || 587,
    secure: emailConfig.smtpSecure || false,
    username: emailConfig.username,
    password: emailConfig.password,
    senderEmail: emailConfig.username
  }
}

// 创建测试用的邮件服务实例
export const createTestIMAPService = (): ImapEmailService => {
  const config = getTestEmailConfig()
  return new ImapEmailService(config)
}

export const createTestSMTPService = (): SMTPService => {
  const config = getTestSMTPConfig()
  return new SMTPService(config)
}

// 测试邮件内容生成器
export const generateTestEmail = (testId: string) => ({
  subject: `[TEST] 集成测试邮件 - ${testId}`,
  text: `这是一封测试邮件，测试ID: ${testId}\n发送时间: ${new Date().toISOString()}`,
  html: `
    <h2>集成测试邮件</h2>
    <p><strong>测试ID:</strong> ${testId}</p>
    <p><strong>发送时间:</strong> ${new Date().toISOString()}</p>
    <p>这是一封自动化集成测试邮件，请忽略。</p>
  `
})

// 连接测试辅助函数
export const testConnection = async (service: ImapEmailService | SMTPService, serviceName: string) => {
  const startTime = Date.now()
  
  try {
    await service.connect()
    const duration = Date.now() - startTime
    console.log(`✅ ${serviceName} 连接成功 (${duration}ms)`)
    return { success: true, duration, error: null }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ ${serviceName} 连接失败 (${duration}ms):`, error)
    return { 
      success: false, 
      duration, 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

// 清理测试邮件
export const cleanupTestEmails = async (imapService: ImapEmailService, testId: string) => {
  try {
    await imapService.connect()
    const emails = await imapService.fetchEmails({ limit: 50 })
    
    const testEmails = emails.filter(email => 
      email.subject.includes(`[TEST]`) && 
      email.subject.includes(testId)
    )
    
    for (const email of testEmails) {
      await imapService.deleteEmail(email.uid)
    }
    
    console.log(`🧹 清理了 ${testEmails.length} 封测试邮件`)
    await imapService.disconnect()
  } catch (error) {
    console.warn('清理测试邮件时出错:', error)
  }
}

// 等待邮件到达
export const waitForEmail = async (
  imapService: ImapEmailService, 
  testId: string, 
  maxWaitTime = 30000
): Promise<boolean> => {
  const startTime = Date.now()
  const checkInterval = 2000
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const emails = await imapService.fetchEmails({ limit: 10 })
      const testEmail = emails.find(email => 
        email.subject.includes(`[TEST]`) && 
        email.subject.includes(testId)
      )
      
      if (testEmail) {
        console.log(`📧 找到测试邮件: ${testEmail.subject}`)
        return true
      }
      
      console.log(`⏳ 等待邮件到达... (${Math.round((Date.now() - startTime) / 1000)}s)`)
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    } catch (error) {
      console.warn('检查邮件时出错:', error)
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
  }
  
  return false
}

// 环境检查
export const checkTestEnvironment = () => {
  const issues: string[] = []
  
  if (!process.env.TEST_EMAIL_USERNAME) {
    issues.push('未设置 TEST_EMAIL_USERNAME')
  }
  
  if (!process.env.TEST_EMAIL_PASSWORD) {
    issues.push('未设置 TEST_EMAIL_PASSWORD')
  }
  
  if (!process.env.RWTH_MAIL_SERVER) {
    issues.push('未设置 RWTH_MAIL_SERVER')
  }
  
  return {
    isReady: issues.length === 0,
    issues
  }
} 