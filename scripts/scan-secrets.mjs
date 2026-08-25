import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const skippedDirectories = new Set([
	'.git', '.nuxt', '.output', '.pnpm-store', 'node_modules', 'vendor'
])
const skippedExtensions = new Set([
	'.jpg', '.jpeg', '.png', '.gif', '.ico', '.pdf', '.tgz', '.woff', '.woff2'
])
const sensitiveKeys = [
	'JWT_SECRET', 'DEEPSEEK_API_KEY', 'OPENAI_API_KEY', 'EMBEDDING_API_KEY',
	'QDRANT_API_KEY', 'DINGTALK_SECRET', 'DINGTALK_WEBHOOK_URL',
	'ALERT_RELAY_TOKEN', 'ALIYUN_ACCESS_KEY_SECRET', 'ALIPAY_PRIVATE_KEY',
	'WECHAT_PAY_PRIVATE_KEY', 'WECHAT_PAY_API_V3_KEY'
]
const placeholder = /^(?:|x+|test(?:-|_)?\w*|replace[-\w]*|example|changeme|\$\{?.+\}?)$/i

const files = []
const walk = async (directory) => {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (entry.name === 'pnpm-lock.yaml') continue
		if (entry.name.startsWith('.env') && !entry.name.endsWith('.example')) {
			continue
		}
		const path = join(directory, entry.name)
		if (entry.isDirectory()) {
			if (!skippedDirectories.has(entry.name)) await walk(path)
		} else if (!skippedExtensions.has(extname(entry.name).toLowerCase())) {
			files.push(path)
		}
	}
}
await walk(root)

const findings = []
for (const file of files) {
	let source
	try {
		source = await readFile(file, 'utf8')
	} catch {
		continue
	}
	if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) {
		findings.push(`${relative(root, file)}: private key block`)
	}
	if (/(?:sk-|AKIA)[A-Za-z0-9_-]{20,}/.test(source)) {
		findings.push(`${relative(root, file)}: credential-shaped token`)
	}
	for (const line of source.split(/\r?\n/)) {
		const match = line.match(/^([A-Z][A-Z0-9_]+)=(.*)$/)
		if (!match || !sensitiveKeys.includes(match[1])) continue
		const value = match[2].trim()
		if (!placeholder.test(value)) {
			findings.push(`${relative(root, file)}: non-placeholder ${match[1]}`)
		}
	}
}

if (findings.length) {
	console.error(findings.join('\n'))
	process.exit(1)
}
console.log(`secret scan passed: ${files.length} text files checked; no committed credential-shaped values found`)
