import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // 分离单元测试和集成测试
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.next'],
    
    // 环境配置
    environment: 'node',
    
    // 测试超时设置（集成测试需要更长时间）
    testTimeout: 30000,
    hookTimeout: 10000,
    
    // 并发设置
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
      }
    },
    
    // 测试分组
    workspace: [
      {
        // 单元测试 - 快速执行
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
          testTimeout: 5000,
        }
      },
      {
        // 集成测试 - 需要真实环境
        test: {
          name: 'integration', 
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          testTimeout: 60000,
          // 集成测试串行执行，避免资源冲突
          pool: 'threads',
          poolOptions: {
            threads: { singleThread: true }
          }
        }
      }
    ],
    
    // 覆盖率设置
    coverage: {
      provider: 'v8',
      include: ['app/**/*.ts', 'app/**/*.tsx'],
      exclude: [
        'app/**/*.test.ts',
        'app/**/*.d.ts',
        'node_modules',
        '.next'
      ],
      reporter: ['text', 'json', 'html']
    },
    
    // 全局设置
    globals: true,
    setupFiles: ['tests/helpers/test-setup.ts'],
  },
  
  // 路径解析
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/tests': path.resolve(__dirname, 'tests'),
    }
  },
  
  // 处理 Next.js 特殊模块
  define: {
    'process.env.NODE_ENV': '"test"'
  }
}) 