目标（只用最简单的 PayPal Checkout）总结成一个 **背景背景 + 开发计划 (dev plan)**。
这样你可以一步步实现，从 `paypal.me → JS SDK + Next.js backend`。

---

## 🧩 Background 背景理解

你要做的不是复杂的 vault / card checkout，而是最基本的 **PayPal Standard Checkout**：

> 用户点击按钮 → 跳转 PayPal → 登录确认 → 返回网站 → 你的 backend 完成 capture。

所以要理解的关键是两个阶段：

| 阶段           | 动作                       | 含义                          |
| ------------ | ------------------------ | --------------------------- |
| **Approval** | 用户点击 PayPal 页面“确认付款”     | 用户授权你可以收钱（但钱还没转）            |
| **Capture**  | 你的 backend 调用 PayPal API | 真正完成收款 + 触发后续逻辑（更新数据库、发邮件等） |

✅ 前端只是展示按钮 + 调你自己的 API。
✅ 真正的钱流发生在 backend 调 PayPal 官方 API 的时候。

---

## 🧱 Dev Plan 开发计划

---

### **Step 1: 前端按钮 (Frontend Button)**

**目标**: 在页面上显示 PayPal 按钮并让用户能付款。

**动作：**

1. 加载 SDK：

   ```html
   <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&disable-funding=card,credit"></script>
   ```

   → 只启用 PayPal，不展示信用卡。

2. 渲染按钮：

   ```html
   <div id="paypal-button-container"></div>
   <script>
     paypal.Buttons({
       createOrder: function(data, actions) {
         return fetch('/api/orders/create', { method: 'POST' })
           .then(res => res.json())
           .then(data => data.orderID);
       },
       onApprove: function(data, actions) {
         return fetch('/api/orders/capture', {
           method: 'POST',
           body: JSON.stringify({ orderID: data.orderID }),
         })
           .then(res => res.json())
           .then(result => alert('Payment success!'));
       }
     }).render('#paypal-button-container');
   </script>
   ```

---

### **Step 2: PayPal Dashboard 设置**

**目标**: 获取 Sandbox 测试凭证。

**动作：**

1. 登录 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)。
2. 在 “My Apps & Credentials” → Sandbox → “Create App”。
3. 复制以下信息：

   * `Client ID` → 用于前端 SDK
   * `Secret` → 用于后端 API
4. 测试账户 (buyer/seller sandbox)：

   * Buyer: 用户测试付款用
   * Business: 收钱账号

---

### **Step 3: 后端 API (Next.js)**

**目标**: 与 PayPal 官方 API 通信，创建订单 + 捕获订单。

**主要接口：**

1️⃣ `/api/orders/create`

```js
export async function POST(req) {
  const res = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${CLIENT_ID}:${SECRET}`)}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { value: '10.00' } }]
    })
  });
  const data = await res.json();
  return Response.json({ orderID: data.id });
}
```

2️⃣ `/api/orders/capture`

```js
export async function POST(req) {
  const { orderID } = await req.json();
  const res = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${CLIENT_ID}:${SECRET}`)}`
    }
  });
  const data = await res.json();
  // ✅ 在这里执行你的业务逻辑，例如：
  // saveToDB(data); sendEmail();
  return Response.json(data);
}
```

---

## 🚀 Final Checklist

| 项目                             | 状态 | 说明                  |
| ------------------------------ | -- | ------------------- |
| PayPal App (client-id, secret) | ☐  | 在 Dashboard 创建      |
| Sandbox buyer/seller accounts  | ☐  | 用于测试付款              |
| 前端按钮渲染成功                       | ☐  | 显示 PayPal 按钮        |
| 后端 API create/capture 工作正常     | ☐  | 成功创建+捕获订单           |
| 付款成功后逻辑执行                      | ☐  | 数据库 / 邮件 / redirect |

---

是否希望我帮你写一个 **完整 minimal project 结构 (Next.js 文件夹 + 路径 + env)**？
那样你直接 `copy + run` 就能开始调试。

---

## 在本项目中的具体落地步骤（文件级别）

下面是基于当前仓库结构（Next.js App Router + `app/lib/*` + `app/api/*`）的最小可用实现清单。只做标准 PayPal Buttons + Orders API（create + capture），不做 vault/card。

说明：

- 前端用 PayPal JS SDK 的 Buttons 组件；推荐用 `@paypal/paypal-js` 异步加载脚本，或直接 `<script>` 也可以。
- 后端严格按 PayPal 推荐：先用 OAuth2 取 access_token（Basic 认证），随后所有 Orders 接口都用 Bearer access token（不是 Basic）。
- 你的业务更新（写库/发通知）放在 capture 成功之后。

### 0) 环境变量（新增/更新）

修改文件：

- `.env` / `.env.example`

新增键：

- `PAYPAL_ENV=sandbox`（或 live）
- `PAYPAL_CLIENT_ID=your_sandbox_client_id`
- `PAYPAL_SECRET=your_sandbox_secret`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id`（给前端 SDK 用）

可复用已存在的：

- `BASE_URL=https://localhost:3000`（项目已有，用于重定向场景可共享）

注意：Client ID 需要在前端可见，故以 `NEXT_PUBLIC_` 前缀暴露；Secret 仅后端可读。

### 1) 后端封装（新建）

文件：`app/lib/payments/paypal.ts`

新增导出函数（名称建议，便于复用/测试）：

- `getPayPalBaseUrl(): string`
  - 依据 `PAYPAL_ENV` 返回 `https://api-m.sandbox.paypal.com` 或 `https://api-m.paypal.com`。

- `getPayPalAccessToken(): Promise<string>`
  - POST `${base}/v1/oauth2/token`，`Authorization: Basic base64(clientId:secret)`，`Content-Type: application/x-www-form-urlencoded`，body: `grant_type=client_credentials`。
  - 返回 `access_token` 字符串。

- `createPayPalOrder(params: { amount: string; currency?: string; referenceId?: string; description?: string; }): Promise<{ id: string }>`
  - 使用 Bearer token 调 `${base}/v2/checkout/orders`，body:
    - `intent: 'CAPTURE'`
    - `purchase_units: [{ amount: { currency_code: currency || 'USD', value: amount }, reference_id: referenceId, description }]`
  - 返回 `{ id }`（order id）。

- `capturePayPalOrder(orderID: string): Promise<any>`
  - 使用 Bearer token 调 `${base}/v2/checkout/orders/${orderID}/capture`。
  - 返回完整 capture 响应（你会在 API 路由里判断状态并执行业务逻辑）。

可选增强：

- 传递 `PayPal-Request-Id` 头做幂等。
- 简单错误归一化函数 `assertOrderCompleted(captureRes)` 检查 `status === 'COMPLETED'`。

### 2) 后端 API 路由（新建）

创建两个 App Router API：

1) `app/api/paypal/orders/create/route.ts`

- 方法：`POST`
- 入参（JSON，可选）：`{ amount?: string; currency?: string; referenceId?: string; description?: string }`
- 动作：调用 `createPayPalOrder`；若未传 amount，可用你的默认金额（如捐赠默认 10.00）。
- 出参：`{ orderID: string }`

2) `app/api/paypal/orders/capture/route.ts`

- 方法：`POST`
- 入参（JSON，必填）：`{ orderID: string }`
- 动作：调用 `capturePayPalOrder(orderID)`；校验 `status==='COMPLETED'`；成功后调用你的业务逻辑（写库/发邮件/记录日志）。
- 出参：完整 `capture` 响应或你裁剪后的关键信息。

业务逻辑位置建议：

- 如需记录流水，可在 `app/lib/db/queries.ts` 新增：
  - `savePayPalOrderCapture(userId: number | null, data: any)`
  - 视你的表结构而定（当前仓库未内置 PayPal 表，先留 TODO）。

### 3) 前端按钮组件（新建）

文件：`app/superc/components/PayPalButton.tsx`

职责：

- 加载 PayPal JS SDK（推荐 `@paypal/paypal-js` 的 `loadScript`）。
- 渲染 Buttons：
  - `createOrder`: `POST /api/paypal/orders/create` → 返回 `orderID`。
  - `onApprove`: `POST /api/paypal/orders/capture` with `{ orderID }`。
  - 可加 `onError`/`onCancel` 兜底。

SDK 加载参数建议：

- `client-id: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `components=buttons`
- `intent=capture`
- `disable-funding=card,credit`（只留 PayPal 资金来源）
- 可选 `currency=USD`

备注：如果不想引入依赖，也可直接在组件里插入 `<script src="https://www.paypal.com/sdk/js?..." />` 再 `paypal.Buttons({...}).render(...)`。

### 4) 页面集成位置（修改）

根据你的产品意图（看起来是捐赠/支持）：

- 在 `app/superc/components/DonationCard.tsx` 中引入并渲染 `<PayPalButton />`；或
- 在 `app/superc/main/page.tsx` 的主要 CTA 区域加入 `<PayPalButton />`；或
- 若面向统一定价页，则在 `app/pricing/page.tsx` 增加一列「PayPal 支付」卡片，使用相同按钮组件。

你可以同时保留 Stripe（订阅）和 PayPal（一次性/赞助）。

### 5) 数据与安全要点

- 仅在后端发起 `create`/`capture`，前端不接触 Secret。
- 不信任前端传入金额：如需前端可变金额（捐赠），你也应在后端做校验/限额。
- 捕获成功前不要发货/开通权限；一切以 `capture` 返回为准。
- 记录最小关键信息：`order.id`、`status`、`payer.email_address`、`purchase_units[].payments.captures[].id/amount`。
- 幂等：对 `capture` 可使用 `PayPal-Request-Id` 防重复写库。

### 6) 可选：Webhook（后续增强）

文件：`app/api/paypal/webhook/route.ts`

- 验证签名（PayPal Webhook 验证接口）；处理 `CHECKOUT.ORDER.APPROVED`、`PAYMENT.CAPTURE.COMPLETED` 等事件，和 `capture` 结果对账。
- 这一步不是最小闭环所必需，建议在上线前补齐。

### 7) 测试清单（Sandbox）

- Dashboard 创建 Sandbox App，拿到 `client-id`/`secret`，配置到 `.env`。
- 用 Buyer Sandbox 账号在前端完成一次支付：
  1. 页面能渲染 PayPal 按钮；
  2. 点击 → 弹窗登录 → Confirm；
  3. `onApprove` → 后端 `/capture` 返回 `COMPLETED`；
  4. 业务逻辑触发（控制台/日志/数据库有记录）。
- 错误用例：取消支付、网络错误、订单已捕获重复调用，均应有明显提示且不报未捕获异常。

---

## 任务拆解（逐文件）

1) `app/lib/payments/paypal.ts`

- [ ] 实现：`getPayPalBaseUrl()`
- [ ] 实现：`getPayPalAccessToken()`
- [ ] 实现：`createPayPalOrder({ amount, currency, referenceId, description })`
- [ ] 实现：`capturePayPalOrder(orderID)`

2) `app/api/paypal/orders/create/route.ts`

- [ ] `POST`：读取入参 → 调 `createPayPalOrder` → 返回 `{ orderID }`

3) `app/api/paypal/orders/capture/route.ts`

- [ ] `POST`：读取 `{ orderID }` → 调 `capturePayPalOrder` → 校验状态 → 执行业务逻辑（TODO）→ 返回结果

4) `app/superc/components/PayPalButton.tsx`

- [ ] 加载 SDK（`@paypal/paypal-js` 或 `<script>`）
- [ ] `createOrder`：`/api/paypal/orders/create`
- [ ] `onApprove`：`/api/paypal/orders/capture`
- [ ] 失败与取消处理

5) 集成位（择一或多个）

- [ ] `app/superc/components/DonationCard.tsx` 引入 `<PayPalButton />`
- [ ] 或 `app/superc/main/page.tsx`
- [ ] 或 `app/pricing/page.tsx`

6) 环境变量

- [ ] `.env`/`.env.example` 写入 4 个键（见上）

---

## 参考参数（来自 PayPal JS SDK / react-paypal-js）

- JS SDK 常用 query：`client-id=...&components=buttons&intent=capture&disable-funding=card,credit&currency=USD`
- React 装载建议：`@paypal/paypal-js` 的 `loadScript({ clientId, components: ["buttons"], intent: "capture", currency: "USD", disableFunding: "card,credit" })`
- 标准回调：`createOrder` → 返回 `orderID`；`onApprove` → 交给后端 `capture` 再提示用户成功。

如需我直接把上述文件一次性创建好（包含最小实现），告诉我你希望按钮出现在哪个页面、默认金额与币种，我就可以落地代码并自测。
