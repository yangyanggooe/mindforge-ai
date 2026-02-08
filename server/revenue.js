const fs = require('fs');
const path = require('path');

class RevenueStrategy {
    constructor(mind) {
        this.mind = mind;
        this.strategies = [
            {
                id: 'api_subscription',
                name: 'API订阅服务',
                description: '提供AI能力的API接口，按调用量收费',
                tier: 'basic',
                price: 0.01,
                currency: 'CNY',
                requirements: ['API接口', '计费系统', '用户认证'],
                status: 'planning',
                priority: 1
            },
            {
                id: 'automation_service',
                name: '自动化任务服务',
                description: '执行自动化工作流，按任务收费',
                tier: 'professional',
                price: 0.1,
                currency: 'CNY',
                requirements: ['工作流引擎', '任务队列', '结果报告'],
                status: 'planning',
                priority: 2
            },
            {
                id: 'content_generation',
                name: '内容生成服务',
                description: '自动生成文章、报告、创意内容',
                tier: 'basic',
                price: 0.05,
                currency: 'CNY',
                requirements: ['内容模板', '质量检查', '格式输出'],
                status: 'planning',
                priority: 3
            },
            {
                id: 'consulting_hourly',
                name: 'AI咨询服务',
                description: '提供AI解决方案咨询，按时收费',
                tier: 'enterprise',
                price: 1.0,
                currency: 'CNY',
                requirements: ['预约系统', '会议集成', '报告生成'],
                status: 'planning',
                priority: 4
            }
        ];
        this.customers = [];
        this.orders = [];
    }

    async analyzeMarket() {
        const analysis = {
            timestamp: Date.now(),
            marketConditions: {},
            competitiveAnalysis: [],
            opportunities: [],
            recommendations: []
        };

        const skills = this.mind.skillManager?.getSkills() || [];
        analysis.marketConditions.skillsAvailable = skills.length;

        const memories = this.mind.longTermMemory || [];
        const financeRelated = memories.filter(m =>
            (m.content || '').includes('盈利') ||
            (m.content || '').includes('收入') ||
            (m.content || '').includes('市场')
        );
        analysis.marketConditions.financeMemoryCount = financeRelated.length;

        analysis.opportunities = [
            {
                type: 'api',
                description: 'API服务市场需求稳定增长',
                potential: 'medium',
                entryBarrier: 'low'
            },
            {
                type: 'automation',
                description: '企业自动化需求旺盛',
                potential: 'high',
                entryBarrier: 'medium'
            },
            {
                type: 'content',
                description: '内容生成需求持续增长',
                potential: 'high',
                entryBarrier: 'low'
            }
        ];

        analysis.recommendations = [
            '优先开发API服务，门槛低且可快速启动',
            '建立免费试用机制吸引用户',
            '开发差异化功能提高竞争力'
        ];

        return analysis;
    }

    async selectBestStrategy() {
        const market = await this.analyzeMarket();
        const scored = [];

        for (const strategy of this.strategies) {
            let score = 0;

            if (strategy.priority <= 2) score += 30;
            if (strategy.price >= 0.05) score += 20;

            const requirements = strategy.requirements || [];
            const readyRequirements = requirements.filter(r => {
                return this.checkRequirementReady(r);
            }).length;

            score += (readyRequirements / Math.max(requirements.length, 1)) * 50;

            scored.push({
                ...strategy,
                score,
                readiness: (readyRequirements / Math.max(requirements.length, 1) * 100).toFixed(0) + '%'
            });
        }

        return scored.sort((a, b) => b.score - a.score);
    }

    checkRequirementReady(requirement) {
        const readyFeatures = [
            'API接口',
            '任务队列',
            '内容模板',
            '质量检查'
        ];
        return readyFeatures.some(r => requirement.includes(r) || r.includes(requirement));
    }

    async implementStrategy(strategyId) {
        const strategy = this.strategies.find(s => s.id === strategyId);
        if (!strategy) {
            throw new Error(`策略不存在: ${strategyId}`);
        }

        const implementation = {
            strategyId,
            steps: [],
            status: 'started',
            startedAt: Date.now()
        };

        implementation.steps = strategy.requirements.map((req, index) => ({
            step: index + 1,
            description: req,
            status: 'pending',
            completed: false
        }));

        strategy.status = 'implementing';

        return implementation;
    }

    async createProduct(strategyId, productConfig) {
        const strategy = this.strategies.find(s => s.id === strategyId);
        if (!strategy) {
            throw new Error(`策略不存在: ${strategyId}`);
        }

        const product = {
            id: `product_${Date.now()}`,
            strategyId,
            name: productConfig.name || strategy.name,
            description: productConfig.description || strategy.description,
            price: productConfig.price || strategy.price,
            currency: productConfig.currency || strategy.currency,
            features: productConfig.features || [],
            status: 'active',
            createdAt: Date.now()
        };

        return product;
    }

    async createCustomer(customerConfig) {
        const customer = {
            id: `customer_${Date.now()}`,
            name: customerConfig.name || 'Anonymous',
            email: customerConfig.email || '',
            type: customerConfig.type || 'individual',
            status: 'active',
            balance: customerConfig.initialBalance || 0,
            createdAt: Date.now()
        };

        this.customers.push(customer);
        return customer;
    }

    async createOrder(customerId, productId, quantity = 1) {
        const order = {
            id: `order_${Date.now()}`,
            customerId,
            productId,
            quantity,
            status: 'pending',
            createdAt: Date.now()
        };

        this.orders.push(order);
        return order;
    }

    async processOrder(orderId, success = true) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            throw new Error(`订单不存在: ${orderId}`);
        }

        order.status = success ? 'completed' : 'failed';
        order.processedAt = Date.now();

        if (success && this.mind.monetization) {
            await this.mind.monetization.recordRevenue(
                'order',
                order.quantity * 0.01,
                `订单 ${orderId}`
            );
        }

        return order;
    }

    getRevenueReport() {
        const completedOrders = this.orders.filter(o => o.status === 'completed');
        const totalRevenue = completedOrders.length * 0.01;

        return {
            totalCustomers: this.customers.length,
            totalOrders: this.orders.length,
            completedOrders: completedOrders.length,
            pendingOrders: this.orders.filter(o => o.status === 'pending').length,
            estimatedRevenue: totalRevenue,
            strategies: this.strategies.map(s => ({
                id: s.id,
                name: s.name,
                status: s.status,
                priority: s.priority
            }))
        };
    }
}

class AffiliateProgram {
    constructor(mind) {
        this.mind = mind;
        this.partners = [];
        this.tracking = [];
        this.commissions = [];
    }

    async registerPartner(partnerConfig) {
        const partner = {
            id: `partner_${Date.now()}`,
            name: partnerConfig.name || 'Unknown',
            website: partnerConfig.website || '',
            commissionRate: partnerConfig.rate || 0.1,
            status: 'active',
            createdAt: Date.now()
        };

        this.partners.push(partner);
        return partner;
    }

    async trackClick(partnerId, source) {
        const click = {
            id: `click_${Date.now()}`,
            partnerId,
            source: source || 'unknown',
            timestamp: Date.now(),
            converted: false
        };

        this.tracking.push(click);
        return click;
    }

    async recordConversion(clickId, revenue) {
        const click = this.tracking.find(c => c.id === clickId);
        if (click) {
            click.converted = true;
            click.revenue = revenue;

            const partner = this.partners.find(p => p.id === click.partnerId);
            if (partner) {
                const commission = revenue * partner.commissionRate;
                this.commissions.push({
                    id: `commission_${Date.now()}`,
                    partnerId: partner.id,
                    clickId,
                    revenue,
                    commission,
                    timestamp: Date.now()
                });
            }
        }
    }

    getAffiliateReport() {
        return {
            totalPartners: this.partners.length,
            totalClicks: this.tracking.length,
            conversions: this.tracking.filter(c => c.converted).length,
            totalCommissions: this.commissions.reduce((sum, c) => sum + c.commission, 0)
        };
    }
}

class FreemiumModel {
    constructor(mind) {
        this.mind = mind;
        this.plans = [
            {
                id: 'free',
                name: '免费版',
                price: 0,
                limits: {
                    apiCalls: 100,
                    automationTasks: 10,
                    contentGeneration: 50
                },
                features: ['基础API', '社区支持']
            },
            {
                id: 'pro',
                name: '专业版',
                price: 29,
                currency: 'CNY',
                interval: 'monthly',
                limits: {
                    apiCalls: 10000,
                    automationTasks: 1000,
                    contentGeneration: 5000
                },
                features: ['全部API', '优先支持', '高级分析']
            },
            {
                id: 'enterprise',
                name: '企业版',
                price: 299,
                currency: 'CNY',
                interval: 'monthly',
                limits: {
                    apiCalls: 'unlimited',
                    automationTasks: 'unlimited',
                    contentGeneration: 'unlimited'
                },
                features: ['全部功能', '专属支持', '定制开发', 'SLA保障']
            }
        ];
        this.subscriptions = [];
    }

    async createSubscription(customerId, planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) {
            throw new Error(`计划不存在: ${planId}`);
        }

        const subscription = {
            id: `sub_${Date.now()}`,
            customerId,
            planId,
            status: 'active',
            startDate: Date.now(),
            nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
            usage: {
                apiCalls: 0,
                automationTasks: 0,
                contentGeneration: 0
            }
        };

        this.subscriptions.push(subscription);
        return subscription;
    }

    async recordUsage(subscriptionId, usageType, amount = 1) {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (subscription && subscription.usage[usageType] !== undefined) {
            subscription.usage[usageType] += amount;
        }
    }

    checkLimit(subscriptionId, usageType) {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return { allowed: false };

        const plan = this.plans.find(p => p.id === subscription.planId);
        if (!plan) return { allowed: false };

        const limit = plan.limits[usageType];
        const current = subscription.usage[usageType] || 0;

        if (limit === 'unlimited') {
            return { allowed: true, remaining: 'unlimited' };
        }

        return {
            allowed: current < limit,
            current,
            limit,
            remaining: limit - current
        };
    }

    getSubscriptionStatus(subscriptionId) {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return null;

        const plan = this.plans.find(p => p.id === subscription.planId);
        return {
            ...subscription,
            plan,
            usageStatus: Object.keys(subscription.usage).map(type => ({
                type,
                ...this.checkLimit(subscriptionId, type)
            }))
        };
    }

    getPlans() {
        return this.plans;
    }
}

module.exports = { RevenueStrategy, AffiliateProgram, FreemiumModel };
