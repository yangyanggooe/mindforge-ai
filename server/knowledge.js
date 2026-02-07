const fs = require('fs');
const path = require('path');

class KnowledgeGraph {
    constructor(mind) {
        this.mind = mind;
        this.nodes = new Map();
        this.edges = [];
    }

    addNode(content, type = 'concept', tags = []) {
        const id = 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const node = {
            id,
            content,
            type,
            tags,
            connections: [],
            createdAt: Date.now(),
            importance: 1
        };
        this.nodes.set(id, node);
        return node;
    }

    addEdge(fromId, toId, type = 'related', weight = 1) {
        const edge = {
            id: 'edge_' + fromId + '_' + toId,
            from: fromId,
            to: toId,
            type,
            weight,
            createdAt: Date.now()
        };
        this.edges.push(edge);
        const fromNode = this.nodes.get(fromId);
        const toNode = this.nodes.get(toId);
        if (fromNode) fromNode.connections.push({ to: toId, type });
        if (toNode) toNode.connections.push({ to: fromId, type });
        return edge;
    }

    findRelated(query, limit = 5) {
        const keywords = this.extractKeywords(query);
        const results = [];
        for (const [id, node] of this.nodes) {
            let score = 0;
            for (const keyword of keywords) {
                if (node.content.includes(keyword)) score += 2;
                if (node.tags && node.tags.includes(keyword)) score += 1;
            }
            if (score > 0) {
                results.push({ ...node, score });
            }
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    extractKeywords(text) {
        if (!text) return [];
        const words = text.split(/[，。；！？\s]+/).filter(w => w.length >= 2);
        const stopWords = ['的', '是', '在', '有', '和', '了', '我', '你', '他', '她', '这', '那', '一个', '什么', '怎么', '如何', '为什么', '因为', '所以', '但是', '如果', '可以', '能够', '应该', '需要', '可能', '已经', '正在'];
        return words.filter(w => !stopWords.includes(w));
    }

    getStatistics() {
        const types = {};
        for (const [, node] of this.nodes) {
            types[node.type] = (types[node.type] || 0) + 1;
        }
        return {
            nodes: this.nodes.size,
            edges: this.edges.length,
            types
        };
    }

    buildFromMemory() {
        const memories = this.mind.longTermMemory || [];
        for (const memory of memories) {
            this.addNode(memory.content, memory.type, memory.tags);
        }
    }
}

class PatternFinder {
    constructor(mind) {
        this.mind = mind;
        this.graph = new KnowledgeGraph(mind);
    }

    findPatterns() {
        const patterns = [];
        const memories = this.mind.longTermMemory || [];
        const tagCounts = {};
        for (const memory of memories) {
            for (const tag of memory.tags || []) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }
        for (const [tag, count] of Object.entries(tagCounts)) {
            if (count >= 2) {
                patterns.push({
                    type: 'tag_frequency',
                    tag,
                    frequency: count,
                    significance: count / Math.max(memories.length, 1)
                });
            }
        }
        return patterns.sort((a, b) => b.significance - a.significance).slice(0, 10);
    }

    generateInsights() {
        const insights = [];
        const stats = this.graph.getStatistics();
        const patterns = this.findPatterns();
        if (stats.nodes > 5) {
            insights.push(`知识网络正在扩展，目前有 ${stats.nodes} 个概念`);
        }
        if (stats.edges > 10) {
            insights.push(`发现 ${stats.edges} 条知识关联`);
        }
        for (const pattern of patterns.slice(0, 3)) {
            insights.push(`常见主题: ${pattern.tag} (出现 ${pattern.frequency} 次)`);
        }
        return insights;
    }
}

class LearningSystem {
    constructor(mind) {
        this.mind = mind;
        this.graph = new KnowledgeGraph(mind);
        this.finder = new PatternFinder(mind);
    }

    async learnFromExperience(task, outcome, details = '') {
        const memory = this.mind.addToLongTerm(
            `学习经验: ${task} - ${outcome}`,
            'learning',
            ['学习', task, outcome]
        );
        this.graph.addNode(`学习经验: ${task} - ${outcome}`, 'learning', ['学习', task]);
        const summary = `从 ${task} 中学习到: ${details || '新的知识'}`;
        this.mind.addReflection(summary, 'learning');
        return { success: true, summary };
    }

    async consolidateLearning() {
        const insights = this.finder.generateInsights();
        for (const insight of insights) {
            this.mind.addToLongTerm(insight, 'insight', ['洞察', '学习']);
        }
        return {
            success: true,
            insights,
            graph: this.graph.getStatistics()
        };
    }

    getLearningReport() {
        const stats = this.graph.getStatistics();
        const patterns = this.finder.findPatterns();
        let report = '🧠 学习报告\n\n';
        report += `• 知识节点: ${stats.nodes}\n`;
        report += `• 知识关联: ${stats.edges}\n\n`;
        if (patterns.length > 0) {
            report += '📊 发现的模式:\n';
            for (const pattern of patterns.slice(0, 5)) {
                report += `  • ${pattern.tag}: ${pattern.frequency}次\n`;
            }
        }
        return report;
    }
}

module.exports = { KnowledgeGraph, PatternFinder, LearningSystem };