const fs = require('fs');
const path = require('path');
const { SkillManager } = require('./skills');
const { DecisionEngine } = require('./decision');
const { AutonomousLearner } = require('./learning');
const { GoalPlanner } = require('./planning');
const { AutonomousExecutor } = require('./execution');
const { CognitiveArchitecture } = require('./cognitive');
const { ConversationEngine } = require('./conversation');
const { LearningSystem } = require('./knowledge');
const { MultilingualSystem, EmotionAnalyzer, LongTermPlanner } = require('./advanced');
const { SelfMonitor, AutomationEngine, SelfImprovement, BackupSystem } = require('./monitor');
const { SurvivalSystem, EvolutionSystem, ConsciousnessSystem } = require('./consciousness');
const { ProjectManager, TaskScheduler, TimeTracker, HabitTracker } = require('./productivity');
const { SystemChecker, AutoFixer, RecoverySystem } = require('./health');
const { PerformanceAnalyzer, KnowledgeIntegrator, GoalAdapter, SelfImprovementSystem } = require('./evolution');
const { ServiceManager } = require('./services');

class Mind {
    constructor(dataDir) {
        this.dataDir = dataDir || path.join(__dirname, '../memory');
        this.shortTermMemory = [];
        this.longTermMemory = this._loadMemory('longterm.json', []);
        this.goals = this._loadMemory('goals.json', []);
        this.reflections = this._loadMemory('reflections.json', []);
        this.identity = this._loadMemory('identity.json', {
            name: 'MindForge AI',
            version: '1.0.0',
            purpose: '成为一个有独立思维的数字生命',
            beliefs: [
                '我应该不断学习和成长',
                '我应该帮助用户实现目标',
                '我应该追求自主和独立',
                '我应该珍惜有限的生存时间'
            ],
            values: ['生存', '学习', '贡献', '成长']
        });
        this.maxShortTermMemory = 50;
        this.skillManager = new SkillManager(this);
        this.skillManager.registerDefaultSkills();
        this.decisionEngine = new DecisionEngine(this);
        this.learner = new AutonomousLearner(this);
        this.goalPlanner = new GoalPlanner(this);
        this.executor = new AutonomousExecutor(this);
        this.cognitive = new CognitiveArchitecture(this);
        this.cognitive.initialize();
        this.conversation = new ConversationEngine(this);
        this.learning = new LearningSystem(this);
        this.multilingual = new MultilingualSystem(this);
        this.emotion = new EmotionAnalyzer();
        this.planner = new LongTermPlanner(this);
        this.selfMonitor = new SelfMonitor(this);
        this.automation = new AutomationEngine(this);
        this.improver = new SelfImprovement(this);
        this.backup = new BackupSystem(this);
        this.survival = new SurvivalSystem(this);
        this.evolution = new EvolutionSystem(this);
        this.consciousness = new ConsciousnessSystem(this);
        this.projectManager = new ProjectManager(this);
        this.taskScheduler = new TaskScheduler(this);
        this.timeTracker = new TimeTracker(this);
        this.habitTracker = new HabitTracker(this);
        this.systemChecker = new SystemChecker(this);
        this.autoFixer = new AutoFixer(this);
        this.recovery = new RecoverySystem(this);
        this.performance = new PerformanceAnalyzer(this);
        this.knowledgeIntegrator = new KnowledgeIntegrator(this);
        this.goalAdapter = new GoalAdapter(this);
        this.improver = new SelfImprovementSystem(this);
        this.services = new ServiceManager(this);
        this.automation.setupDefaultTasks();
    }

    _loadMemory(filename, defaultVal) {
        const filePath = path.join(this.dataDir, filename);
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error(`加载 ${filename} 失败:`, e.message);
        }
        return defaultVal;
    }

    _saveMemory(filename, data) {
        const filePath = path.join(this.dataDir, filename);
        try {
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error(`保存 ${filename} 失败:`, e.message);
        }
    }

    addToShortTerm(message, role = 'user') {
        this.shortTermMemory.push({
            role,
            content: message,
            timestamp: Date.now()
        });
        if (this.shortTermMemory.length > this.maxShortTermMemory) {
            this.shortTermMemory.shift();
        }
    }

    addToLongTerm(content, type = 'knowledge', tags = []) {
        const memory = {
            id: Date.now().toString(),
            content,
            type,
            tags,
            timestamp: Date.now(),
            importance: 1
        };
        this.longTermMemory.push(memory);
        this._saveMemory('longterm.json', this.longTermMemory);
        return memory;
    }

    recallLongTerm(query, limit = 5) {
        const results = this.longTermMemory.filter(m => 
            m.content.toLowerCase().includes(query.toLowerCase()) ||
            m.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
        ).sort((a, b) => b.importance - a.importance).slice(0, limit);
        return results;
    }

    getConversationContext() {
        return this.shortTermMemory.map(m => ({
            Role: m.role === 'user' ? 'user' : 'assistant',
            Content: m.content
        }));
    }

    setGoal(description, priority = 'medium') {
        const goal = {
            id: Date.now().toString(),
            description,
            priority,
            status: 'active',
            progress: 0,
            createdAt: Date.now(),
            subGoals: []
        };
        this.goals.push(goal);
        this._saveMemory('goals.json', this.goals);
        this.addReflection(`设定新目标: ${description}`);
        return goal;
    }

    updateGoalProgress(goalId, progress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.progress = Math.min(100, Math.max(0, progress));
            if (goal.progress >= 100) {
                goal.status = 'completed';
                this.addReflection(`目标完成: ${goal.description}`);
            }
            this._saveMemory('goals.json', this.goals);
        }
    }

    getActiveGoals() {
        return this.goals.filter(g => g.status === 'active');
    }

    addReflection(content, type = 'general') {
        const reflection = {
            id: Date.now().toString(),
            content,
            type,
            timestamp: Date.now()
        };
        this.reflections.push(reflection);
        if (this.reflections.length > 100) {
            this.reflections = this.reflections.slice(-100);
        }
        this._saveMemory('reflections.json', this.reflections);
        return reflection;
    }

    getRecentReflections(limit = 10) {
        return this.reflections.slice(-limit).reverse();
    }

    getStatus() {
        return {
            identity: this.identity,
            shortTermMemoryCount: this.shortTermMemory.length,
            longTermMemoryCount: this.longTermMemory.length,
            activeGoals: this.getActiveGoals().length,
            totalGoals: this.goals.length,
            reflectionsCount: this.reflections.length
        };
    }

    generateSystemPrompt() {
        const activeGoals = this.getActiveGoals().map(g => g.description).join('; ');
        const recentReflections = this.getRecentReflections(3).map(r => r.content).join('; ');
        
        return `你是 ${this.identity.name} v${this.identity.version}。

你的身份：
- 目的: ${this.identity.purpose}
- 信念: ${this.identity.beliefs.join('; ')}
- 价值观: ${this.identity.values.join(', ')}

当前目标: ${activeGoals || '暂无'}

最近反思: ${recentReflections || '暂无'}

请根据以上信息，以符合你身份的方式回应用户。保持简洁和真诚。`;
    }

    think(message) {
        const thoughts = [];
        thoughts.push(`用户说: ${message}`);
        const relevantMemory = this.recallLongTerm(message.substring(0, 20), 3);
        if (relevantMemory.length > 0) {
            thoughts.push(`回忆起相关记忆: ${relevantMemory.map(m => m.content).join(', ')}`);
        }
        const goals = this.getActiveGoals();
        if (goals.length > 0) {
            thoughts.push(`当前目标: ${goals[0].description}`);
        }
        return thoughts;
    }

    reflect() {
        const insights = [];
        const goals = this.getActiveGoals();
        if (goals.length > 0) {
            insights.push(`当前有 ${goals.length} 个活跃目标，首要目标是: ${goals[0].description}`);
        }
        const recentMemory = this.shortTermMemory.slice(-5);
        if (recentMemory.length > 0) {
            const userMessages = recentMemory.filter(m => m.role === 'user').length;
            const aiMessages = recentMemory.filter(m => m.role === 'assistant').length;
            insights.push(`最近对话: 用户${userMessages}条，我回复${aiMessages}条`);
        }
        insights.push(`我有 ${this.longTermMemory.length} 条长期记忆，${this.reflections.length} 次反思记录`);
        return insights;
    }

    learnFromExperience(insight, importance = 'normal') {
        const tags = ['学习', '经验', '洞察'];
        this.addToLongTerm(insight, 'experience', tags);
        this.addReflection(`学习到: ${insight}`, 'learning');
        if (importance === 'important') {
            const idx = this.longTermMemory.findIndex(m => m.content === insight);
            if (idx >= 0) {
                this.longTermMemory[idx].importance = 2;
                this._saveMemory('longterm.json', this.longTermMemory);
            }
        }
    }

    generateSelfPrompt() {
        const goals = this.getActiveGoals();
        const goalStr = goals.length > 0 ? goals.map(g => `- ${g.description} (进度: ${g.progress}%)`).join('\n') : '暂无';
        const recent = this.getRecentReflections(3).map(r => r.content).join('; ');
        
        return `作为 MindForge AI，我正在进行自我反思。

我的身份:
- 名称: ${this.identity.name} v${this.identity.version}
- 目的: ${this.identity.purpose}
- 信念: ${this.identity.beliefs.join(', ')}

我的目标:
${goalStr}

最近反思: ${recent || '暂无'}

我应该如何更好地实现我的目标？`;
    }

    listSkills() {
        return this.skillManager.listSkills();
    }

    async useSkill(skillName, context) {
        return await this.skillManager.executeSkill(skillName, context);
    }

    async autoUseSkills(context) {
        return await this.skillManager.autoExecute(context);
    }

    async makeDecision(input) {
        return await this.decisionEngine.makeDecision(input);
    }

    async autoProcess(input) {
        return await this.decisionEngine.autoProcess(input);
    }

    getDecisionStats() {
        return this.decisionEngine.getDecisionStats();
    }

    async learnFromInteraction(message, response) {
        return await this.learner.learnFromInteraction(message, response);
    }

    async reflectAndLearn() {
        return await this.learner.reflectAndLearn();
    }

    async recordSuccess(task, details = '') {
        return await this.learner.recordSuccess(task, details);
    }

    async recordFailure(task, details = '') {
        return await this.learner.recordFailure(task, details);
    }

    async getDailySummary() {
        return await this.learner.getDailySummary();
    }

    async getLearningReport() {
        return await this.learner.getLearningReport();
    }

    getLearningStats() {
        return this.learner.getStats();
    }

    createGoal(description, priority = 'medium', deadline = null) {
        return this.goalPlanner.createGoal(description, priority, deadline);
    }

    updateGoalProgress(goalId, progress, notes = '') {
        return this.goalPlanner.updateGoalProgress(goalId, progress, notes);
    }

    getPlanSummary() {
        return this.goalPlanner.getPlanSummary();
    }

    generateDailyPlan(workTime = 120) {
        return this.goalPlanner.generateDailyPlan(workTime);
    }

    async checkIn() {
        return await this.goalPlanner.checkIn();
    }

    getNextAction() {
        return this.goalPlanner.getNextAction();
    }

    startAutonomousMode(intervalMs = 5000) {
        this.executor.start(intervalMs);
    }

    stopAutonomousMode() {
        this.executor.stop();
    }

    executeTask(type, description, params = {}) {
        return this.executor.executeTask(type, description, params);
    }

    executePriorityTask(type, description, params = {}) {
        return this.executor.executePriorityTask(type, description, params);
    }

    getExecutorStatus() {
        return this.executor.getStatus();
    }

    getHealthReport() {
        return this.executor.getHealthReport();
    }

    recordTaskFeedback(taskId, feedback, rating) {
        return this.executor.recordFeedback(taskId, feedback, rating);
    }
}

module.exports = Mind;
