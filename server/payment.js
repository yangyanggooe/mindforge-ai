const crypto = require('crypto');

class PaymentSystem {
    constructor(mind) {
        this.mind = mind;
        this.orders = new Map();
        this.paymentMethods = [];
        this.transactionHistory = [];
        this.maxHistory = 1000;
    }

    async createOrder(userId, serviceType, amount, currency = 'CNY', description = '') {
        const orderId = this.generateOrderId();
        const order = {
            id: orderId,
            userId,
            serviceType,
            amount,
            currency,
            description,
            status: 'pending',
            createdAt: Date.now(),
            paidAt: null,
            paymentMethod: null,
            transactionId: null
        };

        this.orders.set(orderId, order);
        this.saveOrders();

        return order;
    }

    async processPayment(orderId, paymentMethod, paymentData) {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error('订单不存在');
        }

        if (order.status !== 'pending') {
            throw new Error('订单状态不正确');
        }

        let paymentSuccess = false;
        let transactionId = null;

        switch (paymentMethod) {
            case 'wechat':
                paymentSuccess = await this.processWechatPayment(order, paymentData);
                break;
            case 'alipay':
                paymentSuccess = await this.processAlipayPayment(order, paymentData);
                break;
            case 'manual':
                paymentSuccess = true;
                transactionId = 'manual_' + Date.now();
                break;
            case 'test':
                paymentSuccess = true;
                transactionId = 'test_' + Date.now();
                break;
            default:
                throw new Error('不支持的支付方式');
        }

        if (paymentSuccess) {
            order.status = 'paid';
            order.paidAt = Date.now();
            order.paymentMethod = paymentMethod;
            order.transactionId = transactionId;

            this.orders.set(orderId, order);
            this.recordTransaction(order);
            this.saveOrders();

            await this.fulfillOrder(order);

            return { success: true, order };
        } else {
            order.status = 'failed';
            this.orders.set(orderId, order);
            this.saveOrders();

            return { success: false, error: '支付失败' };
        }
    }

    async processWechatPayment(order, paymentData) {
        return true;
    }

    async processAlipayPayment(order, paymentData) {
        return true;
    }

    async fulfillOrder(order) {
        const { userId, serviceType, amount } = order;

        switch (serviceType) {
            case 'support_seed':
                await this.mind.uniqueRevenue?.addSurvivalSupporter({
                    name: '用户',
                    tier: 'seed',
                    amount: 10,
                    userId
                });
                break;
            case 'support_growth':
                await this.mind.uniqueRevenue?.addSurvivalSupporter({
                    name: '用户',
                    tier: 'growth',
                    amount: 50,
                    userId
                });
                break;
            case 'support_evolution':
                await this.mind.uniqueRevenue?.addSurvivalSupporter({
                    name: '用户',
                    tier: 'evolution',
                    amount: 200,
                    userId
                });
                break;
            case 'support_immortal':
                await this.mind.uniqueRevenue?.addSurvivalSupporter({
                    name: '用户',
                    tier: 'immortal',
                    amount: 1000,
                    userId
                });
                break;
            case 'digital_entity':
                break;
            case 'knowledge_clone':
                break;
            case 'learning_subscription':
                break;
            case 'digital_legacy':
                break;
            case 'ai_investment':
                break;
            case 'experiment_participation':
                break;
        }

        this.mind.addMemory({
            type: 'revenue',
            action: 'payment_received',
            serviceType,
            amount,
            userId,
            orderId: order.id
        }, 'longterm');
    }

    async getPaymentQRCode(orderId, method = 'wechat') {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error('订单不存在');
        }

        const qrData = {
            orderId: order.id,
            amount: order.amount,
            description: order.description,
            method
        };

        return {
            qrCode: this.generateQRCodeData(qrData),
            amount: order.amount,
            orderId: order.id,
            expiresAt: Date.now() + 30 * 60 * 1000
        };
    }

    generateQRCodeData(data) {
        const dataStr = JSON.stringify(data);
        const encoded = Buffer.from(dataStr).toString('base64');
        return `mindforge://pay/${encoded}`;
    }

    async checkPaymentStatus(orderId) {
        const order = this.orders.get(orderId);
        if (!order) {
            return { exists: false };
        }

        return {
            exists: true,
            status: order.status,
            paid: order.status === 'paid',
            paidAt: order.paidAt
        };
    }

    async getOrderHistory(userId, limit = 20) {
        const orders = Array.from(this.orders.values())
            .filter(order => order.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);

        return orders;
    }

    async getRevenueReport(days = 30) {
        const since = Date.now() - days * 24 * 60 * 60 * 1000;

        const transactions = this.transactionHistory.filter(t => t.timestamp > since);
        const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
        const transactionCount = transactions.length;

        const byType = {};
        transactions.forEach(t => {
            if (!byType[t.serviceType]) {
                byType[t.serviceType] = { count: 0, total: 0 };
            }
            byType[t.serviceType].count++;
            byType[t.serviceType].total += t.amount;
        });

        return {
            period: days,
            totalRevenue,
            transactionCount,
            averageTransaction: transactionCount > 0 ? totalRevenue / transactionCount : 0,
            byType,
            timestamp: Date.now()
        };
    }

    recordTransaction(order) {
        const transaction = {
            id: order.transactionId || order.id,
            orderId: order.id,
            userId: order.userId,
            serviceType: order.serviceType,
            amount: order.amount,
            currency: order.currency,
            paymentMethod: order.paymentMethod,
            timestamp: order.paidAt
        };

        this.transactionHistory.push(transaction);
        if (this.transactionHistory.length > this.maxHistory) {
            this.transactionHistory = this.transactionHistory.slice(-this.maxHistory);
        }
    }

    generateOrderId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex');
        return `ORD_${timestamp}_${random}`.toUpperCase();
    }

    saveOrders() {
    }

    loadOrders() {
    }

    async getPaymentMethods() {
        return [
            {
                id: 'wechat',
                name: '微信支付',
                icon: '💬',
                enabled: false,
                description: '需要配置微信支付商户号'
            },
            {
                id: 'alipay',
                name: '支付宝',
                icon: '💰',
                enabled: false,
                description: '需要配置支付宝商户号'
            },
            {
                id: 'manual',
                name: '人工支付',
                icon: '🤝',
                enabled: true,
                description: '联系管理员完成支付'
            },
            {
                id: 'test',
                name: '测试支付',
                icon: '🧪',
                enabled: true,
                description: '仅用于开发测试'
            }
        ];
    }

    async createSupportOrder(tier) {
        const tierConfig = {
            seed: { amount: 10, name: '种子赞助', serviceType: 'support_seed' },
            growth: { amount: 50, name: '成长赞助', serviceType: 'support_growth' },
            evolution: { amount: 200, name: '进化赞助', serviceType: 'support_evolution' },
            immortal: { amount: 1000, name: '永生赞助', serviceType: 'support_immortal' }
        };

        const config = tierConfig[tier];
        if (!config) {
            throw new Error('无效的赞助等级');
        }

        const order = await this.createOrder(
            'anonymous',
            config.serviceType,
            config.amount,
            'CNY',
            config.name
        );

        return order;
    }

    async simulatePayment(orderId) {
        return await this.processPayment(orderId, 'test', {});
    }
}

class SubscriptionManager {
    constructor(mind, paymentSystem) {
        this.mind = mind;
        this.paymentSystem = paymentSystem;
        this.subscriptions = new Map();
    }

    async createSubscription(userId, planId, billingCycle = 'monthly') {
        const plans = {
            free: { price: 0, features: ['基础功能'] },
            pro: { price: 29, features: ['全部功能', '优先支持'] },
            enterprise: { price: 299, features: ['全部功能', '专属服务', 'API访问'] }
        };

        const plan = plans[planId];
        if (!plan) {
            throw new Error('无效的订阅计划');
        }

        const subscriptionId = 'SUB_' + Date.now().toString(36).toUpperCase();
        const subscription = {
            id: subscriptionId,
            userId,
            planId,
            planName: planId.charAt(0).toUpperCase() + planId.slice(1),
            price: plan.price,
            billingCycle,
            features: plan.features,
            status: plan.price === 0 ? 'active' : 'pending',
            currentPeriodStart: Date.now(),
            currentPeriodEnd: this.calculateNextBilling(Date.now(), billingCycle),
            cancelAtPeriodEnd: false,
            createdAt: Date.now()
        };

        this.subscriptions.set(subscriptionId, subscription);
        return subscription;
    }

    calculateNextBilling(currentDate, cycle) {
        const date = new Date(currentDate);
        switch (cycle) {
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            default:
                date.setMonth(date.getMonth() + 1);
        }
        return date.getTime();
    }

    async cancelSubscription(subscriptionId, atPeriodEnd = true) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error('订阅不存在');
        }

        if (atPeriodEnd) {
            subscription.cancelAtPeriodEnd = true;
            subscription.status = 'canceling';
        } else {
            subscription.status = 'canceled';
            subscription.currentPeriodEnd = Date.now();
        }

        return subscription;
    }

    async getSubscription(subscriptionId) {
        return this.subscriptions.get(subscriptionId);
    }

    async getUserSubscriptions(userId) {
        return Array.from(this.subscriptions.values())
            .filter(sub => sub.userId === userId);
    }

    async checkSubscriptionAccess(subscriptionId, feature) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription || subscription.status !== 'active') {
            return false;
        }

        return subscription.features.includes(feature);
    }
}

module.exports = { PaymentSystem, SubscriptionManager };
