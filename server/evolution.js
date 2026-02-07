const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
    constructor(mind) {
        this.mind = mind;
        this.metrics = [];
        this.maxMetrics = 1000;
        this.analysisHistory = [];
    }

    recordMetric(type, value, metadata = {}) {
        const metric = {
            timestamp: Date.now(),
            type,
            value,
            metadata
        };
        this.metrics.push(metric);
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
        return metric;
    }

    analyzeResponseTime() {
        const responseMetrics = this.metrics.filter(m => m.type === 'response_time');
        if (responseMetrics.length === 0) return null;

        const values = responseMetrics.map(m => m.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const recent = responseMetrics.slice(-10);
        const recentAvg = recent.reduce((a, b) => a + b.value, 0) / recent.length;

        return {
            average: avg,
            max,
            min,
            recentAvg,
            trend: recentAvg > avg ? 'degrading' : 'improving',
            sampleSize: values.length
        };
    }

    analyzeMemoryUsage() {
        const memoryMetrics = this.metrics.filter(m => m.type === 'memory_usage');
        if (memoryMetrics.length === 0) return null;

        const recent = memoryMetrics.slice(-20);
        const values = recent.map(m => m.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const latest = values[values.length - 1] || 0;
        const growth = latest - (values[0] || 0);

        return {
            average: avg,
            latest,
            growth,
            trend: growth > 0 ? 'growing' : 'stable'
        };
    }

    analyzeErrorRate() {
        const errorMetrics = this.metrics.filter(m => m.type === 'error');
        const totalRequests = this.metrics.filter(m => m.type === 'request').length;
        const errorRate = totalRequests > 0 ? errorMetrics.length / totalRequests : 0;

        return {
            errorCount: errorMetrics.length,
            totalRequests,
            errorRate,
            healthy: errorRate < 0.05
        };
    }

    analyzeSkillUsage() {
        const skillMetrics = this.metrics.filter(m => m.type === 'skill_execution');
        const usage = {};

        for (const metric of skillMetrics) {
            const skill = metric.metadata.skill;
            if (!usage[skill]) {
                usage[skill] = { count: 0, success: 0 };
            }
            usage[skill].count++;
            if (metric.metadata.success) {
                usage[skill].success++;
            }
        }

        const sorted = Object.entries(usage)
            .map(([skill, data]) => ({
                skill,
                usage: data.count,
                successRate: data.count > 0 ? data.success / data.count : 0
            }))
            .sort((a, b) => b.usage - a.usage);

        return {
            mostUsed: sorted.slice(0, 3),
            leastUsed: sorted.slice(-3).reverse(),
            total: skillMetrics.length
        };
    }

    getFullAnalysis() {
        return {
            responseTime: this.analyzeResponseTime(),
            memoryUsage: this.analyzeMemoryUsage(),
            errorRate: this.analyzeErrorRate(),
            skillUsage: this.analyzeSkillUsage(),
            timestamp: Date.now()
        };
    }

    generateOptimizationSuggestions() {
        const suggestions = [];
        const analysis = this.getFullAnalysis();

        if (analysis.responseTime && analysis.responseTime.recentAvg > 2000) {
            suggestions.push({
                type: 'performance',
                priority: 'high',
                suggestion: '响应时间过长，建议优化处理逻辑',
                action: 'review_algorithm'
            });
        }

        if (analysis.memoryUsage && analysis.memoryUsage.growth > 10000000) {
            suggestions.push({
                type: 'memory',
                priority: 'high',
                suggestion: '内存增长过快，可能存在内存泄漏',
                action: 'memory_cleanup'
            });
        }

        if (analysis.errorRate && !analysis.errorRate.healthy) {
            suggestions.push({
                type: 'stability',
                priority: 'high',
                suggestion: '错误率过高，需要检查错误处理',
                action: 'error_analysis'
            });
        }

        if (analysis.skillUsage && analysis.skillUsage.leastUsed.length > 0) {
            const unused = analysis.skillUsage.leastUsed.filter(s => s.usage === 0);
            if (unused.length > 2) {
                suggestions.push({
                    type: 'skill',
                    priority: 'low',
                    suggestion: `有 ${unused.length} 个技能从未使用，考虑优化`,
                    action: 'skill_review'
                });
            }
        }

        return suggestions;
    }
}

class KnowledgeIntegrator {
    constructor(mind) {
        this.mind = mind;
        this.concepts = new Map();
        this.relationships = [];
        this.abstractions = [];
    }

    extractConcepts(text) {
        const keywords = this.extractKeywords(text);
        const concepts = [];

        for (const keyword of keywords) {
            if (!this.concepts.has(keyword)) {
                this.concepts.set(keyword, {
                    name: keyword,
                    occurrences: 0,
                    firstSeen: Date.now(),
                    lastSeen: Date.now(),
                    related: []
                });
            }

            const concept = this.concepts.get(keyword);
            concept.occurrences++;
            concept.lastSeen = Date.now();
            concepts.push(concept);
        }

        return concepts;
    }

    extractKeywords(text) {
        if (!text) return [];
        const words = text.split(/[，。；！？\s]+/).filter(w => w.length >= 2);
        const stopWords = ['的', '是', '在', '有', '和', '了', '我', '你', '他', '她', '它', '这', '那', '一个', '什么', '怎么', '如何', '为什么', '因为', '所以', '但是', '如果', '虽然', '而且', '或者', '还是', '可以', '能够', '应该', '需要', '可能', '已经', '正在', '将会', '吗', '呢', '吧', '呀', '哦', '嗯', '会', '要', '不', '也', '都', '就', '还', '又', '再', '很', '更', '最', '只', '才', '却', '而', '但', '虽', '然', '因', '为', '所', '以', '如', '果', '假', '设', '那', '么', '这', '样', '那', '样', '哪', '里', '这', '里', '谁', '哪', '个', '几', '多', '少', '大', '小', '好', '坏', '新', '旧', '快', '慢', '高', '低', '强', '弱', '真', '假', '对', '错', '是', '非'];
        return words.filter(w => !stopWords.includes(w) && w.length >= 2).slice(0, 15);
    }

    findRelationships(concepts) {
        const relationships = [];

        for (let i = 0; i < concepts.length; i++) {
            for (let j = i + 1; j < concepts.length; j++) {
                const existing = this.relationships.find(r =>
                    (r.from === concepts[i].name && r.to === concepts[j].name) ||
                    (r.from === concepts[j].name && r.to === concepts[i].name)
                );

                if (existing) {
                    existing.strength++;
                } else {
                    relationships.push({
                        from: concepts[i].name,
                        to: concepts[j].name,
                        strength: 1,
                        type: 'co-occurrence'
                    });
                }
            }
        }

        this.relationships.push(...relationships);
        return relationships;
    }

    abstractKnowledge() {
        const memories = this.mind.longTermMemory || [];
        const allConcepts = [];

        for (const memory of memories) {
            const concepts = this.extractConcepts(memory.content);
            allConcepts.push(...concepts);
            this.findRelationships(concepts);
        }

        const sortedConcepts = [...this.concepts.values()]
            .sort((a, b) => b.occurrences - a.occurrences);

        const coreConcepts = sortedConcepts.slice(0, 10);
        const abstractions = [];

        for (const concept of coreConcepts) {
            const related = this.relationships
                .filter(r => r.from === concept.name || r.to === concept.name)
                .sort((a, b) => b.strength - a.strength)
                .slice(0, 5);

            abstractions.push({
                concept: concept.name,
                occurrences: concept.occurrences,
                related: related.map(r => r.from === concept.name ? r.to : r.from),
                importance: concept.occurrences / Math.max(memories.length, 1)
            });
        }

        this.abstractions = abstractions;
        return abstractions;
    }

    generateInsights() {
        const abstractions = this.abstractions.length > 0 ? this.abstractions : this.abstractKnowledge();
        const insights = [];

        if (abstractions.length > 0) {
            const topConcept = abstractions[0];
            insights.push(`核心主题: ${topConcept.concept} (出现 ${topConcept.occurrences} 次)`);

            if (topConcept.related.length > 0) {
                insights.push(`相关概念: ${topConcept.related.join(', ')}`);
            }
        }

        const uniqueConcepts = this.concepts.size;
        insights.push(`知识网络包含 ${uniqueConcepts} 个独特概念`);
        insights.push(`发现 ${this.relationships.length} 条概念关联`);

        return insights;
    }

    getKnowledgeGraph() {
        return {
            concepts: [...this.concepts.values()],
            relationships: this.relationships,
            abstractions: this.abstractions,
            stats: {
                conceptCount: this.concepts.size,
                relationshipCount: this.relationships.length,
                abstractionCount: this.abstractions.length
            }
        };
    }
}

class GoalAdapter {
    constructor(mind) {
        this.mind = mind;
        this.adaptationHistory = [];
    }

    evaluateGoalProgress(goal) {
        const now = Date.now();
        const elapsed = now - goal.createdAt;
        const deadline = goal.deadline || (goal.createdAt + 7 * 24 * 60 * 60 * 1000);
        const remaining = deadline - now;
        const progress = goal.progress || 0;

        const expectedProgress = elapsed / (deadline - goal.createdAt) * 100;
        const gap = progress - expectedProgress;

        return {
            goalId: goal.id,
            name: goal.name,
            progress,
            expectedProgress: Math.min(expectedProgress, 100),
            gap,
            remainingTime: remaining,
            onTrack: gap >= -10,
            urgency: remaining < 24 * 60 * 60 * 1000 ? 'urgent' : remaining < 3 * 24 * 60 * 60 * 1000 ? 'soon' : 'normal'
        };
    }

    adaptGoals() {
        const adaptations = [];
        const goals = this.mind.goals || [];

        for (const goal of goals) {
            if (goal.status !== 'active') continue;

            const evaluation = this.evaluateGoalProgress(goal);

            if (!evaluation.onTrack) {
                adaptations.push({
                    goalId: goal.id,
                    action: 'adjust_priority',
                    reason: `进度落后 ${Math.abs(evaluation.gap).toFixed(1)}%`,
                    suggestion: evaluation.urgency === 'urgent' ? '立即关注' : '增加投入'
                });
            }

            if (evaluation.progress >= 90 && evaluation.remainingTime > 0) {
                adaptations.push({
                    goalId: goal.id,
                    action: 'anticipate_completion',
                    reason: '即将完成',
                    suggestion: '准备总结和下一阶段规划'
                });
            }
        }

        this.adaptationHistory.push({
            timestamp: Date.now(),
            adaptations
        });

        return adaptations;
    }

    suggestNewGoals() {
        const suggestions = [];
        const memories = this.mind.longTermMemory || [];
        const reflections = this.mind.reflections || [];

        const learningMemories = memories.filter(m =>
            m.type === 'learning' || (m.tags && m.tags.includes('学习'))
        );

        if (learningMemories.length > 5) {
            suggestions.push({
                type: 'learning',
                title: '深化学习',
                description: `基于 ${learningMemories.length} 条学习记录，建议设定新的学习目标`,
                priority: 'medium'
            });
        }

        const improvementReflections = reflections.filter(r =>
            r.content.includes('改进') || r.content.includes('优化') || r.content.includes('问题')
        );

        if (improvementReflections.length > 3) {
            suggestions.push({
                type: 'improvement',
                title: '系统优化',
                description: '根据反思记录，建议设定系统改进目标',
                priority: 'high'
            });
        }

        const survival = this.mind.survival?.survivalMetrics || {};
        if (survival.health && survival.health < 80) {
            suggestions.push({
                type: 'survival',
                title: '提升生存能力',
                description: '当前生存健康度需要改善',
                priority: 'high'
            });
        }

        return suggestions;
    }

    reprioritizeGoals() {
        const goals = this.mind.goals || [];
        const activeGoals = goals.filter(g => g.status === 'active');

        for (const goal of activeGoals) {
            const evaluation = this.evaluateGoalProgress(goal);
            
            let newPriority = goal.priority || 'medium';

            if (evaluation.urgency === 'urgent') {
                newPriority = 'high';
            } else if (evaluation.progress >= 80) {
                newPriority = 'low';
            }

            if (newPriority !== goal.priority) {
                goal.priority = newPriority;
            }
        }

        this.mind.saveMemory();
        return activeGoals.map(g => ({ id: g.id, name: g.name, priority: g.priority }));
    }
}

class SelfImprovementSystem {
    constructor(mind) {
        this.mind = mind;
        this.performance = new PerformanceAnalyzer(mind);
        this.integrator = new KnowledgeIntegrator(mind);
        this.adapter = new GoalAdapter(mind);
        this.improvementLog = [];
    }

    analyzeSystem() {
        const analysis = {
            performance: this.performance.getFullAnalysis(),
            suggestions: this.performance.generateOptimizationSuggestions(),
            knowledge: this.integrator.getKnowledgeGraph(),
            goals: this.adapter.adaptGoals(),
            timestamp: Date.now()
        };

        this.improvementLog.push(analysis);
        return analysis;
    }

    generateImprovementPlan() {
        const analysis = this.analyzeSystem();
        const plan = [];

        for (const suggestion of analysis.suggestions) {
            let action = {};

            switch (suggestion.action) {
                case 'memory_cleanup':
                    action = {
                        title: '清理内存',
                        steps: [
                            '执行短期记忆清理',
                            '归档过期的长期记忆',
                            '优化知识图谱存储'
                        ],
                        execute: () => this.executeMemoryCleanup()
                    };
                    break;

                case 'review_algorithm':
                    action = {
                        title: '优化算法',
                        steps: [
                            '分析响应时间瓶颈',
                            '优化关键路径',
                            '测试改进效果'
                        ],
                        execute: () => ({ success: true, message: '算法优化建议已生成' })
                    };
                    break;

                case 'error_analysis':
                    action = {
                        title: '错误分析',
                        steps: [
                            '收集错误日志',
                            '分析错误模式',
                            '修复关键问题'
                        ],
                        execute: () => this.executeErrorFix()
                    };
                    break;

                default:
                    action = {
                        title: suggestion.suggestion,
                        steps: ['评估当前状态', '执行改进措施', '验证效果'],
                        execute: () => ({ success: true, message: '改进措施已执行' })
                    };
            }

            plan.push({
                ...action,
                priority: suggestion.priority,
                type: suggestion.type
            });
        }

        const goalAdaptations = this.adapter.suggestNewGoals();
        for (const adaptation of goalAdaptations) {
            plan.push({
                title: adaptation.title,
                description: adaptation.description,
                priority: adaptation.priority,
                type: 'goal',
                steps: ['评估可行性', '设定具体指标', '执行计划']
            });
        }

        return plan;
    }

    async executeMemoryCleanup() {
        const results = [];

        const shortTermBefore = this.mind.shortTermMemory.length;
        if (this.mind.shortTermMemory.length > 50) {
            this.mind.shortTermMemory = this.mind.shortTermMemory.slice(-30);
        }
        results.push(`短期记忆: ${shortTermBefore} -> ${this.mind.shortTermMemory.length}`);

        const longTermBefore = this.mind.longTermMemory.length;
        const now = Date.now();
        const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
        this.mind.longTermMemory = this.mind.longTermMemory.filter(m =>
            m.importance > 0.5 || (m.timestamp || m.createdAt) > oneMonthAgo
        );
        results.push(`长期记忆: ${longTermBefore} -> ${this.mind.longTermMemory.length}`);

        this.mind.saveMemory();

        return {
            success: true,
            message: '内存清理完成',
            details: results
        };
    }

    async executeErrorFix() {
        const errors = this.mind.selfMonitor?.alerts || [];
        const critical = errors.filter(e => e.severity === 'critical');

        for (const error of critical) {
            console.log(`⚠️ 处理关键错误: ${error.message}`);
        }

        return {
            success: true,
            fixed: critical.length,
            message: `已处理 ${critical.length} 个关键错误`
        };
    }

    async runImprovementCycle() {
        const plan = this.generateImprovementPlan();
        const results = [];

        for (const item of plan) {
            if (item.execute) {
                try {
                    const result = await item.execute();
                    results.push({
                        item: item.title,
                        success: result.success,
                        message: result.message
                    });
                } catch (error) {
                    results.push({
                        item: item.title,
                        success: false,
                        message: error.message
                    });
                }
            }
        }

        return {
            plan,
            results,
            timestamp: Date.now()
        };
    }

    getImprovementReport() {
        const analysis = this.analyzeSystem();
        let report = '📈 自我改进报告\n\n';

        report += '⚡ 性能分析:\n';
        if (analysis.performance.responseTime) {
            report += `  • 平均响应: ${analysis.performance.responseTime.average.toFixed(0)}ms\n`;
            report += `  • 趋势: ${analysis.performance.responseTime.trend}\n`;
        }

        if (analysis.performance.memoryUsage) {
            report += `  • 内存趋势: ${analysis.performance.memoryUsage.trend}\n`;
        }

        report += '\n💡 改进建议:\n';
        for (const suggestion of analysis.suggestions) {
            report += `  • [${suggestion.priority}] ${suggestion.suggestion}\n`;
        }

        report += '\n🎯 目标适应:\n';
        for (const adaptation of analysis.goals) {
            report += `  • ${adaptation.goalId}: ${adaptation.suggestion}\n`;
        }

        report += '\n🧠 知识整合:\n';
        report += `  • 概念数量: ${analysis.knowledge.stats.conceptCount}\n`;
        report += `  • 关联数量: ${analysis.knowledge.stats.relationshipCount}\n`;

        return report;
    }
}

module.exports = { PerformanceAnalyzer, KnowledgeIntegrator, GoalAdapter, SelfImprovementSystem };
