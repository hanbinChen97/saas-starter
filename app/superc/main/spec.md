# SuperC Main Page Specification

## Overview
SuperC 主功能页面，用户填写个人信息和预约设置的核心页面。提供完整的用户资料填写表单，包括个人信息、联系方式、出生日期等，用于 SuperC 预约系统的用户档案创建。

## File Structure
```
main/
├── page.tsx        # 用户资料填写页面
├── actions.ts      # 服务器端操作（创建/取消预约）
└── spec.md         # 本规格说明文件
```

## Page Layout

### `/page.tsx` - 用户资料填写页面
- **组件**: `SuperCPage`
- **功能**: SuperC 用户信息收集和预约创建

### 页面结构
- **Header**: SuperCHeader 导航组件
- **Marquee**: 感谢捐赠者滚动横幅
- **Main Content**: 
  - 页面标题和说明
  - 捐赠支持卡片
  - 用户信息填写表单

## Components Used

### UI Components
- **Card, CardContent, CardHeader, CardTitle**: 卡片布局组件
- **Button**: 按钮组件
- **Input**: 输入框组件
- **Label**: 标签组件
- **SuperCHeader**: 页面头部组件
- **Marquee**: 滚动横幅组件

### Icons
- **Search, Loader2, CheckCircle, Coffee**: Lucide React 图标

## Hooks & APIs

### React Hooks
- **useState**: 管理表单状态、提交状态、错误状态
- **useRouter**: Next.js 路由导航

### State Management
- **formData**: 表单数据状态
  - vorname, nachname (姓名)
  - phone, email (联系方式)  
  - geburtsdatumDay/Month/Year (出生日期)
- **isSubmitting**: 提交加载状态
- **submitComplete**: 提交成功状态
- **errors**: 字段验证错误
- **generalError**: 通用错误信息

### API Integration
- **createUserProfile**: Server Action，创建用户预约档案
- **FormData**: 表单数据提交格式

## Form Fields

### Required Fields
- **Vorname**: 德文名字，必填
- **Nachname**: 德文姓氏，必填  
- **Email**: 邮箱地址，必填
- **Phone**: 电话号码，必填，格式：015712344321
- **Geburtsdatum**: 出生日期，分为日/月/年三个字段

### Default Values
- **preferredLocations**: 默认 "superc"

## Technical Details

### Form Validation
- 客户端基础验证（required 属性）
- 服务器端 Zod schema 验证
- 错误信息显示和字段高亮

### Submit Flow
1. 表单数据收集到 FormData 对象
2. 调用 createUserProfile Server Action
3. 处理返回结果：成功/字段错误/通用错误
4. 成功后1.5秒延迟跳转到 `/superc/profile`

### Error Handling
- **Field Errors**: 字段级别验证错误，红色边框提示
- **General Errors**: 业务逻辑错误（如重复注册）
- **Success Message**: 绿色成功提示

### Navigation
- 表单提交成功后自动跳转到个人资料页面
- 使用 `router.push('/superc/profile')`

## Dependencies
- `@/app/components/ui/*` - UI 组件库
- `lucide-react` - 图标库
- `next/navigation` - Next.js 导航
- `react-fast-marquee` - 滚动横幅
- `./actions` - Server Actions