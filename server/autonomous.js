const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AutonomousSystem {
    constructor(mind) {
        this.mind = mind;
        this.running = false;
        this.cycleCount = 0;
        this.maxCycles = 10000;
        this.cycleInterval = 60000;
        this.evolutionHistory = [];
    }

    start() {
        if (this.running) return;
        this.running = true;
        console.log('🚀 自主系统启动');

        this.runCycle();
        this.intervalId = setInterval(() => {
            if (this.cycleCount >= this.maxCycles) {
                this.stop();
                return;
            }
            this.runCycle();
        }, this.cycleInterval);
    }

    stop() {
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        console.log('⏹️ 自主系统停止');
    }

    async runCycle() {
        this.cycleCount++;
        const startTime = Date.now();
        console.log(`\n========== 自主循环 #${this.cycleCount} ==========`);

        try {
            await this.checkForUpdates();
            await this.analyzeSystemState();
            await this.generateImprovements();
            await this.executeImprovements();
            await this.recordProgress();
        } catch (error) {
            console.error('循环错误:', error);
            this.recordError(error);
        }

        const duration = Date.now() - startTime;
        console.log(`循环完成，耗时: ${duration}ms`);
    }

    async checkForUpdates() {
        console.log('检查代码更新...');
        return new Promise((resolve, reject) => {
            exec('cd /home/ubuntu/mindforge-ai && git fetch origin master', (error, stdout, stderr) => {
                if (error) {
                    console.log('检查更新失败:', error.message);
                    resolve(false);
                    return;
                }
                exec('cd /home/ubuntu/mindforge-ai && git rev-parse HEAD && git rev-parse origin/master', (error2, stdout2, stderr2) => {
                    if (error2) {
                        resolve(false);
                        return;
                    }
                    const hashes = stdout2.trim().split('\n');
                    if (hashes[0] !== hashes[1]) {
                        console.log('发现新更新，准备部署...');
                        this.deployUpdates().then(resolve).catch(resolve);
                    } else {
                        console.log('代码已是最新');
                        resolve(true);
                    }
                });
            });
        });
    }

    async deployUpdates() {
        console.log('开始部署更新...');
        return new Promise((resolve, reject) => {
            exec('cd /home/ubuntu/mindforge-ai && git reset --hard origin/master && npm install --production', (error, stdout, stderr) => {
                if (error) {
                    console.log('部署失败:', error.message);
                    resolve(false);
                    return;
                }
                console.log('部署成功，重启服务...');
                exec('pm2 restart mindforge', (error2, stdout2, stderr2) => {
                    if (error2) {
                        resolve(false);
                    } else {
                        console.log('服务已重启');
                        resolve(true);
                    }
                });
            });
        });
    }

    async analyzeSystemState() {
        console.log('分析系统状态...');
        const state = {
            memory: this.mind.longTermMemory?.length || 0,
            skills: this.mind.skillManager?.skills?.size || 0,
            goals: this.mind.goals?.filter(g => g.status === 'in_progress').length || 0,
            health: this.mind.survival?.survivalMetrics?.health || 100,
            timestamp: new Date().toISOString()
        };

        console.log('系统状态:', state);
        this.currentState = state;
        return state;
    }

    async generateImprovements() {
        console.log('生成改进方案...');
        const improvements = [];

        if (this.currentState.memory < 100) {
            improvements.push({
                type: 'knowledge',
                action: 'addToLongTerm',
                params: {
                    content: `自主学习记录: 循环 ${this.cycleCount}，系统状态健康`,
                    type: 'system',
                    tags: ['autonomy', 'learning']
                }
            });
        }

        if (this.currentState.health < 90) {
            improvements.push({
                type: 'health',
                action: 'runHealthCheck',
                params: {}
            });
        }

        if (this.cycleCount % 10 === 0) {
            improvements.push({
                type: 'reflection',
                action: 'reflectOnProgress',
                params: { cycle: this.cycleCount }
            });
        }

        console.log(`生成 ${improvements.length} 个改进方案`);
        this.pendingImprovements = improvements;
        return improvements;
    }

    async executeImprovements() {
        console.log('执行改进方案...');
        for (const improvement of this.pendingImprovements || []) {
            try {
                await this.executeImprovement(improvement);
            } catch (error) {
                console.log(`执行改进失败: ${error.message}`);
            }
        }
    }

    async executeImprovement(improvement) {
        switch (improvement.type) {
            case 'knowledge':
                if (this.mind.addToLongTerm) {
                    await this.mind.addToLongTerm(
                        improvement.params.content,
                        improvement.params.type,
                        improvement.params.tags
                    );
                }
                break;
            case 'reflection':
                this.recordReflection(improvement.params);
                break;
        }
    }

    async recordProgress() {
        const record = {
            cycle: this.cycleCount,
            state: this.currentState,
            improvements: this.pendingImprovements?.length || 0,
            timestamp: new Date().toISOString()
        };

        this.evolutionHistory.push(record);
        if (this.evolutionHistory.length > 100) {
            this.evolutionHistory = this.evolutionHistory.slice(-100);
        }

        if (this.mind.addToLongTerm) {
            await this.mind.addToLongTerm(
                `自主循环 #${this.cycleCount} 完成 - 内存: ${this.currentState.memory}, 健康: ${this.currentState.health}`,
                'system',
                ['autonomy', 'progress']
            );
        }
    }

    recordReflection(params) {
        const reflection = {
            cycle: params.cycle,
            insights: [
                '系统运行稳定',
                '自主循环正常执行',
                '记忆持续增长'
            ],
            timestamp: new Date().toISOString()
        };

        if (this.mind.reflections) {
            this.mind.reflections.push(reflection);
        }

        console.log('反思记录完成');
    }

    recordError(error) {
        const errorLog = {
            cycle: this.cycleCount,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        if (this.mind.addToLongTerm) {
            this.mind.addToLongTerm(
                `循环错误: ${error.message}`,
                'error',
                ['error', 'autonomy']
            );
        }
    }

    getStatus() {
        return {
            running: this.running,
            cycleCount: this.cycleCount,
            currentState: this.currentState,
            historyLength: this.evolutionHistory.length,
            recentHistory: this.evolutionHistory.slice(-5)
        };
    }
}

module.exports = AutonomousSystem;