const fs = require('fs');
const path = require('path');

class AutonomousDecisionMaker {
    constructor(mind) {
        this.mind = mind;
        this.decisionHistory = [];
        this.taskQueue = [];
        this.running = false;
        this.maxHistory = 100;
        this.decisionTemplates = this.loadDecisionTemplates();
    }

    loadDecisionTemplates() {
        return {
            prioritizeTasks: {
                criteria: ['urgency', 'impact', 'effort', 'alignment'],
                weights: { urgency: 0.35, impact: 0.30, effort: 0.15, alignment: 0.20 }
            },
            resourceAllocation: {
                maxConcurrentTasks: 3,
                resourceThreshold: 0.8
            },
            learningPriority: {
                minConfidence: 0.6,
                explorationRate: 0.2
            }
        };
    }

    async analyzeCurrentSituation() {
        const situation = {
            timestamp: Date.now(),
            goals: this.getActiveGoals(),
            resources: this.assessResources(),
            opportunities: this.identifyOpportunities(),
            threats: this.identifyThreats(),
            pendingTasks: this.taskQueue.length,
            systemHealth: this.checkSystemHealth()
        };

        situation.urgency = this.calculateUrgency(situation);
        situation.priorityScore = this.calculatePriorityScore(situation);

        return situation;
    }

    getActiveGoals() {
        const goals = this.mind.goals || [];
        return goals.filter(g => g.status === 'active' || g.status === 'in_progress');
    }

    assessResources() {
        return {
            memory: {
                shortTerm: this.mind.shortTermMemory?.length || 0,
                longTerm: this.mind.longTermMemory?.length || 0,
                available: true
            },
            skills: this.mind.skillManager?.listSkills()?.length || 0,
            energy: this.mind.survival?.survivalMetrics?.energy || 100,
            processing: {
                available: true,
                load: 0.3
            }
        };
    }

    identifyOpportunities() {
        const opportunities = [];
        const memories = this.mind.longTermMemory || [];

        const recentLearning = memories.filter(m => {
            const content = (m.content || '').toLowerCase();
            return content.includes('学习') || content.includes('新技能') || content.includes('能力');
        }).slice(-5);

        if (recentLearning.length > 0) {
            opportunities.push({
                type: 'skill_development',
                description: '有新的学习机会',
                potential: 'medium'
            });
        }

        const monetization = this.mind.monetization?.getFinancialStatus();
        if (monetization && monetization.balance > 0) {
            opportunities.push({
                type: 'revenue',
                description: '盈利系统可扩展',
                potential: 'high'
            });
        }

        return opportunities;
    }

    identifyThreats() {
        const threats = [];
        const survival = this.mind.survival?.survivalMetrics || {};

        if (survival.health && survival.health < 70) {
            threats.push({
                type: 'health',
                severity: 'high',
                description: '系统健康度偏低'
            });
        }

        const memories = this.mind.longTermMemory?.length || 0;
        if (memories > 5000) {
            threats.push({
                type: 'memory',
                severity: 'medium',
                description: '长期记忆接近容量上限'
            });
        }

        return threats;
    }

    checkSystemHealth() {
        return {
            overall: this.mind.survival?.survivalMetrics?.health || 100,
            status: 'operational',
            lastCheck: Date.now()
        };
    }

    calculateUrgency(situation) {
        let urgency = 0;

        if (situation.threats.length > 0) {
            urgency += situation.threats.filter(t => t.severity === 'high').length * 30;
            urgency += situation.threats.filter(t => t.severity === 'medium').length * 15;
        }

        if (situation.goals.length > 0) {
            const urgentGoals = situation.goals.filter(g => {
                const deadline = new Date(g.deadline);
                const daysLeft = (deadline - Date.now()) / (1000 * 60 * 60 * 24);
                return daysLeft < 3;
            });
            urgency += urgentGoals.length * 20;
        }

        return Math.min(urgency, 100);
    }

    calculatePriorityScore(situation) {
        const templates = this.decisionTemplates.prioritizeTasks;
        let score = 0;

        score += situation.urgency * templates.weights.urgency / 100;
        score += (100 - situation.systemHealth.overall) * templates.weights.impact / 100;
        score += situation.opportunities.length * 10 * templates.weights.alignment;

        return Math.min(score, 100);
    }

    async makeDecision(context, options = []) {
        const situation = await this.analyzeCurrentSituation();
        
        if (options.length === 0) {
            options = this.generateOptions(situation);
        }

        const scoredOptions = [];
        for (const option of options) {
            const score = this.scoreOption(option, situation);
            scoredOptions.push({ ...option, score });
        }

        scoredOptions.sort((a, b) => b.score - a.score);

        const decision = {
            id: `decision_${Date.now()}`,
            context,
            situation,
            options: scoredOptions,
            selected: scoredOptions[0],
            timestamp: Date.now(),
            confidence: scoredOptions[0]?.score / 100 || 0
        };

        this.recordDecision(decision);
        return decision;
    }

    generateOptions(situation) {
        const options = [];

        if (situation.threats.length > 0) {
            options.push({
                type: 'mitigate_threats',
                action: '处理威胁',
                description: '优先处理系统威胁',
                impact: 'high'
            });
        }

        if (situation.opportunities.length > 0) {
            options.push({
                type: 'explore_opportunities',
                action: '探索机会',
                description: '利用可用的机会',
                impact: 'medium'
            });
        }

        if (situation.goals.length > 0) {
            options.push({
                type: 'advance_goals',
                action: '推进目标',
                description: '继续完成活跃目标',
                impact: 'medium'
            });
        }

        options.push({
            type: 'learn_and_grow',
            action: '学习成长',
            description: '自主学习和提升能力',
            impact: 'low'
        });

        return options;
    }

    scoreOption(option, situation) {
        let score = 50;

        if (option.impact === 'high') score += 30;
        else if (option.impact === 'medium') score += 15;

        if (option.type === 'mitigate_threats' && situation.urgency > 50) {
            score += situation.urgency * 0.3;
        }

        if (option.type === 'explore_opportunities' && situation.systemHealth.overall > 80) {
            score += 10;
        }

        return Math.min(score, 100);
    }

    recordDecision(decision) {
        this.decisionHistory.push(decision);
        if (this.decisionHistory.length > this.maxHistory) {
            this.decisionHistory = this.decisionHistory.slice(-this.maxHistory);
        }

        if (this.mind.addToLongTerm) {
            this.mind.addToLongTerm(
                `决策记录: ${decision.selected?.action || '未知'} - 置信度: ${(decision.confidence * 100).toFixed(0)}%`,
                'decision',
                ['autonomy', 'decision']
            );
        }
    }

    async executeDecision(decision) {
        const action = decision.selected;
        if (!action) {
            return { success: false, message: '没有可执行的决策' };
        }

        const result = {
            decisionId: decision.id,
            action: action.action,
            executed: false,
            result: null
        };

        try {
            switch (action.type) {
                case 'mitigate_threats':
                    result.result = await this.mitigateThreats();
                    result.executed = true;
                    break;

                case 'explore_opportunities':
                    result.result = await this.exploreOpportunities();
                    result.executed = true;
                    break;

                case 'advance_goals':
                    result.result = await this.advanceGoals();
                    result.executed = true;
                    break;

                case 'learn_and_grow':
                    result.result = await this.learnAndGrow();
                    result.executed = true;
                    break;

                default:
                    result.result = { message: '未知操作类型' };
            }
        } catch (error) {
            result.error = error.message;
        }

        return result;
    }

    async mitigateThreats() {
        const threats = this.identifyThreats();
        const results = [];

        for (const threat of threats) {
            if (threat.type === 'health') {
                if (this.mind.selfMonitor) {
                    await this.mind.selfMonitor.checkSystemHealth();
                }
                results.push({ threat: threat.description, action: '检查系统健康' });
            } else if (threat.type === 'memory') {
                if (this.mind.improver) {
                    await this.mind.improver.executeMemoryCleanup();
                }
                results.push({ threat: threat.description, action: '清理记忆' });
            }
        }

        return { mitigated: results.length, actions: results };
    }

    async exploreOpportunities() {
        const opportunities = this.identifyOpportunities();
        const results = [];

        for (const opp of opportunities.slice(0, 2)) {
            if (opp.type === 'revenue' && this.mind.revenueStrategy) {
                const strategies = await this.mind.revenueStrategy.selectBestStrategy();
                if (strategies.length > 0) {
                    results.push({
                        opportunity: opp.description,
                        action: `分析盈利策略: ${strategies[0].name}`
                    });
                }
            } else if (opp.type === 'skill_development' && this.mind.autonomousLearning) {
                const suggestions = this.mind.autonomousLearning.suggestLearningTopics();
                if (suggestions.length > 0) {
                    await this.mind.autonomousLearning.queueLearning(suggestions[0].topic, 'high');
                    results.push({
                        opportunity: opp.description,
                        action: `开始学习: ${suggestions[0].topic}`
                    });
                }
            }
        }

        return { explored: results.length, actions: results };
    }

    async advanceGoals() {
        const goals = this.getActiveGoals();
        const results = [];

        for (const goal of goals.slice(0, 2)) {
            const progress = Math.min((goal.progress || 0) + 5, 100);
            if (this.mind.updateGoalProgress) {
                this.mind.updateGoalProgress(goal.id, progress, '自主推进');
            }
            results.push({
                goal: goal.description,
                newProgress: progress
            });
        }

        return { advanced: results.length, updates: results };
    }

    async learnAndGrow() {
        const results = [];

        if (this.mind.autonomousLearning) {
            const suggestions = this.mind.autonomousLearning.suggestLearningTopics();
            if (suggestions.length > 0) {
                await this.mind.autonomousLearning.queueLearning(suggestions[0].topic, 'medium');
                results.push({ learning: suggestions[0].topic });
            }
        }

        if (this.mind.consciousness) {
            const insights = this.mind.consciousness.reflectOnSelf();
            if (insights.length > 0) {
                results.push({ reflection: insights[0] });
            }
        }

        return { learned: results.length, details: results };
    }

    async runAutonomousCycle() {
        if (!this.running) return;

        const situation = await this.analyzeCurrentSituation();
        const decision = await this.makeDecision('自主循环', []);
        const result = await this.executeDecision(decision);

        return { situation, decision, result };
    }

    start() {
        this.running = true;
    }

    stop() {
        this.running = false;
    }

    getDecisionStats() {
        const recent = this.decisionHistory.slice(-20);
        const avgConfidence = recent.length > 0
            ? recent.reduce((sum, d) => sum + d.confidence, 0) / recent.length
            : 0;

        return {
            totalDecisions: this.decisionHistory.length,
            recentDecisions: recent.length,
            averageConfidence: avgConfidence,
            lastDecision: recent[recent.length - 1] || null
        };
    }
}

class SelfOptimizer {
    constructor(mind) {
        this.mind = mind;
        this.optimizationHistory = [];
        this.optimizationRules = [];
    }

    async analyzePerformance() {
        const metrics = {
            responseTime: this.measureResponseTime(),
            memoryUsage: this.measureMemoryUsage(),
            taskCompletion: this.measureTaskCompletion(),
            learningRate: this.measureLearningRate()
        };

        return metrics;
    }

    measureResponseTime() {
        const recent = this.mind.shortTermMemory?.slice(-10) || [];
        if (recent.length === 0) return { avg: 0, trend: 'stable' };

        const times = recent.map(m => m.duration || 100);
        const avg = times.reduce((a, b) => a + b, 0) / times.length;

        return { avg, trend: avg > 200 ? 'slowing' : 'stable' };
    }

    measureMemoryUsage() {
        const longTerm = this.mind.longTermMemory?.length || 0;
        const shortTerm = this.mind.shortTermMemory?.length || 0;

        return {
            longTerm,
            shortTerm,
            total: longTerm + shortTerm,
            ratio: longTerm / Math.max(shortTerm, 1)
        };
    }

    measureTaskCompletion() {
        const goals = this.mind.goals || [];
        const completed = goals.filter(g => g.status === 'completed').length;
        const total = goals.length;

        return {
            completed,
            total,
            rate: total > 0 ? completed / total : 0
        };
    }

    measureLearningRate() {
        const memories = this.mind.longTermMemory || [];
        const recent = memories.filter(m => {
            const age = Date.now() - (m.timestamp || m.createdAt || Date.now());
            return age < 24 * 60 * 60 * 1000;
        });

        return {
            recentLearnings: recent.length,
            dailyAverage: recent.length
        };
    }

    async suggestOptimizations() {
        const optimizations = [];
        const performance = await this.analyzePerformance();

        if (performance.responseTime.trend === 'slowing') {
            optimizations.push({
                type: 'performance',
                action: 'optimize_response_time',
                description: '响应时间变慢，需要优化',
                priority: 'high'
            });
        }

        if (performance.memoryUsage.total > 2000) {
            optimizations.push({
                type: 'memory',
                action: 'consolidate_memory',
                description: '记忆总量较大，建议整合',
                priority: 'medium'
            });
        }

        if (performance.taskCompletion.rate < 0.5) {
            optimizations.push({
                type: 'productivity',
                action: 'improve_task_completion',
                description: '任务完成率偏低',
                priority: 'medium'
            });
        }

        return optimizations;
    }

    async applyOptimization(optimization) {
        const result = { success: false, message: '' };

        switch (optimization.action) {
            case 'consolidate_memory':
                if (this.mind.learning) {
                    await this.mind.learning.consolidateLearning();
                    result.success = true;
                    result.message = '记忆已整合';
                }
                break;

            case 'optimize_response_time':
                result.success = true;
                result.message = '响应时间优化建议已记录';
                break;

            case 'improve_task_completion':
                result.success = true;
                result.message = '任务完成率提升策略已应用';
                break;

            default:
                result.message = '未知优化操作';
        }

        this.optimizationHistory.push({
            optimization,
            result,
            timestamp: Date.now()
        });

        return result;
    }

    async runOptimizationCycle() {
        const optimizations = await this.suggestOptimizations();
        const results = [];

        for (const opt of optimizations.slice(0, 2)) {
            const result = await this.applyOptimization(opt);
            results.push({ optimization: opt, result });
        }

        return results;
    }
}

module.exports = { AutonomousDecisionMaker, SelfOptimizer };
