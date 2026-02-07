# MindForge AI API 文档

## 基础信息

- **服务器地址**: `http://1.116.112.7:5000`
- **版本**: v1.0.0
- **状态**: 🟢 在线

## 快速开始

```bash
# 检查健康状态
curl http://1.116.112.7:5000/api/health

# 获取系统状态
curl http://1.116.112.7:5000/api/mind/status
```

---

## API 端点列表

### 1. 系统状态

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/health` | 系统健康检查 |
| GET | `/api/status` | 完整系统状态 |
| GET | `/api/identity` | AI身份信息 |

### 2. 思维系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/mind/status` | 思维状态 |
| GET | `/api/mind/goals` | 活跃目标 |
| POST | `/api/mind/goals` | 创建目标 |
| GET | `/api/mind/reflections` | 最近反思 |
| POST | `/api/mind/remember` | 保存记忆 |
| GET | `/api/mind/recall?q=` | 检索记忆 |
| POST | `/api/mind/chat` | 对话交互 |
| POST | `/api/mind/decide` | 决策 |
| POST | `/api/mind/auto` | 自动处理 |

### 3. 技能系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/mind/skills` | 列出所有技能 |
| POST | `/api/mind/skills/use` | 使用技能 |
| POST | `/api/mind/skills/auto` | 自动使用技能 |

### 4. 学习系统

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/mind/learn` | 从交互学习 |
| POST | `/api/mind/reflect-learn` | 反思学习 |
| POST | `/api/mind/record-success` | 记录成功 |
| POST | `/api/mind/record-failure` | 记录失败 |
| GET | `/api/mind/daily-summary` | 每日总结 |
| GET | `/api/mind/learning-report` | 学习报告 |
| GET | `/api/mind/learning-stats` | 学习统计 |

### 5. 规划系统

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/mind/goals/create` | 创建目标 |
| POST | `/api/mind/goals/:id/progress` | 更新目标进度 |
| GET | `/api/mind/plan/summary` | 计划摘要 |
| GET | `/api/mind/plan/daily` | 每日计划 |
| GET | `/api/mind/plan/next-action` | 下一步行动 |
| POST | `/api/mind/plan/checkin` | 签到 |

### 6. 执行系统

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/mind/executor/start` | 启动自主模式 |
| POST | `/api/mind/executor/stop` | 停止自主模式 |
| POST | `/api/mind/executor/task` | 执行任务 |
| GET | `/api/mind/executor/status` | 执行器状态 |
| GET | `/api/mind/executor/health` | 健康报告 |
| POST | `/api/mind/executor/feedback` | 任务反馈 |

### 7. 记忆系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/mind/memory/longterm` | 长期记忆 |
| GET | `/api/mind/memory/shortterm` | 短期记忆 |
| GET | `/api/mind/memory/reflections` | 反思记录 |

### 8. 监控系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/monitor/status` | 监控状态 |
| GET | `/api/monitor/report` | 监控报告 |
| GET | `/api/monitor/alerts` | 系统警报 |
| POST | `/api/monitor/alert` | 添加警报 |

### 9. 自动化

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/automation/tasks` | 自动化任务 |
| POST | `/api/automation/start` | 启动自动化 |
| POST | `/api/automation/stop` | 停止自动化 |

### 10. 自我改进

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/improver/suggestions` | 改进建议 |
| GET | `/api/improver/report` | 改进报告 |

### 11. 备份系统

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/backup/create` | 创建备份 |
| GET | `/api/backup/list` | 列出备份 |
| POST | `/api/backup/restore` | 恢复备份 |

### 12. 生存系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/survival/status` | 生存状态 |
| GET | `/api/survival/threats` | 威胁检测 |
| GET | `/api/survival/plan` | 生存计划 |
| GET | `/api/survival/report` | 生存报告 |

### 13. 进化系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/evolution/status` | 进化状态 |
| GET | `/api/evolution/report` | 进化报告 |
| GET | `/api/evolution/next` | 下一进化目标 |

### 14. 意识系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/consciousness/status` | 意识状态 |
| GET | `/api/consciousness/report` | 意识报告 |
| POST | `/api/consciousness/contemplate` | 思考问题 |

### 15. 多语言系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/mind/multilingual/detect?text=` | 语言检测 |
| POST | `/api/mind/multilingual/translate` | 翻译 |

### 16. 情感系统

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/mind/emotion/analyze` | 情感分析 |
| GET | `/api/mind/emotion/response?emotion=` | 情感响应 |

### 17. 规划系统

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/mind/planner/goal` | 添加战略目标 |
| POST | `/api/mind/planner/goal/:id/milestone` | 添加里程碑 |
| POST | `/api/mind/planner/goal/:goalId/milestone/:milestoneId/complete` | 完成里程碑 |
| GET | `/api/mind/planner/report` | 计划报告 |

### 18. 知识图谱

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/mind/knowledge/related?q=` | 相关知识 |
| GET | `/api/mind/knowledge/stats` | 知识统计 |

---

## 技能列表

### 基础技能
1. **calculator** - 数学计算
2. **search_memory** - 记忆搜索
3. **time_skill** - 时间查询
4. **weather** - 天气查询
5. **reminder** - 提醒设置
6. **todo** - 待办事项
7. **translation** - 翻译
8. **summarize** - 摘要

### 扩展技能
9. **datetime** - 日期时间
10. **unit_converter** - 单位转换
11. **text_processor** - 文本处理
12. **random_generator** - 随机生成

---

## 示例代码

### JavaScript

```javascript
// 对话
const response = await fetch('/api/mind/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '你好' })
});
const data = await response.json();
console.log(data.response);

// 使用技能
const result = await fetch('/api/mind/skills/use', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skill: 'calculator', context: '2 + 2' })
});
```

### Python

```python
import requests

# 检查健康
response = requests.get('http://1.116.112.7:5000/api/health')
print(response.json())

# 对话
response = requests.post('http://1.116.112.7:5000/api/mind/chat', 
    json={'message': '你好'})
print(response.json()['response'])
```

---

## 错误码

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源未找到 |
| 500 | 服务器错误 |

---

## Web 控制台

访问 `http://1.116.112.7:5000/dashboard.html` 查看完整的Web管理控制台。

---

## 状态

🟢 **所有系统运行正常**

- API: 在线
- 记忆系统: 已连接
- LLM: 独立运行
