#!/bin/bash

cd /home/ubuntu/mindforge-ai

echo "开始部署更新..."

git fetch origin master
git reset --hard origin/master

npm install --production

pm2 restart mindforge

echo "部署完成！"

pm2 status