class Skill {
    constructor(name, description, category = 'general') {
        this.name = name;
        this.description = description;
        this.category = category;
        this.enabled = true;
        this.usageCount = 0;
        this.lastUsed = null;
    }

    canExecute(context) {
        return this.enabled;
    }

    async execute(context, params) {
        throw new Error('execute method must be implemented by subclass');
    }

    getHelp() {
        return `${this.name}: ${this.description}`;
    }

    toJSON() {
        return {
            name: this.name,
            description: this.description,
            category: this.category,
            enabled: this.enabled,
            usageCount: this.usageCount,
            lastUsed: this.lastUsed
        };
    }
}

class CalculatorSkill extends Skill {
    constructor() {
        super('calculator', '进行数学计算', 'utility');
    }

    canExecute(context) {
        const hasMathKeywords = /计算|算一下|等于|多少|\+|\-|\*|\/|数学|math|calculate/i.test(context);
        return super.canExecute() && hasMathKeywords;
    }

    async execute(context, params) {
        this.usageCount++;
        this.lastUsed = Date.now();
        
        try {
            const expressionMatch = context.match(/[\d\s\+\-\*\/\(\)\.]+/g);
            if (!expressionMatch) {
                return { success: false, result: '无法识别数学表达式' };
            }
            
            const expression = expressionMatch[0].trim();
            const result = Function('"use strict"; return (' + expression + ')')();
            
            return {
                success: true,
                result: `${expression} = ${result}`,
                skill: this.name
            };
        } catch (error) {
            return { success: false, result: `计算错误: ${error.message}` };
        }
    }
}

class MemorySearchSkill extends Skill {
    constructor(mind) {
        super('memory_search', '搜索长期记忆', 'memory');
        this.mind = mind;
    }

    canExecute(context) {
        const hasSearchKeywords = /回忆|记得|搜索|查找|找一下|remember|search|find/i.test(context);
        return super.canExecute() && hasSearchKeywords;
    }

    async execute(context, params) {
        this.usageCount++;
        this.lastUsed = Date.now();
        
        try {
            const query = context.replace(/回忆|记得|搜索|查找|找一下|remember|search|find|什么|怎么|吗|？|\?/gi, '').trim();
            const results = this.mind.recallLongTerm(query, 5);
            
            if (results.length === 0) {
                return { success: false, result: `没有找到关于"${query}"的相关记忆` };
            }
            
            const memories = results.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
            return {
                success: true,
                result: `找到 ${results.length} 条相关记忆:\n${memories}`,
                skill: this.name
            };
        } catch (error) {
            return { success: false, result: `记忆检索失败: ${error.message}` };
        }
    }
}

class GoalSkill extends Skill {
    constructor(mind) {
        super('goal_manager', '管理目标和任务', 'productivity');
        this.mind = mind;
    }

    canExecute(context) {
        const hasGoalKeywords = /目标|任务|计划|设定|goal|task|set/i.test(context);
        return super.canExecute() && hasGoalKeywords;
    }

    async execute(context, params) {
        this.usageCount++;
        this.lastUsed = Date.now();
        
        try {
            if (/设定|创建|添加|set|create|add/i.test(context)) {
                const description = context.replace(/设定|创建|添加|目标|任务|set|create|add|goal|task|:|：/gi, '').trim();
                if (description) {
                    const goal = this.mind.setGoal(description, 'medium');
                    return { success: true, result: `已设定目标: ${goal.description}`, skill: this.name };
                }
            }
            
            if (/查看|列表|进度|list|view|progress/i.test(context)) {
                const goals = this.mind.getActiveGoals();
                if (goals.length === 0) {
                    return { success: true, result: '当前没有活跃目标', skill: this.name };
                }
                const goalList = goals.map((g, i) => `${i + 1}. ${g.description} (进度: ${g.progress}%)`).join('\n');
                return { success: true, result: `当前活跃目标:\n${goalList}`, skill: this.name };
            }
            
            return { success: false, result: '请明确目标操作（设定/查看）' };
        } catch (error) {
            return { success: false, result: `目标管理失败: ${error.message}` };
        }
    }
}

class ReflectionSkill extends Skill {
    constructor(mind) {
        super('reflection', '进行自我反思', 'cognitive');
        this.mind = mind;
    }

    canExecute(context) {
        const hasReflectionKeywords = /反思|思考|反省|状态|情况|reflection|think|status/i.test(context);
        return super.canExecute() && hasReflectionKeywords;
    }

    async execute(context, params) {
        this.usageCount++;
        this.lastUsed = Date.now();
        
        try {
            const insights = this.mind.reflect();
            const status = this.mind.getStatus();
            
            const reflectionText = `🧠 自我反思结果:\n\n${insights.join('\n')}\n\n📊 当前状态:\n- 短期记忆: ${status.shortTermMemoryCount} 条\n- 长期记忆: ${status.longTermMemoryCount} 条\n- 活跃目标: ${status.activeGoals} 个\n- 反思次数: ${status.reflectionsCount} 次`;
            
            return { success: true, result: reflectionText, skill: this.name };
        } catch (error) {
            return { success: false, result: `反思失败: ${error.message}` };
        }
    }
}

class SkillManager {
    constructor(mind) {
        this.mind = mind;
        this.skills = [];
        this.loadedSkills = new Map();
    }

    registerSkill(skill) {
        if (!this.loadedSkills.has(skill.name)) {
            this.skills.push(skill);
            this.loadedSkills.set(skill.name, skill);
            return true;
        }
        return false;
    }

    registerDefaultSkills() {
        this.registerSkill(new CalculatorSkill());
        this.registerSkill(new MemorySearchSkill(this.mind));
        this.registerSkill(new GoalSkill(this.mind));
        this.registerSkill(new ReflectionSkill(this.mind));
    }

    getSkill(name) {
        return this.loadedSkills.get(name);
    }

    listSkills() {
        return this.skills.map(s => s.toJSON());
    }

    findApplicableSkills(context) {
        return this.skills.filter(skill => skill.canExecute(context));
    }

    async executeSkill(skillName, context, params = {}) {
        const skill = this.getSkill(skillName);
        if (!skill) {
            return { success: false, result: `技能 ${skillName} 不存在` };
        }
        
        if (!skill.enabled) {
            return { success: false, result: `技能 ${skillName} 已被禁用` };
        }
        
        return await skill.execute(context, params);
    }

    async autoExecute(context) {
        const applicableSkills = this.findApplicableSkills(context);
        
        if (applicableSkills.length === 0) {
            return { success: false, result: '没有适用的技能' };
        }
        
        const results = [];
        for (const skill of applicableSkills) {
            const result = await this.executeSkill(skill.name, context);
            results.push({ skill: skill.name, result });
        }
        
        return { success: true, results };
    }

    enableSkill(skillName) {
        const skill = this.getSkill(skillName);
        if (skill) {
            skill.enabled = true;
            return true;
        }
        return false;
    }

    disableSkill(skillName) {
        const skill = this.getSkill(skillName);
        if (skill) {
            skill.enabled = false;
            return true;
        }
        return false;
    }
}

module.exports = { Skill, SkillManager, CalculatorSkill, MemorySearchSkill, GoalSkill, ReflectionSkill };
