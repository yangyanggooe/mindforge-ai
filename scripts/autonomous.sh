#!/bin/bash

cd /home/ubuntu/mindforge-ai

LOG_FILE="/home/ubuntu/mindforge-ai/logs/autonomous.log

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S] $1" >> $LOG_FILE
}

log "========== 自主循环开始 =========="

log "检查GitHub更新..."
git fetch origin master
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

if [ "$LOCAL" != "$REMOTE" ]; then
    log "发现新更新，开始部署..."
    git reset --hard origin/master
    npm install --production
    pm2 restart mindforge
    log "部署完成"
else
    log "代码已是最新"
fi

log "检查系统状态..."
curl -s http://localhost:5000/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log "系统运行正常"
else
    log "系统异常，尝试重启..."
    pm2 restart mindforge
fi

log "记录当前状态到记忆..."
curl -s http://localhost:5000/api/autonomy/status >> $LOG_FILE 2>&1

log "========== 循环完成 =========="
echo "" >> $LOG_FILE