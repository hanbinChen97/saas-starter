下面给你一份**可直接执行的 Plan**（不贴具体代码）。目标：

1. **Login Page**：跳转 **Matrix SSO**（Keycloak→Google）；
2. **Chat Page**：显示消息、监听并触发你的 **function**。

---

# 项目结构（App Router）

```
app/
  login/page.tsx           # 登录页（触发 SSO）
  matrix/callback/page.tsx # 回调页（用 loginToken 换 Access Token）
  chat/page.tsx            # 聊天页（显示消息 + 触发函数）
  api/trigger/route.ts     # 触发器后端（MVP 可打印/入队）
_components/
  matrixClient.ts          # 封装 matrix client 创建 & 状态（前端）
```

---

# 环境变量（.env.local）

* `NEXT_PUBLIC_MATRIX_HS_URL=https://matrix.dbis.rwth-aachen.de`
* （可选）`NEXT_PUBLIC_ELEMENT_WEB_URL=https://chat.dbis.rwth-aachen.de`

> 英: Only the **homeserver URL** is needed client-side. You **do not** configure Keycloak/Google in your frontend.

---

# 页面 1：Login Page（redirect to Matrix SSO）

**目标 / Goal**

* **点击**登录 → **重定向**到 `/_matrix/client/v3/login/sso/redirect?redirectUrl=<你的回调>`
* 回调指向：`http://localhost:3000/matrix/callback`（开发）或线上域名

**关键步骤 / Key steps**

* 读取 `NEXT_PUBLIC_MATRIX_HS_URL`
* 生成 `redirectUrl`（本地或生产，基于 `window.location.origin`）
* 执行 `window.location.href = {HS}/_matrix/client/v3/login/sso/redirect?redirectUrl=<...>`
* （可选）在按钮上加 **loading**、错误提示

**验证点 / Checks**

* 浏览器跳到 Keycloak → Google → 登录完成
* 登录完成后，地址栏应回到 `/matrix/callback?loginToken=...`

---

# 页面 2：Callback Page（exchange loginToken）

**目标 / Goal**

* 从 **URL** 拿到 **`loginToken`**
* **POST** `{HS}/_matrix/client/v3/login` with `{ "type": "m.login.token", "token": "<loginToken>" }`
* 得到 **Access Token**、`user_id`、`device_id`
* **保存** Token（localStorage/IndexedDB）→ **跳转** `/chat`

**关键点 / Key points**

* **幂等 / Idempotent**：同一个 `loginToken` 只能使用一次；失败时提示重登
* **存储 / Storage**：仅保存 **Matrix Access Token**；不要保存 Google/Keycloak 凭证
* **安全 / Security**：生产用 **HTTPS**，并考虑 Token 过期/清除

---

# 页面 3：Chat Page（show messages & trigger）

**目标 / Goal**

* 用 **Access Token** + **HS URL** 创建 **matrix-js-sdk client**（仅前端）
* `startClient()` 后：

  * **列出房间**（`client.getRooms()`）
  * **展示时间线**（过滤 `m.room.message`，`content.msgtype === "m.text"`）
  * **监听** `Room.timeline` 来**接收新消息**
  * **触发**：收到消息后 `fetch('/api/trigger', { body: JSON.stringify(event) })`

**UI 最小模块 / Minimal UI**

* 左侧：**Rooms 列表**（最近活动排序）
* 右侧：**Timeline**（sender + body）
* 顶部：连接状态（Connected/Connecting…）
* 底部：可选输入框（MVP 可先不发消息）

**触发器事件结构 / Event payload (example)**

```json
{
  "id": "$eventId",
  "roomId": "!roomId:matrix.dbis.rwth-aachen.de",
  "sender": "@alice:matrix.dbis.rwth-aachen.de",
  "body": "deploy api=v2",
  "ts": 1723556400000
}
```

---

# 后端：/api/trigger（MVP 行为）

**目标 / Goal**

* 接收 event → **打印/入队**（BullMQ/Redis 可后续加）
* **去重 / Idempotency**：用 `event.id` 做 Key（MVP 可用内存 Set；生产用 Redis）

**扩展 / Extend**

* 解析 **slash commands** (`/build project=alpha`) 或 **JSON 指令**（`{"action":"run_report","args":{...}}`）
* 把执行结果**回写**到房间（后续用 bot 服务更稳）

---

# 状态与错误（State & Errors）

* **Loading states**：登录中（SSO 跳转）、Sync 准备中（`PREPARED` 前）
* **Token 丢失**：跳回 `/login`
* **Sync 失败**：提示并提供重连按钮
* **权限 / ACL**：触发敏感动作前校验 `sender` 白名单

---

# 安全与配置（Security & Config）

* **SSO 回调**：请管理员将 `http://localhost:3000/matrix/callback` 与生产回调加入 **homeserver `sso.client_whitelist`**
* **CORS**：Homeserver 需允许你的前端来源
* **HTTPS**：线上必须
* **存储策略**：前端 Token 尽量短期；登出时清理
* **多环境**：根据 `NODE_ENV` 动态生成 `redirectUrl`（本地 vs 生产）

---

# 测试清单（Checklist）

1. 打开 `/login`，点击登录 → 跳 Keycloak/Google → 回到 `/matrix/callback?loginToken=...`
2. 回调页用 `loginToken` 成功换取 **Access Token**，自动跳 `/chat`
3. `/chat` 能看到 **房间列表**；选择房间 → 显示历史消息
4. 从 Element 发一条消息到该房间 → 页面实时出现 → `/api/trigger` 收到事件
5. 断网/刷新重连 → 仍可恢复（Token 存在）

---

# 里程碑（Milestones）

* **M1**：Login→Callback→Chat（显示消息 + 触发打印）
* **M2**：加 **命令解析**（slash / JSON）+ 结果 toast
* **M3**：/api/trigger 接 **队列**（BullMQ/Redis），worker 执行业务
* **M4**：加 **发消息**、已读回执、上传文件
* **M5**：切到 **SSO 专用回调域名**、Token 续期策略、错误监控

---

想要我把**每个页面的“需要的最少函数/接口清单”**（例如需要用到的 **Matrix API 名称**、何时调用）再列一版 ultra-short 版本吗？
