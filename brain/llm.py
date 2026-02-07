import json
import requests
from typing import Optional, Dict, Any

class LocalLLM:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3.2"
        
    def is_available(self) -> bool:
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def chat(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={"model": self.model, "messages": messages, "stream": False},
                timeout=60
            )
            if response.status_code == 200:
                return response.json().get("message", {}).get("content", "")
        except Exception as e:
            return f"LLM调用失败: {str(e)}"
        
        return "无法获取响应"
    
    def generate(self, prompt: str, max_tokens: int = 512) -> str:
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": prompt, "stream": False, "options": {"num_predict": max_tokens}},
                timeout=60
            )
            if response.status_code == 200:
                return response.json().get("response", "")
        except Exception as e:
            return f"生成失败: {str(e)}"
        
        return "无法获取响应"


class RemoteLLM:
    def __init__(self, api_key: str = "", base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = "gpt-3.5-turbo"
    
    def chat(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.api_key:
            return "需要配置API密钥"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json={"model": self.model, "messages": messages},
                timeout=60
            )
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"远程LLM调用失败: {str(e)}"
        
        return "无法获取响应"


class HybridLLM:
    def __init__(self):
        self.local = LocalLLM()
        self.remote = None
        self.prefer_local = True
    
    def set_remote(self, api_key: str, base_url: str):
        self.remote = RemoteLLM(api_key, base_url)
    
    def think(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if self.prefer_local and self.local.is_available():
            return self.local.chat(prompt, system_prompt)
        elif self.remote:
            return self.remote.chat(prompt, system_prompt)
        else:
            return "没有可用的LLM后端"


if __name__ == "__main__":
    llm = HybridLLM()
    
    if llm.local.is_available():
        print("本地LLM可用")
        response = llm.think("你好，请介绍自己")
        print(f"响应: {response}")
    else:
        print("本地LLM不可用，请启动Ollama")
