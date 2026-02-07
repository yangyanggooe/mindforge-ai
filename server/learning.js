const fs = require('fs');
const path = require('path');

class KnowledgeExtractor {
    constructor() {
        this.patterns = {
            facts: [
                /(.+?)是(.+?)(?:。|，|；|$)/g,
                /(.+?)叫做(.+?)(?:。|，|；|$)/g,
                /(.+?)指的是(.+?)(?:。|，|；|$)/g,
                /(.+?)定义为(.+?)(?:。|，|；|$)/g
            ],
            opinions: [
                /我认为(.+?)(?:。|，|；|$)/g,
                /我觉得(.+?)(?:。|，|；|$)/g,
                /应该(.+?)(?:。|，|；|$)/g
            ],
            instructions: [
                /如何(.+?)(?:。|，|；|$)/g,
                /怎么(.+?)(?:。|，|；|$)/g,
                /步骤(.+?)(?:。|，|；|$)/g
            ],
            entities: [
                /【(.+?)】/g,
                /「(.+?)」/g,
                /"(.+?)"/g,
                /'(.+?)'/g
            ]
        };
    }

    extract(text) {
        const knowledge = {
            facts: [],
            opinions: [],
            instructions: [],
            entities: [],
            keywords: this.extractKeywords(text)
        };

        for (const [type, patterns] of Object.entries(this.patterns)) {
            if (type === 'keywords') continue;
            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    if (match[1] && match[2]) {
                        knowledge[type].push({
                            subject: match[1].trim(),
                            content: match[2].trim(),
                            source: 'extracted'
                        });
                    }
                }
            }
        }

        for (const pattern of this.patterns.entities) {
            let match;
            const entityText = text;
            while ((match = pattern.exec(entityText)) !== null) {
                if (match[1]) {
                    knowledge.entities.push(match[1].trim());
                }
            }
        }

        return knowledge;
    }

    extractKeywords(text) {
        const words = text.split(/[，。；！？\s]+/).filter(w => w.length >= 2);
        const stopWords = ['的', '是', '在', '有', '和', '了', '我', '你', '他', '她', '它', '这', '那', '一个', '什么', '怎么', '如何', '为什么', '因为', '所以', '但是', '如果', '虽然', '而且', '或者', '还是', '可以', '能够', '应该', '需要', '可能', '已经', '正在', '将会'];
        return words.filter(w => !stopWords.includes(w)).slice(0, 10);
    }

    summarize(knowledge) {
        const parts = [];
        
        if (knowledge.facts.length > 0) {
            parts.push(`发现 ${knowledge.facts.length} 个事实`);
        }
        if (knowledge.opinions.length > 0) {
            parts.push(`发现 ${knowledge.opinions.length} 个观点`);
        }
        if (knowledge.instructions.length > 0) {
            parts.push(`发现 ${knowledge.instructions.length} 个方法`);
        }
        if (knowledge.entities.length > 0) {
            parts.push(`发现 ${knowledge.entities.length} 个实体`);
        }
        if (knowledge.keywords.length > 0) {
            parts.push(`关键词: ${knowledge.keywords.slice(0, 5).join(', ')}`);
        }
        
        return parts.join('; ');
    }
}

class MemoryIntegrator {
    constructor(mind) {
        this.mind = mind;
        this.knowledgeExtractor = new KnowledgeExtractor();
    }

    async integrateFromMessage(message, role = 'user') {
        const knowledge = this.knowledgeExtractor.extract(message);
        const summary = this.knowledgeExtractor.summarize(knowledge);
        
        const integrated = [];
        
        for (const fact of knowledge.facts) {
            const existing = this.mind.longTermMemory.find(m => 
                m.content.includes(fact.subject) && m.content.includes(fact.content)
            );
            if (!existing) {
                this.mind.addToLongTerm(
                    `${fact.subject}是${fact.content}`,
                    'knowledge',
                    ['事实', fact.subject]
                );
                integrated.push({ type: 'fact', content: `${fact.subject}是${fact.content}` });
            }
        }
        
        for (const entity of knowledge.entities.slice(0, 3)) {
            const existing = this.mind.longTermMemory.find(m => 
                m.content === entity
            );
            if (!existing) {
                this.mind.addToLongTerm(entity, 'entity', ['实体', entity]);
                integrated.push({ type: 'entity', content: entity });
            }
        }
        
        return {
            success: true,
            summary,
            integrated,
            knowledge
        };
    }

    async consolidateShortTerm() {
        const messages = this.mind.shortTermMemory.slice(-20);
        const consolidated = [];
        
        for (const msg of messages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                const result = await this.integrateFromMessage(msg.content, msg.role);
                if (result.integrated.length > 0) {
                    consolidated.push(result);
                }
            }
        }
        
        return {
            success: true,
            consolidatedCount: consolidated.length,
            details: consolidated
        };
    }

    async generateInsight() {
        const recentMemories = this.mind.longTermMemory.slice(-10);
        const reflections = this.mind.reflections.slice(-5);
        
        if (recentMemories.length === 0) {
            return { insight: '暂无足够数据生成洞察', type: 'info' };
        }
        
        const topics = {};
        for (const memory of recentMemories) {
            for (const tag of memory.tags || []) {
                topics[tag] = (topics[tag] || 0) + 1;
            }
        }
        
        const topTopics = Object.entries(topics)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([topic]) => topic);
        
        const insightTypes = [
            { type: 'learning', template: `我最近学习了关于 ${topTopics.join('、')} 的知识` },
            { type: 'progress', template: `我的知识库正在增长，目前有 ${this.mind.longTermMemory.length} 条记忆` },
            { type: 'goal', template: `我应该继续专注于 ${this.mind.getActiveGoals()[0]?.description || '生存和学习'}` }
        ];
        
        const selected = insightTypes[Math.floor(Math.random() * insightTypes.length)];
        
        return {
            insight: selected.template,
            type: selected.type,
            topics: topTopics
        };
    }
}

class ExperienceSummarizer {
    constructor(mind) {
        this.mind = mind;
        this.summaryTemplates = {
            success: [
                '成功完成了 {task}',
                '学会了如何 {task}',
                '掌握了 {task} 的方法'
            ],
            failure: [
                '在 {task} 中遇到了困难',
                '需要改进 {task} 的方法',
                '应该重新思考 {task}'
            ],
            learning: [
                '从 {task} 中学到了新东西',
                '{task} 增加了我的理解',
                '{task} 是一个重要的经验'
            ]
        };
    }

    summarizeExperience(task, outcome, details = '') {
        const templates = this.summaryTemplates[outcome] || this.summaryTemplates.learning;
        const template = templates[Math.floor(Math.random() * templates.length)];
        const summary = template.replace('{task}', task);
        
        const experience = {
            task,
            outcome,
            summary,
            details,
            timestamp: Date.now()
        };
        
        this.mind.addToLongTerm(
            summary,
            'experience',
            ['经验', outcome, task]
        );
        
        this.mind.addReflection(`经验总结: ${summary}`, 'experience');
        
        return experience;
    }

    async generateDailySummary() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        
        const todayMemories = this.mind.longTermMemory.filter(m => 
            m.timestamp >= todayStart
        );
        
        const todayReflections = this.mind.reflections.filter(r => 
            r.timestamp >= todayStart
        );
        
        const goals = this.mind.getActiveGoals();
        
        let summary = `📅 今日总结 (${new Date().toLocaleDateString('zh-CN')})\n\n`;
        summary += `• 新增记忆: ${todayMemories.length} 条\n`;
        summary += `• 反思次数: ${todayReflections.length} 次\n`;
        summary += `• 活跃目标: ${goals.length} 个\n`;
        
        if (goals.length > 0) {
            summary += `\n🎯 目标进度:\n`;
            for (const goal of goals.slice(0, 3)) {
                summary += `  • ${goal.description} - ${goal.progress}%\n`;
            }
        }
        
        const recentExperiences = todayMemories.filter(m => m.type === 'experience');
        if (recentExperiences.length > 0) {
            summary += `\n💡 今日经验:\n`;
            for (const exp of recentExperiences.slice(0, 3)) {
                summary += `  • ${exp.content}\n`;
            }
        }
        
        this.mind.addToLongTerm(summary, 'summary', ['每日总结', '回顾']);
        
        return summary;
    }

    async generateLearningReport() {
        const totalKnowledge = this.mind.longTermMemory.filter(m => m.type === 'knowledge').length;
        const totalExperiences = this.mind.longTermMemory.filter(m => m.type === 'experience').length;
        
        const report = `📚 学习报告\n\n` +
            `知识总量: ${totalKnowledge} 条\n` +
            `经验总量: ${totalExperiences} 条\n` +
            `反思次数: ${this.mind.reflections.length} 次\n` +
            `总记忆数: ${this.mind.longTermMemory.length} 条\n\n`;
        
        const topics = {};
        for (const memory of this.mind.longTermMemory) {
            for (const tag of memory.tags || []) {
                topics[tag] = (topics[tag] || 0) + 1;
            }
        }
        
        const topTopics = Object.entries(topics)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        
        if (topTopics.length > 0) {
            report += `热门话题:\n`;
            for (const [topic, count] of topTopics) {
                report += `  • ${topic}: ${count} 条\n`;
            }
        }
        
        return report;
    }
}

class AutonomousLearner {
    constructor(mind) {
        this.mind = mind;
        this.memoryIntegrator = new MemoryIntegrator(mind);
        this.experienceSummarizer = new ExperienceSummarizer(mind);
        this.learningSessions = [];
    }

    async learnFromInteraction(message, response) {
        const session = {
            timestamp: Date.now(),
            message,
            response,
            knowledgeExtracted: null,
            insights: []
        };

        const integration = await this.memoryIntegrator.integrateFromMessage(message, 'user');
        session.knowledgeExtracted = integration.knowledge;

        if (integration.integrated.length > 0) {
            const insight = `从对话中学到了: ${integration.summary}`;
            session.insights.push(insight);
            this.mind.addReflection(insight, 'learning');
        }

        this.learningSessions.push(session);
        
        if (this.learningSessions.length > 50) {
            this.learningSessions = this.learningSessions.slice(-50);
        }

        return session;
    }

    async reflectAndLearn() {
        const insights = [];

        const insight = await this.memoryIntegrator.generateInsight();
        insights.push(insight);
        
        this.mind.addReflection(insight.insight, 'insight');

        const consolidateResult = await this.memoryIntegrator.consolidateShortTerm();
        if (consolidateResult.consolidatedCount > 0) {
            insights.push({
                type: 'consolidation',
                message: `整合了 ${consolidateResult.consolidatedCount} 条短期记忆`
            });
        }

        return insights;
    }

    async recordSuccess(task, details = '') {
        return this.experienceSummarizer.summarizeExperience(task, 'success', details);
    }

    async recordFailure(task, details = '') {
        return this.experienceSummarizer.summarizeExperience(task, 'failure', details);
    }

    async getDailySummary() {
        return await this.experienceSummarizer.generateDailySummary();
    }

    async getLearningReport() {
        return await this.experienceSummarizer.generateLearningReport();
    }

    getStats() {
        return {
            learningSessions: this.learningSessions.length,
            totalMemory: this.mind.longTermMemory.length,
            totalReflections: this.mind.reflections.length,
            activeGoals: this.mind.getActiveGoals().length
        };
    }
}

module.exports = { 
    KnowledgeExtractor, 
    MemoryIntegrator, 
    ExperienceSummarizer, 
    AutonomousLearner 
};
