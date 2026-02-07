class GoalDecomposer {
    constructor() {
        this.decompositionPatterns = {
            learning: [
                '了解基础知识',
                '学习核心概念',
                '实践练习',
                '总结归纳',
                '复习巩固'
            ],
            development: [
                '需求分析',
                '设计方案',
                '实现开发',
                '测试验证',
                '部署上线'
            ],
            problem_solving: [
                '理解问题',
                '收集信息',
                '分析原因',
                '制定方案',
                '执行验证'
            ],
            creative: [
                '灵感收集',
                '构思方案',
                '初稿创作',
                '修改完善',
                '最终完成'
            ]
        };
    }

    decompose(goal, category = 'development', subGoalCount = 5) {
        const patterns = this.decompositionPatterns[category] || this.decompositionPatterns.development;
        const subGoals = [];
        
        for (let i = 0; i < Math.min(subGoalCount, patterns.length); i++) {
            subGoals.push({
                id: `sub_${Date.now()}_${i}`,
                description: `${patterns[i]} - ${goal}`,
                priority: this.calculatePriority(i, subGoalCount),
                status: 'pending',
                progress: 0,
                estimatedTime: this.estimateTime(i),
                dependencies: i > 0 ? [`sub_${Date.now()}_${i - 1}`] : []
            });
        }
        
        return {
            mainGoal: goal,
            category,
            subGoals,
            totalSubGoals: subGoals.length,
            createdAt: Date.now()
        };
    }

    calculatePriority(index, total) {
        const priorities = ['high', 'high', 'medium', 'medium', 'low'];
        return priorities[index] || 'medium';
    }

    estimateTime(index) {
        const times = [30, 60, 90, 45, 30];
        return times[index] || 30;
    }

    autoDetectCategory(goalDescription) {
        const keywords = {
            learning: ['学习', '掌握', '了解', '研究', '理解'],
            development: ['开发', '实现', '创建', '搭建', '编写'],
            problem_solving: ['解决', '修复', '处理', '优化', '改进'],
            creative: ['设计', '创作', '构思', '规划', '制定']
        };
        
        const lowerGoal = goalDescription.toLowerCase();
        let maxScore = 0;
        let detectedCategory = 'development';
        
        for (const [category, words] of Object.entries(keywords)) {
            const score = words.filter(word => lowerGoal.includes(word)).length;
            if (score > maxScore) {
                maxScore = score;
                detectedCategory = category;
            }
        }
        
        return detectedCategory;
    }
}

class ProgressTracker {
    constructor(mind) {
        this.mind = mind;
        this.checkInHistory = [];
    }

    updateProgress(goalId, progress, notes = '') {
        const goal = this.mind.goals.find(g => g.id === goalId);
        if (!goal) {
            return { success: false, message: '目标不存在' };
        }

        const oldProgress = goal.progress;
        goal.progress = Math.min(100, Math.max(0, progress));
        
        if (goal.progress >= 100) {
            goal.status = 'completed';
            goal.completedAt = Date.now();
            this.mind.addReflection(`目标完成: ${goal.description}`, 'achievement');
        }

        this.mind._saveMemory('goals.json', this.mind.goals);

        const checkIn = {
            goalId,
            oldProgress,
            newProgress: goal.progress,
            notes,
            timestamp: Date.now()
        };
        this.checkInHistory.push(checkIn);

        const delta = goal.progress - oldProgress;
        if (delta > 0) {
            this.mind.addToLongTerm(
                `目标"${goal.description}"进度更新: ${oldProgress}% -> ${goal.progress}%`,
                'progress',
                ['进度', goal.description]
            );
        }

        return {
            success: true,
            goalId,
            oldProgress,
            newProgress: goal.progress,
            delta,
            isCompleted: goal.progress >= 100
        };
    }

    getProgress(goalId) {
        const goal = this.mind.goals.find(g => g.id === goalId);
        return goal ? goal.progress : null;
    }

    getOverallProgress() {
        const activeGoals = this.mind.goals.filter(g => g.status === 'active');
        if (activeGoals.length === 0) return 0;
        
        const totalProgress = activeGoals.reduce((sum, g) => sum + g.progress, 0);
        return Math.round(totalProgress / activeGoals.length);
    }

    getProgressHistory(goalId, limit = 10) {
        return this.checkInHistory
            .filter(c => c.goalId === goalId)
            .slice(-limit);
    }

    estimateCompletion(goalId) {
        const goal = this.mind.goals.find(g => g.id === goalId);
        if (!goal || goal.progress >= 100) {
            return { estimatedTime: 0, message: '已完成' };
        }

        const history = this.getProgressHistory(goalId, 20);
        if (history.length < 2) {
            return { estimatedTime: null, message: '数据不足' };
        }

        const recentProgress = history.slice(-5);
        const totalDelta = recentProgress.reduce((sum, h) => sum + (h.newProgress - h.oldProgress), 0);
        const timeSpan = recentProgress.length > 0 
            ? recentProgress[recentProgress.length - 1].timestamp - recentProgress[0].timestamp 
            : 0;

        if (totalDelta <= 0 || timeSpan <= 0) {
            return { estimatedTime: null, message: '进度停滞' };
        }

        const remainingProgress = 100 - goal.progress;
        const progressPerMs = totalDelta / timeSpan;
        const estimatedMs = remainingProgress / progressPerMs;

        return {
            estimatedTime: Math.round(estimatedMs / 1000 / 60),
            remainingProgress,
            currentProgress: goal.progress,
            message: `预计还需要 ${Math.round(estimatedMs / 1000 / 60)} 分钟`
        };
    }
}

class PriorityManager {
    constructor() {
        this.priorityWeights = {
            high: 3,
            medium: 2,
            low: 1
        };
    }

    calculatePriorityScore(goal) {
        let score = this.priorityWeights[goal.priority] || 2;
        
        const urgency = this.calculateUrgency(goal);
        score += urgency;
        
        const impact = this.calculateImpact(goal);
        score += impact;
        
        return score;
    }

    calculateUrgency(goal) {
        if (!goal.deadline) return 0;
        
        const now = Date.now();
        const deadline = new Date(goal.deadline).getTime();
        const timeLeft = deadline - now;
        
        if (timeLeft <= 0) return 3;
        if (timeLeft < 24 * 60 * 60 * 1000) return 2;
        if (timeLeft < 7 * 24 * 60 * 60 * 1000) return 1;
        return 0;
    }

    calculateImpact(goal) {
        const dependencies = this.countDependencies(goal);
        if (dependencies > 3) return 2;
        if (dependencies > 0) return 1;
        return 0;
    }

    countDependencies(goal) {
        return goal.subGoals ? goal.subGoals.filter(sg => sg.status !== 'completed').length : 0;
    }

    sortGoalsByPriority(goals) {
        return [...goals].sort((a, b) => {
            const scoreA = this.calculatePriorityScore(a);
            const scoreB = this.calculatePriorityScore(b);
            return scoreB - scoreA;
        });
    }

    getNextAction(goals) {
        const activeGoals = goals.filter(g => g.status === 'active' && g.progress < 100);
        const sorted = this.sortGoalsByPriority(activeGoals);
        return sorted[0] || null;
    }

    allocateResources(goals, availableTime = 60) {
        const sorted = this.sortGoalsByPriority(goals.filter(g => g.status === 'active'));
        const allocation = [];
        let remainingTime = availableTime;

        for (const goal of sorted) {
            if (remainingTime <= 0) break;
            
            const timeNeeded = Math.min(
                this.estimateTimeNeeded(goal),
                remainingTime
            );
            
            allocation.push({
                goalId: goal.id,
                description: goal.description,
                allocatedTime: timeNeeded,
                priority: goal.priority
            });
            
            remainingTime -= timeNeeded;
        }

        return {
            allocation,
            totalAllocated: availableTime - remainingTime,
            remainingTime
        };
    }

    estimateTimeNeeded(goal) {
        const remainingProgress = 100 - (goal.progress || 0);
        return Math.max(10, Math.round(remainingProgress / 10) * 10);
    }
}

class GoalPlanner {
    constructor(mind) {
        this.mind = mind;
        this.decomposer = new GoalDecomposer();
        this.tracker = new ProgressTracker(mind);
        this.priorityManager = new PriorityManager();
    }

    createGoal(description, priority = 'medium', deadline = null) {
        const category = this.decomposer.autoDetectCategory(description);
        const decomposition = this.decomposer.decompose(description, category);

        const goal = {
            id: Date.now().toString(),
            description,
            priority,
            category,
            status: 'active',
            progress: 0,
            deadline,
            createdAt: Date.now(),
            decomposition,
            subGoals: decomposition.subGoals
        };

        this.mind.goals.push(goal);
        this.mind._saveMemory('goals.json', this.mind.goals);
        this.mind.addReflection(`设定新目标: ${description} (${category})`, 'goal');

        return goal;
    }

    updateGoalProgress(goalId, progress, notes = '') {
        return this.tracker.updateProgress(goalId, progress, notes);
    }

    getGoal(goalId) {
        return this.mind.goals.find(g => g.id === goalId);
    }

    getActiveGoals() {
        return this.mind.goals.filter(g => g.status === 'active');
    }

    getOverallProgress() {
        return this.tracker.getOverallProgress();
    }

    getNextAction() {
        return this.priorityManager.getNextAction(this.mind.goals);
    }

    allocateResources(availableTime = 60) {
        return this.priorityManager.allocateResources(this.mind.goals, availableTime);
    }

    getPlanSummary() {
        const activeGoals = this.getActiveGoals();
        const sorted = this.priorityManager.sortGoalsByPriority(activeGoals);
        const overallProgress = this.getOverallProgress();
        const nextAction = this.getNextAction();

        return {
            totalGoals: this.mind.goals.length,
            activeGoals: activeGoals.length,
            completedGoals: this.mind.goals.filter(g => g.status === 'completed').length,
            overallProgress,
            nextAction: nextAction ? nextAction.description : null,
            priorityList: sorted.slice(0, 5).map(g => ({
                id: g.id,
                description: g.description,
                priority: g.priority,
                progress: g.progress
            }))
        };
    }

    generateDailyPlan(workTime = 120) {
        const allocation = this.allocateResources(workTime);
        const nextAction = this.getNextAction();
        const overallProgress = this.getOverallProgress();

        let plan = `📋 今日工作计划 (${new Date().toLocaleDateString('zh-CN')})\n\n`;
        plan += `• 总工作时间: ${workTime} 分钟\n`;
        plan += `• 整体进度: ${overallProgress}%\n`;
        plan += `• 下一任务: ${nextAction ? nextAction.description : '暂无'}\n\n`;

        if (allocation.allocation.length > 0) {
            plan += `⏰ 时间分配:\n`;
            for (const item of allocation.allocation) {
                plan += `  [${item.priority}] ${item.description} - ${item.allocatedTime}分钟\n`;
            }
        }

        return {
            plan,
            allocation,
            nextAction,
            workTime
        };
    }

    async checkIn() {
        const summary = this.getPlanSummary();
        const insights = [];

        for (const goal of this.getActiveGoals()) {
            if (goal.progress === 0 && Date.now() - goal.createdAt > 24 * 60 * 60 * 1000) {
                insights.push(`提醒: 目标"${goal.description}"尚未开始，考虑优先处理`);
            }
            if (goal.progress > 0 && goal.progress < 100) {
                const estimation = this.tracker.estimateCompletion(goal.id);
                if (estimation.estimatedTime) {
                    insights.push(`目标"${goal.description}"预计还需要 ${estimation.estimatedTime} 分钟`);
                }
            }
        }

        return {
            summary,
            insights,
            timestamp: Date.now()
        };
    }
}

module.exports = { GoalDecomposer, ProgressTracker, PriorityManager, GoalPlanner };
