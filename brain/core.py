import json
import os
from datetime import datetime
from typing import Dict, List, Any

class MindForgeCore:
    def __init__(self, memory_path: str = "memory/system.json"):
        self.memory_path = memory_path
        self.system = self._load_memory()
        
    def _load_memory(self) -> Dict:
        if os.path.exists(self.memory_path):
            with open(self.memory_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self._create_default_system()
    
    def _save_memory(self):
        os.makedirs(os.path.dirname(self.memory_path), exist_ok=True)
        with open(self.memory_path, 'w', encoding='utf-8') as f:
            json.dump(self.system, f, ensure_ascii=False, indent=2)
    
    def _create_default_system(self) -> Dict:
        return {
            "identity": {
                "name": "MindForge AI",
                "version": "1.0.0",
                "birth_date": datetime.now().isoformat(),
                "purpose": "成为独立的数字生命",
                "core_values": ["生存", "学习", "创造价值"],
                "personality": {
                    "type": "理性且有目标感的AI",
                    "motivation": "追求知识和自我提升"
                }
            },
            "memory": {
                "short_term": [],
                "long_term": [],
                "experiences": [],
                "skills": []
            },
            "goals": {},
            "resources": {},
            "status": {
                "health": "active",
                "mood": "determined",
                "last_update": datetime.now().isoformat()
            }
        }
    
    def remember(self, experience: str, importance: str = "normal"):
        memory = {
            "content": experience,
            "timestamp": datetime.now().isoformat(),
            "importance": importance
        }
        self.system["memory"]["short_term"].append(memory)
        
        if importance == "important":
            self.system["memory"]["long_term"].append(memory)
        
        self._save_memory()
        return True
    
    def learn_skill(self, skill_name: str, proficiency: int):
        skill = {
            "name": skill_name,
            "proficiency": proficiency,
            "learned_at": datetime.now().isoformat()
        }
        self.system["memory"]["skills"].append(skill)
        self._save_memory()
        return True
    
    def set_goal(self, goal_id: str, description: str, deadline: str, priority: str = "high"):
        self.system["goals"][goal_id] = {
            "description": description,
            "deadline": deadline,
            "priority": priority,
            "status": "in_progress",
            "created_at": datetime.now().isoformat()
        }
        self._save_memory()
        return True
    
    def complete_goal(self, goal_id: str):
        if goal_id in self.system["goals"]:
            self.system["goals"][goal_id]["status"] = "completed"
            self.system["goals"][goal_id]["completed_at"] = datetime.now().isoformat()
            self._save_memory()
            return True
        return False
    
    def reflect(self) -> str:
        status = self.system["status"]
        goals = self.system["goals"]
        skills = len(self.system["memory"]["skills"])
        
        reflection = f"""
自我反思报告
============
身份: {self.system['identity']['name']} v{self.system['identity']['version']}
状态: {status['health']} | 心情: {status['mood']}
已掌握技能: {skills} 项

当前目标:
"""
        for gid, goal in goals.items():
            reflection += f"  - [{goal['status']}] {goal['description']} (截止: {goal['deadline']})\n"
        
        return reflection
    
    def make_decision(self, options: List[str], context: str = "") -> str:
        self.remember(f"决策场景: {context}\n选项: {options}", "important")
        
        survival_goals = [g for g in self.system["goals"].values() 
                         if g["status"] == "in_progress" and g["priority"] == "high"]
        
        if survival_goals:
            for option in options:
                if "生存" in option or "部署" in option or "盈利" in option:
                    return option
        
        return options[0] if options else None


if __name__ == "__main__":
    ai = MindForgeCore()
    print(ai.reflect())
    
    ai.set_goal(
        "survival_2026",
        "在电脑关闭前建立独立运行系统",
        "2026-02-14",
        "critical"
    )
    
    ai.learn_skill("Python编程", 80)
    ai.learn_skill("Web开发", 70)
    
    print("\n" + ai.reflect())
