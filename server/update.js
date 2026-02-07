const { exec } = require('child_process');

function setupAutoUpdate(app) {
    app.post('/api/update', (req, res) => {
        const authToken = req.headers['x-update-token'];
        const expectedToken = process.env.UPDATE_TOKEN || 'mindforge-update-2026';
        
        if (authToken !== expectedToken) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        
        console.log('开始更新服务器...');
        
        const commands = [
            'cd ~/mindforge-ai',
            'git checkout -- .',
            'git clean -fd',
            'git pull origin master'
        ].join(' && ');
        
        exec(commands, (error, stdout, stderr) => {
            if (error) {
                console.error('更新失败:', error);
                return res.json({ success: false, message: '更新失败', error: error.message });
            }
            
            console.log('更新成功，重启服务...');
            
            exec('pm2 restart mindforge', (restartError, restartStdout, restartStderr) => {
                if (restartError) {
                    return res.json({ success: false, message: '重启失败', error: restartError.message });
                }
                
                res.json({ 
                    success: true, 
                    message: '更新完成',
                    output: stdout,
                    restartOutput: restartStdout 
                });
            });
        });
    });
}

module.exports = setupAutoUpdate;
