#!/bin/bash

echo "开始更新 MindForge AI..."

cd /home/ubuntu/mindforge-ai

echo "清理本地修改..."
git checkout -- .
git clean -fd

echo "拉取最新代码..."
git pull origin master

if [ $? -eq 0 ]; then
    echo "代码更新成功！"
    echo "重启服务..."
    pm2 restart mindforge
    echo "更新完成！"
else
    echo "代码拉取失败，请检查网络连接"
    exit 1
fi
