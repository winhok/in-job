<!--
  语音识别优化器测试页面
  
  用途：
  1. 测试优化器的各种功能
  2. 调试优化效果
  3. 查看词典和规则
  
  访问：/test-speech-optimizer
-->

<template>
	<div class="min-h-screen bg-gray-50 py-8">
		<div class="max-w-4xl mx-auto px-4">
			<!-- 标题 -->
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">
					语音识别优化器测试
				</h1>
				<p class="text-gray-600">
					测试和调试语音识别文本优化功能
				</p>
			</div>

			<!-- 配置选项 -->
			<UCard class="mb-6">
				<template #header>
					<h2 class="text-lg font-semibold">配置选项</h2>
				</template>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<!-- 职业类型 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							职业类型
						</label>
						<select 
							v-model="profession" 
							class="w-full px-3 py-2 border border-gray-300 rounded-lg"
							@change="updateOptimizer"
						>
							<option value="programmer">程序员</option>
							<option value="designer">设计师</option>
							<option value="pm">产品经理</option>
							<option value="general">通用</option>
						</select>
					</div>

					<!-- 上下文类型 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							上下文类型
						</label>
						<select 
							v-model="context" 
							class="w-full px-3 py-2 border border-gray-300 rounded-lg"
							@change="updateOptimizer"
						>
							<option value="interview">面试</option>
							<option value="tech">技术讨论</option>
							<option value="general">通用</option>
						</select>
					</div>

					<!-- 添加标点 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							停顿时间（毫秒）
						</label>
						<input 
							v-model.number="timeSinceLastFinal" 
							type="number"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg"
							placeholder="1000"
						/>
					</div>
				</div>

				<div class="mt-4 flex items-center">
					<input
						id="addPunctuation"
						v-model="addPunctuation"
						type="checkbox"
						class="h-4 w-4 text-primary-600 rounded"
					/>
					<label for="addPunctuation" class="ml-2 text-sm text-gray-700">
						自动添加标点符号
					</label>
				</div>
			</UCard>

			<!-- 输入测试 -->
			<UCard class="mb-6">
				<template #header>
					<h2 class="text-lg font-semibold">文本测试</h2>
				</template>

				<div class="space-y-4">
					<!-- 输入框 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							输入原始文本（模拟语音识别结果）
						</label>
						<textarea
							v-model="inputText"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
							rows="3"
							placeholder="例如：我熟悉皮埃奇皮和杰斯嗯嗯还有瑞阿克特"
						></textarea>
					</div>

					<!-- 操作按钮 -->
					<div class="flex gap-2">
						<UButton @click="optimizeText" color="primary">
							优化文本
						</UButton>
						<UButton @click="clearHistory" variant="outline">
							清除历史
						</UButton>
						<UButton @click="useExample" variant="outline">
							加载示例
						</UButton>
					</div>

					<!-- 输出框 -->
					<div v-if="outputText">
						<label class="block text-sm font-medium text-gray-700 mb-2">
							优化后的文本
						</label>
						<div class="bg-green-50 border border-green-200 rounded-lg p-3">
							<p class="text-green-900">{{ outputText }}</p>
						</div>
					</div>

					<!-- 差异对比 -->
					<div v-if="outputText && inputText !== outputText" class="mt-4">
						<label class="block text-sm font-medium text-gray-700 mb-2">
							变化详情
						</label>
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
							<div class="space-y-1">
								<p><strong>原始长度：</strong>{{ inputText.length }} 字符</p>
								<p><strong>优化长度：</strong>{{ outputText.length }} 字符</p>
								<p><strong>变化：</strong>{{ getChanges() }}</p>
							</div>
						</div>
					</div>
				</div>
			</UCard>

			<!-- 批量测试 -->
			<UCard class="mb-6">
				<template #header>
					<h2 class="text-lg font-semibold">批量测试</h2>
				</template>

				<div class="space-y-4">
					<UButton @click="runBatchTest" color="primary">
						运行批量测试
					</UButton>

					<div v-if="batchResults.length > 0" class="space-y-2">
						<div
							v-for="(result, index) in batchResults"
							:key="index"
							class="bg-gray-50 border border-gray-200 rounded-lg p-3"
						>
							<p class="text-sm text-gray-600">
								<strong>原始：</strong>{{ result.input }}
							</p>
							<p class="text-sm text-green-700 mt-1">
								<strong>优化：</strong>{{ result.output }}
							</p>
						</div>
					</div>
				</div>
			</UCard>

			<!-- 历史记录 -->
			<UCard class="mb-6">
				<template #header>
					<h2 class="text-lg font-semibold">优化历史记录</h2>
				</template>

				<div v-if="history.length > 0" class="space-y-2">
					<div
						v-for="(item, index) in history"
						:key="index"
						class="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
					>
						<span class="text-gray-600">{{ index + 1 }}.</span>
						{{ item }}
					</div>
				</div>
				<div v-else class="text-gray-500 text-sm">
					暂无历史记录
				</div>
			</UCard>

			<!-- 词典预览 -->
			<UCard>
				<template #header>
					<h2 class="text-lg font-semibold">词典预览</h2>
				</template>

				<div class="space-y-4">
					<div>
						<h3 class="text-sm font-medium text-gray-700 mb-2">
							技术词汇（部分）
						</h3>
						<div class="bg-gray-50 rounded-lg p-3 text-sm">
							<div class="grid grid-cols-2 gap-2">
								<div v-for="(value, key) in techVocabularySample" :key="key">
									<span class="text-gray-600">{{ key }}</span>
									<span class="mx-2">→</span>
									<span class="text-primary-600 font-medium">{{ value }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</UCard>
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SpeechRecognitionOptimizer } from '@/utils/speechRecognitionOptimizer'
import { TECH_VOCABULARY } from '@/utils/speechRecognitionOptimizer'
import { getOptimizerConfigByProfession } from '@/config/speechRecognitionConfig'

// 配置
const profession = ref('programmer')
const context = ref('interview')
const addPunctuation = ref(true)
const timeSinceLastFinal = ref(1000)

// 测试数据
const inputText = ref('')
const outputText = ref('')
const batchResults = ref([])
const history = ref([])

// 优化器实例
let optimizer = null

// 初始化优化器
const initOptimizer = () => {
	const config = getOptimizerConfigByProfession(profession.value)
	optimizer = new SpeechRecognitionOptimizer({
		...config,
		context: context.value
	})
	
	// 添加自定义词汇
	if (config.customVocabulary) {
		optimizer.addCustomVocabulary(config.customVocabulary)
	}
	
	// 更新历史记录
	history.value = optimizer.getHistory()
}

// 初始化
initOptimizer()

// 更新优化器
const updateOptimizer = () => {
	initOptimizer()
}

// 优化文本
const optimizeText = () => {
	if (!inputText.value.trim()) {
		alert('请输入测试文本')
		return
	}
	
	outputText.value = optimizer.optimize(inputText.value, {
		addPunctuation: addPunctuation.value,
		timeSinceLastFinal: timeSinceLastFinal.value
	})
	
	history.value = optimizer.getHistory()
}

// 清除历史
const clearHistory = () => {
	optimizer.clearHistory()
	history.value = []
	outputText.value = ''
}

// 加载示例
const useExample = () => {
	const examples = {
		programmer: '我熟悉皮埃奇皮和杰斯嗯嗯还有瑞阿克特啊',
		designer: '我设计了原形图和交互稿呃还有视觉稿',
		pm: '我做了需求分析啊和竞品分析嗯嗯还有虚求文档'
	}
	
	inputText.value = examples[profession.value] || examples.programmer
}

// 批量测试
const runBatchTest = () => {
	const testCases = [
		'我熟悉皮埃奇皮和杰斯',
		'用过维优易和瑞阿克特',
		'后端会用诺德杰斯嗯嗯',
		'数据库用麦艾斯扣欧和瑞迪斯啊',
		'还会用道克和居特',
		'这个函素很复杂呃',
		'需要倒入这个模块',
		'调用这个街口',
		'写了一些带吗',
		'连接数剧库'
	]
	
	batchResults.value = testCases.map(input => ({
		input,
		output: optimizer.optimize(input, {
			addPunctuation: addPunctuation.value,
			timeSinceLastFinal: timeSinceLastFinal.value
		})
	}))
}

// 获取变化描述
const getChanges = () => {
	const changes = []
	
	if (inputText.value.includes('嗯') || inputText.value.includes('啊') || inputText.value.includes('呃')) {
		changes.push('移除了口语化词汇')
	}
	
	const techWords = ['皮埃奇皮', '杰斯', '维优易', '瑞阿克特']
	if (techWords.some(word => inputText.value.includes(word))) {
		changes.push('识别了技术词汇')
	}
	
	if (outputText.value.includes('。') || outputText.value.includes('，') || outputText.value.includes('？')) {
		changes.push('添加了标点符号')
	}
	
	return changes.join('、') || '无明显变化'
}

// 技术词汇示例（取前10个）
const techVocabularySample = computed(() => {
	const entries = Object.entries(TECH_VOCABULARY).slice(0, 10)
	return Object.fromEntries(entries)
})

// SEO 配置（仅开发环境）
if (process.dev) {
	useSEO({
		title: '语音识别优化器测试',
		description: '测试和调试语音识别文本优化功能',
		noIndex: true
	})
}
</script>

<style scoped>
/* 自定义样式 */
textarea {
	font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
}
</style>

