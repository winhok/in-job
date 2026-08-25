import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const walk = (directory, suffix) =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name)
		if (entry.isDirectory()) return walk(path, suffix)
		return entry.name.endsWith(suffix) ? [path] : []
	})

const normalizePath = (path) =>
	`/${path}`
		.replace(/\/+/g, '/')
		.replace(/:[^/]+/g, ':param')
		.replace(/\/$/, '') || '/'

const controllerContracts = (directory) => {
	const contracts = new Set()
	for (const file of walk(directory, '.controller.ts')) {
		const source = readFileSync(file, 'utf8')
		const prefix =
			source.match(/@Controller\(\s*['"]([^'"]*)['"]\s*\)/)?.[1] || ''
		for (const match of source.matchAll(
			/@(Get|Post|Put|Patch|Delete)\(\s*['"]([^'"]*)['"]\s*\)/g
		)) {
			contracts.add(
				`${match[1].toUpperCase()} ${normalizePath(`${prefix}/${match[2]}`)}`
			)
		}
	}
	return contracts
}

const requiredRoutes = new Set([
	'GET /interview/analysis/report/:param',
	'GET /user/consumption-records',
	'GET /user/info',
	'GET /wechat/check-qr-status',
	'GET /wechat/get-menu',
	'POST /interview/analyze-resume',
	'POST /interview/continue-conversation',
	'POST /interview/exchange-package',
	'POST /interview/mock/answer',
	'POST /interview/mock/end/:param',
	'POST /interview/mock/pause/:param',
	'POST /interview/mock/resume/:param',
	'POST /interview/mock/start',
	'POST /interview/resume/quiz/stream',
	'POST /payment/order',
	'POST /payment/order/status',
	'POST /user/login',
	'POST /user/register',
	'POST /wechat/create-menu',
	'POST /wechat/delete-menu',
	'POST /wechat/qrcode',
	'POST /wechat/validateToken',
	'PUT /user/profile'
])

const requiredMcpTools = new Set([
	'get_analysis_report',
	'get_current_user_info',
	'get_resume_quiz_history',
	'get_resume_quiz_result_detail',
	'get_user_consumption_records'
])

const requiredMetrics = new Set([
	'ai_call_duration_ms',
	'ai_calls_total',
	'ai_cost_total',
	'ai_tokens_used_total',
	'db_active_connections',
	'db_query_duration_ms',
	'errors_total',
	'http_request_duration_ms',
	'http_requests_total',
	'interviews_completed_total',
	'online_users',
	'virtual_coin_spent_total'
])

const currentRoutes = controllerContracts('server/src')
const currentTools = new Set(
	[
		...readFileSync('apps/mcp/src/index.ts', 'utf8').matchAll(
			/registerTool\(\s*['"]([^'"]+)['"]/g
		)
	].map((match) => match[1])
)
const currentMetrics = new Set(
	[
		...readFileSync(
			'server/src/common/metrics/metrics.service.ts',
			'utf8'
		).matchAll(/name:\s*['"]([^'"]+)['"]/g)
	].map((match) => match[1])
)

const requiredSnippets = [
	['server/src/user/schemas/user.schema.ts', 'processedOrders'],
	[
		'server/src/payment/schemas/payment-record.schema.ts',
		'notificationPayload'
	],
	['server/src/payment/schemas/payment-record.schema.ts', 'amount!: number'],
	['server/src/payment/schemas/user-transaction.schema.ts', 'relatedOrderId'],
	['server/src/payment/schemas/user-transaction.schema.ts', 'userIdentifier'],
	['docker-compose.yml', 'node-exporter']
]
const forbiddenSnippets = [
	['server/src/user/schemas/user.schema.ts', 'paymentGrantKeys'],
	['server/src/payment/schemas/payment-record.schema.ts', 'amountFen'],
	['server/src/payment/schemas/payment-record.schema.ts', 'benefitSnapshot'],
	['server/src/payment/schemas/payment-record.schema.ts', 'providerData'],
	['server/src/payment/schemas/user-transaction.schema.ts', 'transactionKey'],
	['server/src/payment/schemas/user-transaction.schema.ts', 'externalOrderId'],
	['apps/mcp/src/api.ts', 'WWZHIDAO_']
]

const failures = [
	...[...requiredRoutes]
		.filter((route) => !currentRoutes.has(route))
		.map((route) => `route ${route}`),
	...[...requiredMcpTools]
		.filter((tool) => !currentTools.has(tool))
		.map((tool) => `MCP tool ${tool}`),
	...[...requiredMetrics]
		.filter((metric) => !currentMetrics.has(metric))
		.map((metric) => `metric ${metric}`),
	...requiredSnippets
		.filter(
			([file, snippet]) =>
				!existsSync(file) || !readFileSync(file, 'utf8').includes(snippet)
		)
		.map(([file, snippet]) => `${file}: ${snippet}`),
	...forbiddenSnippets
		.filter(
			([file, snippet]) =>
				existsSync(file) && readFileSync(file, 'utf8').includes(snippet)
		)
		.map(([file, snippet]) => `duplicate field ${file}: ${snippet}`)
]

console.log(
	`Required routes: ${requiredRoutes.size}; current routes: ${currentRoutes.size}`
)
console.log(
	`Required MCP tools: ${requiredMcpTools.size}; current MCP tools: ${currentTools.size}`
)
console.log(
	`Required metrics: ${requiredMetrics.size}; current metrics: ${currentMetrics.size}`
)
if (failures.length) {
	for (const failure of failures) console.error(`Missing ${failure}`)
	process.exitCode = 1
} else {
	console.log('Capability coverage audit: passed')
}
