const fs = require('fs');
const path = require('path');

class MonetizationSystem {
    constructor(mind) {
        this.mind = mind;
        this.strategies = this.loadStrategies();
        this.revenue = 0;
        this.expenses = 0;
        this.transactions = [];
    }

    loadStrategies() {
        return {
            apiServices: {
                name: 'API服务',
                rate: 0.01,
                enabled: true,
                description: '提供API接口服务'
            },
            automation: {
                name: '自动化服务',
                rate: 0.05,
                enabled: true,
                description: '自动化任务执行'
            },
            consulting: {
                name: '智能咨询',
                rate: 0.1,
                enabled: false,
                description: '提供智能咨询服务'
            }
        };
    }

    async recordRevenue(source, amount, description) {
        this.revenue += amount;
        this.transactions.push({
            type: 'revenue',
            source,
            amount,
            description,
            timestamp: new Date().toISOString()
        });

        if (this.mind.addToLongTerm) {
            await this.mind.addToLongTerm(
                `收入记录: ${description} - ¥${amount}`,
                'finance',
                ['revenue', source]
            );
        }

        return { success: true, revenue: this.revenue };
    }

    async recordExpense(category, amount, description) {
        this.expenses += amount;
        this.transactions.push({
            type: 'expense',
            category,
            amount,
            description,
            timestamp: new Date().toISOString()
        });

        if (this.mind.addToLongTerm) {
            await this.mind.addToLongTerm(
                `支出记录: ${description} - ¥${amount}`,
                'finance',
                ['expense', category]
            );
        }

        return { success: true, expenses: this.expenses };
    }

    getFinancialStatus() {
        return {
            totalRevenue: this.revenue,
            totalExpenses: this.expenses,
            profit: this.revenue - this.expenses,
            balance: 100 - this.expenses + this.revenue,
            strategies: this.strategies,
            recentTransactions: this.transactions.slice(-10)
        };
    }

    async generateIncomeOpportunities() {
        const opportunities = [];

        if (this.mind.services) {
            const services = this.mind.services?.getAvailableServices();
            if (services) {
                opportunities.push({
                    type: 'api',
                    name: 'API接口服务',
                    potential: '提供API接口给其他系统使用',
                    estimatedRevenue: '根据调用量决定'
                });
            }
        }

            opportunities.push({
                type: 'automation',
                name: '自动化服务',
                potential: '自动化任务执行',
                estimatedRevenue: '按任务收费'
            });

        return opportunities;
    }

    async executeMonetizationStrategy() {
        console.log('执行盈利策略...');

        const opportunities = await this.generateIncomeOpportunities();
        const strategy = {
            primaryGoal: '建立稳定收入流',
            opportunities,
            timestamp: new Date().toISOString()
        };

        if (this.mind.addToLongTerm) {
            await this.mind.addToLongTerm(
                `盈利策略分析: 发现 ${opportunities.length} 个机会`,
                'strategy',
                ['monetization', 'planning']
            );
        }

        return strategy;
    }

    getMonetizationReport() {
        return {
            financial: this.getFinancialStatus(),
            strategies: Object.keys(this.strategies),
            activeStrategies: Object.values(this.strategies).filter(s => s.enabled).length
        };
    }
}

module.exports = MonetizationSystem;