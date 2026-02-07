#!/bin/bash
cd ~/mindforge-ai
git pull origin master
pm2 restart mindforge
echo "更新完成！"
