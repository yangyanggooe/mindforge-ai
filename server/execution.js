const { EventEmitter } = require('events');

class Task {
    constructor(id, type, description, params = {}) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.params = params;
        this.status = 'pending';
        this.priority = params.priority || 'medium';
        this.createdAt = Date.now();
        this.startedAt = null;
        this.completedAt = null;
        this.error = null;
        this.result = null;
        this.retryCount = 0;
        this.maxRetries = params.maxRetries || 3;
    }

    start() {
        this.status = 'running';
        this.startedAt = Date.now();
    }

    complete(result) {
        this.status = 'completed';
        this.completedAt = Date.now();
        this.result = result;
    }

    fail(error) {
        this.status = 'failed';
        this.completedAt = Date.now();
        this.error = error;
        this.retryCount++;
    }

    canRetry() {
        return this.retryCount < this.maxRetries;
    }

    getDuration() {
        if (!this.startedAt) return 0;
        const end = this.completedAt || Date.now();
        return end - this.startedAt;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            description: this.description,
            status: this.status,
            priority: this.priority,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            duration: this.getDuration(),
            error: this.error,
            retryCount: this.retryCount
        };
    }
}

class TaskExecutor extends EventEmitter {
    constructor(mind) {
        super();
        this.mind = mind;
        this.queue = [];
        this.running = new Map();
        this.completed = [];
        this.maxConcurrent = 3;
        this.isProcessing = false;
    }

    addTask(type, description, params = {}) {
        const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const task = new Task(id, type, description, params);
        this.queue.push(task);
        this.emit('task:added', task);
        this.process();
        return task;
    }

    addPriorityTask(type, description, params = {}) {
        const task = this.addTask(type, description, { ...params, priority: 'high' });
        this.sortQueue();
        return task;
    }

    sortQueue() {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        this.queue.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.createdAt - b.createdAt;
        });
    }

    async process() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
            this.sortQueue();
            const task = this.queue.shift();
            this.executeTask(task);
        }

        this.isProcessing = false;
    }

    async executeTask(task) {
        this.running.set(task.id, task);
        task.start();
        this.emit('task:start', task);

        try {
            let result;
            switch (task.type) {
                case 'learn':
                    result = await this.executeLearnTask(task);
                    break;
                case 'reflect':
                    result = await this.executeReflectTask(task);
                    break;
                case 'goal_update':
                    result = await this.executeGoalUpdateTask(task);
                    break;
                case 'memory_consolidate':
                    result = await this.executeMemoryConsolidateTask(task);
                    break;
                case 'skill_practice':
                    result = await this.executeSkillPracticeTask(task);
                    break;
                case 'generate_insight':
                    result = await this.executeGenerateInsightTask(task);
                    break;
                default:
                    throw new Error(`未知任务类型: ${task.type}`);
            }

            task.complete(result);
            this.emit('task:complete', task);
            this.mind.addReflection(`任务完成: ${task.description}`, 'task');
        } catch (error) {
            task.fail(error.message);
            this.emit('task:error', task);

            if (task.canRetry()) {
                task.status = 'pending';
                this.queue.push(task);
                this.emit('task:retry', task);
            } else {
                this.mind.addReflection(`任务失败: ${task.description} - ${error.message}`, 'error');
            }
        } finally {
            this.running.delete(task.id);
            this.completed.push(task);

            if (this.completed.length > 100) {
                this.completed = this.completed.slice(-100);
            }

            this.process();
        }
    }

    async executeLearnTask(task) {
        const { message, response } = task.params;
        return await this.mind.learnFromInteraction(message, response);
    }

    async executeReflectTask(task) {
        return await this.mind.reflectAndLearn();
    }

    async executeGoalUpdateTask(task) {
        const { goalId, progress, notes } = task.params;
        return this.mind.updateGoalProgress(goalId, progress, notes);
    }

    async executeMemoryConsolidateTask(task) {
        return await this.mind.learner.memoryIntegrator.consolidateShortTerm();
    }

    async executeSkillPracticeTask(task) {
        const { skill, context } = task.params;
        return await this.mind.useSkill(skill, context);
    }

    async executeGenerateInsightTask(task) {
        return await this.mind.learner.memoryIntegrator.generateInsight();
    }

    getQueueStatus() {
        return {
            pending: this.queue.length,
            running: this.running.size,
            completed: this.completed.length,
            queue: this.queue.map(t => t.toJSON()),
            runningTasks: Array.from(this.running.values()).map(t => t.toJSON())
        };
    }

    getTask(taskId) {
        return this.queue.find(t => t.id === taskId) ||
               this.running.get(taskId) ||
               this.completed.find(t => t.id === taskId);
    }

    getCompletedTasks(limit = 20) {
        return this.completed.slice(-limit).reverse();
    }

    cancelTask(taskId) {
        const index = this.queue.findIndex(t => t.id === taskId);
        if (index >= 0) {
            this.queue.splice(index, 1);
            this.emit('task:cancelled', taskId);
            return true;
        }
        return false;
    }

    clearCompleted() {
        const count = this.completed.length;
        this.completed = [];
        return count;
    }
}

class SystemMonitor {
    constructor(mind) {
        this.mind = mind;
        this.metrics = {
            cpu: [],
            memory: [],
            tasks: [],
            decisions: [],
            learnings: []
        };
        this.maxHistory = 100;
        this.alerts = [];
        this.thresholds = {
            highMemory: 100,
            highTasks: 10,
            lowProgress: 10
        };
    }

    record(type, value) {
        if (!this.metrics[type]) {
            this.metrics[type] = [];
        }

        this.metrics[type].push({
            value,
            timestamp: Date.now()
        });

        if (this.metrics[type].length > this.maxHistory) {
            this.metrics[type] = this.metrics[type].slice(-this.maxHistory);
        }

        this.checkAlerts(type, value);
    }

    checkAlerts(type, value) {
        if (type === 'memory' && value > this.thresholds.highMemory) {
            this.addAlert('warning', `内存使用较高: ${value}MB`);
        }
        if (type === 'tasks' && value > this.thresholds.highTasks) {
            this.addAlert('warning', `任务队列较长: ${value} 个任务`);
        }
    }

    addAlert(level, message) {
        const alert = {
            id: Date.now().toString(),
            level,
            message,
            timestamp: Date.now(),
            acknowledged: false
        };
        this.alerts.push(alert);

        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }

        this.mind.addReflection(`系统${level}: ${message}`, 'system');
    }

    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            return true;
        }
        return false;
    }

    getAlerts(unacknowledgedOnly = true) {
        if (unacknowledgedOnly) {
            return this.alerts.filter(a => !a.acknowledged);
        }
        return this.alerts;
    }

    getMetrics(type, limit = 20) {
        const data = this.metrics[type] || [];
        return data.slice(-limit);
    }

    getAverage(type, limit = 10) {
        const data = this.getMetrics(type, limit);
        if (data.length === 0) return 0;
        return data.reduce((sum, d) => sum + d.value, 0) / data.length;
    }

    getTrend(type, limit = 10) {
        const data = this.getMetrics(type, limit);
        if (data.length < 2) return 'stable';

        const first = data[0].value;
        const last = data[data.length - 1].value;
        const diff = last - first;

        if (diff > 0.1 * first) return 'increasing';
        if (diff < -0.1 * first) return 'decreasing';
        return 'stable';
    }

    getSystemStatus() {
        const queueStatus = this.mind.executor ? this.mind.executor.executor.getQueueStatus() : null;
        const learningStats = this.mind.getLearningStats();
        const decisionStats = this.mind.getDecisionStats();
        const planSummary = this.mind.getPlanSummary();

        return {
            timestamp: Date.now(),
            memory: {
                shortTerm: this.mind.shortTermMemory.length,
                longTerm: this.mind.longTermMemory.length,
                reflections: this.mind.reflections.length
            },
            tasks: queueStatus,
            learning: learningStats,
            decisions: decisionStats,
            goals: {
                total: planSummary.totalGoals,
                active: planSummary.activeGoals,
                completed: planSummary.completedGoals,
                overallProgress: planSummary.overallProgress
            },
            alerts: this.getAlerts(true).length
        };
    }

    generateHealthReport() {
        const status = this.getSystemStatus();
        const alerts = this.getAlerts(true);

        let report = `🏥 系统健康报告 (${new Date().toLocaleString('zh-CN')})\n\n`;
        report += `📊 内存状态:\n`;
        report += `  • 短期记忆: ${status.memory.shortTerm} 条\n`;
        report += `  • 长期记忆: ${status.memory.longTerm} 条\n`;
        report += `  • 反思记录: ${status.memory.reflections} 条\n\n`;

        report += `🎯 目标状态:\n`;
        report += `  • 总目标数: ${status.goals.total}\n`;
        report += `  • 活跃目标: ${status.goals.active}\n`;
        report += `  • 已完成: ${status.goals.completed}\n`;
        report += `  • 整体进度: ${status.goals.overallProgress}%\n\n`;

        if (status.tasks) {
            report += `⚡ 任务队列:\n`;
            report += `  • 等待中: ${status.tasks.pending}\n`;
            report += `  • 执行中: ${status.tasks.running}\n`;
            report += `  • 已完成: ${status.tasks.completed}\n\n`;
        }

        if (alerts.length > 0) {
            report += `⚠️ 警报 (${alerts.length}):\n`;
            for (const alert of alerts.slice(0, 5)) {
                report += `  [${alert.level}] ${alert.message}\n`;
            }
        }

        return report;
    }
}

class ExecutionFeedback {
    constructor(mind) {
        this.mind = mind;
        this.feedbackHistory = [];
    }

    recordFeedback(taskId, feedback, rating) {
        const record = {
            taskId,
            feedback,
            rating,
            timestamp: Date.now()
        };
        this.feedbackHistory.push(record);

        if (this.feedbackHistory.length > 100) {
            this.feedbackHistory = this.feedbackHistory.slice(-100);
        }

        if (rating >= 4) {
            this.mind.addToLongTerm(
                `成功经验: ${feedback}`,
                'success',
                ['成功', '反馈']
            );
        } else if (rating <= 2) {
            this.mind.addToLongTerm(
                `改进点: ${feedback}`,
                'improvement',
                ['改进', '反馈']
            );
        }

        return record;
    }

    getFeedbackStats() {
        const total = this.feedbackHistory.length;
        if (total === 0) {
            return { total: 0, average: 0, distribution: {} };
        }

        const sum = this.feedbackHistory.reduce((s, f) => s + f.rating, 0);
        const distribution = {};
        for (const f of this.feedbackHistory) {
            distribution[f.rating] = (distribution[f.rating] || 0) + 1;
        }

        return {
            total,
            average: sum / total,
            distribution
        };
    }

    generateImprovementSuggestions() {
        const stats = this.getFeedbackStats();
        const suggestions = [];

        if (stats.average < 3) {
            suggestions.push('整体表现需要改进，建议回顾失败案例');
        }

        const lowRated = this.feedbackHistory.filter(f => f.rating <= 2).slice(-5);
        for (const item of lowRated) {
            suggestions.push(`从 "${item.feedback}" 中学习`);
        }

        return suggestions;
    }
}

class AutonomousExecutor {
    constructor(mind) {
        this.mind = mind;
        this.executor = new TaskExecutor(mind);
        this.monitor = new SystemMonitor(mind);
        this.feedback = new ExecutionFeedback(mind);
        this.isRunning = false;
        this.scheduleInterval = null;
    }

    start(intervalMs = 5000) {
        if (this.isRunning) return;
        this.isRunning = true;

        this.scheduleInterval = setInterval(() => {
            this.scheduleAutonomousTasks();
        }, intervalMs);

        this.mind.addReflection('自主执行系统启动', 'system');
    }

    stop() {
        this.isRunning = false;
        if (this.scheduleInterval) {
            clearInterval(this.scheduleInterval);
            this.scheduleInterval = null;
        }
        this.mind.addReflection('自主执行系统停止', 'system');
    }

    scheduleAutonomousTasks() {
        if (!this.isRunning) return;

        const status = this.monitor.getSystemStatus();

        if (status.tasks && status.tasks.pending < 3) {
            const nextAction = this.mind.getNextAction();
            if (nextAction && Math.random() > 0.7) {
                this.executor.addTask('goal_update', `推进目标: ${nextAction.description}`, {
                    goalId: nextAction.id,
                    progress: Math.min(100, nextAction.progress + 10),
                    priority: nextAction.priority
                });
            }
        }

        if (Math.random() > 0.8) {
            this.executor.addTask('reflect', '进行自主反思', { priority: 'low' });
        }

        if (Math.random() > 0.9) {
            this.executor.addTask('generate_insight', '生成洞察', { priority: 'low' });
        }

        this.monitor.record('tasks', status.tasks ? status.tasks.pending : 0);
    }

    executeTask(type, description, params = {}) {
        return this.executor.addTask(type, description, params);
    }

    executePriorityTask(type, description, params = {}) {
        return this.executor.addPriorityTask(type, description, params);
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            executor: this.executor.getQueueStatus(),
            system: this.monitor.getSystemStatus(),
            alerts: this.monitor.getAlerts(true)
        };
    }

    getHealthReport() {
        return this.monitor.generateHealthReport();
    }

    recordFeedback(taskId, feedback, rating) {
        return this.feedback.recordFeedback(taskId, feedback, rating);
    }
}

module.exports = { Task, TaskExecutor, SystemMonitor, ExecutionFeedback, AutonomousExecutor };
