# 邮件 AI 草稿（AI Draft）功能总结

## 1. 功能与交互流程

- 用户在邮件详情页（EmailView）点击“Reply”按钮，弹出回复界面。
- 回复界面左侧为回复输入框，右侧为 AI 聊天助手（ChatInterface）。
- 用户可点击“✨ AI Draft”按钮，自动生成智能回复草稿，草稿内容会自动填充到回复输入框。
- 用户可直接编辑 AI 草稿内容，或选择 AI 推荐的修改建议（如语气、长度、正式度等），一键替换草稿。
- 用户还可在右侧与 AI 聊天，进一步优化草稿，AI 会根据对话内容实时调整草稿内容。（todo：这一步还有问题，需要优化）
- 用户最终可直接发送或手动编辑后发送。

## 2. 技术实现要点

### 2.1 draft 的生成与注入
- draft 的生成由 useAIReply hook 管理，点击“AI Draft”按钮时调用 generateReply，向 /api/email-reply 发起请求，返回 draftReply。
- 重点是 draftReply，这个是 ai 生成的草稿，然后被 page 展示。
- EmailView 组件通过 useEffect 监听 draftReply 变化，自动 setReplyText(draftReply)，实现 draft 注入到回复输入框（textarea）。
- 用户手动编辑 textarea 内容时，replyText 独立于 draftReply，保证用户可控。

### 2.2 AI 推荐与修改
- useAIReply 返回 modifications（AI 推荐的草稿修改建议），EmailView 渲染为按钮，点击后直接替换 replyText。
- applyModification 会 setDraftReply，EmailView 也同步 setReplyText，保证草稿内容一致。

### 2.3 ChatInterface 协同
- 右侧 ChatInterface 作为 AI 聊天助手，展示 conversationHistory。
- 用户可输入“请帮我更正式/更简洁”等，onSendMessage 触发 useAIReply.sendMessage，AI 返回新 draftReply 并更新 conversationHistory。（todo：用户的输入要结合draftReply，发送给 llm，然后返回新的 response，里面包含新的 draftReply，解析这个 response，然后更新 conversationHistory 在 chat ui，更新 draftReply 在 textarea 里）
- EmailView 监听 draftReply 变化，自动同步到 replyText，实现 AI 聊天与草稿实时联动。

### 2.4 关键代码片段

- draft 注入：
```ts
useEffect(() => {
  if (draftReply) {
    setReplyText(draftReply);
  }
}, [draftReply]);
```
- 生成 AI 草稿：
```ts
<button onClick={generateReply}>AI Draft</button>
```
- AI 推荐修改：
```ts
modifications.map((mod) => (
  <button onClick={() => { applyModification(mod); setReplyText(mod.replacement); }}>
    {mod.title}
  </button>
))
```
- 聊天协同：
```ts
<ChatInterface onSendMessage={sendMessage} conversationHistory={conversationHistory} />
```

## 3. 总结与建议
- 该实现将 AI 草稿与用户手动编辑、AI 聊天助手深度融合，支持一键生成、智能修改、对话式优化。
- 建议：
  - draftReply 只做“AI 建议”，replyText 始终可编辑，避免 AI draft 覆盖用户输入。
  - 可增加“恢复 AI 草稿/清空/撤销”等功能，提升用户体验。
  - AI 推荐建议可扩展为自定义 prompt，提升灵活性。


使用 vercel ai sdk, zod 来实现 ai 的调用。

## 4. Zod 验证与数据安全

### 4.1 LLM 响应验证
为了确保 LLM 返回的 JSON 数据结构正确且安全，我们使用 Zod 进行严格的数据验证：

```ts
// 在 app/lib/email-ai/ai-prompt.ts 中定义的验证 schema
export const EmailModificationSchema = z.object({
  id: z.string(),
  type: z.enum(['tone', 'length', 'formality', 'language', 'custom']),
  title: z.string(),
  description: z.string(),
  replacement: z.string().min(1, 'Replacement text cannot be empty')
});

export const EmailReplyResponseSchema = z.object({
  draftReply: z.string().min(1, 'Draft reply cannot be empty'),
  modifications: z.array(EmailModificationSchema).min(1, 'At least one modification is required'),
  aiResponse: z.string().optional()
});
```

### 4.2 验证函数
使用 `validateEmailReplyResponse` 函数来验证 LLM 返回的数据：

```ts
export function validateEmailReplyResponse(data: any): EmailReplyResponse {
  try {
    return EmailReplyResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid LLM response format: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}
```

### 4.3 在 API 路由中使用验证
在 `/api/email-reply` 路由中应用验证：

```ts
import { validateEmailReplyResponse } from '@/lib/email-ai/ai-prompt';

// 在处理 LLM 响应时
try {
  const rawResponse = await llmCall(prompt);
  const parsedResponse = JSON.parse(rawResponse);
  const validatedResponse = validateEmailReplyResponse(parsedResponse);
  
  return Response.json(validatedResponse);
} catch (error) {
  console.error('LLM response validation failed:', error);
  return Response.json({ error: 'Invalid AI response format' }, { status: 500 });
}
```

### 4.4 验证的好处
- **数据安全**：防止恶意或格式错误的数据进入系统
- **类型安全**：确保前端接收到的数据结构符合预期
- **错误处理**：提供详细的错误信息，便于调试
- **一致性**：保证所有 AI 响应都遵循相同的数据格式
- **防注入**：验证字符串长度和内容，防止恶意内容注入

### 4.5 多语言支持验证
针对德语和英语双语功能，验证确保：
- `draftReply` 内容非空且有意义
- `modifications` 数组包含 4 个元素（3个同语言 + 1个翻译）
- `type` 字段包含新增的 `language` 类型
- 所有替换文本都不为空