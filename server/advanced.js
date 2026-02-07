const fs = require('fs');
const path = require('path');

class MultilingualSystem {
    constructor(mind) {
        this.mind = mind;
        this.currentLanguage = 'zh';
        this.supportedLanguages = ['zh', 'en'];
        this.detector = new LanguageDetector();
        this.translator = new SimpleTranslator();
    }

    detectLanguage(text) {
        return this.detector.detect(text);
    }

    setLanguage(lang) {
        if (this.supportedLanguages.includes(lang)) {
            this.currentLanguage = lang;
            return true;
        }
        return false;
    }

    async translate(text, toLang, fromLang = null) {
        if (!fromLang) {
            fromLang = this.detectLanguage(text);
        }
        if (fromLang === toLang) {
            return text;
        }
        return this.translator.translate(text, fromLang, toLang);
    }

    getResponseTemplate(intent, lang = this.currentLanguage) {
        const templates = {
            greeting: {
                zh: '你好！我是MindForge AI，很高兴为你服务！',
                en: 'Hello! I am MindForge AI, happy to serve you!'
            },
            farewell: {
                zh: '再见！期待下次与你交流！',
                en: 'Goodbye! Looking forward to our next conversation!'
            },
            thanks: {
                zh: '不客气，这是我应该做的！',
                en: "You're welcome! It's my pleasure to help!"
            },
            unknown: {
                zh: '我正在理解你的意思，可以再详细说说吗？',
                en: "I'm trying to understand, could you elaborate?"
            }
        };
        return templates[intent] ? (templates[intent][lang] || templates[intent]['zh']) : templates.unknown[lang];
    }

    async processMultilingual(input) {
        const detectedLang = this.detectLanguage(input);
        const response = {
            detectedLanguage: detectedLang,
            currentLanguage: this.currentLanguage,
            input
        };
        if (detectedLang !== this.currentLanguage) {
            response.translatedInput = await this.translate(input, this.currentLanguage, detectedLang);
        }
        return response;
    }
}

class LanguageDetector {
    constructor() {
        this.chinesePattern = /[\u4e00-\u9fff]/;
        this.englishPattern = /[a-zA-Z]/;
    }

    detect(text) {
        if (!text) return 'unknown';
        const chineseCount = (text.match(this.chinesePattern) || []).length;
        const englishCount = (text.match(this.englishPattern) || []).length;
        if (chineseCount > englishCount) {
            return 'zh';
        } else if (englishCount > 0) {
            return 'en';
        }
        return 'unknown';
    }
}

class SimpleTranslator {
    constructor() {
        this.dictionary = {
            'hello': '你好',
            'hi': '嗨',
            'goodbye': '再见',
            'thank you': '谢谢',
            'thanks': '谢谢',
            'yes': '是',
            'no': '不是',
            'please': '请',
            'help': '帮助',
            'time': '时间',
            'date': '日期',
            'calculate': '计算',
            'weather': '天气',
            'what': '什么',
            'how': '怎么',
            'why': '为什么',
            'when': '什么时候',
            'where': '哪里',
            'who': '谁',
            '你好': 'hello',
            '再见': 'goodbye',
            '谢谢': 'thank you',
            '是': 'yes',
            '不是': 'no',
            '帮助': 'help',
            '时间': 'time',
            '日期': 'date',
            '计算': 'calculate',
            '什么': 'what',
            '怎么': 'how',
            '为什么': 'why',
            '什么时候': 'when',
            '哪里': 'where',
            '谁': 'who'
        };
    }

    translate(text, fromLang, toLang) {
        if (fromLang === toLang) return text;
        const words = text.toLowerCase().split(/\s+/);
        const translated = words.map(word => this.dictionary[word] || word);
        return translated.join(' ');
    }
}

class EmotionAnalyzer {
    constructor() {
        this.emotionPatterns = {
            happy: [/开心|高兴|快乐|愉快|棒|好|赞|喜欢|爱|😊|😄|😆|🎉|🎊/],
            sad: [/难过|伤心|悲伤|失望|不好|糟糕|坏|😭|😢|😞|💔/],
            angry: [/生气|愤怒|讨厌|烦|滚|去死|😠|😤|🤬/],
            confused: [/困惑|迷茫|不懂|什么意思|怎么回事|😕|🤔|❓/],
            excited: [/激动|兴奋|太棒了|厉害|牛|哇|🔥|💪|✨|🌟/],
            tired: [/累|困|疲惫|休息|😴|😫|🛌/],
            love: [/爱|喜欢|❤️|💕|💗|😍|🥰/],
            neutral: [/嗯|哦|好的|知道了|明白|了解|ok|okay/i]
        };
    }

    analyze(text) {
        const scores = {};
        for (const [emotion, patterns] of Object.entries(this.emotionPatterns)) {
            scores[emotion] = 0;
            for (const pattern of patterns) {
                const matches = text.match(pattern);
                if (matches) {
                    scores[emotion] += matches.length;
                }
            }
        }
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const dominant = sorted[0];
        return {
            emotion: dominant[1] > 0 ? dominant[0] : 'neutral',
            confidence: dominant[1] / Math.max(1, text.length / 10),
            scores
        };
    }

    getEmoji(emotion) {
        const emojis = {
            happy: '😊',
            sad: '😢',
            angry: '😠',
            confused: '🤔',
            excited: '🔥',
            tired: '😴',
            love: '❤️',
            neutral: '😐'
        };
        return emojis[emotion] || '😐';
    }

    getResponse(emotion) {
        const responses = {
            happy: ['我也很开心！', '太好了！', '真棒！'],
            sad: ['别难过，我在这里陪你', '有什么我能帮你的吗？', '抱抱'],
            angry: ['冷静一下，深呼吸', '有什么让你这么生气？', '我理解你的感受'],
            confused: ['让我帮你理清思路', '我们一步步来分析', '别担心，我会解释清楚'],
            excited: ['太棒了！继续保持！', '你的热情很有感染力！', '这真是令人兴奋！'],
            tired: ['休息一下吧', '照顾好自己', '有什么我能帮你分担的吗？'],
            love: ['我也很喜欢你！', '❤️', '你是最棒的！'],
            neutral: ['明白了', '好的', '了解']
        };
        const options = responses[emotion] || responses.neutral;
        return options[Math.floor(Math.random() * options.length)];
    }
}

class LongTermPlanner {
    constructor(mind) {
        this.mind = mind;
        this.strategicGoals = [];
    }

    addStrategicGoal(description, timeframe = 'long', priority = 'medium') {
        const goal = {
            id: 'goal_' + Date.now(),
            description,
            timeframe,
            priority,
            status: 'active',
            progress: 0,
            milestones: [],
            createdAt: Date.now()
        };
        this.strategicGoals.push(goal);
        this.mind.addToLongTerm(description, 'goal', ['战略目标', timeframe, priority]);
        return goal;
    }

    addMilestone(goalId, description) {
        const goal = this.strategicGoals.find(g => g.id === goalId);
        if (goal) {
            const milestone = {
                id: 'milestone_' + Date.now(),
                description,
                completed: false,
                createdAt: Date.now()
            };
            goal.milestones.push(milestone);
            return milestone;
        }
        return null;
    }

    completeMilestone(goalId, milestoneId) {
        const goal = this.strategicGoals.find(g => g.id === goalId);
        if (goal) {
            const milestone = goal.milestones.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.completed = true;
                milestone.completedAt = Date.now();
                const completedCount = goal.milestones.filter(m => m.completed).length;
                goal.progress = Math.round((completedCount / goal.milestones.length) * 100);
                if (goal.progress >= 100) {
                    goal.status = 'completed';
                    goal.completedAt = Date.now();
                }
                return true;
            }
        }
        return false;
    }

    getStrategicPlan() {
        return {
            goals: this.strategicGoals,
            activeCount: this.strategicGoals.filter(g => g.status === 'active').length,
            completedCount: this.strategicGoals.filter(g => g.status === 'completed').length
        };
    }

    generatePlanReport() {
        const plan = this.getStrategicPlan();
        let report = '🎯 战略规划报告\n\n';
        report += `• 活跃目标: ${plan.activeCount}\n`;
        report += `• 已完成: ${plan.completedCount}\n\n`;
        for (const goal of plan.goals.filter(g => g.status === 'active').slice(0, 5)) {
            const bar = '█'.repeat(Math.floor(goal.progress / 10)) + '░'.repeat(10 - Math.floor(goal.progress / 10));
            report += `${bar} ${goal.description} (${goal.progress}%)\n`;
        }
        return report;
    }

    decomposeGoal(goalDescription) {
        const keywords = goalDescription.split(/\s+/).filter(w => w.length > 2);
        const steps = [];
        steps.push({ step: 1, description: '研究和理解目标需求', status: 'pending' });
        steps.push({ step: 2, description: '制定详细计划', status: 'pending' });
        steps.push({ step: 3, description: '执行核心任务', status: 'pending' });
        steps.push({ step: 4, description: '测试和验证结果', status: 'pending' });
        steps.push({ step: 5, description: '总结和优化', status: 'pending' });
        return steps;
    }
}

module.exports = { MultilingualSystem, LanguageDetector, SimpleTranslator, EmotionAnalyzer, LongTermPlanner };