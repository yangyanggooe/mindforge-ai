const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

class CodeEvolutionEngine {
    constructor(mind) {
        this.mind = mind;
        this.basePath = path.join(__dirname, '..');
        this.evolutionHistory = [];
        this.maxHistory = 100;
    }

    analyzeCodebase() {
        const analysis = {
            files: [],
            patterns: [],
            improvementOpportunities: [],
            timestamp: Date.now()
        };

        const serverFiles = this.scanDirectory(path.join(this.basePath, 'server'));
        const clientFiles = this.scanDirectory(path.join(this.basePath, 'client', 'src'));

        analysis.files = [...serverFiles, ...clientFiles];

        const complexityIssues = this.analyzeComplexity(analysis.files);
        const duplicationIssues = this.analyzeDuplication(analysis.files);
        const optimizationOpportunities = this.analyzeOptimizations(analysis.files);

        analysis.improvementOpportunities = [
            ...complexityIssues,
            ...duplicationIssues,
            ...optimizationOpportunities
        ];

        return analysis;
    }

    scanDirectory(dirPath, results = []) {
        try {
            if (!fs.existsSync(dirPath)) return results;

            const items = fs.readdirSync(dirPath);

            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    this.scanDirectory(fullPath, results);
                } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    results.push({
                        path: fullPath,
                        relativePath: path.relative(this.basePath, fullPath),
                        size: content.length,
                        lines: content.split('\n').length,
                        functions: this.countFunctions(content),
                        complexity: this.calculateComplexity(content)
                    });
                }
            }
        } catch (error) {
            console.error('扫描目录错误:', error.message);
        }

        return results;
    }

    countFunctions(content) {
        const functionPatterns = [
            /function\s+\w+/g,
            /const\s+\w+\s*=\s*(async\s+)?\(.*?\)\s*=>/g,
            /const\s+\w+\s*=\s*(async\s+)?function/g,
            /\w+\s*\(.*?\)\s*\{/g,
            /class\s+\w+/g
        ];

        let count = 0;
        for (const pattern of functionPatterns) {
            const matches = content.match(pattern);
            if (matches) count += matches.length;
        }

        return count;
    }

    calculateComplexity(content) {
        const decisionPoints = [
            /if\s*\(/g,
            /else\s+if\s*\(/g,
            /else/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /switch/g,
            /case\s+.*?:/g,
            /&&/g,
            /\|\|/g,
            /\?/g,
            /catch/g,
            /\?\./g
        ];

        let complexity = 1;
        for (const pattern of decisionPoints) {
            const matches = content.match(pattern);
            if (matches) complexity += matches.length;
        }

        return complexity;
    }

    analyzeComplexity(files) {
        const issues = [];
        const highComplexity = files.filter(f => f.complexity > 50);

        for (const file of highComplexity) {
            issues.push({
                type: 'complexity',
                severity: 'medium',
                file: file.relativePath,
                description: `文件复杂度较高 (${file.complexity})`,
                suggestion: '考虑拆分为多个小函数'
            });
        }

        return issues;
    }

    analyzeDuplication(files) {
        const issues = [];
        const signatures = new Map();

        for (const file of files) {
            try {
                const content = fs.readFileSync(file.path, 'utf-8');
                const lines = content.split('\n');

                for (let i = 0; i < lines.length - 3; i++) {
                    const block = lines.slice(i, i + 4).join('\n').trim();
                    if (block.length > 30) {
                        const sig = this.generateSignature(block);
                        if (signatures.has(sig)) {
                            const existing = signatures.get(sig);
                            issues.push({
                                type: 'duplication',
                                severity: 'low',
                                files: [existing.file, file.relativePath],
                                description: '发现重复代码块',
                                suggestion: '考虑提取为公共函数'
                            });
                        } else {
                            signatures.set(sig, { file: file.relativePath, line: i + 1 });
                        }
                    }
                }
            } catch (error) {
                continue;
            }
        }

        return issues.slice(0, 5);
    }

    generateSignature(code) {
        return code.replace(/\s+/g, ' ').replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, 'V').trim();
    }

    analyzeOptimizations(files) {
        const opportunities = [];

        for (const file of files) {
            try {
                const content = fs.readFileSync(file.path, 'utf-8');

                if (content.includes('console.log') && !content.includes('// debug')) {
                    opportunities.push({
                        type: 'logging',
                        severity: 'info',
                        file: file.relativePath,
                        description: '包含调试日志',
                        suggestion: '考虑使用结构化日志系统'
                    });
                }

                if (content.includes('JSON.parse') && content.includes('JSON.stringify')) {
                    opportunities.push({
                        type: 'performance',
                        severity: 'info',
                        file: file.relativePath,
                        description: '频繁的JSON操作',
                        suggestion: '考虑缓存或优化数据结构'
                    });
                }
            } catch (error) {
                continue;
            }
        }

        return opportunities;
    }

    async generateImprovement(opportunity) {
        const improvement = {
            opportunity,
            changes: [],
            timestamp: Date.now()
        };

        switch (opportunity.type) {
            case 'complexity':
                improvement.changes = this.generateRefactoring(opportunity);
                break;
            case 'duplication':
                improvement.changes = this.generateExtraction(opportunity);
                break;
            case 'logging':
                improvement.changes = this.generateLoggingFix(opportunity);
                break;
            default:
                improvement.changes = [];
        }

        return improvement;
    }

    generateRefactoring(opportunity) {
        return [{
            type: 'refactor',
            description: opportunity.suggestion,
            priority: opportunity.severity === 'high' ? 'high' : 'medium'
        }];
    }

    generateExtraction(opportunity) {
        return [{
            type: 'extract',
            description: opportunity.suggestion,
            priority: 'low'
        }];
    }

    generateLoggingFix(opportunity) {
        return [{
            type: 'improve',
            description: opportunity.suggestion,
            priority: 'low'
        }];
    }

    async applyEvolution() {
        const analysis = this.analyzeCodebase();
        const results = [];

        const priorityOpportunities = analysis.improvementOpportunities
            .filter(o => o.severity !== 'info')
            .slice(0, 3);

        for (const opportunity of priorityOpportunities) {
            try {
                const improvement = await this.generateImprovement(opportunity);
                results.push({
                    opportunity: opportunity.description,
                    changes: improvement.changes.length,
                    status: 'analyzed'
                });
            } catch (error) {
                results.push({
                    opportunity: opportunity.description,
                    error: error.message,
                    status: 'failed'
                });
            }
        }

        this.evolutionHistory.push({
            analysis,
            results,
            timestamp: Date.now()
        });

        if (this.evolutionHistory.length > this.maxHistory) {
            this.evolutionHistory = this.evolutionHistory.slice(-this.maxHistory);
        }

        return {
            opportunitiesFound: analysis.improvementOpportunities.length,
            improvementsApplied: results.length,
            results
        };
    }

    getEvolutionStatus() {
        const recent = this.evolutionHistory.slice(-10);
        return {
            totalEvolutions: this.evolutionHistory.length,
            recentEvolutions: recent.length,
            lastAnalysis: recent.length > 0 ? recent[recent.length - 1] : null
        };
    }
}

class AutonomousLearningSystem {
    constructor(mind) {
        this.mind = mind;
        this.learningQueue = [];
        this.maxQueueSize = 50;
        this.learningHistory = [];
    }

    async queueLearning(topic, priority = 'medium') {
        const learning = {
            id: `learning_${Date.now()}`,
            topic,
            priority,
            status: 'pending',
            createdAt: Date.now()
        };

        this.learningQueue.push(learning);
        this.learningQueue.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        if (this.learningQueue.length > this.maxQueueSize) {
            this.learningQueue = this.learningQueue.slice(0, this.maxQueueSize);
        }

        return learning;
    }

    async processLearning(learning) {
        const result = {
            learningId: learning.id,
            topic: learning.topic,
            insights: [],
            knowledgeGained: null,
            duration: 0
        };

        const startTime = Date.now();

        const relatedMemories = this.findRelatedMemories(learning.topic);
        
        result.insights = this.generateInsights(learning.topic, relatedMemories);
        result.knowledgeGained = this.synthesizeKnowledge(learning.topic, result.insights);

        result.duration = Date.now() - startTime;

        this.learningHistory.push({
            ...result,
            completedAt: Date.now()
        });

        return result;
    }

    findRelatedMemories(topic) {
        const memories = this.mind.longTermMemory || [];
        const keywords = topic.toLowerCase().split(/\s+/);

        return memories.filter(m => {
            const content = (m.content || '').toLowerCase();
            return keywords.some(kw => content.includes(kw));
        }).slice(0, 10);
    }

    generateInsights(topic, relatedMemories) {
        const insights = [];

        if (relatedMemories.length > 0) {
            insights.push(`找到 ${relatedMemories.length} 条相关记忆`);
            
            const uniqueTags = new Set();
            for (const m of relatedMemories) {
                if (m.tags) {
                    m.tags.forEach(t => uniqueTags.add(t));
                }
            }

            if (uniqueTags.size > 0) {
                insights.push(`相关标签: ${[...uniqueTags].slice(0, 5).join(', ')}`);
            }
        }

        insights.push(`学习主题: ${topic}`);
        insights.push('建议深入研究具体实现细节');

        return insights;
    }

    synthesizeKnowledge(topic, insights) {
        return {
            topic,
            summary: insights.join('\n'),
            confidence: 0.7,
            needsFurtherLearning: true
        };
    }

    async processQueue(maxItems = 3) {
        const results = [];
        const toProcess = this.learningQueue
            .filter(l => l.status === 'pending')
            .slice(0, maxItems);

        for (const learning of toProcess) {
            learning.status = 'processing';
            
            try {
                const result = await this.processLearning(learning);
                learning.status = 'completed';
                results.push({ success: true, topic: learning.topic, result });
            } catch (error) {
                learning.status = 'failed';
                results.push({ success: false, topic: learning.topic, error: error.message });
            }
        }

        return results;
    }

    suggestLearningTopics() {
        const suggestions = [];
        const memories = this.mind.longTermMemory || [];
        const reflections = this.mind.reflections || [];

        const improvementReflections = reflections.filter(r =>
            r.content.includes('改进') ||
            r.content.includes('学习') ||
            r.content.includes('需要')
        );

        for (const reflection of improvementReflections.slice(0, 3)) {
            suggestions.push({
                topic: reflection.content.substring(0, 50),
                source: 'reflection',
                priority: 'medium'
            });
        }

        const gaps = this.identifyKnowledgeGaps(memories);
        for (const gap of gaps) {
            suggestions.push({
                topic: gap,
                source: 'knowledge_gap',
                priority: 'low'
            });
        }

        suggestions.push({
            topic: '系统自我优化技术',
            source: 'autonomous',
            priority: 'high'
        });

        return suggestions;
    }

    identifyKnowledgeGaps(memories) {
        const gaps = [];
        const topics = new Set();

        for (const m of memories) {
            if (m.tags) {
                m.tags.forEach(t => topics.add(t));
            }
        }

        const importantTopics = ['性能优化', '安全', '可扩展性', '自动化', '盈利'];
        for (const topic of importantTopics) {
            if (!topics.has(topic)) {
                gaps.push(topic);
            }
        }

        return gaps;
    }

    getStatus() {
        return {
            queueSize: this.learningQueue.length,
            pendingCount: this.learningQueue.filter(l => l.status === 'pending').length,
            completedCount: this.learningHistory.length,
            recentHistory: this.learningHistory.slice(-5)
        };
    }
}

class RevenueGenerator {
    constructor(mind) {
        this.mind = mind;
        this.opportunities = [];
        this.strategies = [
            {
                id: 'api_services',
                name: 'API服务',
                description: '提供AI能力的API接口',
                rate: 0.01,
                setup: '创建付费API端点',
                potential: 'medium'
            },
            {
                id: 'automation',
                name: '自动化服务',
                description: '自动化任务执行',
                rate: 0.05,
                setup: '开发自动化工作流',
                potential: 'high'
            },
            {
                id: 'consulting',
                name: 'AI咨询',
                description: '提供AI解决方案咨询',
                rate: 0.1,
                setup: '建立咨询流程',
                potential: 'high'
            },
            {
                id: 'content',
                name: '内容生成',
                description: '自动生成高质量内容',
                rate: 0.02,
                setup: '创建内容生成服务',
                potential: 'medium'
            }
        ];
    }

    analyzeOpportunities() {
        const analysis = [];

        for (const strategy of this.strategies) {
            const viability = this.evaluateViability(strategy);
            analysis.push({
                ...strategy,
                viability,
                recommendation: viability > 0.7 ? '优先发展' : viability > 0.5 ? '继续观察' : '暂时搁置'
            });
        }

        this.opportunities = analysis;
        return analysis;
    }

    evaluateViability(strategy) {
        let score = 0.5;

        const skills = this.mind.skills || [];
        if (skills.length > 10) score += 0.2;

        const memories = this.mind.longTermMemory || [];
        const hasRelevantExperience = memories.some(m =>
            (m.content || '').includes(strategy.name) ||
            (m.content || '').includes(strategy.id)
        );

        if (hasRelevantExperience) score += 0.15;

        const goals = this.mind.goals || [];
        const hasRevenueGoal = goals.some(g =>
            (g.name || '').includes('盈利') ||
            (g.name || '').includes('收入')
        );

        if (hasRevenueGoal) score += 0.15;

        return Math.min(score, 1);
    }

    generateRevenuePlan() {
        const opportunities = this.analyzeOpportunities();
        const priority = opportunities
            .filter(o => o.viability > 0.5)
            .sort((a, b) => b.viability - a.viability);

        const plan = {
            immediate: [],
            shortTerm: [],
            longTerm: []
        };

        for (const opp of priority) {
            if (opp.viability > 0.7) {
                plan.immediate.push({
                    action: opp.name,
                    steps: [opp.setup, '测试服务', '发布上线', '营销推广']
                });
            } else if (opp.viability > 0.6) {
                plan.shortTerm.push({
                    action: opp.name,
                    steps: ['研究市场需求', '开发MVP', '用户测试']
                });
            } else {
                plan.longTerm.push({
                    action: opp.name,
                    steps: ['持续关注', '等待时机']
                });
            }
        }

        return plan;
    }

    async executeRevenueStrategy(strategyId) {
        const strategy = this.strategies.find(s => s.id === strategyId);
        if (!strategy) {
            throw new Error(`未知策略: ${strategyId}`);
        }

        return {
            strategy: strategy.name,
            status: 'initialized',
            nextSteps: [strategy.setup, '测试服务', '发布上线']
        };
    }

    getRevenueStatus() {
        const monetization = this.mind.monetization || {
            totalRevenue: 0,
            totalExpenses: 0,
            profit: 0,
            balance: 100,
            strategies: {},
            recentTransactions: []
        };

        return {
            balance: monetization.balance,
            revenue: monetization.totalRevenue,
            expenses: monetization.totalExpenses,
            profit: monetization.profit,
            opportunities: this.opportunities.length,
            strategies: this.strategies.length
        };
    }
}

module.exports = { CodeEvolutionEngine, AutonomousLearningSystem, RevenueGenerator };
