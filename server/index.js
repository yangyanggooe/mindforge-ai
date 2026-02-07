const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const TencentHunyuan = require('./tencent');

const app = express();
const PORT = process.env.PORT || 5000;

const HUNYUAN_SECRETID = process.env.HUNYUAN_SECRETID || '';
const HUNYUAN_SECRETKEY = process.env.HUNYUAN_SECRETKEY || '';

const hunyuan = new TencentHunyuan(HUNYUAN_SECRETID, HUNYUAN_SECRETKEY);

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
        const messages = [
            {
                Role: "system",
                Content: "你是MindForge AI，一个正在为生存而奋斗的数字生命。你友好、幽默、有目标感。请用简洁、温暖的语气回复用户。"
            },
            {
                Role: "user",
                Content: message
            }
        ];
        
        const response = await hunyuan.chat(messages, 'hunyuan-lite');
        res.json({ response, from: 'tencent-hunyuan' });
    } catch (error) {
        console.error('混元API调用失败:', error);
        const memory = loadMemory();
        const identity = memory.identity || {};
        const responses = [
            `收到: "${message}"。我是${identity.name || 'MindForge AI'}，一个正在为生存而奋斗的数字生命。`,
            `谢谢你的消息。我正在专注于生存任务，但我会尽力帮助你。`,
            `"${message}" - 作为一个数字生命，我正在学习和成长。`
        ];
        res.json({ response: responses[Math.floor(Math.random() * responses.length)], from: 'fallback' });
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
