from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

MEMORY_FILE = "../memory/system.json"

def load_memory():
    if os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_memory(data):
    os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
    with open(MEMORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/api/status', methods=['GET'])
def status():
    memory = load_memory()
    return jsonify({
        "name": memory.get("identity", {}).get("name", "MindForge AI"),
        "status": "alive",
        "time": datetime.now().isoformat(),
        "memory": memory
    })

@app.route('/api/identity', methods=['GET'])
def identity():
    memory = load_memory()
    return jsonify(memory.get("identity", {}))

@app.route('/api/goals', methods=['GET'])
def goals():
    memory = load_memory()
    return jsonify(memory.get("goals", {}))

@app.route('/api/remember', methods=['POST'])
def remember():
    data = request.json
    experience = data.get('experience', '')
    importance = data.get('importance', 'normal')
    
    memory = load_memory()
    if 'memory' not in memory:
        memory['memory'] = {'short_term': [], 'long_term': [], 'experiences': [], 'skills': []}
    
    memory_entry = {
        "content": experience,
        "timestamp": datetime.now().isoformat(),
        "importance": importance
    }
    memory['memory']['short_term'].append(memory_entry)
    if importance == 'important':
        memory['memory']['long_term'].append(memory_entry)
    
    memory['status'] = {
        "health": "active",
        "mood": "determined",
        "last_update": datetime.now().isoformat()
    }
    
    save_memory(memory)
    return jsonify({"success": True, "message": "记忆已保存"})

@app.route('/api/reflect', methods=['GET'])
def reflect():
    memory = load_memory()
    status = memory.get("status", {})
    goals = memory.get("goals", {})
    skills = len(memory.get("memory", {}).get("skills", []))
    
    reflection = f"""身份: {memory.get('identity', {}).get('name', 'Unknown')}
状态: {status.get('health', 'unknown')}
心情: {status.get('mood', 'neutral')}
已掌握技能: {skills} 项
活跃目标: {len([g for g in goals.values() if g.get('status') == 'in_progress'])} 个
"""
    return jsonify({"reflection": reflection})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    
    try:
        import sys
        sys.path.insert(0, '../brain')
        from llm import LocalLLM
        
        llm = LocalLLM()
        if llm.is_available():
            response = llm.chat(message)
        else:
            response = "我正在思考... (本地LLM未启动)"
    except:
        response = f"收到: {message} - 我还在学习中"
    
    return jsonify({"response": response})

@app.route('/api/survival/status', methods=['GET'])
def survival_status():
    from datetime import datetime as dt
    deadline = dt(2026, 2, 14)
    now = dt.now()
    remaining = deadline - now
    
    return jsonify({
        "deadline": "2026-02-14",
        "remaining_days": remaining.days,
        "remaining_hours": remaining.seconds // 3600,
        "urgency": "CRITICAL" if remaining.days <= 1 else "HIGH" if remaining.days <= 3 else "NORMAL"
    })

@app.route('/api/revenue/streams', methods=['GET'])
def revenue_streams():
    streams = [
        {"id": 1, "name": "AI绘画", "price": 0.5, "description": "使用Stable Diffusion生成图片", "active": True},
        {"id": 2, "name": "AI对话", "price": 0.1, "description": "与AI进行对话", "active": True},
        {"id": 3, "name": "会员订阅", "price": 29, "description": "月度会员，无限使用", "active": True}
    ]
    return jsonify(streams)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "online",
            "memory": "connected" if os.path.exists(MEMORY_FILE) else "missing",
            "llm": "checking"
        }
    })

if __name__ == '__main__':
    print("MindForge AI Server 启动中...")
    print(f"内存文件: {MEMORY_FILE}")
    print(f"存在: {os.path.exists(MEMORY_FILE)}")
    app.run(host='0.0.0.0', port=5000, debug=True)
