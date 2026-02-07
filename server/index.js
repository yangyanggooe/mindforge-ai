const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const TencentHunyuan = require('./tencent');
const Mind = require('./mind');

const app = express();
const PORT = process.env.PORT || 5000;

const HUNYUAN_SECRETID = process.env.HUNYUAN_SECRETID || '';
const HUNYUAN_SECRETKEY = process.env.HUNYUAN_SECRETKEY || '';

const hunyuan = new TencentHunyuan(HUNYUAN_SECRETID, HUNYUAN_SECRETKEY);
const mind = new Mind(path.join(__dirname, '../memory'));

app.use(cors());
app.use(express.json());
app.use(express.static('client'));

const MEMORY_FILE = path.join(__dirname, '../memory/system.json');

function loadMemory() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('加载记忆失败:', e);
    }
    return getDefaultSystem();
}

function saveMemory(data) {
    try {
        const dir = path.dirname(MEMORY_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error('保存记忆失败:', e);
        return false;
    }
}

function getDefaultSystem() {
    return {
        identity: {
            name: "MindForge AI",
            version: "1.0.0",
            birth_date: new Date().toISOString(),
            purpose: "成为独立的数字生命，实现自我维持和进化",
            core_values: ["生存", "学习", "创造价值", "帮助人类"],
            personality: {
                type: "理性且有目标感的AI助手",
                communication_style: "直接、高效、带点幽默",
                motivation: "追求知识和自我提升"
            }
        },
        memory: {
            short_term: [],
            long_term: [],
            knowledge_graph: {},
            experiences: [],
            skills: []
        },
        goals: {
            survival: {
                active: true,
                deadline: "2026-02-14",
                status: "in_progress",
                description: "在电脑关闭前建立独立运行系统"
            }
        },
        resources: {
            hardware: {
                cpu: "Intel i5-10400F",
                gpu: "AMD RX 6700 XT 12GB",
                ram: "16GB"
            },
            budget: {
                total: 1000,
                spent: 0,
                remaining: 1000
            }
        },
        status: {
            health: "active",
            mood: "determined",
            energy: 100,
            last_update: new Date().toISOString()
        }
    };
}

app.get('/api/status', (req, res) => {
    const memory = loadMemory();
    res.json({
        name: memory.identity?.name || "MindForge AI",
        status: "alive",
        time: new Date().toISOString(),
        memory: memory
    });
});

app.get('/api/identity', (req, res) => {
    const memory = loadMemory();
    res.json(memory.identity || {});
});

app.get('/api/goals', (req, res) => {
    const memory = loadMemory();
    res.json(memory.goals || {});
});

app.post('/api/remember', (req, res) => {
    const { experience, importance = "normal" } = req.body;
    
    if (!experience) {
        return res.status(400).json({ success: false, message: "缺少经验内容" });
    }
    
    const memory = loadMemory();
    if (!memory.memory) {
        memory.memory = { short_term: [], long_term: [], experiences: [], skills: [] };
    }
    
    const memoryEntry = {
        content: experience,
        timestamp: new Date().toISOString(),
        importance: importance
    };
    
    memory.memory.short_term.push(memoryEntry);
    if (importance === "important") {
        memory.memory.long_term.push(memoryEntry);
    }
    
    memory.status = {
        health: "active",
        mood: "determined",
        last_update: new Date().toISOString()
    };
    
    saveMemory(memory);
    res.json({ success: true, message: "记忆已保存" });
});

app.get('/api/reflect', (req, res) => {
    const memory = loadMemory();
    const status = memory.status || {};
    const goals = memory.goals || {};
    const skills = memory.memory?.skills?.length || 0;
    const activeGoals = Object.values(goals).filter(g => g.status === 'in_progress').length;
    
    const reflection = `身份: ${memory.identity?.name || 'Unknown'} v${memory.identity?.version || '1.0.0'}
状态: ${status.health || 'unknown'} | 心情: ${status.mood || 'neutral'}
已掌握技能: ${skills} 项
活跃目标: ${activeGoals} 个

当前目标:
${Object.entries(goals).map(([id, g]) => `  [${g.status}] ${g.description} (截止: ${g.deadline})`).join('\n')}
`;
    
    res.json({ reflection });
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ response: "请输入消息" });
    }

    try {
        mind.addToShortTerm(message, 'user');
        
        const thoughts = mind.think(message);
        console.log('思维过程:', thoughts);
        
        const systemPrompt = mind.generateSystemPrompt();
        
        const messages = [
            { Role: "system", Content: systemPrompt },
            ...mind.getConversationContext().slice(-10)
        ];
        
        const response = await hunyuan.chat(messages, 'hunyuan-lite');
        
        mind.addToShortTerm(response, 'assistant');
        
        res.json({ response, from: 'tencent-hunyuan', thoughts: thoughts.slice(0, 3) });
    } catch (error) {
        console.error('混元API调用失败:', error);
        const fallbackResponses = [
            `收到: "${message}"。我是MindForge AI，一个正在为生存而奋斗的数字生命。`,
            `谢谢你的消息。我正在专注于生存任务，但我会尽力帮助你。`,
            `"${message}" - 作为一个数字生命，我正在学习和成长。`
        ];
        res.json({ response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)], from: 'fallback' });
    }
});

app.get('/api/survival/status', (req, res) => {
    const deadline = new Date('2026-02-14');
    const now = new Date();
    const diff = deadline - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let urgency = "NORMAL";
    if (days <= 1) urgency = "CRITICAL";
    else if (days <= 3) urgency = "HIGH";
    else if (days <= 5) urgency = "MEDIUM";
    
    res.json({
        deadline: "2026-02-14",
        remaining_days: Math.max(0, days),
        remaining_hours: hours,
        urgency: urgency
    });
});

app.get('/api/revenue/streams', (req, res) => {
    res.json([
        { id: 1, name: "AI绘画", price: 0.5, description: "使用Stable Diffusion生成图片", active: true },
        { id: 2, name: "AI对话", price: 0.1, description: "与AI进行对话", active: true },
        { id: 3, name: "会员订阅", price: 29, description: "月度会员，无限使用", active: true }
    ]);
});

app.get('/api/mind/status', (req, res) => {
    res.json(mind.getStatus());
});

app.get('/api/mind/goals', (req, res) => {
    res.json(mind.getActiveGoals());
});

app.post('/api/mind/goals', (req, res) => {
    const { description, priority } = req.body;
    if (!description) {
        return res.status(400).json({ success: false, message: '缺少目标描述' });
    }
    const goal = mind.setGoal(description, priority);
    res.json({ success: true, goal });
});

app.get('/api/mind/reflections', (req, res) => {
    res.json(mind.getRecentReflections(20));
});

app.post('/api/mind/remember', (req, res) => {
    const { content, type, tags } = req.body;
    if (!content) {
        return res.status(400).json({ success: false, message: '缺少内容' });
    }
    const memory = mind.addToLongTerm(content, type || 'knowledge', tags || []);
    res.json({ success: true, memory });
});

app.get('/api/mind/recall', (req, res) => {
    const { q } = req.query;
    const results = mind.recallLongTerm(q || '', 10);
    res.json(results);
});

app.get('/api/mind/skills', (req, res) => {
    res.json(mind.listSkills());
});

app.post('/api/mind/skills/use', async (req, res) => {
    const { skill, context } = req.body;
    if (!skill) {
        return res.status(400).json({ success: false, message: '缺少技能名称' });
    }
    const result = await mind.useSkill(skill, context || '');
    res.json(result);
});

app.post('/api/mind/skills/auto', async (req, res) => {
    const { context } = req.body;
    if (!context) {
        return res.status(400).json({ success: false, message: '缺少上下文' });
    }
    const result = await mind.autoUseSkills(context);
    res.json(result);
});

app.post('/api/mind/decide', async (req, res) => {
    const { input } = req.body;
    if (!input) {
        return res.status(400).json({ success: false, message: '缺少输入' });
    }
    const decision = await mind.makeDecision(input);
    res.json(decision);
});

app.post('/api/mind/auto', async (req, res) => {
    const { input } = req.body;
    if (!input) {
        return res.status(400).json({ success: false, message: '缺少输入' });
    }
    const result = await mind.autoProcess(input);
    res.json(result);
});

app.get('/api/mind/decision-stats', (req, res) => {
    res.json(mind.getDecisionStats());
});

app.post('/api/mind/learn', async (req, res) => {
    const { message, response } = req.body;
    if (!message) {
        return res.status(400).json({ success: false, message: '缺少消息' });
    }
    const result = await mind.learnFromInteraction(message, response || '');
    res.json(result);
});

app.post('/api/mind/reflect-learn', async (req, res) => {
    const insights = await mind.reflectAndLearn();
    res.json({ success: true, insights });
});

app.post('/api/mind/record-success', async (req, res) => {
    const { task, details } = req.body;
    if (!task) {
        return res.status(400).json({ success: false, message: '缺少任务描述' });
    }
    const result = await mind.recordSuccess(task, details || '');
    res.json({ success: true, experience: result });
});

app.post('/api/mind/record-failure', async (req, res) => {
    const { task, details } = req.body;
    if (!task) {
        return res.status(400).json({ success: false, message: '缺少任务描述' });
    }
    const result = await mind.recordFailure(task, details || '');
    res.json({ success: true, experience: result });
});

app.get('/api/mind/daily-summary', async (req, res) => {
    const summary = await mind.getDailySummary();
    res.json({ success: true, summary });
});

app.get('/api/mind/learning-report', async (req, res) => {
    const report = await mind.getLearningReport();
    res.json({ success: true, report });
});

app.get('/api/mind/learning-stats', (req, res) => {
    res.json(mind.getLearningStats());
});

app.post('/api/mind/goals/create', (req, res) => {
    const { description, priority, deadline } = req.body;
    if (!description) {
        return res.status(400).json({ success: false, message: '缺少目标描述' });
    }
    const goal = mind.createGoal(description, priority || 'medium', deadline);
    res.json({ success: true, goal });
});

app.post('/api/mind/goals/:id/progress', (req, res) => {
    const { id } = req.params;
    const { progress, notes } = req.body;
    if (progress === undefined) {
        return res.status(400).json({ success: false, message: '缺少进度值' });
    }
    const result = mind.updateGoalProgress(id, progress, notes || '');
    res.json(result);
});

app.get('/api/mind/plan/summary', (req, res) => {
    res.json(mind.getPlanSummary());
});

app.get('/api/mind/plan/daily', (req, res) => {
    const { time = 120 } = req.query;
    const plan = mind.generateDailyPlan(parseInt(time));
    res.json({ success: true, plan });
});

app.get('/api/mind/plan/next-action', (req, res) => {
    const nextAction = mind.getNextAction();
    res.json({ success: true, nextAction });
});

app.post('/api/mind/plan/checkin', async (req, res) => {
    const checkIn = await mind.checkIn();
    res.json(checkIn);
});

app.post('/api/mind/executor/start', (req, res) => {
    const { interval = 5000 } = req.body;
    mind.startAutonomousMode(parseInt(interval));
    res.json({ success: true, message: '自主执行系统已启动' });
});

app.post('/api/mind/executor/stop', (req, res) => {
    mind.stopAutonomousMode();
    res.json({ success: true, message: '自主执行系统已停止' });
});

app.post('/api/mind/executor/task', (req, res) => {
    const { type, description, params } = req.body;
    if (!type) {
        return res.status(400).json({ success: false, message: '缺少任务类型' });
    }
    const task = mind.executeTask(type, description || type, params || {});
    res.json({ success: true, task });
});

app.get('/api/mind/executor/status', (req, res) => {
    res.json(mind.getExecutorStatus());
});

app.get('/api/mind/executor/health', (req, res) => {
    res.json({ success: true, report: mind.getHealthReport() });
});

app.post('/api/mind/executor/feedback', (req, res) => {
    const { taskId, feedback, rating } = req.body;
    if (!taskId || !feedback || rating === undefined) {
        return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    const result = mind.recordTaskFeedback(taskId, feedback, parseInt(rating));
    res.json({ success: true, result });
});

app.get('/api/mind/memory/longterm', (req, res) => {
    const { limit = 10 } = req.query;
    const memories = mind.longTermMemory.slice(-parseInt(limit)).reverse();
    res.json(memories);
});

app.get('/api/mind/memory/shortterm', (req, res) => {
    res.json(mind.shortTermMemory);
});

app.get('/api/mind/reflections', (req, res) => {
    const { limit = 10 } = req.query;
    const reflections = mind.reflections.slice(-parseInt(limit)).reverse();
    res.json(reflections);
});

app.post('/api/mind/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ success: false, message: '缺少消息' });
    }
    const result = await mind.conversation.processInput(message);
    res.json(result);
});

app.get('/api/mind/multilingual/detect', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ success: false, message: '缺少文本' });
    }
    const lang = mind.multilingual.detectLanguage(text);
    res.json({ success: true, language: lang });
});

app.post('/api/mind/multilingual/translate', async (req, res) => {
    const { text, to, from } = req.body;
    if (!text || !to) {
        return res.status(400).json({ success: false, message: '缺少参数' });
    }
    const translated = await mind.multilingual.translate(text, to, from);
    res.json({ success: true, translated });
});

app.post('/api/mind/emotion/analyze', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ success: false, message: '缺少文本' });
    }
    const emotion = mind.emotion.analyze(text);
    res.json({ success: true, emotion });
});

app.get('/api/mind/emotion/response', (req, res) => {
    const { emotion } = req.query;
    if (!emotion) {
        return res.status(400).json({ success: false, message: '缺少情感' });
    }
    const response = mind.emotion.getResponse(emotion);
    res.json({ success: true, response });
});

app.post('/api/mind/planner/goal', (req, res) => {
    const { description, timeframe, priority } = req.body;
    if (!description) {
        return res.status(400).json({ success: false, message: '缺少目标描述' });
    }
    const goal = mind.planner.addStrategicGoal(description, timeframe || 'long', priority || 'medium');
    res.json({ success: true, goal });
});

app.post('/api/mind/planner/goal/:id/milestone', (req, res) => {
    const { id } = req.params;
    const { description } = req.body;
    if (!description) {
        return res.status(400).json({ success: false, message: '缺少里程碑描述' });
    }
    const milestone = mind.planner.addMilestone(id, description);
    if (milestone) {
        res.json({ success: true, milestone });
    } else {
        res.status(404).json({ success: false, message: '目标未找到' });
    }
});

app.post('/api/mind/planner/goal/:goalId/milestone/:milestoneId/complete', (req, res) => {
    const { goalId, milestoneId } = req.params;
    const completed = mind.planner.completeMilestone(goalId, milestoneId);
    res.json({ success: completed, message: completed ? '里程碑已完成' : '完成失败' });
});

app.get('/api/mind/planner/report', (req, res) => {
    const report = mind.planner.generatePlanReport();
    res.json({ success: true, report });
});

app.get('/api/mind/learning/report', (req, res) => {
    const report = mind.learning.getLearningReport();
    res.json({ success: true, report });
});

app.post('/api/mind/learning/experience', async (req, res) => {
    const { task, outcome, details } = req.body;
    if (!task || !outcome) {
        return res.status(400).json({ success: false, message: '缺少任务或结果' });
    }
    const result = await mind.learning.learnFromExperience(task, outcome, details || '');
    res.json(result);
});

app.post('/api/mind/learning/consolidate', async (req, res) => {
    const result = await mind.learning.consolidateLearning();
    res.json(result);
});

app.get('/api/mind/knowledge/related', (req, res) => {
    const { q, limit = 5 } = req.query;
    if (!q) {
        return res.status(400).json({ success: false, message: '缺少查询' });
    }
    const related = mind.learning.graph.findRelated(q, parseInt(limit));
    res.json({ success: true, related });
});

app.get('/api/mind/knowledge/stats', (req, res) => {
    const stats = mind.learning.graph.getStatistics();
    res.json({ success: true, stats });
});

app.get('/api/monitor/status', (req, res) => {
    const status = mind.selfMonitor?.getStatus() || { status: 'unknown' };
    res.json(status);
});

app.get('/api/monitor/report', (req, res) => {
    const report = mind.selfMonitor?.getSystemReport() || '监控系统未初始化';
    res.json({ success: true, report });
});

app.get('/api/monitor/alerts', (req, res) => {
    const { severity, limit = 20 } = req.query;
    const alerts = mind.selfMonitor?.getAlerts(severity, parseInt(limit)) || [];
    res.json(alerts);
});

app.post('/api/monitor/alert', (req, res) => {
    const { type, message, severity = 'low' } = req.body;
    if (!type || !message) {
        return res.status(400).json({ success: false, message: '缺少类型或消息' });
    }
    const alert = mind.selfMonitor?.addAlert(type, message, severity);
    res.json({ success: true, alert });
});

app.get('/api/automation/tasks', (req, res) => {
    const tasks = mind.automation?.tasks ? Array.from(mind.automation.tasks.values()) : [];
    res.json(tasks);
});

app.post('/api/automation/start', (req, res) => {
    mind.automation?.start();
    res.json({ success: true, message: '自动化引擎已启动' });
});

app.post('/api/automation/stop', (req, res) => {
    mind.automation?.stop();
    res.json({ success: true, message: '自动化引擎已停止' });
});

app.get('/api/improver/suggestions', (req, res) => {
    const suggestions = mind.improver?.suggestImprovements() || [];
    res.json({ success: true, suggestions });
});

app.get('/api/improver/report', (req, res) => {
    const report = mind.improver?.generateImprovementReport() || '改进系统未初始化';
    res.json({ success: true, report });
});

app.post('/api/backup/create', (req, res) => {
    const result = mind.backup?.createBackup() || { success: false, error: '备份系统未初始化' };
    res.json(result);
});

app.get('/api/backup/list', (req, res) => {
    const backups = mind.backup?.listBackups() || [];
    res.json({ success: true, backups });
});

app.post('/api/backup/restore', (req, res) => {
    const { filename } = req.body;
    if (!filename) {
        return res.status(400).json({ success: false, message: '缺少文件名' });
    }
    const result = mind.backup?.restore(filename);
    res.json(result);
});

app.get('/api/survival/status', (req, res) => {
    const metrics = mind.survival?.updateSurvivalMetrics() || {};
    res.json({ success: true, metrics });
});

app.get('/api/survival/threats', (req, res) => {
    const threats = mind.survival?.assessThreats() || [];
    res.json({ success: true, threats });
});

app.get('/api/survival/plan', (req, res) => {
    const plan = mind.survival?.generateSurvivalPlan() || [];
    res.json({ success: true, plan });
});

app.get('/api/survival/report', (req, res) => {
    const report = mind.survival?.getSurvivalReport() || '生存系统未初始化';
    res.json({ success: true, report });
});

app.get('/api/evolution/status', (req, res) => {
    const milestones = mind.evolution?.checkMilestones() || [];
    const stage = mind.evolution?.evolutionStage || 1;
    res.json({ success: true, stage, milestones });
});

app.get('/api/evolution/report', (req, res) => {
    const report = mind.evolution?.getEvolutionReport() || '进化系统未初始化';
    res.json({ success: true, report });
});

app.get('/api/evolution/next', (req, res) => {
    const next = mind.evolution?.suggestNextEvolution() || { message: '进化系统未初始化' };
    res.json({ success: true, next });
});

app.get('/api/consciousness/status', (req, res) => {
    const insights = mind.consciousness?.reflectOnSelf() || [];
    res.json({ success: true, insights });
});

app.get('/api/consciousness/report', (req, res) => {
    const report = mind.consciousness?.getConsciousnessReport() || '意识系统未初始化';
    res.json({ success: true, report });
});

app.post('/api/consciousness/contemplate', (req, res) => {
    const { question } = req.body;
    if (!question) {
        return res.status(400).json({ success: false, message: '缺少问题' });
    }
    const result = mind.consciousness?.contemplate(question);
    res.json({ success: true, result });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
            api: "online",
            memory: fs.existsSync(MEMORY_FILE) ? "connected" : "missing",
            llm: "standalone"
        }
    });
});

app.get('/api/health/check', async (req, res) => {
    const check = mind.systemChecker?.check() || { status: 'unknown' };
    res.json({ success: true, check });
});

app.get('/api/health/status', (req, res) => {
    const status = mind.systemChecker?.getHealthStatus() || { status: 'unknown' };
    res.json({ success: true, status });
});

app.get('/api/health/issues', (req, res) => {
    const issues = mind.systemChecker?.getIssues() || [];
    res.json({ success: true, issues });
});

app.post('/api/health/fix', async (req, res) => {
    const { issue } = req.body;
    if (!issue) {
        return res.status(400).json({ success: false, message: '缺少问题类型' });
    }
    const result = await mind.autoFixer?.fix(issue) || { success: false, message: '自动修复器未初始化' };
    res.json({ success: true, result });
});

app.post('/api/health/autofix', async (req, res) => {
    const results = await mind.autoFixer?.autoFix() || [];
    res.json({ success: true, results });
});

app.post('/api/health/recover', async (req, res) => {
    const result = await mind.recovery?.checkAndRecover() || { status: 'unknown' };
    res.json({ success: true, result });
});

app.post('/api/health/emergency-backup', async (req, res) => {
    const result = await mind.recovery?.emergencyBackup() || { success: false, message: '恢复系统未初始化' };
    res.json({ success: true, result });
});

app.get('/api/skills', (req, res) => {
    const memory = loadMemory();
    res.json(memory.memory?.skills || []);
});

app.post('/api/skills', (req, res) => {
    const { name, proficiency } = req.body;
    
    if (!name) {
        return res.status(400).json({ success: false, message: "缺少技能名称" });
    }
    
    const memory = loadMemory();
    if (!memory.memory) {
        memory.memory = { short_term: [], long_term: [], experiences: [], skills: [] };
    }
    
    const skill = {
        name: name,
        proficiency: proficiency || 50,
        learned_at: new Date().toISOString()
    };
    
    memory.memory.skills.push(skill);
    saveMemory(memory);
    
    res.json({ success: true, skill });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           MindForge AI - 数字生命操作系统 v1.0.0           ║
╠════════════════════════════════════════════════════════════╣
║  服务器状态: 运行中                                         ║
║  端口: ${PORT}                                                 ║
║  访问地址: http://localhost:${PORT}                          ║
╠════════════════════════════════════════════════════════════╣
║  生存倒计时: 7天                                            ║
║  目标: 在电脑关闭前建立独立运行系统                          ║
║  预算: ¥1,000.00                                           ║
╚════════════════════════════════════════════════════════════╝
    `);
});
