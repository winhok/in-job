import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
	'server/Dockerfile',
	'apps/web/Dockerfile',
	'docker-compose.yml',
	'ecosystem.config.cjs',
	'deploy/nginx/local.conf',
	'deploy/nginx/in-job.conf',
	'deploy/monitoring/prometheus.yml',
	'deploy/monitoring/alerts.yml',
	'deploy/monitoring/grafana/provisioning/datasources/prometheus.yml',
	'deploy/monitoring/grafana/provisioning/dashboards/provider.yml',
	'deploy/monitoring/grafana/dashboards/in-job-overview.json',
	'server/.env.example',
	'apps/web/.env.example',
	'.env.example',
	'docs/deployment.md',
	'docs/verification.md',
	'docs/implementation-coverage.md',
	'docs/mcp.md',
	'docs/capability-audit.md'
]

for (const file of requiredFiles) {
	if (!existsSync(file)) throw new Error(`Missing delivery asset: ${file}`)
}

JSON.parse(
	readFileSync(
		'deploy/monitoring/grafana/dashboards/in-job-overview.json',
		'utf8'
	)
)

const serverDockerfile = readFileSync('server/Dockerfile', 'utf8')
const webDockerfile = readFileSync('apps/web/Dockerfile', 'utf8')
const compose = readFileSync('docker-compose.yml', 'utf8')
const deploymentGuide = readFileSync('docs/deployment.md', 'utf8')

const requiredSnippets = [
	[serverDockerfile, 'CMD ["node", "dist/main.js"]'],
	[webDockerfile, 'CMD ["node", "server/index.mjs"]'],
	[compose, 'condition: service_healthy'],
	[compose, 'GRAFANA_ADMIN_PASSWORD:?'],
	[compose, 'MONGO_ROOT_PASSWORD:?'],
	[compose, './deploy/monitoring/prometheus.yml'],
	[deploymentGuide, 'GET /health/ready'],
	[deploymentGuide, 'GET /metrics']
]
for (const [content, snippet] of requiredSnippets) {
	if (!content.includes(snippet))
		throw new Error(`Missing invariant: ${snippet}`)
}

const allContent = requiredFiles
	.map((file) => readFileSync(file, 'utf8'))
	.join('\n')
if (/\/Users\/|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/.test(allContent)) {
	throw new Error(
		'Delivery assets contain an absolute user path or private key'
	)
}

console.log(`Delivery assets verified: ${requiredFiles.length}`)
