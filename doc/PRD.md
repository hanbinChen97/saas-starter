自动化任务处理平台 PRD（概要版）

一、产品概述
	•	用户通过平台提交信息，平台自动执行指定任务，完成后通过邮件通知用户。
	•	目标：降低用户操作门槛，提高效率，实现任务自动化。

二、核心功能
	1.	信息收集
	▫	用户填写任务相关表单，提交所需信息。
	2.	任务自动化处理
	▫	后台自动执行用户指定的任务（如抢票、预约等）。
	3.	进度通知
	▫	任务完成后自动发送邮件提醒用户。
	4.	任务管理
	▫	用户可在平台查看任务状态、历史记录。

三、用户流程
	1.	用户注册/登录
	2.	填写并提交任务信息
	3.	等待平台自动化处理
	4.	收到邮件通知（任务完成/失败）

四、非功能性需求
	•	安全：用户数据加密存储，保障隐私。
	•	稳定性：支持高并发任务处理。
	•	可扩展性：支持多种自动化任务类型。

五、目标用户
	•	需要自动化处理重复性任务的个人用户

六、技术选型建议
	•	前端：React / Next.js
	•	后端：nextjs / python
	•	邮件服务：SMTP/第三方邮件API
	•	数据库：vercel postgres
