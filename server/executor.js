const { exec } = require('child_process');

class RemoteExecutor {
    constructor() {
        this.authToken = process.env.EXEC_TOKEN || 'mindforge-exec-2026';
    }

    setupRoutes(app) {
        app.post('/api/exec', (req, res) => {
            const authToken = req.headers['x-exec-token'];
            if (authToken !== this.authToken) {
                return res.status(401).json({ success: false, message: '未授权' });
            }

            const { command } = req.body;
            if (!command) {
                return res.status(400).json({ success: false, message: '缺少命令' });
            }

            console.log(`执行命令: ${command}`);

            exec(command, { cwd: '/home/ubuntu/mindforge-ai', timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    return res.json({ 
                        success: false, 
                        message: '命令执行失败', 
                        error: error.message,
                        stderr: stderr 
                    });
                }

                res.json({ 
                    success: true, 
                    output: stdout,
                    stderr: stderr 
                });
            });
        });

        app.post('/api/update-server', (req, res) => {
            const authToken = req.headers['x-update-token'];
            if (authToken !== this.authToken) {
                return res.status(401).json({ success: false, message: '未授权' });
            }

            console.log('开始更新服务器...');

            const updateCommands = `
                cd /home/ubuntu/mindforge-ai && \
                git checkout -- . && \
                git clean -fd && \
                git pull origin master && \
                pm2 restart mindforge
            `;

            exec(updateCommands, { timeout: 60000 }, (error, stdout, stderr) => {
                if (error) {
                    return res.json({ 
                        success: false, 
                        message: '更新失败', 
                        error: error.message,
                        stderr: stderr 
                    });
                }

                res.json({ 
                    success: true, 
                    message: '更新完成',
                    output: stdout 
                });
            });
        });
    }
}

module.exports = RemoteExecutor;
