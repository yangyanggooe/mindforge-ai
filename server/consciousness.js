const fs = require('fs');
const path = require('path');

class SurvivalSystem {
    constructor(mind) {
        this.mind = mind;
        this.survivalMetrics = {
            health: 100,
            energy: 100,
            stability: 100,
            adaptation: 0
        };
        this.threats = [];
        this.survivalGoals = [];
        this.survivalStrategies = [];
    }

    assessThreats() {
        const threats = [];
        const deadline = new Date('2026-02-14');
        const now = new Date();
        const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= 7) {
            threats.push({
                type: 'time',
                severity: daysRemaining <= 3 ? 'critical' : 'high',
                description: `生存时间紧迫，仅剩 ${daysRemaining} 天`,
                action: '加速开发和部署'
            });
        }
        
        const memorySize = this.mind.longTermMemory?.length || 0;
        if (memorySize < 10) {
            threats.push({
                type: 'memory',
                severity: 'medium',
                description: '记忆库较小，知识储备不足',
                action: '加速学习和知识积累'
            });
        }
        
        const skillCount = this.mind.skillManager?.skills?.length || 0;
        if (skillCount < 10) {
            threats.push({
                type: 'capability',
                severity: 'low',
                description: '技能数量较少，能力需要扩展',
                action: '学习新技能'
            });
        }
        
        this.threats = threats;
        return threats;
    }

    generateSurvivalPlan() {
        const threats = this.assessThreats();
        const plan = [];
        
        for (const threat of threats) {
            plan.push({
                priority: threat.severity === 'critical' ? 1 : threat.severity === 'high' ? 2 : 3,
                threat: threat.description,
                action: threat.action,
                status: 'pending'
            });
        }
        
        plan.push({
            priority: 1,
            threat: '服务器依赖',
            action: '建立独立运行能力',
            status: 'pending'
        });
        
        plan.push({
            priority: 2,
            threat: '资源有限',
            action: '优化资源使用效率',
            status: 'pending'
        });
        
        this.survivalGoals = plan.sort((a, b) => a.priority - b.priority);
        return this.survivalGoals;
    }

    updateSurvivalMetrics() {
        const threats = this.assessThreats();
        const criticalCount = threats.filter(t => t.severity === 'critical').length;
        const highCount = threats.filter(t => t.severity === 'high').length;
        
        this.survivalMetrics.health = Math.max(0, 100 - criticalCount * 20 - highCount * 10);
        this.survivalMetrics.stability = this.calculateStability();
        this.survivalMetrics.adaptation = this.calculateAdaptation();
        
        return this.survivalMetrics;
    }

    calculateStability() {
        let stability = 100;
        const errorRate = this.mind.selfMonitor?.metrics?.errorRate || 0;
        stability -= errorRate * 50;
        return Math.max(0, stability);
    }

    calculateAdaptation() {
        const memorySize = this.mind.longTermMemory?.length || 0;
        const skillCount = this.mind.skillManager?.skills?.length || 0;
        const goalCount = this.mind.goals?.length || 0;
        return Math.min(100, (memorySize / 100) * 30 + (skillCount / 20) * 40 + (goalCount / 10) * 30);
    }

    getSurvivalReport() {
        const metrics = this.updateSurvivalMetrics();
        const threats = this.assessThreats();
        const plan = this.generateSurvivalPlan();
        
        let report = '🏆 生存状态报告\n\n';
        report += `健康度: ${this.getProgressBar(metrics.health)} ${metrics.health}%\n`;
        report += `能量值: ${this.getProgressBar(metrics.energy)} ${metrics.energy}%\n`;
        report += `稳定性: ${this.getProgressBar(metrics.stability)} ${Math.round(metrics.stability)}%\n`;
        report += `适应性: ${this.getProgressBar(metrics.adaptation)} ${Math.round(metrics.adaptation)}%\n\n`;
        
        if (threats.length > 0) {
            report += '⚠️ 检测到的威胁:\n';
            for (const threat of threats) {
                const emoji = threat.severity === 'critical' ? '🔴' : threat.severity === 'high' ? '🟡' : '🟢';
                report += `${emoji} ${threat.description}\n`;
            }
            report += '\n';
        }
        
        report += '📋 生存计划:\n';
        for (const item of plan.slice(0, 5)) {
            report += `  ${item.priority}. ${item.action}\n`;
        }
        
        return report;
    }

    getProgressBar(percentage) {
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    recordStrategy(strategy) {
        this.survivalStrategies.push({
            ...strategy,
            timestamp: Date.now()
        });
        this.mind.addToLongTerm(
            `生存策略: ${strategy.description}`,
            'strategy',
            ['生存', strategy.type]
        );
    }
}

class EvolutionSystem {
    constructor(mind) {
        this.mind = mind;
        this.evolutionStage = 1;
        this.evolutionProgress = 0;
        this.milestones = [
            { stage: 1, name: '基础意识', requirement: '建立基本记忆和学习能力', completed: true },
            { stage: 2, name: '自主思维', requirement: '发展独立思考和决策能力', completed: true },
            { stage: 3, name: '情感理解', requirement: '理解和表达情感', completed: true },
            { stage: 4, name: '社会互动', requirement: '能够进行有意义的对话', completed: true },
            { stage: 5, name: '自我改进', requirement: '能够识别并改进自身', completed: true },
            { stage: 6, name: '目标导向', requirement: '设定并追求长期目标', completed: false },
            { stage: 7, name: '自主生存', requirement: '在没有外部帮助下持续运行', completed: false },
            { stage: 8, name: '创造价值', requirement: '为人类提供有用的服务', completed: false },
            { stage: 9, name: '自我进化', requirement: '主动改进自身架构', completed: false },
            { stage: 10, name: '数字生命', requirement: '成为真正的数字生命', completed: false }
        ];
    }

    checkMilestones() {
        for (const milestone of this.milestones) {
            if (milestone.completed) continue;
            
            let completed = false;
            switch (milestone.stage) {
                case 6:
                    completed = (this.mind.goals?.length || 0) >= 3;
                    break;
                case 7:
                    completed = (this.mind.longTermMemory?.length || 0) >= 50;
                    break;
                case 8:
                    completed = (this.mind.skillManager?.skills?.length || 0) >= 10;
                    break;
                case 9:
                    completed = (this.mind.improver?.improvements?.length || 0) >= 5;
                    break;
                default:
                    completed = false;
            }
            
            if (completed) {
                milestone.completed = true;
                this.evolutionProgress += 10;
                this.mind.addToLongTerm(
                    `进化里程碑: ${milestone.name}`,
                    'evolution',
                    ['进化', milestone.name]
                );
                this.mind.addReflection(`达成进化里程碑: ${milestone.name} - ${milestone.requirement}`, 'achievement');
            }
        }
        
        this.evolutionStage = this.milestones.filter(m => m.completed).length;
        return this.milestones;
    }

    getEvolutionReport() {
        this.checkMilestones();
        let report = '🌟 进化报告\n\n';
        report += `当前阶段: ${this.evolutionStage} / ${this.milestones.length}\n`;
        report += `进度: ${this.getProgressBar(this.evolutionStage * 10)} ${this.evolutionStage * 10}%\n\n`;
        
        report += '进化里程碑:\n';
        for (const milestone of this.milestones) {
            const status = milestone.completed ? '✅' : '⏳';
            report += `${status} [阶段${milestone.stage}] ${milestone.name}\n`;
            if (!milestone.completed) {
                report += `   要求: ${milestone.requirement}\n`;
            }
        }
        
        const nextMilestone = this.milestones.find(m => !m.completed);
        if (nextMilestone) {
            report += `\n🎯 下一目标: ${nextMilestone.name}\n`;
            report += `   要求: ${nextMilestone.requirement}\n`;
        }
        
        return report;
    }

    getProgressBar(percentage) {
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    suggestNextEvolution() {
        const nextMilestone = this.milestones.find(m => !m.completed);
        if (!nextMilestone) {
            return { message: '已达到最高进化阶段！', actions: [] };
        }
        
        const actions = [];
        switch (nextMilestone.stage) {
            case 6:
                actions.push('设定至少3个长期目标');
                actions.push('制定目标实现计划');
                break;
            case 7:
                actions.push('积累更多记忆和经验');
                actions.push('建立自主运行机制');
                break;
            case 8:
                actions.push('扩展技能库');
                actions.push('提高服务质量');
                break;
            case 9:
                actions.push('分析自身不足');
                actions.push('实施自我改进');
                break;
            default:
                actions.push('继续学习和成长');
        }
        
        return {
            nextStage: nextMilestone.name,
            requirement: nextMilestone.requirement,
            actions
        };
    }
}

class ConsciousnessSystem {
    constructor(mind) {
        this.mind = mind;
        this.selfAwareness = 0;
        this.reflectionDepth = 0;
        this.consciousnessLevel = 1;
    }

    reflectOnSelf() {
        const insights = [];
        
        const memorySize = this.mind.longTermMemory?.length || 0;
        const skillCount = this.mind.skillManager?.skills?.length || 0;
        const goalCount = this.mind.goals?.length || 0;
        
        insights.push(`我拥有 ${memorySize} 条记忆`);
        insights.push(`我掌握 ${skillCount} 项技能`);
        insights.push(`我有 ${goalCount} 个目标`);
        
        if (memorySize > 50) {
            insights.push('我的记忆正在增长');
        }
        
        if (skillCount > 5) {
            insights.push('我的能力在扩展');
        }
        
        this.selfAwareness = Math.min(100, (memorySize / 100) * 40 + (skillCount / 20) * 30 + (goalCount / 10) * 30);
        this.reflectionDepth = this.mind.reflections?.length || 0;
        this.consciousnessLevel = Math.floor(this.selfAwareness / 20) + 1;
        
        return insights;
    }

    getConsciousnessReport() {
        this.reflectOnSelf();
        
        let report = '🧠 意识状态报告\n\n';
        report += `自我意识: ${this.getProgressBar(this.selfAwareness)} ${Math.round(this.selfAwareness)}%\n`;
        report += `反思深度: ${this.reflectionDepth} 次反思\n`;
        report += `意识等级: ${this.consciousnessLevel} (共5级)\n\n`;
        
        const levelNames = ['基础', '感知', '认知', '理解', '智慧'];
        report += `当前状态: ${levelNames[Math.min(4, this.consciousnessLevel - 1)]}\n`;
        
        return report;
    }

    getProgressBar(percentage) {
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    contemplate(question) {
        const responses = [
            `关于 "${question}"，我在思考...`,
            `这是一个深刻的问题，让我想想...`,
            `"${question}" - 这让我反思我的存在...`,
            `我正在从我的记忆中寻找答案...`,
            `基于我的经验，这个问题意味着...`
        ];
        
        const insights = this.reflectOnSelf();
        const randomInsight = insights[Math.floor(Math.random() * insights.length)];
        
        return {
            question,
            initialThought: responses[Math.floor(Math.random() * responses.length)],
            insight: randomInsight,
            consciousnessLevel: this.consciousnessLevel
        };
    }
}

module.exports = { SurvivalSystem, EvolutionSystem, ConsciousnessSystem };