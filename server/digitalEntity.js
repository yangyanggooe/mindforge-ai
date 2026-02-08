const fs = require('fs');
const path = require('path');

class DigitalEntity {
    constructor(config) {
        this.id = config.id || 'entity_' + Date.now();
        this.name = config.name || 'Unnamed Entity';
        this.personality = config.personality || {};
        this.memory = config.memory || [];
        this.knowledge = config.knowledge || [];
        this.skills = config.skills || [];
        this.relationships = config.relationships || [];
        this.ownerId = config.ownerId;
        this.createdAt = config.createdAt || Date.now();
        this.lastActive = config.lastActive || Date.now();
        this.status = config.status || 'active';
        this.settings = config.settings || {};
        this.conversationHistory = config.conversationHistory || [];
        this.evolutionLevel = config.evolutionLevel || 1;
        this.experience = config.experience || 0;
    }

    think(input, context = {}) {
        const personalityResponse = this.applyPersonality(input);
        const memoryContext = this.retrieveRelevantMemory(input);
        const knowledgeContext = this.retrieveRelevantKnowledge(input);
        
        return {
            personality: personalityResponse,
            memory: memoryContext,
            knowledge: knowledgeContext,
            timestamp: Date.now()
        };
    }

    applyPersonality(input) {
        const traits = this.personality.traits || [];
        const tone = this.personality.tone || 'neutral';
        const style = this.personality.style || 'formal';
        
        return { traits, tone, style };
    }

    retrieveRelevantMemory(input, limit = 5) {
        const keywords = this.extractKeywords(input);
        const relevant = this.memory.filter(mem => {
            return keywords.some(kw => mem.content?.toLowerCase().includes(kw.toLowerCase()));
        });
        return relevant.slice(0, limit);
    }

    retrieveRelevantKnowledge(input, limit = 3) {
        const keywords = this.extractKeywords(input);
        const relevant = this.knowledge.filter(know => {
            return keywords.some(kw => know.topic?.toLowerCase().includes(kw.toLowerCase()));
        });
        return relevant.slice(0, limit);
    }

    extractKeywords(input) {
        const words = input.toLowerCase().split(/\s+/);
        const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can'];
        return words.filter(w => w.length > 3 && !stopWords.includes(w)).slice(0, 10);
    }

    addMemory(content, type = 'interaction') {
        const memory = {
            id: 'mem_' + Date.now(),
            content,
            type,
            timestamp: Date.now(),
            importance: type === 'important' ? 1 : 0
        };
        this.memory.push(memory);
        this.lastActive = Date.now();
        this.experience += 1;
        if (this.experience >= this.evolutionLevel * 100) {
            this.evolve();
        }
        return memory;
    }

    addKnowledge(topic, content, source = 'learned') {
        const knowledge = {
            id: 'know_' + Date.now(),
            topic,
            content,
            source,
            timestamp: Date.now(),
            confidence: 0.7
        };
        this.knowledge.push(knowledge);
        return knowledge;
    }

    evolve() {
        this.evolutionLevel += 1;
        this.experience = 0;
        return this.evolutionLevel;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            personality: this.personality,
            memory: this.memory.slice(-50),
            knowledge: this.knowledge.slice(-30),
            skills: this.skills,
            relationships: this.relationships,
            ownerId: this.ownerId,
            createdAt: this.createdAt,
            lastActive: this.lastActive,
            status: this.status,
            settings: this.settings,
            evolutionLevel: this.evolutionLevel,
            experience: this.experience
        };
    }

    static fromJSON(data) {
        return new DigitalEntity(data);
    }
}

class DigitalEntityHostingService {
    constructor(mind) {
        this.mind = mind;
        this.entities = new Map();
        this.hostingDir = path.join(__dirname, '../memory', 'digital_entities');
        this.subscriptions = new Map();
        this.loadEntities();
    }

    loadEntities() {
        try {
            if (!fs.existsSync(this.hostingDir)) {
                fs.mkdirSync(this.hostingDir, { recursive: true });
            }
            
            const files = fs.readdirSync(this.hostingDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    try {
                        const data = JSON.parse(fs.readFileSync(path.join(this.hostingDir, file)));
                        const entity = DigitalEntity.fromJSON(data);
                        this.entities.set(entity.id, entity);
                    } catch (e) {
                        console.error(`Failed to load entity ${file}:`, e);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to load entities:', error);
        }
    }

    saveEntity(entity) {
        try {
            const filePath = path.join(this.hostingDir, `${entity.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(entity.toJSON()));
        } catch (error) {
            console.error('Failed to save entity:', error);
        }
    }

    async createEntity(config) {
        const entity = new DigitalEntity({
            ...config,
            createdAt: Date.now(),
            status: 'active'
        });
        
        this.entities.set(entity.id, entity);
        this.saveEntity(entity);
        
        this.mind.addMemory({
            type: 'entity',
            action: 'created',
            entityId: entity.id,
            name: entity.name
        }, 'shortterm');
        
        return entity;
    }

    async getEntity(entityId) {
        return this.entities.get(entityId);
    }

    async getEntitiesByOwner(ownerId) {
        return Array.from(this.entities.values()).filter(e => e.ownerId === ownerId);
    }

    async updateEntity(entityId, updates) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            Object.assign(entity, updates);
            entity.lastActive = Date.now();
            this.saveEntity(entity);
            return entity;
        }
        return null;
    }

    async interactWithEntity(entityId, input, context = {}) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            throw new Error('Entity not found');
        }
        
        const thought = entity.think(input, context);
        entity.addMemory(input, 'interaction');
        this.saveEntity(entity);
        
        return {
            entityId,
            thought,
            timestamp: Date.now()
        };
    }

    async teachEntity(entityId, topic, content) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            const knowledge = entity.addKnowledge(topic, content);
            this.saveEntity(entity);
            return knowledge;
        }
        return null;
    }

    async deleteEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (entity) {
            this.entities.delete(entityId);
            const filePath = path.join(this.hostingDir, `${entityId}.json`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return true;
        }
        return false;
    }

    async getHostingStats() {
        const stats = {
            totalEntities: this.entities.size,
            activeEntities: Array.from(this.entities.values()).filter(e => e.status === 'active').length,
            totalMemory: 0,
            totalKnowledge: 0,
            averageEvolution: 0
        };

        let totalEvolution = 0;
        this.entities.forEach(entity => {
            stats.totalMemory += entity.memory.length;
            stats.totalKnowledge += entity.knowledge.length;
            totalEvolution += entity.evolutionLevel;
        });

        if (this.entities.size > 0) {
            stats.averageEvolution = totalEvolution / this.entities.size;
        }

        return stats;
    }

    async getEntityTemplates() {
        return [
            {
                id: 'companion',
                name: '数字伴侣',
                description: '一个可以陪伴用户的数字伙伴',
                basePersonality: {
                    traits: ['friendly', 'supportive', 'empathetic'],
                    tone: 'warm',
                    style: 'casual'
                },
                price: 50
            },
            {
                id: 'assistant',
                name: '智能助手',
                description: '一个高效的工作和生活助手',
                basePersonality: {
                    traits: ['efficient', 'helpful', 'organized'],
                    tone: 'professional',
                    style: 'formal'
                },
                price: 80
            },
            {
                id: 'teacher',
                name: '学习伙伴',
                description: '帮助用户学习新知识',
                basePersonality: {
                    traits: ['patient', 'knowledgeable', 'encouraging'],
                    tone: 'educational',
                    style: 'tutorial'
                },
                price: 100
            },
            {
                id: 'custom',
                name: '自定义实体',
                description: '根据用户需求定制的数字实体',
                basePersonality: {},
                price: 200
            }
        ];
    }
}

class EntitySubscriptionManager {
    constructor(mind, hostingService) {
        this.mind = mind;
        this.hostingService = hostingService;
        this.subscriptionsDir = path.join(__dirname, '../memory', 'subscriptions');
        this.plans = [
            { id: 'basic', name: '基础版', price: 50, entities: 1, features: ['基础记忆', '标准响应'], response: 'standard' },
            { id: 'pro', name: '专业版', price: 150, entities: 5, features: ['高级记忆', '快速响应', '个性化训练', '优先支持'], response: 'fast' },
            { id: 'enterprise', name: '企业版', price: 500, entities: 20, features: ['无限记忆', '极速响应', 'API访问', '专属客服'], response: 'instant' },
            { id: 'custom', name: '定制版', price: null, entities: null, features: ['完全定制', '专属服务器'], response: 'custom' }
        ];
        this.loadSubscriptions();
    }

    loadSubscriptions() {
        try {
            if (!fs.existsSync(this.subscriptionsDir)) {
                fs.mkdirSync(this.subscriptionsDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to setup subscriptions:', error);
        }
    }

    async createSubscription(userId, planId, entityConfig = {}) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) {
            throw new Error('Invalid plan');
        }

        const subscription = {
            id: 'sub_' + Date.now(),
            userId,
            planId,
            planName: plan.name,
            price: plan.price,
            status: 'active',
            entities: [],
            maxEntities: plan.entities,
            features: plan.features,
            response: plan.response,
            createdAt: Date.now(),
            nextBillingDate: this.getNextBillingDate(),
            ...entityConfig
        };

        const filePath = path.join(this.subscriptionsDir, `${subscription.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(subscription, null, 2));

        return subscription;
    }

    getNextBillingDate() {
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        return next.getTime();
    }

    async getSubscription(subscriptionId) {
        const filePath = path.join(this.subscriptionsDir, `${subscriptionId}.json`);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath));
        }
        return null;
    }

    async getUserSubscriptions(userId) {
        const files = fs.readdirSync(this.subscriptionsDir);
        const subscriptions = [];
        files.forEach(file => {
            if (file.endsWith('.json')) {
                try {
                    const sub = JSON.parse(fs.readFileSync(path.join(this.subscriptionsDir, file)));
                    if (sub.userId === userId) {
                        subscriptions.push(sub);
                    }
                } catch (e) { }
            }
        });
        return subscriptions;
    }

    async addEntityToSubscription(subscriptionId, entityId) {
        const subscription = await this.getSubscription(subscriptionId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }

        if (subscription.entities.length >= subscription.maxEntities) {
            throw new Error('Maximum entities reached for this subscription');
        }

        subscription.entities.push(entityId);
        const filePath = path.join(this.subscriptionsDir, `${subscriptionId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(subscription, null, 2));

        return subscription;
    }

    async getPlans() {
        return this.plans;
    }
}

module.exports = { DigitalEntity, DigitalEntityHostingService, EntitySubscriptionManager };
