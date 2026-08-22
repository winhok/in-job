/**
 * 语音识别优化器使用示例
 *
 * 这个文件展示了如何使用 speechRecognitionOptimizer
 * 包含各种使用场景和最佳实践
 */

import {
	SpeechRecognitionOptimizer,
	optimizeText
} from './speechRecognitionOptimizer'
import {
	getOptimizerConfigByProfession,
	getAllCustomVocabulary
} from '@/config/speechRecognitionConfig'

// ==================== 示例 1: 基础使用 ====================

export function example1_basicUsage() {
	console.log('=== 示例 1: 基础使用 ===')

	// 创建优化器实例
	const optimizer = new SpeechRecognitionOptimizer({
		context: 'interview',
		profession: 'programmer'
	})

	// 优化文本
	const rawText = '我熟悉皮埃奇皮和杰斯嗯嗯还有瑞阿克特'
	const optimized = optimizer.optimize(rawText)

	console.log('原始文本:', rawText)
	console.log('优化后:', optimized)
	// 输出: "我熟悉PHP和JS，还有React"
}

// ==================== 示例 2: 使用上下文优化 ====================

export function example2_contextAware() {
	console.log('=== 示例 2: 上下文感知优化 ===')

	const optimizer = new SpeechRecognitionOptimizer({
		context: 'interview',
		profession: 'programmer'
	})

	// 模拟连续的语音识别
	const texts = [
		'我之前做过一个电商项目',
		'用的是维优易和杰斯',
		'它的性能很好', // "它"可能指 Vue 或 JS
		'用户反馈也不错'
	]

	texts.forEach((text) => {
		const optimized = optimizer.optimize(text)
		console.log('原始:', text)
		console.log('优化:', optimized)
		console.log('---')
	})

	// 查看历史记录
	console.log('历史记录:', optimizer.getHistory())
}

// ==================== 示例 3: 智能标点符号 ====================

export function example3_smartPunctuation() {
	console.log('=== 示例 3: 智能标点符号 ===')

	const optimizer = new SpeechRecognitionOptimizer()

	// 测试不同类型的句子
	const testCases = [
		{ text: '你做过什么项目吗', expected: '你做过什么项目吗？' },
		{ text: '我熟悉前端开发', expected: '我熟悉前端开发。' },
		{ text: '我用过Vue', timeSince: 2000, expected: '我用过Vue。' },
		{ text: '还有React', timeSince: 500, expected: '还有React，' }
	]

	testCases.forEach(({ text, timeSince = 1000, expected }) => {
		const optimized = optimizer.optimize(text, {
			addPunctuation: true,
			timeSinceLastFinal: timeSince
		})
		console.log(`输入: "${text}"`)
		console.log(`期望: "${expected}"`)
		console.log(`结果: "${optimized}"`)
		console.log(`✓ ${optimized === expected ? '通过' : '未通过'}`)
		console.log('---')
	})
}

// ==================== 示例 4: 同音字纠错 ====================

export function example4_homophones() {
	console.log('=== 示例 4: 同音字纠错 ===')

	const optimizer = new SpeechRecognitionOptimizer()

	const testCases = [
		{ raw: '我写了一些带吗', corrected: '我写了一些代码' },
		{ raw: '需要倒入这个模块', corrected: '需要导入这个模块' },
		{ raw: '这个函素很复杂', corrected: '这个函数很复杂' },
		{ raw: '调用这个街口', corrected: '调用这个接口' },
		{ raw: '连接数剧库', corrected: '连接数据库' }
	]

	testCases.forEach(({ raw, corrected }) => {
		const optimized = optimizer.optimize(raw, { addPunctuation: false })
		console.log(`原始: "${raw}"`)
		console.log(`期望: "${corrected}"`)
		console.log(`结果: "${optimized}"`)
		console.log(`✓ ${optimized === corrected ? '通过' : '待优化'}`)
		console.log('---')
	})
}

// ==================== 示例 5: 技术词汇识别 ====================

export function example5_techVocabulary() {
	console.log('=== 示例 5: 技术词汇识别 ===')

	const optimizer = new SpeechRecognitionOptimizer({
		profession: 'programmer'
	})

	const testCases = [
		'我会用皮埃奇皮开发后端',
		'前端用的是维优易和瑞阿克特',
		'数据库是麦艾斯扣欧和瑞迪斯',
		'还用过道克和库伯内踢死',
		'熟悉艾皮爱开发和瑞斯特福设计'
	]

	testCases.forEach((text) => {
		const optimized = optimizer.optimize(text, { addPunctuation: false })
		console.log('原始:', text)
		console.log('优化:', optimized)
		console.log('---')
	})
}

// ==================== 示例 6: 不同职业的优化 ====================

export function example6_professionSpecific() {
	console.log('=== 示例 6: 不同职业的优化 ===')

	const professions = ['programmer', 'designer', 'pm']
	const texts = {
		programmer: '我用杰斯和瑞阿克特开发了一个网站',
		designer: '我设计了原形图和交互稿',
		pm: '我做了需求分析和竞品分析'
	}

	professions.forEach((profession) => {
		const config = getOptimizerConfigByProfession(profession)
		const optimizer = new SpeechRecognitionOptimizer(config)

		// 添加自定义词汇
		if (config.customVocabulary) {
			optimizer.addCustomVocabulary(config.customVocabulary)
		}

		const text = texts[profession]
		const optimized = optimizer.optimize(text)

		console.log(`职业: ${profession}`)
		console.log(`原始: ${text}`)
		console.log(`优化: ${optimized}`)
		console.log('---')
	})
}

// ==================== 示例 7: 添加自定义词汇 ====================

export function example7_customVocabulary() {
	console.log('=== 示例 7: 添加自定义词汇 ===')

	const optimizer = new SpeechRecognitionOptimizer()

	// 添加公司/项目特定词汇
	optimizer.addCustomVocabulary({
		面试网: '面试汪',
		简历网: '简历汪',
		阿里妈妈: '阿里妈妈',
		字节跳动: '字节跳动'
	})

	const text = '我在面试网上做过测试'
	const optimized = optimizer.optimize(text)

	console.log('原始:', text)
	console.log('优化:', optimized)
}

// ==================== 示例 8: 批量处理 ====================

export function example8_batchProcessing() {
	console.log('=== 示例 8: 批量处理 ===')

	const optimizer = new SpeechRecognitionOptimizer({
		profession: 'programmer'
	})

	const texts = [
		'我熟悉前端开发',
		'用过维优易和瑞阿克特',
		'后端会用诺德杰斯',
		'数据库用麦艾斯扣欧'
	]

	const optimized = optimizer.optimizeBatch(texts)

	console.log('原始文本:')
	texts.forEach((text, i) => console.log(`${i + 1}. ${text}`))

	console.log('\n优化后:')
	optimized.forEach((text, i) => console.log(`${i + 1}. ${text}`))
}

// ==================== 示例 9: 实时面试场景 ====================

export function example9_realTimeInterview() {
	console.log('=== 示例 9: 实时面试场景 ===')

	const optimizer = new SpeechRecognitionOptimizer({
		context: 'interview',
		profession: 'programmer'
	})

	// 模拟面试对话
	const conversation = [
		{ role: 'interviewer', text: '请介绍一下你的项目经验吗' },
		{ role: 'candidate', text: '我做过一个电商网站嗯嗯用的是维优易' },
		{ role: 'interviewer', text: '你在项目中负责什么' },
		{ role: 'candidate', text: '我负责前端开发啊还有一些艾皮爱对接' },
		{ role: 'interviewer', text: '遇到过什么技术难点呢' },
		{ role: 'candidate', text: '主要是性能优化的问题呃还有就是兼容性' }
	]

	console.log('面试对话:')
	conversation.forEach(({ role, text }) => {
		// 只优化候选人的回答
		if (role === 'candidate') {
			const optimized = optimizer.optimize(text)
			console.log(`[候选人原始] ${text}`)
			console.log(`[候选人优化] ${optimized}`)
		} else {
			console.log(`[面试官] ${text}`)
		}
		console.log()
	})
}

// ==================== 示例 10: 使用快捷函数 ====================

export function example10_helperFunctions() {
	console.log('=== 示例 10: 使用快捷函数 ===')

	// 使用全局优化函数（单例模式）
	const text1 = '我会用杰斯和维优易'
	const optimized1 = optimizeText(text1)

	console.log('快速优化:')
	console.log('原始:', text1)
	console.log('优化:', optimized1)
	console.log()

	// 再次调用会使用同一个优化器实例，保留历史记录
	const text2 = '它们都很好用'
	const optimized2 = optimizeText(text2)

	console.log('第二次优化（有上下文）:')
	console.log('原始:', text2)
	console.log('优化:', optimized2)
}

// ==================== 运行所有示例 ====================

export function runAllExamples() {
	console.log('========================================')
	console.log('语音识别优化器 - 使用示例')
	console.log('========================================\n')

	example1_basicUsage()
	console.log('\n')

	example2_contextAware()
	console.log('\n')

	example3_smartPunctuation()
	console.log('\n')

	example4_homophones()
	console.log('\n')

	example5_techVocabulary()
	console.log('\n')

	example6_professionSpecific()
	console.log('\n')

	example7_customVocabulary()
	console.log('\n')

	example8_batchProcessing()
	console.log('\n')

	example9_realTimeInterview()
	console.log('\n')

	example10_helperFunctions()

	console.log('\n========================================')
	console.log('所有示例运行完成！')
	console.log('========================================')
}

// 在浏览器控制台中运行示例
if (typeof window !== 'undefined') {
	window.runSpeechOptimizerExamples = runAllExamples
	console.log('💡 提示: 在控制台输入 runSpeechOptimizerExamples() 运行所有示例')
}

export default {
	example1_basicUsage,
	example2_contextAware,
	example3_smartPunctuation,
	example4_homophones,
	example5_techVocabulary,
	example6_professionSpecific,
	example7_customVocabulary,
	example8_batchProcessing,
	example9_realTimeInterview,
	example10_helperFunctions,
	runAllExamples
}
