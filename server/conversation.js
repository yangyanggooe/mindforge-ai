const fs = require('fs');
const path = require('path');

class ContextManager {
    constructor(mind) {
        this.mind = mind;
        this.maxContextSize = 20;
        this.contextWindow = [];
    }

    addMessage(role, content) {
        const message = {
            role,
            content,
            timestamp: Date.now(),
            keywords: this.extractKeywords(content)
        };
        
        this.contextWindow.push(message);
        if (this.contextWindow.length > this.maxContextSize) {
            this.contextWindow.shift();
        }
        
        this.mind.addToShortTerm(content, role);
        return message;
    }

    extractKeywords(text) {
        const words = text.split(/[，。；！？\s]+/).filter(w => w.length >= 2);
        const stopWords = ['的', '是', '在', '有', '和', '了', '我', '你', '他', '她', '它', '这', '那', '一个', '什么', '怎么', '如何', '为什么', '因为', '所以', '但是', '如果', '虽然', '而且', '或者', '还是', '可以', '能够', '应该', '需要', '可能', '已经', '正在', '将会', '吗', '呢', '吧', '呀', '哦', '嗯'];
        return words.filter(w => !stopWords.includes(w) && w.length >= 2).slice(0, 10);
    }

    getRecentContext(count = 5) {
        return this.contextWindow.slice(-count);
    }

    getConversationSummary() {
        const messages = this.contextWindow;
        if (messages.length === 0) return '暂无对话历史';
        
        const userMessages = messages.filter(m => m.role === 'user');
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        
        let summary = `📝 对话摘要\n\n`;
        summary += `• 总消息数: ${messages.length}\n`;
        summary += `• 用户消息: ${userMessages.length}\n`;
        summary += `• 助手消息: ${assistantMessages.length}\n`;
        
        const allKeywords = [];
        messages.forEach(m => {
            if (m.keywords) allKeywords.push(...m.keywords);
        });
        
        const uniqueKeywords = [...new Set(allKeywords)].slice(0, 10);
        if (uniqueKeywords.length > 0) {
            summary += `\n🔑 关键词: ${uniqueKeywords.join(', ')}\n`;
        }
        
        return summary;
    }

    findRelatedMessages(keyword) {
        return this.contextWindow.filter(m => 
            m.content.includes(keyword) ||
            (m.keywords && m.keywords.some(k => k.includes(keyword)))
        );
    }

    detectTopicShift() {
        if (this.contextWindow.length < 3) return false;
        
        const recent = this.contextWindow.slice(-3);
        const recentKeywords = recent.flatMap(m => m.keywords || []);
        
        const earlier = this.contextWindow.slice(0, -3);
        const earlierKeywords = earlier.flatMap(m => m.keywords || []);
        
        const overlap = recentKeywords.filter(k => earlierKeywords.includes(k));
        return overlap.length < 2 && earlierKeywords.length > 5;
    }

    getTopic() {
        const allKeywords = this.contextWindow.flatMap(m => m.keywords || []);
        const keywordCounts = {};
        
        allKeywords.forEach(k => {
            keywordCounts[k] = (keywordCounts[k] || 0) + 1;
        });
        
        const sorted = Object.entries(keywordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
        
        return sorted.map(([k]) => k);
    }
}

class MemoryRetriever {
    constructor(mind) {
        this.mind = mind;
    }

    async retrieveRelevant(query, limit = 5) {
        const keywords = this.extractKeywords(query);
        const results = [];
        
        for (const memory of this.mind.longTermMemory) {
            let score = 0;
            for (const keyword of keywords) {
                if (memory.content.includes(keyword)) score += 2;
                if (memory.tags && memory.tags.some(t => t.includes(keyword))) score += 1;
            }
            if (score > 0) {
                results.push({ ...memory, relevance: score });
            }
        }
        
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit);
    }

    extractKeywords(text) {
        const words = text.split(/[，。；！？\s]+/).filter(w => w.length >= 2);
        const stopWords = ['的', '是', '在', '有', '和', '了', '我', '你', '他', '她', '它', '这', '那', '一个', '什么', '怎么', '如何', '为什么', '因为', '所以', '但是', '如果', '虽然', '而且', '或者', '还是', '可以', '能够', '应该', '需要', '可能', '已经', '正在', '将会'];
        return words.filter(w => !stopWords.includes(w) && w.length >= 2);
    }

    async expandQuery(query) {
        const related = [];
        const keywords = this.extractKeywords(query);
        
        for (const keyword of keywords) {
            const memories = this.mind.longTermMemory.filter(m => 
                m.content.includes(keyword) ||
                (m.tags && m.tags.some(t => t.includes(keyword)))
            );
            
            for (const memory of memories) {
                const memoryKeywords = this.extractKeywords(memory.content);
                memoryKeywords.forEach(k => {
                    if (!keywords.includes(k) && !related.includes(k)) {
                        related.push(k);
                    }
                });
            }
        }
        
        return related.slice(0, 5);
    }
}

class ResponseGenerator {
    constructor(mind) {
        this.mind = mind;
        this.templates = {
            greeting: [
                '你好！我是MindForge AI，很高兴为你服务！',
                '嗨！有什么我可以帮助你的吗？',
                '你好！今天我能为你做些什么？'
            ],
            farewell: [
                '再见！期待下次与你交流！',
                '拜拜！记得照顾好自己！',
                '下次见！有问题随时来找我！'
            ],
            thanks: [
                '不客气，这是我应该做的！',
                '能帮到你我很开心！',
                '随时为你服务！'
            ],
            unknown: [
                '这个问题我还在学习中，让我想想...',
                '我正在理解你的意思，可以再详细说说吗？',
                '让我尝试理解这个问题...'
            ]
        };
    }

    generate(intent, context = '') {
        const templates = this.templates[intent] || this.templates.unknown;
        const template = templates[Math.floor(Math.random() * templates.length)];
        return template;
    }

    async generateWithMemory(intent, context) {
        const baseResponse = this.generate(intent, context);
        
        const retriever = new MemoryRetriever(this.mind);
        const related = await retriever.retrieveRelevant(context, 2);
        
        if (related.length > 0) {
            const memoryContext = related.map(m => m.content).join('；');
            return `${baseResponse}\n\n💡 相关记忆: ${memoryContext}`;
        }
        
        return baseResponse;
    }

    formatSkillResponse(skillName, result) {
        const icons = {
            calculator: '🧮',
            memory_search: '🔍',
            goal_manager: '🎯',
            reflection: '🧠',
            datetime: '🕐',
            converter: '🔄',
            text: '📝',
            random: '🎲'
        };
        
        const icon = icons[skillName] || '⚡';
        return `${icon} ${result}`;
    }
}

class ConversationEngine {
    constructor(mind) {
        this.mind = mind;
        this.contextManager = new ContextManager(mind);
        this.responseGenerator = new ResponseGenerator(mind);
        this.memoryRetriever = new MemoryRetriever(mind);
    }

    async processInput(userInput) {
        this.contextManager.addMessage('user', userInput);
        
        const intent = this.mind.decisionEngine.recognizeIntent(userInput);
        
        if (intent.skill) {
            const result = await this.mind.skillManager.executeSkill(intent.skill, userInput);
            if (result.success) {
                const response = this.responseGenerator.formatSkillResponse(intent.skill, result.result);
                this.contextManager.addMessage('assistant', response);
                await this.mind.learner.integrateFromMessage(userInput, 'user');
                return { success: true, response, skill: intent.skill };
            }
        }
        
        const response = await this.responseGenerator.generateWithMemory(intent.type, userInput);
        this.contextManager.addMessage('assistant', response);
        await this.mind.learner.integrateFromMessage(userInput, 'user');
        return { success: true, response };
    }

    getContextSummary() {
        return this.contextManager.getConversationSummary();
    }

    getCurrentTopic() {
        return this.contextManager.getTopic();
    }

    async getRelatedMemories(query) {
        return await this.memoryRetriever.retrieveRelevant(query);
    }
}

module.exports = { ContextManager, MemoryRetriever, ResponseGenerator, ConversationEngine };