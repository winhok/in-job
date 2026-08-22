// 启动指令：pm2 start /sunday/resume/mian-shi-wang/ecosystem.config.js
// 启动指令：pm2 start ecosystem.config.js
const path = require('path')
module.exports = {
	apps: [
		{
			name: 'Mian-Shi-Wang-Nuxt',
			port: '3001',
			exec_mode: 'fork',
			script: path.join(__dirname, './.output/server', 'index.mjs'),
			env_production: {
				VITE_RESUME_PREVIEW_URL: 'https://lgdsunday.club/'
			}
		}
	]
}
