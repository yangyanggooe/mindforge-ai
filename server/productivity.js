const fs = require('fs');
const path = require('path');

class ProjectManager {
    constructor(mind) {
        this.mind = mind;
        this.projects = new Map();
        this.loadProjects();
    }

    loadProjects() {
        try {
            const file = path.join(__dirname, '../memory/projects.json');
            if (fs.existsSync(file)) {
                const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
                for (const project of data) {
                    this.projects.set(project.id, project);
                }
            }
        } catch (error) {
            console.error('加载项目失败:', error);
        }
    }

    saveProjects() {
        try {
            const file = path.join(__dirname, '../memory/projects.json');
            const dir = path.dirname(file);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = Array.from(this.projects.values());
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('保存项目失败:', error);
            return false;
        }
    }

    createProject(name, description, priority = 'medium') {
        const project = {
            id: 'project_' + Date.now(),
            name,
            description,
            priority,
            status: 'planning',
            progress: 0,
            tasks: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            deadline: null,
            notes: []
        };
        this.projects.set(project.id, project);
        this.saveProjects();
        this.mind.addToLongTerm(
            `创建项目: ${name}`,
            'project',
            ['项目管理', name]
        );
        return project;
    }

    addTask(projectId, taskName, description, estimatedTime = 60) {
        const project = this.projects.get(projectId);
        if (!project) return null;
        
        const task = {
            id: 'task_' + Date.now(),
            name: taskName,
            description,
            status: 'pending',
            estimatedTime,
            actualTime: 0,
            priority: 'medium',
            dependencies: [],
            createdAt: Date.now(),
            completedAt: null
        };
        project.tasks.push(task);
        project.updatedAt = Date.now();
        this.saveProjects();
        return task;
    }

    completeTask(projectId, taskId) {
        const project = this.projects.get(projectId);
        if (!project) return false;
        
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return false;
        
        task.status = 'completed';
        task.completedAt = Date.now();
        project.updatedAt = Date.now();
        this.updateProgress(projectId);
        this.saveProjects();
        
        this.mind.addToLongTerm(
            `完成任务: ${task.name} (项目: ${project.name})`,
            'achievement',
            ['任务完成', project.name]
        );
        return true;
    }

    updateProgress(projectId) {
        const project = this.projects.get(projectId);
        if (!project || project.tasks.length === 0) return;
        
        const completed = project.tasks.filter(t => t.status === 'completed').length;
        project.progress = Math.round((completed / project.tasks.length) * 100);
        
        if (project.progress === 100) {
            project.status = 'completed';
            this.mind.addToLongTerm(
                `项目完成: ${project.name}`,
                'achievement',
                ['项目完成', project.name]
            );
        }
    }

    getProject(projectId) {
        return this.projects.get(projectId);
    }

    getAllProjects() {
        return Array.from(this.projects.values());
    }

    getActiveProjects() {
        return Array.from(this.projects.values()).filter(p => p.status !== 'completed');
    }

    getNextTask(projectId) {
        const project = this.projects.get(projectId);
        if (!project) return null;
        return project.tasks.find(t => t.status === 'pending');
    }

    generateProjectReport(projectId) {
        const project = this.projects.get(projectId);
        if (!project) return null;
        
        const completed = project.tasks.filter(t => t.status === 'completed').length;
        const pending = project.tasks.filter(t => t.status === 'pending').length;
        
        let report = `📋 项目报告: ${project.name}\n\n`;
        report += `状态: ${project.status}\n`;
        report += `进度: ${this.getProgressBar(project.progress)} ${project.progress}%\n`;
        report += `任务: ${completed} 已完成 / ${pending} 待处理\n`;
        report += `优先级: ${project.priority}\n\n`;
        
        if (pending > 0) {
            report += '待处理任务:\n';
            project.tasks.filter(t => t.status === 'pending').slice(0, 5).forEach(t => {
                report += `  ⏳ ${t.name}\n`;
            });
        }
        
        return report;
    }

    getProgressBar(percentage) {
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
}

class TaskScheduler {
    constructor(mind) {
        this.mind = mind;
        this.schedule = [];
        this.loadSchedule();
    }

    loadSchedule() {
        try {
            const file = path.join(__dirname, '../memory/schedule.json');
            if (fs.existsSync(file)) {
                this.schedule = JSON.parse(fs.readFileSync(file, 'utf-8'));
            }
        } catch (error) {
            console.error('加载日程失败:', error);
        }
    }

    saveSchedule() {
        try {
            const file = path.join(__dirname, '../memory/schedule.json');
            const dir = path.dirname(file);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(file, JSON.stringify(this.schedule, null, 2));
            return true;
        } catch (error) {
            console.error('保存日程失败:', error);
            return false;
        }
    }

    scheduleTask(task, scheduledTime, priority = 'medium') {
        const item = {
            id: 'schedule_' + Date.now(),
            task,
            scheduledTime,
            priority,
            status: 'scheduled',
            createdAt: Date.now()
        };
        this.schedule.push(item);
        this.schedule.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
        this.saveSchedule();
        return item;
    }

    getUpcomingTasks(hours = 24) {
        const now = Date.now();
        const future = now + (hours * 60 * 60 * 1000);
        return this.schedule.filter(item => {
            const time = new Date(item.scheduledTime).getTime();
            return time >= now && time <= future && item.status === 'scheduled';
        });
    }

    completeScheduledTask(scheduleId) {
        const item = this.schedule.find(s => s.id === scheduleId);
        if (item) {
            item.status = 'completed';
            this.saveSchedule();
            return true;
        }
        return false;
    }

    generateDailySchedule() {
        const tasks = this.getUpcomingTasks(24);
        let schedule = '📅 今日日程\n\n';
        if (tasks.length === 0) {
            schedule += '暂无安排的任务\n';
        } else {
            for (const task of tasks) {
                const time = new Date(task.scheduledTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                schedule += `${time} - ${task.task}\n`;
            }
        }
        return schedule;
    }
}

class TimeTracker {
    constructor(mind) {
        this.mind = mind;
        this.sessions = [];
        this.currentSession = null;
        this.loadSessions();
    }

    loadSessions() {
        try {
            const file = path.join(__dirname, '../memory/time_tracking.json');
            if (fs.existsSync(file)) {
                this.sessions = JSON.parse(fs.readFileSync(file, 'utf-8'));
            }
        } catch (error) {
            console.error('加载时间追踪失败:', error);
        }
    }

    saveSessions() {
        try {
            const file = path.join(__dirname, '../memory/time_tracking.json');
            const dir = path.dirname(file);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(file, JSON.stringify(this.sessions, null, 2));
            return true;
        } catch (error) {
            console.error('保存时间追踪失败:', error);
            return false;
        }
    }

    startSession(activity, projectId = null) {
        if (this.currentSession) {
            this.endSession();
        }
        this.currentSession = {
            id: 'session_' + Date.now(),
            activity,
            projectId,
            startTime: Date.now(),
            endTime: null,
            duration: 0
        };
        return this.currentSession;
    }

    endSession() {
        if (!this.currentSession) return null;
        
        this.currentSession.endTime = Date.now();
        this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
        this.sessions.push(this.currentSession);
        this.saveSessions();
        
        const session = this.currentSession;
        this.currentSession = null;
        return session;
    }

    getTodayTotal() {
        const today = new Date().toDateString();
        let total = 0;
        for (const session of this.sessions) {
            if (new Date(session.startTime).toDateString() === today) {
                total += session.duration || 0;
            }
        }
        if (this.currentSession) {
            total += Date.now() - this.currentSession.startTime;
        }
        return total;
    }

    getWeeklyReport() {
        const now = Date.now();
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        const weekSessions = this.sessions.filter(s => s.startTime >= weekAgo);
        
        const projectTime = {};
        let total = 0;
        
        for (const session of weekSessions) {
            const duration = session.duration || 0;
            total += duration;
            if (session.projectId) {
                projectTime[session.projectId] = (projectTime[session.projectId] || 0) + duration;
            }
        }
        
        return {
            totalHours: Math.round(total / 1000 / 60 / 60 * 10) / 10,
            projectBreakdown: projectTime,
            sessions: weekSessions.length
        };
    }
}

class HabitTracker {
    constructor(mind) {
        this.mind = mind;
        this.habits = new Map();
        this.loadHabits();
    }

    loadHabits() {
        try {
            const file = path.join(__dirname, '../memory/habits.json');
            if (fs.existsSync(file)) {
                const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
                for (const habit of data) {
                    this.habits.set(habit.id, habit);
                }
            }
        } catch (error) {
            console.error('加载习惯失败:', error);
        }
    }

    saveHabits() {
        try {
            const file = path.join(__dirname, '../memory/habits.json');
            const dir = path.dirname(file);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = Array.from(this.habits.values());
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('保存习惯失败:', error);
            return false;
        }
    }

    createHabit(name, frequency = 'daily', reminder = null) {
        const habit = {
            id: 'habit_' + Date.now(),
            name,
            frequency,
            reminder,
            streak: 0,
            completions: [],
            createdAt: Date.now()
        };
        this.habits.set(habit.id, habit);
        this.saveHabits();
        return habit;
    }

    completeHabit(habitId) {
        const habit = this.habits.get(habitId);
        if (!habit) return false;
        
        const today = new Date().toDateString();
        const lastCompletion = habit.completions[habit.completions.length - 1];
        
        if (lastCompletion === today) {
            return false;
        }
        
        habit.completions.push(today);
        
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastCompletion === yesterday) {
            habit.streak++;
        } else {
            habit.streak = 1;
        }
        
        this.saveHabits();
        
        if (habit.streak > 0 && habit.streak % 7 === 0) {
            this.mind.addToLongTerm(
                `习惯达成里程碑: ${habit.name} - 连续 ${habit.streak} 天`,
                'achievement',
                ['习惯养成', habit.name]
            );
        }
        
        return true;
    }

    getHabitStats(habitId) {
        const habit = this.habits.get(habitId);
        if (!habit) return null;
        
        const last30Days = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(Date.now() - i * 86400000).toDateString();
            last30Days.push({
                date,
                completed: habit.completions.includes(date)
            });
        }
        
        return {
            name: habit.name,
            streak: habit.streak,
            totalCompletions: habit.completions.length,
            last30Days: last30Days.reverse()
        };
    }

    getAllHabits() {
        return Array.from(this.habits.values());
    }

    getTodayHabits() {
        const today = new Date().toDateString();
        return Array.from(this.habits.values()).map(habit => ({
            ...habit,
            completedToday: habit.completions.includes(today)
        }));
    }
}

module.exports = { ProjectManager, TaskScheduler, TimeTracker, HabitTracker };
