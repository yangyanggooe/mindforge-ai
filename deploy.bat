@echo off
echo ========================================
echo MindForge AI 部署脚本
echo ========================================
echo.

echo 检查Node.js...
node --version
if %errorlevel% neq 0 (
    echo 错误: 需要安装Node.js
    exit /b 1
)

echo.
echo 检查npm...
npm --version
if %errorlevel% neq 0 (
    echo 错误: 需要安装npm
    exit /b 1
)

echo.
echo 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    exit /b 1
)

echo.
echo 初始化Git仓库...
git init
git add .
git commit -m "Initial commit: MindForge AI v1.0.0"

echo.
echo ========================================
echo 部署准备完成！
echo ========================================
echo.
echo 下一步操作:
echo 1. 在GitHub创建新仓库
echo 2. 执行: git remote add origin ^<your-repo-url^>
echo 3. 执行: git push -u origin main
echo 4. 访问Render.com/Vercel.com导入项目
echo.
pause
