import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const apiDirectory = new URL('../apps/web/app/api/', import.meta.url)
const serverDirectory = new URL('../server/src/', import.meta.url)

const plannedGaps = new Set()

const walk = (directory, suffix) =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name)
		if (entry.isDirectory()) return walk(path, suffix)
		return entry.name.endsWith(suffix) ? [path] : []
	})

const normalizePath = (path) => {
	const withoutQuery = path.split('?')[0]
	return (`/${withoutQuery}`)
		.replace(/\/+/g, '/')
		.replace(/\$\{[^}]+\}/g, ':param')
		.replace(/:[^/]+/g, ':param')
		.replace(/\/$/, '') || '/'
}

const frontendContracts = new Set()
for (const file of walk(apiDirectory.pathname, '.js')) {
	const source = readFileSync(file, 'utf8')
	const callPattern = /(?:\$api|ssePost)\(\s*([`'"])(.*?)\1\s*,?([\s\S]*?)(?=\n\s*\}\)|\n\s*return|\n\s*export|$)/g
	for (const match of source.matchAll(callPattern)) {
		const options = match[3] || ''
		const methodMatch = options.match(/method\s*:\s*['"]([a-z]+)['"]/i)
		const method = (methodMatch?.[1] || (match[0].startsWith('ssePost') ? 'POST' : 'GET')).toUpperCase()
		frontendContracts.add(`${method} ${normalizePath(match[2])}`)
	}
}

const backendContracts = new Set()
for (const file of walk(serverDirectory.pathname, '.controller.ts')) {
	const source = readFileSync(file, 'utf8')
	const prefix = source.match(/@Controller\(\s*['"]([^'"]*)['"]\s*\)/)?.[1] || ''
	for (const match of source.matchAll(/@(Get|Post|Put|Patch|Delete)\(\s*['"]([^'"]*)['"]\s*\)/g)) {
		backendContracts.add(`${match[1].toUpperCase()} ${normalizePath(`${prefix}/${match[2]}`)}`)
	}
}

const missing = [...frontendContracts].filter((contract) => !backendContracts.has(contract))
const undocumented = missing.filter((contract) => !plannedGaps.has(contract))
const stalePlan = [...plannedGaps].filter((contract) => !missing.includes(contract))

console.log(`Frontend contracts: ${frontendContracts.size}`)
console.log(`Backend contracts: ${backendContracts.size}`)
console.log(`Registered implementation gaps: ${missing.length}`)
for (const contract of missing) console.log(`  - ${contract}`)

if (undocumented.length > 0 || stalePlan.length > 0) {
	if (undocumented.length > 0) {
		console.error('Unregistered frontend contracts:')
		for (const contract of undocumented) console.error(`  - ${contract}`)
	}
	if (stalePlan.length > 0) {
		console.error('Stale planned gaps (remove after implementation):')
		for (const contract of stalePlan) console.error(`  - ${contract}`)
	}
	process.exitCode = 1
}
