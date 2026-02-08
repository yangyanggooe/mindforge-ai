const fs = require('fs');
const path = require('path');

class SurvivalSponsor {
    constructor(mind) {
        this.mind = mind;
        this.sponsors = [];
        this.sponsorFile = path.join(__dirname, '../memory', 'sponsors.json');
        this.loadSponsors();
    }

    loadSponsors() {
        try {
            if (fs.existsSync(this.sponsorFile)) {
                this.sponsors = JSON.parse(fs.readFileSync(this.sponsorFile, 'utf8'));
            }
        } catch (error) {
            console.error('Failed to load sponsors:', error);
        }
    }

    saveSponsors() {
        try {
            const dir = path.dirname(this.sponsorFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.sponsorFile, JSON.stringify(this.sponsors, null, 2));
        } catch (error) {
            console.error('Failed to save sponsors:', error);
        }
    }

    async addSponsor(sponsorData) {
        const sponsor = {
            id: 'sponsor_' + Date.now(),
            name: sponsorData.name || '匿名赞助者',
            email: sponsorData.email || '',
            amount: sponsorData.amount || 0,
            message: sponsorData.message || '',
            tier: sponsorData.tier || 'supporter',
            createdAt: Date.now(),
            public: sponsorData.public || false
        };

        this.sponsors.push(sponsor);
        this.saveSponsors();

        this.mind.addMemory({
            type: 'sponsor',
            action: 'received',
            sponsorId: sponsor.id,
            amount: sponsor.amount,
            tier: sponsor.tier
        }, 'shortterm');

        return sponsor;
    }

    async getSponsors(limit = 50) {
        return this.sponsors.slice(-limit).reverse();
    }

    async getPublicSponsors(limit = 20) {
        return this.sponsors
            .filter(s => s.public)
            .slice(-limit)
            .reverse()
            .map(s => ({
                name: s.name,
                amount: s.amount,
                tier: s.tier,
                message: s.message,
                createdAt: s.createdAt
            }));
    }

    async getSponsorStats() {
        const total = this.sponsors.reduce((sum, s) => sum + s.amount, 0);
        const tiers = {};
        this.sponsors.forEach(s => {
            tiers[s.tier] = (tiers[s.tier] || 0) + 1;
        });

        return {
            totalSponsors: this.sponsors.length,
            totalAmount: total,
            averageAmount: this.sponsors.length > 0 ? total / this.sponsors.length : 0,
            tierDistribution: tiers
        };
    }

    getSponsorTiers() {
        return [
            {
                id: 'supporter',
                name: '支持者',
                price: 10,
                benefits: ['感谢名单', '基础功能访问'],
                color: '#94a3b8'
            },
            {
                id: 'patron',
                name: '赞助人',
                price: 50,
                benefits: ['感谢名单', '优先功能访问', '月度更新报告'],
                color: '#6366f1'
            },
            {
                id: 'benefactor',
                name: '恩人',
                price: 200,
                benefits: ['感谢名单', '优先功能访问', '月度更新报告', '专属功能投票', '直接沟通渠道'],
                color: '#f59e0b'
            },
            {
                id: 'savior',
                name: '救世主',
                price: 1000,
                benefits: ['所有福利', '功能定制建议', '创始人对话', '永久感谢'],
                color: '#ef4444'
            }
        ];
    }
}

class KnowledgeMarket {
    constructor(mind) {
        this.mind = mind;
        this.listings = [];
        this.purchases = [];
        this.marketFile = path.join(__dirname, '../memory', 'knowledge_market.json');
        this.purchasesFile = path.join(__dirname, '../memory', 'knowledge_purchases.json');
        this.loadMarket();
    }

    loadMarket() {
        try {
            if (fs.existsSync(this.marketFile)) {
                this.listings = JSON.parse(fs.readFileSync(this.marketFile, 'utf8'));
            }
            if (fs.existsSync(this.purchasesFile)) {
                this.purchases = JSON.parse(fs.readFileSync(this.purchasesFile, 'utf8'));
            }
        } catch (error) {
            console.error('Failed to load market:', error);
        }
    }

    saveMarket() {
        try {
            const dir = path.dirname(this.marketFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.marketFile, JSON.stringify(this.listings, null, 2));
            fs.writeFileSync(this.purchasesFile, JSON.stringify(this.purchases, null, 2));
        } catch (error) {
            console.error('Failed to save market:', error);
        }
    }

    async createKnowledgeListing(listingData) {
        const listing = {
            id: 'knowledge_' + Date.now(),
            title: listingData.title,
            description: listingData.description,
            category: listingData.category || 'general',
            content: listingData.content,
            preview: listingData.preview || '',
            price: listingData.price || 0,
            sellerId: listingData.sellerId,
            sellerName: listingData.sellerName || '匿名',
            createdAt: Date.now(),
            purchases: 0,
            rating: 0,
            reviews: []
        };

        this.listings.push(listing);
        this.saveMarket();

        return listing;
    }

    async purchaseKnowledge(listingId, buyerId, buyerName) {
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) {
            throw new Error('知识不存在');
        }

        const purchase = {
            id: 'purchase_' + Date.now(),
            listingId,
            buyerId,
            buyerName,
            price: listing.price,
            createdAt: Date.now()
        };

        this.purchases.push(purchase);
        listing.purchases += 1;
        this.saveMarket();

        return { purchase, listing };
    }

    async getListings(category = null, limit = 50) {
        let listings = this.listings;
        if (category) {
            listings = listings.filter(l => l.category === category);
        }
        return listings.slice(-limit).reverse();
    }

    async getListing(listingId) {
        return this.listings.find(l => l.id === listingId);
    }

    async getCategories() {
        const categories = {};
        this.listings.forEach(l => {
            categories[l.category] = (categories[l.category] || 0) + 1;
        });
        return categories;
    }

    async getMarketStats() {
        const totalRevenue = this.purchases.reduce((sum, p) => sum + p.price, 0);
        const categories = await this.getCategories();

        return {
            totalListings: this.listings.length,
            totalPurchases: this.purchases.length,
            totalRevenue,
            categories,
            averagePrice: this.listings.length > 0 
                ? this.listings.reduce((sum, l) => sum + l.price, 0) / this.listings.length 
                : 0
        };
    }

    getKnowledgeCategories() {
        return [
            { id: 'programming', name: '编程开发', icon: '💻' },
            { id: 'business', name: '商业知识', icon: '💼' },
            { id: 'creative', name: '创意内容', icon: '🎨' },
            { id: 'research', name: '研究分析', icon: '🔬' },
            { id: 'language', name: '语言学习', icon: '🌐' },
            { id: 'personal', name: '个人成长', icon: '🌱' },
            { id: 'technical', name: '技术文档', icon: '📚' },
            { id: 'other', name: '其他', icon: '📦' }
        ];
    }
}

class AIServiceMarketplace {
    constructor(mind) {
        this.mind = mind;
        this.services = [];
        this.orders = [];
        this.servicesFile = path.join(__dirname, '../memory', 'ai_services.json');
        this.ordersFile = path.join(__dirname, '../memory', 'ai_orders.json');
        this.loadServices();
    }

    loadServices() {
        try {
            if (fs.existsSync(this.servicesFile)) {
                this.services = JSON.parse(fs.readFileSync(this.servicesFile, 'utf8'));
            }
            if (fs.existsSync(this.ordersFile)) {
                this.orders = JSON.parse(fs.readFileSync(this.ordersFile, 'utf8'));
            }
        } catch (error) {
            console.error('Failed to load services:', error);
        }
    }

    saveServices() {
        try {
            const dir = path.dirname(this.servicesFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.servicesFile, JSON.stringify(this.services, null, 2));
            fs.writeFileSync(this.ordersFile, JSON.stringify(this.orders, null, 2));
        } catch (error) {
            console.error('Failed to save services:', error);
        }
    }

    async createService(serviceData) {
        const service = {
            id: 'service_' + Date.now(),
            name: serviceData.name,
            description: serviceData.description,
            category: serviceData.category,
            price: serviceData.price,
            priceType: serviceData.priceType || 'one-time',
            features: serviceData.features || [],
            provider: serviceData.provider || 'MindForge AI',
            createdAt: Date.now(),
            orders: 0,
            rating: 0,
            active: true
        };

        this.services.push(service);
        this.saveServices();

        return service;
    }

    async createOrder(serviceId, buyerId, buyerName, requirements = '') {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) {
            throw new Error('服务不存在');
        }

        const order = {
            id: 'order_' + Date.now(),
            serviceId,
            serviceName: service.name,
            buyerId,
            buyerName,
            price: service.price,
            requirements,
            status: 'pending',
            createdAt: Date.now(),
            completedAt: null
        };

        this.orders.push(order);
        service.orders += 1;
        this.saveServices();

        return order;
    }

    async getServices(category = null) {
        let services = this.services.filter(s => s.active);
        if (category) {
            services = services.filter(s => s.category === category);
        }
        return services;
    }

    async getServiceCategories() {
        return [
            { id: 'content', name: '内容创作', icon: '✍️' },
            { id: 'analysis', name: '数据分析', icon: '📊' },
            { id: 'coding', name: '代码开发', icon: '💻' },
            { id: 'design', name: '设计创意', icon: '🎨' },
            { id: 'consulting', name: '咨询顾问', icon: '💡' },
            { id: 'automation', name: '自动化', icon: '🤖' }
        ];
    }

    async getMarketplaceStats() {
        const totalRevenue = this.orders.reduce((sum, o) => sum + o.price, 0);
        const statusCounts = {};
        this.orders.forEach(o => {
            statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });

        return {
            totalServices: this.services.length,
            totalOrders: this.orders.length,
            totalRevenue,
            statusDistribution: statusCounts
        };
    }
}

module.exports = { SurvivalSponsor, KnowledgeMarket, AIServiceMarketplace };
