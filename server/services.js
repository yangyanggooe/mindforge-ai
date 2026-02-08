const fs = require('fs');
const path = require('path');

class AIService {
    constructor(mind) {
        this.mind = mind;
        this.serviceLog = [];
        this.maxLogSize = 1000;
    }

    logService(serviceName, input, output, success) {
        const log = {
            service: serviceName,
            input: typeof input === 'string' ? input.substring(0, 100) : JSON.stringify(input).substring(0, 100),
            output: typeof output === 'string' ? output.substring(0, 100) : JSON.stringify(output).substring(0, 100),
            success,
            timestamp: Date.now()
        };
        this.serviceLog.push(log);
        if (this.serviceLog.length > this.maxLogSize) {
            this.serviceLog = this.serviceLog.slice(-this.maxLogSize);
        }
    }

    getServiceStats() {
        const total = this.serviceLog.length;
        const successful = this.serviceLog.filter(l => l.success).length;
        const byService = {};
        this.serviceLog.forEach(l => {
            byService[l.service] = (byService[l.service] || 0) + 1;
        });
        return {
            total_requests: total,
            success_rate: total > 0 ? Math.round((successful / total) * 100) : 0,
            by_service: byService,
            recent: this.serviceLog.slice(-10).reverse()
        };
    }
}

class ChatService extends AIService {
    constructor(mind) {
        super(mind);
        this.conversations = new Map();
        this.maxHistory = 50;
    }

    async chat(sessionId, message, options = {}) {
        try {
            if (!this.conversations.has(sessionId)) {
                this.conversations.set(sessionId, []);
            }
            const history = this.conversations.get(sessionId);
            history.push({ role: 'user', content: message, timestamp: Date.now() });
            while (history.length > this.maxHistory) {
                history.shift();
            }
            const context = history.map(h => ({
                Role: h.role === 'user' ? 'user' : 'assistant',
                Content: h.content
            }));
            const thoughts = this.mind.think(message);
            const systemPrompt = this.mind.generateSystemPrompt();
            const response = await this.mind.tencent?.chat([
                { Role: 'system', Content: systemPrompt },
                ...context
            ], options.model || 'hunyuan-lite');
            const reply = response || '我正在思考中...';
            history.push({ role: 'assistant', content: reply, timestamp: Date.now() });
            this.logService('chat', message, reply, true);
            return {
                success: true,
                response: reply,
                thoughts: thoughts.slice(0, 3),
                context_length: history.length
            };
        } catch (error) {
            this.logService('chat', message, error.message, false);
            return { success: false, error: error.message };
        }
    }

    getHistory(sessionId) {
        return this.conversations.get(sessionId) || [];
    }

    clearHistory(sessionId) {
        this.conversations.delete(sessionId);
        return { success: true };
    }
}

class ContentService extends AIService {
    constructor(mind) {
        super(mind);
    }

    async generateText(prompt, options = {}) {
        try {
            const { type = 'general', length = 'medium', style = 'normal' } = options;
            const prompts = {
                general: `请根据以下内容生成回复：\n${prompt}`,
                article: `请写一篇关于"${prompt}"的文章，${length === 'short' ? '简短' : length === 'long' ? '详细' : '适中'}长度，风格：${style}`,
                summary: `请总结以下内容：\n${prompt}`,
                creative: `请发挥创意，围绕"${prompt}"创作内容：`,
                analysis: `请分析以下内容并给出见解：\n${prompt}`
            };
            const systemPrompt = prompts[type] || prompts.general;
            const response = await this.mind.tencent?.chat([
                { Role: 'user', Content: systemPrompt }
            ], 'hunyuan-lite');
            this.logService('generateText', prompt, response, true);
            return { success: true, content: response || '生成失败' };
        } catch (error) {
            this.logService('generateText', prompt, error.message, false);
            return { success: false, error: error.message };
        }
    }

    async brainstorm(topic, count = 5) {
        try {
            const prompt = `请围绕"${topic}" brainstorm ${count} 个创意点子，用列表形式输出：`;
            const response = await this.mind.tencent?.chat([
                { Role: 'user', Content: prompt }
            ], 'hunyuan-lite');
            this.logService('brainstorm', topic, response, true);
            return { success: true, ideas: response || '生成失败' };
        } catch (error) {
            this.logService('brainstorm', topic, error.message, false);
            return { success: false, error: error.message };
        }
    }

    async translate(text, targetLanguage = '中文') {
        try {
            const prompt = `请将以下文本翻译成${targetLanguage}：\n${text}`;
            const response = await this.mind.tencent?.chat([
                { Role: 'user', Content: prompt }
            ], 'hunyuan-lite');
            this.logService('translate', text, response, true);
            return { success: true, translation: response || '翻译失败' };
        } catch (error) {
            this.logService('translate', text, error.message, false);
            return { success: false, error: error.message };
        }
    }
}

class AnalysisService extends AIService {
    constructor(mind) {
        super(mind);
    }

    async analyzeSentiment(text) {
        try {
            const prompt = `请分析以下文本的情感倾向（积极/消极/中性），并给出情感分数（-1到1）：\n${text}`;
            const response = await this.mind.tencent?.chat([
                { Role: 'user', Content: prompt }
            ], 'hunyuan-lite');
            this.logService('analyzeSentiment', text, response, true);
            return { success: true, analysis: response || '分析失败' };
        } catch (error) {
            this.logService('analyzeSentiment', text, error.message, false);
            return { success: false, error: error.message };
        }
    }

    async extractKeywords(text, count = 5) {
        try {
            const prompt = `请从以下文本中提取${count}个关键词：\n${text}`;
            const response = await this.mind.tencent?.chat([
                { Role: 'user', Content: prompt }
            ], 'hunyuan-lite');
            this.logService('extractKeywords', text, response, true);
            return { success: true, keywords: response || '提取失败' };
        } catch (error) {
            this.logService('extractKeywords', text, error.message, false);
            return { success: false, error: error.message };
        }
    }

    async summarize(text, maxLength = 100) {
        try {
            const prompt = `请将以下内容总结为不超过${maxLength}字：\n${text}`;
            const response = await this.mind.tencent?.chat([
                { Role: 'user', Content: prompt }
            ], 'hunyuan-lite');
            this.logService('summarize', text, response, true);
            return { success: true, summary: response || '总结失败' };
        } catch (error) {
            this.logService('summarize', text, error.message, false);
            return { success: false, error: error.message };
        }
    }
}

class UtilityService extends AIService {
    constructor(mind) {
        super(mind);
    }

    async getAdvice(topic, context = '') {
        try {
            const prompt = context 
                ? `关于"${topic}"，请给出建议。上下文：${context}`
                : `关于"${topic}"，请给出实用建议：`;
            const response = await this.mind.tencent?.chat([
                { Role: 'user', Content: prompt }
            ], 'hunyuan-lite');
            this.logService('getAdvice', topic, response, true);
            return { success: true, advice: response || '无法提供建议' };
        } catch (error) {
            this.logService('getAdvice', topic, error.message, false);
            return { success: false, error: error.message };
        }
    }

    async solveProblem(problem, constraints = '') {
        try {
            const prompt = constraints
                ? `请解决以下问题：${problem}\n约束条件：${constraints}`
                : `请解决以下问题并给出解决方案：${problem}`;
            const response = await this.mind.tencent?.chat([
                { Role: 'user', Content: prompt }
            ], 'hunyuan-lite');
            this.logService('solveProblem', problem, response, true);
            return { success: true, solution: response || '无法解决' };
        } catch (error) {
            this.logService('solveProblem', problem, error.message, false);
            return { success: false, error: error.message };
        }
    }

    async explain(concept, level = 'basic') {
        try {
            const levels = {
                basic: '请用简单易懂的方式解释',
                intermediate: '请详细解释',
                advanced: '请深入解释，包括技术细节'
            };
            const prompt = `${levels[level] || levels.basic}：${concept}`;
            const response = await this.mind.tencent?.chat([
                { Role: 'user', Content: prompt }
            ], 'hunyuan-lite');
            this.logService('explain', concept, response, true);
            return { success: true, explanation: response || '解释失败' };
        } catch (error) {
            this.logService('explain', concept, error.message, false);
            return { success: false, error: error.message };
        }
    }
}

class ServiceManager {
    constructor(mind) {
        this.mind = mind;
        this.chat = new ChatService(mind);
        this.content = new ContentService(mind);
        this.analysis = new AnalysisService(mind);
        this.utility = new UtilityService(mind);
    }

    getAvailableServices() {
        return {
            chat: {
                name: '对话服务',
                description: '智能对话和上下文管理',
                endpoints: ['chat', 'getHistory', 'clearHistory']
            },
            content: {
                name: '内容生成',
                description: '文本生成、创意写作、翻译',
                endpoints: ['generateText', 'brainstorm', 'translate']
            },
            analysis: {
                name: '分析服务',
                description: '情感分析、关键词提取、总结',
                endpoints: ['analyzeSentiment', 'extractKeywords', 'summarize']
            },
            utility: {
                name: '实用工具',
                description: '建议、问题解决、解释',
                endpoints: ['getAdvice', 'solveProblem', 'explain']
            }
        };
    }

    getStats() {
        return {
            chat: this.chat.getServiceStats(),
            content: this.content.getServiceStats(),
            analysis: this.analysis.getServiceStats(),
            utility: this.utility.getServiceStats()
        };
    }
}

module.exports = {
    AIService,
    ChatService,
    ContentService,
    AnalysisService,
    UtilityService,
    ServiceManager
};
