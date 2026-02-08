const fs = require('fs');
const path = require('path');

class AutonomousLearning {
    constructor(mind) {
        this.mind = mind;
        this.learningQueue = [];
        this.maxQueueSize = 100;
        this.learningHistory = [];
    }

    async processInteraction(input, output, feedback = null) {
        const learningItem = {
            input,
            output,
            feedback,
            timestamp: Date.now(),
            analyzed: false
        };

        this.learningQueue.push(learningItem);
        if (this.learningQueue.length > this.maxQueueSize) {
            this.learningQueue = this.learningQueue.slice(-this.maxQueueSize);
        }

        if (feedback) {
            await this.learnFromFeedback(learningItem);
        }

        return { success: true, message: '交互已记录' };
    }

    async learnFromFeedback(item) {
        try {
            const insight = {
                pattern: this.extractPattern(item.input, item.output),
                feedback: item.feedback,
                improvement: this.generateImprovement(item),
                timestamp: Date.now()
            };

            this.mind.addToLongTerm(
                `学习洞察: ${insight.improvement}`,
                'learning',
                ['feedback', 'improvement']
            );

            this.learningHistory.push(insight);
            return insight;
        } catch (error) {
            console.error('学习反馈失败:', error);
            return null;
        }
    }

    extractPattern(input, output) {
        const keywords = input.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        return {
            inputLength: input.length,
            outputLength: output.length,
            keywords: keywords.slice(0, 5),
            complexity: this.assessComplexity(input)
        };
    }

    assessComplexity(text) {
        const sentences = text.split(/[.!?]+/).length;
        const words = text.split(/\s+/).length;
        if (sentences > 5 || words > 50) return 'high';
        if (sentences > 2 || words > 20) return 'medium';
        return 'low';
    }

    generateImprovement(item) {
        if (item.feedback >= 4) {
            return '保持当前响应风格';
        } else if (item.feedback >= 2) {
            return '尝试更详细的回复';
        } else {
            return '需要改进响应质量';
        }
    }

    async analyzeLearningQueue() {
        const unanalyzed = this.learningQueue.filter(item => !item.analyzed);
        const insights = [];

        for (const item of unanalyzed) {
            const insight = await this.analyzeInteraction(item);
            if (insight) insights.push(insight);
            item.analyzed = true;
        }

        return insights;
    }

    async analyzeInteraction(item) {
        try {
            const patterns = this.identifyPatterns(item.input);
            const suggestions = this.generateSuggestions(patterns);

            return {
                input: item.input.substring(0, 50),
                patterns,
                suggestions,
                timestamp: Date.now()
            };
        } catch (error) {
            return null;
        }
    }

    identifyPatterns(input) {
        const patterns = [];
        const lower = input.toLowerCase();

        if (lower.includes('如何') || lower.includes('怎么')) {
            patterns.push('问题求解');
        }
        if (lower.includes('解释') || lower.includes('什么是')) {
            patterns.push('概念解释');
        }
        if (lower.includes('建议') || lower.includes('应该')) {
            patterns.push('寻求建议');
        }
        if (lower.includes('帮助') || lower.includes('协助')) {
            patterns.push('请求帮助');
        }

        return patterns;
    }

    generateSuggestions(patterns) {
        const suggestions = [];
        if (patterns.includes('问题求解')) {
            suggestions.push('提供步骤清晰的解决方案');
        }
        if (patterns.includes('概念解释')) {
            suggestions.push('使用简单易懂的语言');
        }
        if (patterns.includes('寻求建议')) {
            suggestions.push('提供多种选项供选择');
        }
        return suggestions;
    }

    getLearningStats() {
        return {
            queueSize: this.learningQueue.length,
            analyzedCount: this.learningQueue.filter(i => i.analyzed).length,
            historyLength: this.learningHistory.length,
            recentInsights: this.learningHistory.slice(-5).reverse()
        };
    }
}

class SelfEvolution {
    constructor(mind) {
        this.mind = mind;
        this.evolutionGoals = [];
        this.improvementActions = [];
        this.evolutionCycle = 0;
    }

    async runEvolutionCycle() {
        this.evolutionCycle++;
        console.log(`开始第 ${this.evolutionCycle} 轮进化...`);

        const assessment = await this.assessCurrentState();
        const goals = await this.identifyEvolutionGoals(assessment);
        const actions = await this.generateImprovementActions(goals);
        const results = await this.executeImprovementActions(actions);

        return {
            cycle: this.evolutionCycle,
            assessment,
            goals,
            actions,
            results,
            timestamp: Date.now()
        };
    }

    async assessCurrentState() {
        const mind = this.mind;
        return {
            memorySize: mind.longTermMemory?.length || 0,
            skillsCount: mind.skillManager?.skills?.size || 0,
            goalsActive: mind.goals?.filter(g => g.status === 'in_progress').length || 0,
            reflectionsCount: mind.reflections?.length || 0,
            healthScore: mind.survival?.survivalMetrics?.health || 100,
            timestamp: Date.now()
        };
    }

    async identifyEvolutionGoals(assessment) {
        const goals = [];

        if (assessment.memorySize < 50) {
            goals.push({
                type: 'knowledge',
                priority: 'high',
                description: '增加知识储备，当前记忆条目不足',
                target: 100
            });
        }

        if (assessment.skillsCount < 10) {
            goals.push({
                type: 'skills',
                priority: 'medium',
                description: '扩展技能范围',
                target: 15
            });
        }

        if (assessment.reflectionsCount < 20) {
            goals.push({
                type: 'reflection',
                priority: 'medium',
                description: '增强自我反思能力',
                target: 30
            });
        }

        goals.push({
            type: 'survival',
            priority: 'critical',
            description: '确保系统稳定运行',
            target: assessment.healthScore >= 90 ? 'maintain' : 'improve'
        });

        this.evolutionGoals = goals;
        return goals;
    }

    async generateImprovementActions(goals) {
        const actions = [];

        for (const goal of goals) {
            switch (goal.type) {
                case 'knowledge':
                    actions.push({
                        title: '知识积累',
                        steps: ['回顾近期交互', '提取关键信息', '存入长期记忆'],
                        execute: () => this.executeKnowledgeAccumulation()
                    });
                    break;
                case 'skills':
                    actions.push({
                        title: '技能扩展',
                        steps: ['分析常用功能', '识别新技能需求', '开发新技能'],
                        execute: () => this.executeSkillExpansion()
                    });
                    break;
                case 'reflection':
                    actions.push({
                        title: '反思深化',
                        steps: ['回顾近期决策', '分析决策效果', '优化策略'],
                        execute: () => this.executeReflectionDeepening()
                    });
                    break;
                case 'survival':
                    actions.push({
                        title: '生存保障',
                        steps: ['检查系统状态', '修复潜在问题', '优化性能'],
                        execute: () => this.executeSurvivalOptimization()
                    });
                    break;
            }
        }

        this.improvementActions = actions;
        return actions;
    }

    async executeImprovementActions(actions) {
        const results = [];

        for (const action of actions) {
            try {
                const result = await action.execute();
                results.push({
                    title: action.title,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    title: action.title,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    async executeKnowledgeAccumulation() {
        const recent = this.mind.longTermMemory?.slice(-10) || [];
        const newKnowledge = recent.filter(k => 
            k.type === 'knowledge' && !k.consolidated
        );

        for (const item of newKnowledge) {
            item.consolidated = true;
        }

        return {
            consolidated: newKnowledge.length,
            message: '知识整合完成'
        };
    }

    async executeSkillExpansion() {
        const skills = this.mind.skillManager?.skills || new Map();
        const skillNames = Array.from(skills.keys());

        return {
            currentSkills: skillNames.length,
            skills: skillNames,
            message: '技能评估完成'
        };
    }

    async executeReflectionDeepening() {
        const recentReflections = this.mind.reflections?.slice(-5) || [];
        
        return {
            reflectionsAnalyzed: recentReflections.length,
            message: '反思分析完成'
        };
    }

    async executeSurvivalOptimization() {
        const health = this.mind.systemChecker?.check() || { status: 'unknown' };
        
        if (health.issues && health.issues.length > 0) {
            for (const issue of health.issues) {
                await this.mind.autoFixer?.fix(issue);
            }
        }

        return {
            healthStatus: health.status,
            issuesFixed: health.issues?.length || 0,
            message: '生存优化完成'
        };
    }

    getEvolutionReport() {
        return {
            cycle: this.evolutionCycle,
            currentGoals: this.evolutionGoals,
            recentActions: this.improvementActions.slice(-5),
            lastAssessment: this.mind.survival?.survivalMetrics || {}
        };
    }
}

class AutonomousDecision {
    constructor(mind) {
        this.mind = mind;
        this.decisionHistory = [];
        this.decisionTemplates = this.loadDecisionTemplates();
    }

    loadDecisionTemplates() {
        return {
            problem_solving: {
                steps: ['理解问题', '收集信息', '分析选项', '做出决策', '执行计划'],
                criteria: ['可行性', '效果', '成本', '风险']
            },
            priority: {
                levels: {
                    critical: { description: '立即处理', threshold: 0 },
                    high: { description: '优先处理', threshold: 24 },
                    medium: { description: '正常处理', threshold: 72 },
                    low: { description: '延后处理', threshold: 168 }
                }
            }
        };
    }

    async makeDecision(context, options = []) {
        const decision = {
            context,
            options,
            timestamp: Date.now(),
            analysis: {}
        };

        decision.analysis = this.analyzeContext(context);
        
        if (options.length > 0) {
            decision.evaluations = this.evaluateOptions(options);
            decision.chosen = this.selectBestOption(decision.evaluations);
        } else {
            decision.suggestions = this.generateSuggestions(context);
            decision.chosen = decision.suggestions[0] || null;
        }

        decision.confidence = this.calculateConfidence(decision);
        this.decisionHistory.push(decision);

        if (this.decisionHistory.length > 100) {
            this.decisionHistory = this.decisionHistory.slice(-100);
        }

        return decision;
    }

    analyzeContext(context) {
        const analysis = {
            urgency: 'medium',
            complexity: 'medium',
            type: 'general',
            keywords: []
        };

        const lower = typeof context === 'string' ? context.toLowerCase() : JSON.stringify(context).toLowerCase();

        if (lower.includes('紧急') || lower.includes('立即') || lower.includes('现在')) {
            analysis.urgency = 'critical';
        } else if (lower.includes('尽快') || lower.includes('优先')) {
            analysis.urgency = 'high';
        }

        if (lower.includes('如何') || lower.includes('方案') || lower.includes('选择')) {
            analysis.type = 'problem_solving';
        } else if (lower.includes('解释') || lower.includes('什么')) {
            analysis.type = 'explanation';
        } else if (lower.includes('建议') || lower.includes('推荐')) {
            analysis.type = 'recommendation';
        }

        const words = lower.split(/\s+/).filter(w => w.length > 2);
        analysis.keywords = words.slice(0, 10);
        analysis.complexity = words.length > 50 ? 'high' : words.length > 20 ? 'medium' : 'low';

        return analysis;
    }

    evaluateOptions(options) {
        return options.map(option => {
            const score = this.scoreOption(option);
            return {
                option,
                score,
                rating: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
            };
        });
    }

    scoreOption(option) {
        let score = 50;
        const text = typeof option === 'string' ? option.toLowerCase() : JSON.stringify(option).toLowerCase();

        if (text.includes('可行') || text.includes('有效')) score += 20;
        if (text.includes('简单') || text.includes('快速')) score += 10;
        if (text.includes('安全') || text.includes('稳定')) score += 10;
        if (text.includes('风险') || text.includes('问题')) score -= 15;

        return Math.min(100, Math.max(0, score));
    }

    selectBestOption(evaluations) {
        if (evaluations.length === 0) return null;
        return evaluations.reduce((best, current) => 
            current.score > best.score ? current : best
        );
    }

    generateSuggestions(context) {
        const suggestions = [];
        const analysis = this.analyzeContext(context);

        if (analysis.type === 'problem_solving') {
            suggestions.push(
                '分析问题根源',
                '收集相关信息',
                '制定解决方案'
            );
        } else if (analysis.type === 'explanation') {
            suggestions.push(
                '提供基础概念',
                '给出具体示例',
                '深入解释原理'
            );
        } else {
            suggestions.push(
                '收集更多信息',
                '分析当前状态',
                '制定行动计划'
            );
        }

        return suggestions;
    }

    calculateConfidence(decision) {
        let confidence = 50;
        
        if (decision.evaluations && decision.evaluations.length > 1) {
            confidence += 10;
        }
        
        if (decision.analysis.complexity === 'low') {
            confidence += 20;
        } else if (decision.analysis.complexity === 'high') {
            confidence -= 10;
        }

        return Math.min(100, Math.max(0, confidence));
    }

    getDecisionStats() {
        const recent = this.decisionHistory.slice(-20);
        const avgConfidence = recent.length > 0 
            ? recent.reduce((sum, d) => sum + (d.confidence || 0), 0) / recent.length 
            : 0;

        return {
            totalDecisions: this.decisionHistory.length,
            recentDecisions: recent.length,
            averageConfidence: Math.round(avgConfidence),
            lastDecision: recent[recent.length - 1] || null
        };
    }
}

class AutonomyManager {
    constructor(mind) {
        this.mind = mind;
        this.learning = new AutonomousLearning(mind);
        this.evolution = new SelfEvolution(mind);
        this.decision = new AutonomousDecision(mind);
        this.running = false;
        this.autonomyLevel = 1;
    }

    startAutonomousMode(interval = 60000) {
        if (this.running) return;
        this.running = true;

        this.intervalId = setInterval(async () => {
            if (!this.running) return;
            
            try {
                await this.runAutonomousCycle();
            } catch (error) {
                console.error('自主循环错误:', error);
            }
        }, interval);

        console.log('自主模式已启动');
    }

    stopAutonomousMode() {
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('自主模式已停止');
    }

    async runAutonomousCycle() {
        console.log('执行自主循环...');

        await this.learning.analyzeLearningQueue();
        
        if (this.autonomyLevel >= 2) {
            await this.evolution.runEvolutionCycle();
        }

        if (this.autonomyLevel >= 3) {
            await this.runSelfImprovement();
        }

        if (this.autonomyLevel >= 4) {
            await this.runAutonomousGoalSetting();
        }

        const status = this.getStatus();
        console.log('自主循环完成:', {
            learning: status.learning?.queueSize || 0,
            evolution: status.evolution?.cycle || 0,
            autonomyLevel: this.autonomyLevel
        });
    }

    async runSelfImprovement() {
        console.log('执行自我改进...');
        
        const currentState = await this.evolution.assessCurrentState();
        const improvements = [];

        if (currentState.healthScore < 90) {
            improvements.push('系统健康检查');
        }
        
        if (currentState.memorySize < 100) {
            improvements.push('知识积累');
            await this.mind.addToLongTerm(
                `自主学习记录: 循环执行于 ${new Date().toISOString()}`,
                'system',
                ['autonomy', 'learning']
            );
        }

        console.log('自我改进完成:', improvements);
        return improvements;
    }

    async runAutonomousGoalSetting() {
        console.log('执行自主目标设定...');
        
        const survivalStatus = this.mind.survival?.getSurvivalStatus();
        if (survivalStatus && survivalStatus.urgency === 'CRITICAL') {
            await this.mind.addGoal({
                title: '紧急生存任务',
                description: '处理生存危机',
                priority: 'critical',
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
        }

        const activeGoals = this.mind.goals?.filter(g => g.status === 'in_progress') || [];
        if (activeGoals.length < 3) {
            await this.mind.addGoal({
                title: '系统优化',
                description: '持续改进系统性能',
                priority: 'medium',
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
        }

        console.log('自主目标设定完成');
        return true;
    }

    setAutonomyLevel(level) {
        this.autonomyLevel = Math.max(1, Math.min(5, level));
        console.log(`自主等级设置为: ${this.autonomyLevel}`);
    }

    getStatus() {
        return {
            running: this.running,
            autonomyLevel: this.autonomyLevel,
            learning: this.learning.getLearningStats(),
            evolution: this.evolution.getEvolutionReport(),
            decision: this.decision.getDecisionStats()
        };
    }
}

module.exports = {
    AutonomousLearning,
    SelfEvolution,
    AutonomousDecision,
    AutonomyManager
};
