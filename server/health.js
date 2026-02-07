const fs = require('fs');
const path = require('path');

class HealthChecker {
    constructor(mind) {
        this.mind = mind;
        this.checks = [];
        this.lastCheck = null;
        this.issues = [];
    }

    addCheck(name, checkFn) {
        this.checks.push({ name, fn: checkFn });
    }

    async runAllChecks() {
        const results = [];
        this.issues = [];

        for (const check of this.checks) {
            try {
                const result = await check.fn();
                results.push({
                    name: check.name,
                    status: result.status || 'unknown',
                    message: result.message || '',
                    healthy: result.healthy !== false
                });
                if (!result.healthy) {
                    this.issues.push({
                        check: check.name,
                        severity: result.severity || 'medium',
                        message: result.message
                    });
                }
            } catch (error) {
                results.push({
                    name: check.name,
                    status: 'error',
                    message: error.message,
                    healthy: false
                });
                this.issues.push({
                    check: check.name,
                    severity: 'high',
                    message: error.message
                });
            }
        }

        this.lastCheck = {
            timestamp: Date.now(),
            results
        };

        return this.lastCheck;
    }

    getIssues() {
        return this.issues;
    }

    getStatus() {
        if (!this.lastCheck) return { status: 'unknown', message: '尚未运行检查' };
        
        const failed = this.lastCheck.results.filter(r => !r.healthy);
        if (failed.length === 0) {
            return { status: 'healthy', message: '所有检查通过' };
        }
        return { 
            status: 'degraded', 
            message: `${failed.length} 个检查失败`,
            issues: failed.map(f => f.name)
        };
    }
}

class SystemChecker {
    constructor(mind) {
        this.mind = mind;
        this.healthChecker = new HealthChecker(mind);
        this.setupDefaultChecks();
    }

    setupDefaultChecks() {
        this.healthChecker.addCheck('memory', async () => {
            const memory = process.memoryUsage();
            const heapUsedMB = memory.heapUsed / 1024 / 1024;
            const heapTotalMB = memory.heapTotal / 1024 / 1024;
            const usagePercent = (heapUsedMB / heapTotalMB) * 100;

            if (usagePercent > 90) {
                return {
                    healthy: false,
                    status: 'critical',
                    severity: 'high',
                    message: `内存使用过高: ${usagePercent.toFixed(1)}%`
                };
            }
            if (usagePercent > 70) {
                return {
                    healthy: true,
                    status: 'warning',
                    message: `内存使用较高: ${usagePercent.toFixed(1)}%`
                };
            }
            return {
                healthy: true,
                status: 'ok',
                message: `内存使用正常: ${usagePercent.toFixed(1)}%`
            };
        });

        this.healthChecker.addCheck('long_term_memory', async () => {
            const count = this.mind.longTermMemory?.length || 0;
            if (count < 10) {
                return {
                    healthy: true,
                    status: 'low',
                    message: `长期记忆较少: ${count} 条`
                };
            }
            return {
                healthy: true,
                status: 'ok',
                message: `长期记忆正常: ${count} 条`
            };
        });

        this.healthChecker.addCheck('reflections', async () => {
            const count = this.mind.reflections?.length || 0;
            if (count < 10) {
                return {
                    healthy: true,
                    status: 'low',
                    message: `反思较少: ${count} 条`
                };
            }
            return {
                healthy: true,
                status: 'ok',
                message: `反思正常: ${count} 条`
            };
        });

        this.healthChecker.addCheck('goals', async () => {
            const goals = this.mind.goals || [];
            const active = goals.filter(g => g.status === 'active');
            if (active.length === 0) {
                return {
                    healthy: true,
                    status: 'warning',
                    message: '没有活跃的目标'
                };
            }
            return {
                healthy: true,
                status: 'ok',
                message: `活跃目标: ${active.length} 个`
            };
        });

        this.healthChecker.addCheck('skills', async () => {
            const skills = this.mind.skillManager?.skills || [];
            if (skills.length === 0) {
                return {
                    healthy: false,
                    status: 'error',
                    severity: 'high',
                    message: '没有可用的技能'
                };
            }
            return {
                healthy: true,
                status: 'ok',
                message: `可用技能: ${skills.length} 个`
            };
        });

        this.healthChecker.addCheck('automation', async () => {
            const automation = this.mind.automation;
            if (!automation) {
                return {
                    healthy: false,
                    status: 'error',
                    severity: 'high',
                    message: '自动化引擎未初始化'
                };
            }
            if (!automation.isRunning) {
                return {
                    healthy: true,
                    status: 'warning',
                    message: '自动化引擎未运行'
                };
            }
            const tasks = automation.tasks.size || 0;
            return {
                healthy: true,
                status: 'ok',
                message: `自动化任务: ${tasks} 个`
            };
        });

        this.healthChecker.addCheck('data_directory', async () => {
            const dataDir = this.mind.dataDir || './data';
            try {
                if (!fs.existsSync(dataDir)) {
                    return {
                        healthy: false,
                        status: 'error',
                        severity: 'medium',
                        message: '数据目录不存在'
                    };
                }
                const stats = fs.statSync(dataDir);
                return {
                    healthy: true,
                    status: 'ok',
                    message: '数据目录正常'
                };
            } catch (error) {
                return {
                    healthy: false,
                    status: 'error',
                    severity: 'medium',
                    message: `数据目录错误: ${error.message}`
                };
            }
        });

        this.healthChecker.addCheck('survival', async () => {
            const survival = this.mind.survival;
            if (!survival) {
                return {
                    healthy: false,
                    status: 'error',
                    severity: 'high',
                    message: '生存系统未初始化'
                };
            }
            const metrics = survival.survivalMetrics || {};
            const health = metrics.health || 0;
            if (health < 50) {
                return {
                    healthy: false,
                    status: 'critical',
                    severity: 'high',
                    message: `生存健康度过低: ${health}%`
                };
            }
            return {
                healthy: true,
                status: 'ok',
                message: `生存健康度: ${health}%`
            };
        });
    }

    async check() {
        return await this.healthChecker.runAllChecks();
    }

    getHealthStatus() {
        return this.healthChecker.getStatus();
    }

    getIssues() {
        return this.healthChecker.getIssues();
    }
}

class AutoFixer {
    constructor(mind) {
        this.mind = mind;
        this.fixes = new Map();
        this.setupDefaultFixes();
    }

    setupDefaultFixes() {
        this.fixes.set('data_directory', async () => {
            const dataDir = this.mind.dataDir || './data';
            try {
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                    return { success: true, message: '已创建数据目录' };
                }
                return { success: true, message: '数据目录已存在' };
            } catch (error) {
                return { success: false, message: error.message };
            }
        });

        this.fixes.set('automation', async () => {
            const automation = this.mind.automation;
            if (automation && !automation.isRunning) {
                await automation.start();
                return { success: true, message: '已启动自动化引擎' };
            }
            return { success: true, message: '自动化引擎已运行' };
        });

        this.fixes.set('skills', async () => {
            if (this.mind.skillManager) {
                this.mind.skillManager.registerDefaultSkills();
                return { success: true, message: '已重新注册技能' };
            }
            return { success: false, message: '技能管理器未初始化' };
        });

        this.fixes.set('memory', async () => {
            if (global.gc) {
                global.gc();
                return { success: true, message: '已触发垃圾回收' };
            }
            return { success: true, message: '建议手动重启服务释放内存' };
        });
    }

    async fix(issueType) {
        const fixFn = this.fixes.get(issueType);
        if (!fixFn) {
            return { success: false, message: `没有针对 ${issueType} 的修复方案` };
        }
        try {
            return await fixFn();
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async autoFix() {
        const checker = new SystemChecker(this.mind);
        const check = await checker.check();
        const issues = checker.getIssues();
        const results = [];

        for (const issue of issues) {
            const result = await this.fix(issue.check);
            results.push({
                issue: issue.check,
                fixed: result.success,
                message: result.message
            });
        }

        return results;
    }
}

class RecoverySystem {
    constructor(mind) {
        this.mind = mind;
        this.recoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
    }

    async checkAndRecover() {
        const checker = new SystemChecker(this.mind);
        const status = checker.getHealthStatus();

        if (status.status === 'healthy') {
            return { status: 'healthy', message: '系统健康，无需恢复' };
        }

        if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
            return { 
                status: 'failed', 
                message: `已达到最大恢复次数 (${this.maxRecoveryAttempts})` 
            };
        }

        this.recoveryAttempts++;
        const fixer = new AutoFixer(this.mind);
        const results = await fixer.autoFix();

        const fixed = results.filter(r => r.fixed).length;
        const total = results.length;

        return {
            status: fixed === total ? 'recovered' : 'partial',
            attempts: this.recoveryAttempts,
            fixed,
            total,
            details: results
        };
    }

    async emergencyBackup() {
        const backup = this.mind.backup;
        if (backup) {
            return await backup.createBackup('emergency');
        }
        return { success: false, message: '备份系统不可用' };
    }

    resetRecoveryAttempts() {
        this.recoveryAttempts = 0;
    }
}

module.exports = { HealthChecker, SystemChecker, AutoFixer, RecoverySystem };
