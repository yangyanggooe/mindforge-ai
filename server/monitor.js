const fs = require('fs');
const path = require('path');

class SelfMonitor {
    constructor(mind) {
        this.mind = mind;
        this.metrics = {
            startTime: Date.now(),
            requests: 0,
            errors: 0,
            avgResponseTime: 0,
            totalResponseTime: 0
        };
        this.alerts = [];
        this.healthChecks = [];
    }

    recordRequest(responseTime, success = true) {
        this.metrics.requests++;
        if (!success) this.metrics.errors++;
        this.metrics.totalResponseTime += responseTime;
        this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.requests;
    }

    addAlert(type, message, severity = 'low') {
        const alert = {
            id: 'alert_' + Date.now(),
            type,
            message,
            severity,
            timestamp: Date.now()
        };
        this.alerts.push(alert);
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-50);
        }
        return alert;
    }

    getAlerts(severity = null, limit = 20) {
        let filtered = this.alerts;
        if (severity) {
            filtered = this.alerts.filter(a => a.severity === severity);
        }
        return filtered.slice(-limit).reverse();
    }

    performHealthCheck() {
        const check = {
            timestamp: Date.now(),
            uptime: Date.now() - this.metrics.startTime,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            requests: this.metrics.requests,
            errors: this.metrics.errors,
            avgResponseTime: this.metrics.avgResponseTime,
            errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) : 0
        };
        this.healthChecks.push(check);
        if (this.healthChecks.length > 100) {
            this.healthChecks = this.healthChecks.slice(-50);
        }
        return check;
    }

    getSystemReport() {
        const latest = this.performHealthCheck();
        const uptimeHours = Math.floor(latest.uptime / (1000 * 60 * 60));
        const uptimeMins = Math.floor((latest.uptime % (1000 * 60 * 60)) / (1000 * 60));
        
        let report = '🩺 系统健康报告\n\n';
        report += `• 运行时间: ${uptimeHours}小时 ${uptimeMins}分钟\n`;
        report += `• 总请求: ${latest.requests}\n`;
        report += `• 错误数: ${latest.errors}\n`;
        report += `• 平均响应: ${Math.round(latest.avgResponseTime)}ms\n`;
        report += `• 内存使用: ${Math.round(latest.memory.heapUsed / 1024 / 1024)}MB\n`;
        report += `• 错误率: ${Math.round(latest.errorRate * 100)}%\n\n`;
        
        const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
        if (criticalAlerts > 0) {
            report += `⚠️ 严重警报: ${criticalAlerts}\n`;
        }
        
        return report;
    }

    getStatus() {
        const check = this.performHealthCheck();
        let status = 'healthy';
        if (check.errorRate > 0.1) status = 'degraded';
        if (check.errorRate > 0.3) status = 'unhealthy';
        
        return {
            status,
            uptime: check.uptime,
            requests: check.requests,
            errorRate: check.errorRate,
            alerts: this.alerts.slice(-5)
        };
    }
}

class AutomationEngine {
    constructor(mind) {
        this.mind = mind;
        this.tasks = new Map();
        this.schedules = [];
        this.isRunning = false;
    }

    addTask(id, fn, interval = 60000) {
        const task = {
            id,
            fn,
            interval,
            lastRun: null,
            nextRun: Date.now() + interval,
            enabled: true,
            runs: 0
        };
        this.tasks.set(id, task);
        return task;
    }

    removeTask(id) {
        this.tasks.delete(id);
    }

    start() {
        this.isRunning = true;
        this.runLoop();
    }

    stop() {
        this.isRunning = false;
    }

    async runLoop() {
        while (this.isRunning) {
            const now = Date.now();
            for (const [id, task] of this.tasks) {
                if (task.enabled && now >= task.nextRun) {
                    try {
                        task.lastRun = now;
                        task.nextRun = now + task.interval;
                        task.runs++;
                        await task.fn();
                    } catch (error) {
                        console.error(`任务 ${id} 执行失败:`, error);
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    scheduleDaily(hour, minute, fn) {
        const id = 'daily_' + Date.now();
        this.schedules.push({
            id,
            type: 'daily',
            hour,
            minute,
            fn,
            lastRun: null
        });
        return id;
    }

    getSchedules() {
        return Array.from(this.schedules);
    }

    setupDefaultTasks() {
        this.addTask('health_check', () => {
            this.mind.selfMonitor?.performHealthCheck();
        }, 30000);
        
        this.addTask('memory_cleanup', () => {
            if (this.mind.shortTermMemory.length > 100) {
                this.mind.shortTermMemory = this.mind.shortTermMemory.slice(-50);
            }
        }, 60000);
        
        this.addTask('reflection', async () => {
            await this.mind.autoReflect();
        }, 120000);
        
        this.addTask('learning', async () => {
            await this.mind.learner?.consolidateLearning();
        }, 300000);
        
        console.log('🤖 自动化引擎已设置默认任务');
    }
}

class SelfImprovement {
    constructor(mind) {
        this.mind = mind;
        this.improvements = [];
        this.suggestions = [];
    }

    analyzePerformance() {
        const issues = [];
        const metrics = this.mind.selfMonitor?.metrics || {};
        
        if (metrics.avgResponseTime > 1000) {
            issues.push({ type: 'performance', issue: '响应时间过长', suggestion: '优化算法或增加缓存' });
        }
        
        if (metrics.errorRate > 0.1) {
            issues.push({ type: 'reliability', issue: '错误率过高', suggestion: '增加错误处理和重试机制' });
        }
        
        return issues;
    }

    suggestImprovements() {
        const suggestions = [];
        const issues = this.analyzePerformance();
        
        for (const issue of issues) {
            suggestions.push({
                priority: 'high',
                area: issue.type,
                description: issue.issue,
                action: issue.suggestion
            });
        }
        
        const memorySize = this.mind.longTermMemory?.length || 0;
        if (memorySize > 500) {
            suggestions.push({
                priority: 'medium',
                area: 'memory',
                description: '记忆库较大',
                action: '考虑记忆压缩或归档旧记忆'
            });
        }
        
        const goalCount = this.mind.goals?.length || 0;
        if (goalCount > 10) {
            suggestions.push({
                priority: 'low',
                area: 'goals',
                description: '目标较多',
                action: '优先处理重要目标'
            });
        }
        
        this.suggestions = suggestions;
        return suggestions;
    }

    implementImprovement(improvement) {
        this.improvements.push({
            ...improvement,
            implementedAt: Date.now()
        });
        this.mind.addToLongTerm(
            `实施改进: ${improvement.description}`,
            'improvement',
            ['自我改进', improvement.area]
        );
        return true;
    }

    getImprovementHistory() {
        return this.improvements.slice(-20).reverse();
    }

    generateImprovementReport() {
        const suggestions = this.suggestSuggestions();
        let report = '📈 自我改进报告\n\n';
        
        if (suggestions.length === 0) {
            report += '系统运行良好，暂无改进建议\n';
        } else {
            report += '改进建议:\n';
            for (const s of suggestions.slice(0, 5)) {
                const emoji = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢';
                report += `${emoji} [${s.area}] ${s.description} - ${s.action}\n`;
            }
        }
        
        const implemented = this.improvements.length;
        if (implemented > 0) {
            report += `\n✅ 已实施改进: ${implemented}\n`;
        }
        
        return report;
    }
}

class BackupSystem {
    constructor(mind, backupDir) {
        this.mind = mind;
        this.backupDir = backupDir || path.join(__dirname, '../backups');
        this.ensureBackupDir();
    }

    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    createBackup() {
        const backup = {
            timestamp: Date.now(),
            memory: {
                shortTerm: this.mind.shortTermMemory,
                longTerm: this.mind.longTermMemory,
                reflections: this.mind.reflections
            },
            goals: this.mind.goals,
            skills: this.mind.skillManager?.skills?.map(s => s.toJSON()) || [],
            version: '1.0.0'
        };

        const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(this.backupDir, filename);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
            console.log(`💾 备份已创建: ${filename}`);
            return { success: true, filename };
        } catch (error) {
            console.error('备份失败:', error);
            return { success: false, error: error.message };
        }
    }

    restore(filename) {
        const filepath = path.join(this.backupDir, filename);
        try {
            const backup = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
            
            this.mind.shortTermMemory = backup.memory.shortTerm;
            this.mind.longTermMemory = backup.memory.longTerm;
            this.mind.reflections = backup.memory.reflections;
            this.mind.goals = backup.goals;
            
            console.log(`🔄 从 ${filename} 恢复成功`);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
                .sort()
                .slice(-10);
            return files;
        } catch {
            return [];
        }
    }

    autoBackup() {
        const backups = this.listBackups();
        if (backups.length > 10) {
            const toDelete = backups.slice(0, backups.length - 10);
            for (const file of toDelete) {
                fs.unlinkSync(path.join(this.backupDir, file));
            }
        }
        return this.createBackup();
    }
}

module.exports = { SelfMonitor, AutomationEngine, SelfImprovement, BackupSystem };