import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import dotenv from 'dotenv'

// 加载测试环境变量
dotenv.config({ path: '.env.test' })
dotenv.config({ path: '.env.local' })

// 全局测试设置
beforeAll(async () => {
  console.log('🧪 开始测试环境初始化...')
  
  // 验证必要的环境变量
  const requiredEnvVars = [
    'RWTH_MAIL_SERVER',
    'RWTH_MAIL_SERVER_IMAP_PORT',
    'RWTH_MAIL_SERVER_SMTP_HOST',
    'RWTH_MAIL_SERVER_SMTP_PORT'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    console.warn(`⚠️  缺少环境变量: ${missingVars.join(', ')}`)
  }
  
  // 设置测试超时
  process.env.NODE_ENV = 'test'
})

afterAll(async () => {
  console.log('🧹 清理测试环境...')
})

// 每个测试前的设置
beforeEach(async () => {
  // 重置控制台，避免测试间干扰
  console.log('\n' + '='.repeat(50))
})

afterEach(async () => {
  // 清理可能的连接
  await new Promise(resolve => setTimeout(resolve, 100))
}) 