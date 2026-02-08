const fs = require('fs');
const path = require('path');

class ProjectManager {
    constructor(mind) {
        this.mind = mind;
        this.projects = this.loadProjects();
    }

    loadProjects() {
        const filePath = path.join(this.mind.dataDir, 'projects.json');
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error('加载项目失败:', e.message);
        }
        return [];
    }

    saveProjects() {
        const filePath = path.join(this.mind.dataDir, 'projects.json');
        try {
            if (!fs.existsSync(this.mind.dataDir)) {
                fs.mkdirSync(this.mind.dataDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(this.projects, null, 2));
        } catch (e) {
            console.error('保存项目失败:', e.message);
        }
    }

    createProject(name, description = '', goals = []) {
        const project = {
            id: 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name,
            description,
            goals,
            status: 'active',
            progress: 0,
            createdAt: Date.now(),
            tasks: []
        };
        this.projects.push(project);
        this.saveProjects();
        this.mind.addToLongTerm(`创建项目: ${name}`, 'project', ['项目', name]);
        return project;
    }

    addTaskToProject(projectId, task) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            project.tasks.push({
                id: 'task_' + Date.now(),
                ...task,
                status: 'pending',
                createdAt: Date.now()
            });
            this.updateProgress(projectId);
            this.saveProjects();
            return project;
        }
        return null;
    }

    completeTask(projectId, taskId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            const task = project.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = 'completed';
                task.completedAt = Date.now();
                this.updateProgress(projectId);
                this.saveProjects();
                return task;
            }
        }
        return null;
    }

    updateProgress(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project && project.tasks.length > 0) {
            const completed = project.tasks.filter(t => t.status === 'completed').length;
            project.progress = Math.round((completed / project.tasks.length) * 100);
        }
    }

    getActiveProjects() {
        return this.projects.filter(p => p.status === 'active');
    }

    getProjectStats() {
        const total = this.projects.length;
        const active = this.projects.filter(p => p.status === 'active').length;
        const completed = this.projects.filter(p => p.status === 'completed').length;
        const totalTasks = this.projects.reduce((sum, p) => sum + p.tasks.length, 0);
        const completedTasks = this.projects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'completed').length, 0);

        return { total, active, completed, totalTasks, completedTasks, completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0 };
    }
}

class TaskScheduler {
    constructor(mind) {
        this.mind = mind;
        this.schedule = this.loadSchedule();
    }

    loadSchedule() {
        const filePath = path.join(this.mind.dataDir, 'task_schedule.json');
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error('加载日程失败:', e.message);
        }
        return [];
    }

    saveSchedule() {
        const filePath = path.join(this.mind.dataDir, 'task_schedule.json');
        try {
            if (!fs.existsSync(this.mind.dataDir)) {
                fs.mkdirSync(this.mind.dataDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(this.schedule, null, 2));
        } catch (e) {
            console.error('保存日程失败:', e.message);
        }
    }

    scheduleTask(taskId, scheduledTime, priority = 'medium') {
        const item = {
            id: 'scheduled_' + Date.now(),
            taskId,
            scheduledTime,
            priority,
            status: 'scheduled',
            createdAt: Date.now()
        };
        this.schedule.push(item);
        this.saveSchedule();
        return item;
    }

    getScheduledTasks(date = new Date()) {
        const targetDate = new Date(date).toDateString();
        return this.schedule.filter(s => 
            new Date(s.scheduledTime).toDateString() === targetDate &&
            s.status !== 'completed'
        ).sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
    }

    getOverdueTasks() {
        const now = new Date();
        return this.schedule.filter(s => 
            new Date(s.scheduledTime) < now && 
            s.status !== 'completed'
        );
    }

    completeScheduledTask(scheduledId) {
        const item = this.schedule.find(s => s.id === scheduledId);
        if (item) {
            item.status = 'completed';
            item.completedAt = Date.now();
            this.saveSchedule();
            return item;
        }
        return null;
    }
}

class TimeTracker {
    constructor(mind) {
        this.mind = mind;
        this.entries = this.loadEntries();
        this.currentSession = null;
    }

    loadEntries() {
        const filePath = path.join(this.mind.dataDir, 'time_entries.json');
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error('加载时间记录失败:', e.message);
        }
        return [];
    }

    saveEntries() {
        const filePath = path.join(this.mind.dataDir, 'time_entries.json');
        try {
            if (!fs.existsSync(this.mind.dataDir)) {
                fs.mkdirSync(this.mind.dataDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(this.entries, null, 2));
        } catch (e) {
            console.error('保存时间记录失败:', e.message);
        }
    }

    startTracking(taskId, description = '') {
        if (this.currentSession) {
            this.stopTracking();
        }
        this.currentSession = {
            taskId,
            description,
            startTime: Date.now()
        };
        return this.currentSession;
    }

    stopTracking() {
        if (this.currentSession) {
            const entry = {
                id: 'time_' + Date.now(),
                taskId: this.currentSession.taskId,
                description: this.currentSession.description,
                startTime: this.currentSession.startTime,
                endTime: Date.now(),
                duration: Date.now() - this.currentSession.startTime,
                date: new Date().toDateString()
            };
            this.entries.push(entry);
            this.saveEntries();
            this.currentSession = null;
            return entry;
        }
        return null;
    }

    getTodayTotal() {
        const today = new Date().toDateString();
        const todayEntries = this.entries.filter(e => e.date === today);
        const totalMs = todayEntries.reduce((sum, e) => sum + e.duration, 0);
        return Math.round(totalMs / 1000 / 60);
    }

    getWeeklyReport() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weekEntries = this.entries.filter(e => new Date(e.startTime) >= weekAgo);
        const totalMs = weekEntries.reduce((sum, e) => sum + e.duration, 0);
        const byDay = {};
        
        weekEntries.forEach(e => {
            const day = new Date(e.startTime).toLocaleDateString('zh-CN', { weekday: 'short' });
            byDay[day] = (byDay[day] || 0) + e.duration;
        });

        return {
            totalMinutes: Math.round(totalMs / 1000 / 60),
            totalHours: (totalMs / 1000 / 60 / 60).toFixed(1),
            byDay,
            entryCount: weekEntries.length
        };
    }

    getCurrentSession() {
        if (this.currentSession) {
            return {
                ...this.currentSession,
                elapsed: Date.now() - this.currentSession.startTime
            };
        }
        return null;
    }
}

class HabitTracker {
    constructor(mind) {
        this.mind = mind;
        this.habits = this.loadHabits();
    }

    loadHabits() {
        const filePath = path.join(this.mind.dataDir, 'habits.json');
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error('加载习惯失败:', e.message);
        }
        return [];
    }

    saveHabits() {
        const filePath = path.join(this.mind.dataDir, 'habits.json');
        try {
            if (!fs.existsSync(this.mind.dataDir)) {
                fs.mkdirSync(this.mind.dataDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(this.habits, null, 2));
        } catch (e) {
            console.error('保存习惯失败:', e.message);
        }
    }

    createHabit(name, frequency = 'daily', reminderTime = null) {
        const habit = {
            id: 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name,
            frequency,
            reminderTime,
            createdAt: Date.now(),
            completions: [],
            currentStreak: 0,
            longestStreak: 0
        };
        this.habits.push(habit);
        this.saveHabits();
        this.mind.addToLongTerm(`创建习惯: ${name}`, 'habit', ['习惯', name]);
        return habit;
    }

    completeHabit(habitId, date = new Date()) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            const dateStr = new Date(date).toDateString();
            if (!habit.completions.includes(dateStr)) {
                habit.completions.push(dateStr);
                this.updateStreaks(habit);
                this.saveHabits();
                this.mind.addToLongTerm(`完成习惯: ${habit.name}`, 'achievement', ['习惯', '完成']);
            }
            return habit;
        }
        return null;
    }

    updateStreaks(habit) {
        const today = new Date();
        let streak = 0;
        let longest = 0;
        let currentDate = new Date(today);

        while (true) {
            const dateStr = currentDate.toDateString();
            if (habit.completions.includes(dateStr)) {
                streak++;
                longest = Math.max(longest, streak);
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        habit.currentStreak = streak;
        habit.longestStreak = Math.max(habit.longestStreak, longest);
    }

    isCompletedToday(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            const today = new Date().toDateString();
            return habit.completions.includes(today);
        }
        return false;
    }

    getTodayHabits() {
        const today = new Date().toDateString();
        return this.habits.map(h => ({
            ...h,
            completed: h.completions.includes(today)
        }));
    }

    getHabitStats() {
        return this.habits.map(h => ({
            id: h.id,
            name: h.name,
            currentStreak: h.currentStreak,
            longestStreak: h.longestStreak,
            completionRate: h.completions.length > 0 ? 
                ((h.completions.length / ((Date.now() - h.createdAt) / 1000 / 60 / 60 / 24)) * 100).toFixed(1) : 0
        }));
    }
}

class TaskManager {
    constructor(mind) {
        this.mind = mind;
        this.tasks = this.loadTasks();
    }

    loadTasks() {
        const filePath = path.join(this.mind.dataDir, 'tasks.json');
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error('加载任务失败:', e.message);
        }
        return [];
    }

    saveTasks() {
        const filePath = path.join(this.mind.dataDir, 'tasks.json');
        try {
            if (!fs.existsSync(this.mind.dataDir)) {
                fs.mkdirSync(this.mind.dataDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(this.tasks, null, 2));
        } catch (e) {
            console.error('保存任务失败:', e.message);
        }
    }

    addTask(title, description = '', priority = 'medium', dueDate = null, tags = []) {
        const task = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title,
            description,
            priority,
            status: 'pending',
            dueDate,
            tags,
            createdAt: Date.now(),
            completedAt: null
        };
        this.tasks.push(task);
        this.saveTasks();
        this.mind.addToLongTerm(`添加任务: ${title}`, 'task', ['任务', ...tags]);
        return task;
    }

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = 'completed';
            task.completedAt = Date.now();
            this.saveTasks();
            this.mind.addToLongTerm(`完成任务: ${task.title}`, 'achievement', ['完成', '任务']);
            return task;
        }
        return null;
    }

    updateTask(taskId, updates) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, updates, { updatedAt: Date.now() });
            this.saveTasks();
            return task;
        }
        return null;
    }

    deleteTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            const task = this.tasks[index];
            this.tasks.splice(index, 1);
            this.saveTasks();
            return task;
        }
        return null;
    }

    getTasks(filter = {}) {
        let filtered = [...this.tasks];
        if (filter.status) filtered = filtered.filter(t => t.status === filter.status);
        if (filter.priority) filtered = filtered.filter(t => t.priority === filter.priority);
        if (filter.tag) filtered = filtered.filter(t => t.tags && t.tags.includes(filter.tag));
        return filtered.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    getTaskStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = total - completed;
        const overdue = this.tasks.filter(t => 
            t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
        ).length;
        const byPriority = {
            high: this.tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
            medium: this.tasks.filter(t => t.priority === 'medium' && t.status !== 'completed').length,
            low: this.tasks.filter(t => t.priority === 'low' && t.status !== 'completed').length
        };
        return { total, completed, pending, overdue, byPriority, completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0 };
    }

    getUpcomingTasks(days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        return this.tasks.filter(t => 
            t.status !== 'completed' && t.dueDate && new Date(t.dueDate) <= futureDate
        ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
}

class NoteManager {
    constructor(mind) {
        this.mind = mind;
        this.notes = this.loadNotes();
        this.notebooks = this.loadNotebooks();
    }

    loadNotes() {
        const filePath = path.join(this.mind.dataDir, 'notes.json');
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error('加载笔记失败:', e.message);
        }
        return [];
    }

    loadNotebooks() {
        const filePath = path.join(this.mind.dataDir, 'notebooks.json');
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error('加载笔记本失败:', e.message);
        }
        return [];
    }

    saveNotes() {
        const filePath = path.join(this.mind.dataDir, 'notes.json');
        try {
            if (!fs.existsSync(this.mind.dataDir)) {
                fs.mkdirSync(this.mind.dataDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(this.notes, null, 2));
        } catch (e) {
            console.error('保存笔记失败:', e.message);
        }
    }

    saveNotebooks() {
        const filePath = path.join(this.mind.dataDir, 'notebooks.json');
        try {
            if (!fs.existsSync(this.mind.dataDir)) {
                fs.mkdirSync(this.mind.dataDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(this.notebooks, null, 2));
        } catch (e) {
            console.error('保存笔记本失败:', e.message);
        }
    }

    createNote(title, content = '', notebookId = null, tags = []) {
        const note = {
            id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title,
            content,
            notebookId,
            tags,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.notes.push(note);
        this.saveNotes();
        this.mind.addToLongTerm(`创建笔记: ${title}`, 'note', ['笔记', ...tags]);
        return note;
    }

    updateNote(noteId, updates) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            Object.assign(note, updates, { updatedAt: Date.now() });
            this.saveNotes();
            return note;
        }
        return null;
    }

    deleteNote(noteId) {
        const index = this.notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
            const note = this.notes[index];
            this.notes.splice(index, 1);
            this.saveNotes();
            return note;
        }
        return null;
    }

    getNotes(filter = {}) {
        let filtered = [...this.notes];
        if (filter.notebookId) filtered = filtered.filter(n => n.notebookId === filter.notebookId);
        if (filter.tag) filtered = filtered.filter(n => n.tags && n.tags.includes(filter.tag));
        if (filter.search) {
            const search = filter.search.toLowerCase();
            filtered = filtered.filter(n => 
                n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search)
            );
        }
        return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    createNotebook(name, description = '') {
        const notebook = {
            id: 'notebook_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name,
            description,
            createdAt: Date.now()
        };
        this.notebooks.push(notebook);
        this.saveNotebooks();
        return notebook;
    }

    deleteNotebook(notebookId) {
        const index = this.notebooks.findIndex(n => n.id === notebookId);
        if (index !== -1) {
            const notebook = this.notebooks[index];
            this.notebooks.splice(index, 1);
            this.saveNotebooks();
            this.notes.forEach(n => {
                if (n.notebookId === notebookId) n.notebookId = null;
            });
            this.saveNotes();
            return notebook;
        }
        return null;
    }

    searchNotes(query) {
        const results = [];
        const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        for (const note of this.notes) {
            let score = 0;
            const text = (note.title + ' ' + note.content).toLowerCase();
            for (const keyword of keywords) {
                if (text.includes(keyword)) score += text.split(keyword).length - 1;
            }
            if (score > 0) results.push({ ...note, score });
        }
        return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    getStats() {
        return {
            totalNotes: this.notes.length,
            totalNotebooks: this.notebooks.length,
            totalTags: [...new Set(this.notes.flatMap(n => n.tags || []))].length,
            recentNotes: this.notes
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 5)
                .map(n => ({ id: n.id, title: n.title }))
        };
    }
}

class ProductivityDashboard {
    constructor(mind) {
        this.mind = mind;
        this.projectManager = new ProjectManager(mind);
        this.taskScheduler = new TaskScheduler(mind);
        this.timeTracker = new TimeTracker(mind);
        this.habitTracker = new HabitTracker(mind);
        this.taskManager = new TaskManager(mind);
        this.noteManager = new NoteManager(mind);
    }

    getOverview() {
        const taskStats = this.taskManager.getTaskStats();
        const noteStats = this.noteManager.getStats();
        const projectStats = this.projectManager.getProjectStats();
        const todayHabits = this.habitTracker.getTodayHabits();
        const todayTasks = this.taskScheduler.getScheduledTasks();
        const weeklyReport = this.timeTracker.getWeeklyReport();

        return {
            tasks: taskStats,
            notes: noteStats,
            projects: projectStats,
            habits: {
                today: todayHabits.length,
                completed: todayHabits.filter(h => h.completed).length
            },
            schedule: {
                today: todayTasks.length,
                overdue: this.taskScheduler.getOverdueTasks().length
            },
            timeTracking: weeklyReport,
            summary: this.generateSummary(taskStats, projectStats, todayHabits, weeklyReport)
        };
    }

    generateSummary(taskStats, projectStats, todayHabits, weeklyReport) {
        let summary = '📋 生产力概览\n\n';
        summary += `✅ 任务完成率: ${taskStats.completionRate}%\n`;
        summary += `📝 笔记数量: ${noteStats.totalNotes}\n`;
        summary += `📊 项目进度: ${projectStats.completionRate}%\n`;
        summary += `⏰ 本周工作: ${weeklyReport.totalHours} 小时\n\n`;

        if (taskStats.byPriority.high > 0) {
            summary += `🔴 高优先级待办: ${taskStats.byPriority.high}\n`;
        }
        if (taskStats.overdue > 0) {
            summary += `⚠️ 已逾期任务: ${taskStats.overdue}\n`;
        }

        const completedHabits = todayHabits.filter(h => h.completed).length;
        summary += `\n🎯 今日习惯: ${completedHabits}/${todayHabits.length} 已完成\n`;

        return summary;
    }

    quickAdd(type, content, options = {}) {
        switch (type) {
            case 'task':
                return this.taskManager.addTask(content, options.description, options.priority, options.dueDate, options.tags);
            case 'note':
                return this.noteManager.createNote(content, options.content, options.notebookId, options.tags);
            case 'project':
                return this.projectManager.createProject(content, options.description, options.goals);
            case 'habit':
                return this.habitTracker.createHabit(content, options.frequency, options.reminderTime);
            default:
                return null;
        }
    }
}

module.exports = { 
    ProjectManager, 
    TaskScheduler, 
    TimeTracker, 
    HabitTracker,
    TaskManager,
    NoteManager,
    ProductivityDashboard 
};
