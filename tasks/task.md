
### 1. 路由结构

- `app/(dashboard)/dashboard/mail/page.tsx`：只显示邮箱登录界面。
- `app/(dashboard)/dashboard/mail/[id]/page.tsx`：显示邮件列表和详情，`[id]` 为邮箱地址。

### 2. 登录流程

- 用户在 `/dashboard/mail` 输入邮箱地址和密码，点击登录。
- 登录成功后，自动跳转到 `/dashboard/mail/[email address]`。
- 登录失败则提示错误信息。

### 3. 邮件列表与详情

- `/dashboard/mail/[id]` 页面根据 URL 中的 `[id]`（即邮箱地址）加载对应邮箱的邮件列表。
- 页面采用双栏布局，左侧为邮件列表，右侧为邮件详情。
- 点击邮件时，仅更新右侧详情内容，不改变 URL。

### 4. 参数获取

- 在 `/dashboard/mail/[id]/page.tsx` 中，使用 `useParams` 获取 `[id]`，并据此加载邮箱数据。
- 邮箱登录信息（如 token、session）建议存储在 context 或 sessionStorage，避免敏感信息泄露到 URL。

### 5. 状态管理

- 邮箱登录状态、邮件列表、选中邮件等用 React context 或 useState 管理。
- 如果用户未登录，直接访问 `/dashboard/mail/[id]` 时，自动重定向到 `/dashboard/mail` 登录页。

### 6. 组件复用

- 邮箱登录表单、邮件列表、邮件详情等组件可复用，无需大改。

### 7. 旧页面清理

- 删除或废弃 `app/(dashboard)/dashboard/emails/page.tsx`，避免路由混乱。

---

## 需要修改/新增的文件

1. **新建/迁移页面**
   - `app/(dashboard)/dashboard/mail/page.tsx`（邮箱登录页）
   - `app/(dashboard)/dashboard/mail/[id]/page.tsx`（主页面，迁移原有邮件逻辑）

2. **登录逻辑**
   - 登录成功后跳转到 `/dashboard/mail/[email address]`

3. **参数获取**
   - 在 `[id]/page.tsx` 用 `useParams` 获取邮箱地址

4. **未登录重定向**
   - `/dashboard/mail/[id]` 页面如未登录，自动跳转到 `/dashboard/mail`

5. **删除旧页面**
   - 删除 `app/(dashboard)/dashboard/emails/page.tsx`（或重命名为备份）

- 用邮箱地址作为 `[id]` 很直观，但要注意邮箱地址中包含特殊字符（如 @、.），建议在 URL 中做 encode/decode 处理。
  -  那就取邮箱地址的@之前的部分，去除"." 作为 id。

你觉得这个 plan 是否清晰？是否需要我帮你细化某一步或给出具体的编码建议？