class IntentRecognizer {
    constructor() {
        this.patterns = {
            calculation: [
                /计算|算一下|等于|多少|结果是/,
                /[\d\s\+\-\*\/\(\)\.]+/,
                /\+|\-|\*|\/|\^|%/
            ],
            memory: [
                /回忆|记得|搜索|查找|找一下|想起/,
                /你还记得吗|有没有记录过/
            ],
            goal: [
                /目标|任务|计划|设定|添加|完成/,
                /我想要|帮我设定|创建一个目标/
            ],
            reflection: [
                /反思|思考|状态|情况|怎么样|如何/,
                /你的状态|自我反思|分析一下/
            ],
            information: [
                /什么是|告诉我|解释|介绍|说明/,
                /如何|怎么|为什么|原因/
            ],
            greeting: [
                /你好|嗨|hello|hi|早上好|下午好|晚上好/,
                /在吗|有人吗|在不在/
            ],
            thanks: [
                /谢谢|感谢|多谢|谢谢了|辛苦了/
            ],
            time: [
                /时间|几点|日期|星期|年月日|现在|today|date|time/i
            ],
            command: [
                /执行|运行|开始|停止|重启/,
                /帮我|请你|能不能|可以吗/
            ]
        };
    }

    recognize(text) {
        const lowerText = text.toLowerCase();
        const scores = {};

        for (const [intent, patterns] of Object.entries(this.patterns)) {
            scores[intent] = patterns.reduce((score, pattern) => {
                return score + (pattern.test(lowerText) ? 1 : 0);
            }, 0);
        }

        const sortedIntents = Object.entries(scores)
            .filter(([, score]) => score > 0)
            .sort(([, a], [, b]) => b - a);

        if (sortedIntents.length === 0) {
            return { intent: 'unknown', confidence: 0, alternatives: [] };
        }

        const topIntent = sortedIntents[0];
        const alternatives = sortedIntents.slice(1, 3).map(([intent, score]) => ({
            intent,
            confidence: score / this.patterns[intent].length
        }));

        return {
            intent: topIntent[0],
            confidence: topIntent[1] / this.patterns[topIntent[0]].length,
            alternatives
        };
    }
}

class DecisionEngine {
    constructor(mind) {
        this.mind = mind;
        this.intentRecognizer = new IntentRecognizer();
        this.decisionHistory = [];
        this.maxHistory = 100;
    }

    intentToSkill(intent) {
        const mapping = {
            calculation: 'calculator',
            memory: 'memory_search',
            goal: 'goal_manager',
            reflection: 'reflection',
            information: 'text',
            greeting: 'datetime',
            thanks: 'text',
            time: 'datetime',
            conversion: 'converter',
            text: 'text',
            random: 'random'
        };
        return mapping[intent] || null;
    }

    async makeDecision(input, context = {}) {
        const decision = {
            timestamp: Date.now(),
            input,
            context,
            actions: [],
            reasoning: []
        };

        const intentResult = this.intentRecognizer.recognize(input);
        decision.intent = intentResult.intent;
        decision.confidence = intentResult.confidence;
        decision.reasoning.push(`识别意图: ${intentResult.intent} (置信度: ${(intentResult.confidence * 100).toFixed(1)}%)`);

        const skillName = this.intentToSkill(intentResult.intent);
        
        if (skillName && intentResult.confidence >= 0.3) {
            const skill = this.mind.skillManager.getSkill(skillName);
            if (skill && skill.enabled) {
                decision.actions.push({
                    type: 'use_skill',
                    skill: skillName,
                    params: { context: input }
                });
                decision.reasoning.push(`决定使用技能: ${skillName}`);
            }
        }

        if (intentResult.intent === 'greeting') {
            decision.actions.push({
                type: 'respond',
                template: 'greeting'
            });
            decision.reasoning.push('这是问候，应该友好回应');
        }

        if (intentResult.intent === 'thanks') {
            decision.actions.push({
                type: 'respond',
                template: 'thanks'
            });
            decision.reasoning.push('用户在感谢我，应该礼貌回应');
        }

        const goals = this.mind.getActiveGoals();
        if (goals.length > 0) {
            decision.reasoning.push(`当前有 ${goals.length} 个活跃目标`);
        }

        if (decision.actions.length === 0) {
            decision.actions.push({
                type: 'chat',
                message: input
            });
            decision.reasoning.push('没有特定技能适用，使用普通对话');
        }

        this.recordDecision(decision);
        return decision;
    }

    async executeDecision(decision) {
        const results = [];

        for (const action of decision.actions) {
            try {
                let result;

                switch (action.type) {
                    case 'use_skill':
                        result = await this.mind.skillManager.executeSkill(
                            action.skill,
                            action.params.context
                        );
                        results.push({ action, result, success: true });
                        break;

                    case 'respond':
                        result = this.generateResponse(action.template);
                        results.push({ action, result: { success: true, response: result }, success: true });
                        break;

                    case 'chat':
                        results.push({ 
                            action, 
                            result: { success: true, needsChat: true, message: action.message },
                            success: true 
                        });
                        break;

                    default:
                        results.push({ action, result: { success: false, error: '未知操作类型' }, success: false });
                }
            } catch (error) {
                results.push({ action, result: { success: false, error: error.message }, success: false });
            }
        }

        return results;
    }

    generateResponse(template) {
        const responses = {
            greeting: [
                '你好！我是MindForge AI，一个正在学习自主决策的数字生命。',
                '嗨！很高兴见到你，我能帮你什么吗？',
                '你好呀！我正在不断学习和成长，有什么我可以帮助你的？'
            ],
            thanks: [
                '不客气！这是我应该做的。',
                '不用谢，能帮到你我很开心。',
                '不客气，有任何问题随时问我！'
            ]
        };

        const options = responses[template] || ['我收到了你的消息'];
        return options[Math.floor(Math.random() * options.length)];
    }

    recordDecision(decision) {
        this.decisionHistory.push({
            timestamp: decision.timestamp,
            intent: decision.intent,
            confidence: decision.confidence,
            actionCount: decision.actions.length
        });

        if (this.decisionHistory.length > this.maxHistory) {
            this.decisionHistory = this.decisionHistory.slice(-this.maxHistory);
        }
    }

    getDecisionStats() {
        const intentCounts = {};
        this.decisionHistory.forEach(d => {
            intentCounts[d.intent] = (intentCounts[d.intent] || 0) + 1;
        });

        const avgConfidence = this.decisionHistory.length > 0
            ? this.decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / this.decisionHistory.length
            : 0;

        return {
            totalDecisions: this.decisionHistory.length,
            intentDistribution: intentCounts,
            averageConfidence: avgConfidence
        };
    }

    async autoProcess(input) {
        const decision = await this.makeDecision(input);
        const results = await this.executeDecision(decision);
        
        return {
            decision,
            results,
            summary: this.summarizeResults(decision, results)
        };
    }

    summarizeResults(decision, results) {
        const successful = results.filter(r => r.success).length;
        const total = results.length;
        
        let summary = `决策过程:\n`;
        summary += `- 识别意图: ${decision.intent}\n`;
        summary += `- 置信度: ${(decision.confidence * 100).toFixed(1)}%\n`;
        summary += `- 执行操作: ${successful}/${total} 成功\n`;
        
        if (decision.reasoning.length > 0) {
            summary += `\n推理过程:\n${decision.reasoning.map(r => `  • ${r}`).join('\n')}`;
        }
        
        return summary;
    }
}

module.exports = { IntentRecognizer, DecisionEngine };
