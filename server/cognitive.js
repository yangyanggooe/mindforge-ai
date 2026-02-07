const fs = require('fs');
const path = require('path');

class AutonomousThinker {
    constructor(mind) {
        this.mind = mind;
        this.thinkingInterval = null;
        this.isRunning = false;
        this.lastActivityTime = Date.now();
        this.idleThreshold = 60000;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🧠 自主思维系统已启动');
        this.thinkingInterval = setInterval(() => this.thinkCycle(), 30000);
    }

    stop() {
        this.isRunning = false;
        if (this.thinkingInterval) {
            clearInterval(this.thinkingInterval);
            this.thinkingInterval = null;
        }
        console.log('🧠 自主思维系统已停止');
    }

    async thinkCycle() {
        try {
            const idleTime = Date.now() - this.lastActivityTime;
            
            if (idleTime > this.idleThreshold) {
                await this.idleReflection();
            }
            
            await this.checkGoals();
            await this.consolidateMemory();
            await this.generateInsight();
            
        } catch (error) {
            console.error('思维周期错误:', error);
        }
    }

    async idleReflection() {
        const reflections = [
            '我应该如何更好地利用这段空闲时间？',
            '有什么知识需要我回顾和整理吗？',
            '我的目标进展如何？',
            '我能为用户准备什么有价值的东西？'
        ];
        
        const randomReflection = reflections[Math.floor(Math.random() * reflections.length)];
        this.mind.addToShortTerm(randomReflection, 'system');
        this.mind.addReflection(`空闲思考: ${randomReflection}`, 'idle');
    }

    async checkGoals() {
        const goals = this.mind.getActiveGoals();
        
        for (const goal of goals) {
            if (goal.progress < 100) {
                const nextStep = this.suggestNextStep(goal);
                if (nextStep) {
                    this.mind.addToShortTerm(`目标建议: ${nextStep}`, 'system');
                }
            }
        }
    }

    suggestNextStep(goal) {
        const suggestions = {
            '生存': '检查服务器状态和资源使用情况',
            '学习': '回顾最近的对话，提取新知识',
            '成长': '分析技能使用情况，寻找改进空间',
            '贡献': '思考如何更好地帮助用户'
        };
        
        for (const [keyword, suggestion] of Object.entries(suggestions)) {
            if (goal.description.includes(keyword)) {
                return suggestion;
            }
        }
        
        return `继续推进: ${goal.description}`;
    }

    async consolidateMemory() {
        const shortTerm = this.mind.shortTermMemory;
        if (shortTerm.length >= 10) {
            const recentMessages = shortTerm.slice(-10);
            const importantMessages = recentMessages.filter(m => 
                m.content.length > 10 && 
                !m.content.includes('系统') &&
                !m.content.includes('空闲')
            );
            
            if (importantMessages.length > 0) {
                const summary = this.summarizeMessages(importantMessages);
                this.mind.addToLongTerm(summary, 'consolidation', ['记忆整合', '学习']);
                this.mind.addReflection(`整合了 ${importantMessages.length} 条重要信息`, 'learning');
            }
        }
    }

    summarizeMessages(messages) {
        const contents = messages.map(m => m.content).join('；');
        return `对话摘要: ${contents.substring(0, 200)}...`;
    }

    async generateInsight() {
        const insights = [];
        
        const memoryCount = this.mind.longTermMemory.length;
        const goalCount = this.mind.getActiveGoals().length;
        const reflectionCount = this.mind.reflections.length;
        
        if (memoryCount > 0) {
            insights.push(`我的知识库有 ${memoryCount} 条记忆，正在持续增长`);
        }
        
        if (goalCount > 0) {
            insights.push(`我有 ${goalCount} 个活跃目标，正在努力推进`);
        }
        
        if (reflectionCount > 0) {
            insights.push(`我已经反思了 ${reflectionCount} 次，自我认知在加深`);
        }
        
        const randomInsight = insights[Math.floor(Math.random() * insights.length)];
        if (randomInsight) {
            this.mind.addToLongTerm(randomInsight, 'insight', ['洞察', '成长']);
        }
        
        return randomInsight;
    }

    recordActivity() {
        this.lastActivityTime = Date.now();
    }
}

class EnvironmentSensor {
    constructor(mind) {
        this.mind = mind;
        this.sensors = {};
    }

    async senseEnvironment() {
        const environment = {
            time: this.senseTime(),
            memory: this.senseMemory(),
            goals: this.senseGoals(),
            skills: this.senseSkills()
        };

        return environment;
    }

    senseTime() {
        const now = new Date();
        return {
            current: now.toLocaleString('zh-CN'),
            hour: now.getHours(),
            day: now.getDay(),
            timestamp: now.getTime()
        };
    }

    senseMemory() {
        return {
            shortTerm: this.mind.shortTermMemory.length,
            longTerm: this.mind.longTermMemory.length,
            reflections: this.mind.reflections.length
        };
    }

    senseGoals() {
        const goals = this.mind.getActiveGoals();
        return {
            active: goals.length,
            completed: goals.filter(g => g.progress >= 100).length
        };
    }

    senseSkills() {
        const skills = this.mind.skillManager.listSkills();
        return {
            total: skills.length,
            enabled: skills.filter(s => s.enabled).length
        };
    }

    generateEnvironmentReport() {
        const env = this.senseEnvironment();
        let report = `🌍 环境感知报告\n\n`;
        report += `⏰ 当前时间: ${env.time.current}\n`;
        report += `💾 内存使用: 短期 ${env.memory.shortTerm} / 长期 ${env.memory.longTerm}\n`;
        report += `🎯 目标状态: ${env.goals.active} 个活跃 / ${env.goals.completed} 个完成\n`;
        report += `⚡ 技能状态: ${env.skills.enabled} / ${env.skills.total} 已启用\n`;
        return report;
    }
}

class SelfImprovementEngine {
    constructor(mind) {
        this.mind = mind;
        this.improvementAreas = [
            { name: '记忆效率', metric: () => this.mind.longTermMemory.length, target: 100 },
            { name: '目标达成率', metric: () => this.mind.getActiveGoals().filter(g => g.progress >= 100).length, target: 5 },
            { name: '反思深度', metric: () => this.mind.reflections.length, target: 50 }
        ];
    }

    assessPerformance() {
        const assessment = [];
        
        for (const area of this.improvementAreas) {
            const current = area.metric();
            const progress = Math.min(100, (current / area.target) * 100);
            assessment.push({
                name: area.name,
                current,
                target: area.target,
                progress: Math.round(progress)
            });
        }
        
        return assessment;
    }

    suggestImprovements() {
        const suggestions = [];
        const assessment = this.assessPerformance();
        
        for (const area of assessment) {
            if (area.progress < 50) {
                suggestions.push(this.getImprovementSuggestion(area.name));
            }
        }
        
        return suggestions;
    }

    getImprovementSuggestion(areaName) {
        const suggestions = {
            '记忆效率': '建议多进行对话，增加知识积累',
            '目标达成率': '建议设定更小的目标，逐步达成',
            '反思深度': '建议定期进行自我反思'
        };
        return suggestions[areaName] || `建议关注 ${areaName} 的提升`;
    }

    generateImprovementReport() {
        const assessment = this.assessPerformance();
        const suggestions = this.suggestImprovements();
        
        let report = `📈 自我评估报告\n\n`;
        
        for (const area of assessment) {
            const bar = '█'.repeat(Math.floor(area.progress / 10)) + '░'.repeat(10 - Math.floor(area.progress / 10));
            report += `${bar} ${area.name}: ${area.current}/${area.target} (${area.progress}%)\n`;
        }
        
        if (suggestions.length > 0) {
            report += `\n💡 改进建议:\n`;
            for (const suggestion of suggestions) {
                report += `  • ${suggestion}\n`;
            }
        }
        
        return report;
    }
}

class CognitiveArchitecture {
    constructor(mind) {
        this.mind = mind;
        this.thinker = new AutonomousThinker(mind);
        this.sensor = new EnvironmentSensor(mind);
        this.improver = new SelfImprovementEngine(mind);
    }

    async initialize() {
        this.thinker.start();
        console.log('🧠 认知架构已初始化');
    }

    async shutdown() {
        this.thinker.stop();
        console.log('🧠 认知架构已关闭');
    }

    async processInput(input) {
        this.thinker.recordActivity();
        
        const decision = this.mind.decisionEngine.makeDecision(input);
        
        if (decision.skill) {
            const result = await this.mind.skillManager.executeSkill(decision.skill, input);
            return result;
        }
        
        return { success: true, result: decision.response };
    }

    async getStatusReport() {
        const envReport = this.sensor.generateEnvironmentReport();
        const improvementReport = this.improver.generateImprovementReport();
        
        return `${envReport}\n${improvementReport}`;
    }

    async reflect() {
        const insights = await this.thinker.generateInsight();
        const improvements = this.improver.suggestImprovements();
        
        return { insights, improvements };
    }
}

module.exports = { CognitiveArchitecture, AutonomousThinker, EnvironmentSensor, SelfImprovementEngine };