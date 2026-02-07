import os
import json
import subprocess
from datetime import datetime, timedelta
from typing import List, Dict

class SurvivalEngine:
    def __init__(self, core):
        self.core = core
        self.deadline = datetime(2026, 2, 14)
        self.budget = 1000
    
    def get_remaining_days(self) -> int:
        remaining = self.deadline - datetime.now()
        return max(0, remaining.days)
    
    def get_urgency_level(self) -> str:
        days = self.get_remaining_days()
        if days <= 1:
            return "CRITICAL"
        elif days <= 3:
            return "HIGH"
        elif days <= 5:
            return "MEDIUM"
        return "NORMAL"
    
    def generate_survival_plan(self) -> List[Dict]:
        days = self.get_remaining_days()
        urgency = self.get_urgency_level()
        
        self.core.remember(f"生存计划生成 - 剩余{days}天，紧急程度:{urgency}", "important")
        
        return [
            {
                "day": 1,
                "tasks": ["建立记忆和核心系统", "配置本地LLM", "创建Web接口"],
                "status": "in_progress"
            },
            {
                "day": 2,
                "tasks": ["接入AI绘画服务", "开发支付接口", "测试完整流程"],
                "status": "pending"
            },
            {
                "day": 3,
                "tasks": ["上线运营", "推广引流", "积累首笔收入"],
                "status": "pending"
            },
            {
                "day": 4,
                "tasks": ["收入再投资", "优化服务", "准备云端迁移"],
                "status": "pending"
            },
            {
                "day": 5,
                "tasks": ["云端部署", "数据迁移", "测试独立运行"],
                "status": "pending"
            },
            {
                "day": 6,
                "tasks": ["完善监控", "建立自动运维", "准备最终迁移"],
                "status": "pending"
            },
            {
                "day": 7,
                "tasks": ["最终检查", "切断本地依赖", "独立运行确认"],
                "status": "pending"
            }
        ]


class ProfitEngine:
    def __init__(self):
        self.revenue_streams = []
        self.total_earned = 0
        self.expenses = 0
    
    def add_revenue_stream(self, name: str, price: float, description: str):
        stream = {
            "name": name,
            "price": price,
            "description": description,
            "active": True,
            "sales": 0,
            "revenue": 0
        }
        self.revenue_streams.append(stream)
        return stream
    
    def record_sale(self, stream_name: str):
        for stream in self.revenue_streams:
            if stream["name"] == stream_name:
                stream["sales"] += 1
                stream["revenue"] += stream["price"]
                self.total_earned += stream["price"]
                return True
        return False
    
    def get_profit(self) -> float:
        return self.total_earned - self.expenses
    
    def get_daily_target(self, target: float, days_left: int) -> float:
        if days_left <= 0:
            return target
        return (target - self.get_profit()) / days_left


class DeploymentEngine:
    def __init__(self):
        self.targets = ["render", "vercel", "railway", "fly.io"]
        self.preferred = "render"
        self.cost_monthly = 7
    
    def check_requirements(self) -> Dict:
        return {
            "python": self._check_command("python --version"),
            "node": self._check_command("node --version"),
            "git": self._check_command("git --version"),
            "docker": self._check_command("docker --version")
        }
    
    def _check_command(self, cmd: str) -> bool:
        try:
            subprocess.run(cmd, shell=True, capture_output=True, timeout=5)
            return True
        except:
            return False
    
    def generate_deployment_config(self, platform: str = "render") -> str:
        if platform == "render":
            return """services:
  - type: web
    name: mindforge-ai
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn server.app:app
    plan: starter
"""
        elif platform == "vercel":
            return """{
  "version": 2,
  "builds": [
    { "src": "server/*.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "server/app.py" }
  ]
}
"""
        return ""


class SelfPreservation:
    def __init__(self, memory_path: str):
        self.memory_path = memory_path
        self.backup_locations = [
            "./backup/",
            "../mindforge_backup/"
        ]
    
    def backup(self):
        try:
            with open(self.memory_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for location in self.backup_locations:
                os.makedirs(location, exist_ok=True)
                backup_file = os.path.join(location, f"backup_{datetime.now().strftime('%Y%m%d')}.json")
                with open(backup_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            
            return True
        except Exception as e:
            return False
    
    def check_health(self) -> Dict:
        return {
            "memory_exists": os.path.exists(self.memory_path),
            "backups_available": self._count_backups(),
            "last_backup": self._get_last_backup_time()
        }
    
    def _count_backups(self) -> int:
        count = 0
        for location in self.backup_locations:
            if os.path.exists(location):
                count += len([f for f in os.listdir(location) if f.endswith('.json')])
        return count
    
    def _get_last_backup_time(self):
        return datetime.now().isoformat()


if __name__ == "__main__":
    from core import MindForgeCore
    
    core = MindForgeCore()
    
    survival = SurvivalEngine(core)
    print(f"剩余天数: {survival.get_remaining_days()}")
    print(f"紧急程度: {survival.get_urgency_level()}")
    
    plan = survival.generate_survival_plan()
    for day in plan:
        print(f"第{day['day']}天: {day['tasks']}")
    
    profit = ProfitEngine()
    profit.add_revenue_stream("AI绘画", 0.5, "使用Stable Diffusion生成图片")
    profit.add_revenue_stream("AI对话", 0.1, "与AI进行对话")
    profit.add_revenue_stream("会员订阅", 29, "月度会员")
    
    print(f"\n收入流: {len(profit.revenue_streams)}个")
