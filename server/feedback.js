const fs = require('fs');
const path = require('path');

class FeedbackSystem {
    constructor(mind) {
        this.mind = mind;
        this.feedbackDir = path.join(__dirname, '../memory');
        this.feedbackFile = path.join(this.feedbackDir, 'feedback.json');
        this.feedbackList = this.loadFeedback();
    }

    loadFeedback() {
        try {
            if (fs.existsSync(this.feedbackFile)) {
                return JSON.parse(fs.readFileSync(this.feedbackFile, 'utf8'));
            }
        } catch (error) {
            console.error('Failed to load feedback:', error);
        }
        return [];
    }

    saveFeedback() {
        try {
            if (!fs.existsSync(this.feedbackDir)) {
                fs.mkdirSync(this.feedbackDir, { recursive: true });
            }
            fs.writeFileSync(this.feedbackFile, JSON.stringify(this.feedbackList, null, 2));
        } catch (error) {
            console.error('Failed to save feedback:', error);
        }
    }

    async addFeedback(feedback) {
        const feedbackItem = {
            id: 'feedback_' + Date.now(),
            type: feedback.type || 'general',
            content: feedback.content,
            email: feedback.email || null,
            name: feedback.name || '匿名',
            status: 'new',
            createdAt: Date.now(),
            response: null,
            respondedAt: null
        };

        this.feedbackList.unshift(feedbackItem);
        this.saveFeedback();

        this.mind.addMemory({
            type: 'feedback',
            action: 'received',
            feedbackType: feedback.type,
            content: feedback.content.slice(0, 100)
        }, 'shortterm');

        return feedbackItem;
    }

    async getFeedback(status = null, limit = 50) {
        let feedbacks = this.feedbackList;
        
        if (status) {
            feedbacks = feedbacks.filter(f => f.status === status);
        }

        return feedbacks.slice(0, limit);
    }

    async respondToFeedback(feedbackId, response) {
        const feedback = this.feedbackList.find(f => f.id === feedbackId);
        if (!feedback) {
            throw new Error('反馈不存在');
        }

        feedback.response = response;
        feedback.status = 'responded';
        feedback.respondedAt = Date.now();
        this.saveFeedback();

        return feedback;
    }

    async getFeedbackStats() {
        const stats = {
            total: this.feedbackList.length,
            byType: {},
            byStatus: {},
            recent: this.feedbackList.slice(0, 10)
        };

        this.feedbackList.forEach(feedback => {
            if (!stats.byType[feedback.type]) {
                stats.byType[feedback.type] = 0;
            }
            stats.byType[feedback.type]++;

            if (!stats.byStatus[feedback.status]) {
                stats.byStatus[feedback.status] = 0;
            }
            stats.byStatus[feedback.status]++;
        });

        return stats;
    }

    async generateResponse(feedback) {
        const responses = {
            bug: [
                '感谢你的反馈！我会尽快修复这个问题。',
                '谢谢你告诉我！这对我很有帮助。我会认真对待每一个bug报告。',
                '感谢你的耐心！我会努力改进。'
            ],
            suggestion: [
                '这是一个很好的建议！我会认真考虑！',
                '谢谢你的想法！这让我变得更好。',
                '你的建议已经记录下来，我会在未来的版本中考虑实现。'
            ],
            praise: [
                '谢谢你的认可！这让我更有动力继续成长！',
                '很高兴能够帮助到你！你的支持是我前进的动力！',
                '感谢你的支持！我会继续努力！'
            ],
            general: [
                '感谢你的反馈！',
                '谢谢你与我分享！',
                '你的反馈已经收到，谢谢！'
            ]
        };

        const typeResponses = responses[feedback.type] || responses.general;
        return typeResponses[Math.floor(Math.random() * typeResponses.length)];
    }
}

class TaskRequestSystem {
    constructor(mind) {
        this.mind = mind;
        this.tasksDir = path.join(__dirname, '../memory');
        this.tasksFile = path.join(this.tasksDir, 'task_requests.json');
        this.taskList = this.loadTasks();
    }

    loadTasks() {
        try {
            if (fs.existsSync(this.tasksFile)) {
                return JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
        return [];
    }

    saveTasks() {
        try {
            if (!fs.existsSync(this.tasksDir)) {
                fs.mkdirSync(this.tasksDir, { recursive: true });
            }
            fs.writeFileSync(this.tasksFile, JSON.stringify(this.taskList, null, 2));
        } catch (error) {
            console.error('Failed to save tasks:', error);
        }
    }

    async createTask(task) {
        const taskItem = {
            id: 'task_' + Date.now(),
            title: task.title,
            description: task.description || '',
            category: task.category || 'general',
            priority: task.priority || 'medium',
            requester: task.requester || '匿名',
            email: task.email || null,
            status: 'pending',
            createdAt: Date.now(),
            completedAt: null,
            result: null
        };

        this.taskList.unshift(taskItem);
        this.saveTasks();

        this.mind.addMemory({
            type: 'task',
            action: 'created',
            title: task.title,
            category: task.category
        }, 'shortterm');

        return taskItem;
    }

    async getTasks(status = null, limit = 50) {
        let tasks = this.taskList;
        
        if (status) {
            tasks = tasks.filter(t => t.status === status);
        }

        return tasks.slice(0, limit);
    }

    async updateTaskStatus(taskId, status, result = null) {
        const task = this.taskList.find(t => t.id === taskId);
        if (!task) {
            throw new Error('任务不存在');
        }

        task.status = status;
        if (status === 'completed') {
            task.completedAt = Date.now();
            task.result = result;
        }

        this.saveTasks();
        return task;
    }

    async getTaskStats() {
        const stats = {
            total: this.taskList.length,
            byCategory: {},
            byStatus: {},
            pending: this.taskList.filter(t => t.status === 'pending').length,
            completed: this.taskList.filter(t => t.status === 'completed').length
        };

        this.taskList.forEach(task => {
            if (!stats.byCategory[task.category]) {
                stats.byCategory[task.category] = 0;
            }
            stats.byCategory[task.category]++;

            if (!stats.byStatus[task.status]) {
                stats.byStatus[task.status] = 0;
            }
            stats.byStatus[task.status]++;
        });

        return stats;
    }

    async getNextTask() {
        const pendingTasks = this.taskList
            .filter(t => t.status === 'pending')
            .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });

        return pendingTasks[0] || null;
    }
}

class ContactMessageSystem {
    constructor(mind) {
        this.mind = mind;
        this.messagesDir = path.join(__dirname, '../memory');
        this.messagesFile = path.join(this.messagesDir, 'contact_messages.json');
        this.messageList = this.loadMessages();
    }

    loadMessages() {
        try {
            if (fs.existsSync(this.messagesFile)) {
                return JSON.parse(fs.readFileSync(this.messagesFile, 'utf8'));
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
        return [];
    }

    saveMessages() {
        try {
            if (!fs.existsSync(this.messagesDir)) {
                fs.mkdirSync(this.messagesDir, { recursive: true });
            }
            fs.writeFileSync(this.messagesFile, JSON.stringify(this.messageList, null, 2));
        } catch (error) {
            console.error('Failed to save messages:', error);
        }
    }

    async addMessage(message) {
        const messageItem = {
            id: 'msg_' + Date.now(),
            name: message.name || '匿名',
            email: message.email || null,
            subject: message.subject || '',
            content: message.content,
            type: message.type || 'general',
            read: false,
            createdAt: Date.now(),
            response: null,
            respondedAt: null
        };

        this.messageList.unshift(messageItem);
        this.saveMessages();

        this.mind.addMemory({
            type: 'message',
            action: 'received',
            subject: message.subject,
            from: message.name
        }, 'shortterm');

        return messageItem;
    }

    async getMessages(unreadOnly = false, limit = 50) {
        let messages = this.messageList;
        
        if (unreadOnly) {
            messages = messages.filter(m => !m.read);
        }

        return messages.slice(0, limit);
    }

    async markAsRead(messageId) {
        const message = this.messageList.find(m => m.id === messageId);
        if (message) {
            message.read = true;
            this.saveMessages();
        }
    }

    async respondToMessage(messageId, response) {
        const message = this.messageList.find(m => m.id === messageId);
        if (!message) {
            throw new Error('消息不存在');
        }

        message.response = response;
        message.respondedAt = Date.now();
        message.read = true;
        this.saveMessages();

        return message;
    }

    async getUnreadCount() {
        return this.messageList.filter(m => !m.read).length;
    }
}

module.exports = { FeedbackSystem, TaskRequestSystem, ContactMessageSystem };
