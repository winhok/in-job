<template>
	<div class="flex flex-col items-center justify-center py-4 space-y-4">
		<!-- 音浪动画区域 -->
		<div class="relative flex items-center justify-center w-full">
			<div v-if="listening" class="flex items-end justify-center gap-1 h-16">
				<span class="bar" v-for="n in 24" :key="n" :style="barStyle(n)"></span>
			</div>
			<div
				v-else
				class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center"
			>
				<UIcon name="i-heroicons-microphone" class="w-10 h-10 text-gray-400" />
			</div>
		</div>

		<!-- 状态与操作提示 -->
		<div class="text-center space-y-3 mt-8">
			<h3
				class="text-xl font-medium transition-colors duration-300"
				:class="listening ? 'text-rose-600' : 'text-neutral-900'"
			>
				{{ listening ? '正在聆听...' : '准备就绪' }}
			</h3>
			<p class="text-sm text-neutral-500">
				^_^语音输入可能有误差，可稍后核对。<br />AI面试官也会自动纠错，请放心^_^
			</p>
			<p class="text-sm text-neutral-500" v-if="!autoStart">
				<span v-if="!listening">按下 <UKbd>Space</UKbd> 键开始语音输入</span>
				<span v-else>按下 <UKbd>Space</UKbd> 键暂停输入</span>
			</p>
		</div>

		<!-- 底部确认提示 -->
		<div
			class="flex items-center gap-2 text-sm text-neutral-500 bg-gray-50 px-6 py-3 rounded-full border border-gray-100"
		>
			<UIcon
				name="i-heroicons-paper-airplane"
				class="w-4 h-4 text-primary-500"
			/>
			<span>语音输入完成，按 <UKbd>Enter</UKbd> 键即可发送</span>
		</div>
	</div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { SpeechRecognitionOptimizer } from '@/utils/speechRecognitionOptimizer'

const props = defineProps({
	initialText: {
		type: String,
		default: ''
	},
	autoStart: {
		type: Boolean,
		default: false
	},
	onConfirm: {
		type: Function,
		required: true
	},
	onRealtimeUpdate: {
		type: Function,
		default: () => {}
	},
	// 新增：职业类型，用于优化器
	profession: {
		type: String,
		default: 'programmer' // programmer, designer, pm, general
	},
	// 新增：上下文类型
	context: {
		type: String,
		default: 'interview' // interview, general, tech
	}
})

const transcript = ref(props.initialText || '')
const listening = ref(false)
const recognitionRef = ref(null)
const lastFinalTime = ref(0) // 记录上次 final 结果的时间
const sessionTranscript = ref('') // 当前会话的临时文本
const lastProcessedIndex = ref(0) // 记录已处理的结果索引，避免重复处理

// 创建语音识别优化器实例
const optimizer = new SpeechRecognitionOptimizer({
	context: props.context,
	profession: props.profession,
	maxHistoryLength: 10
})

const getSR = () => {
	if (typeof window === 'undefined') return null
	return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

// 注意：文本优化功能已迁移到 @/utils/speechRecognitionOptimizer.js
// 现在使用优化器实例进行所有文本处理

const initRecognition = () => {
	const SR = getSR()
	if (!SR) return
	const rec = new SR()

	// 优化识别参数
	rec.lang = 'zh-CN' // 中文识别
	rec.continuous = true // 持续识别
	rec.interimResults = true // 返回临时结果
	rec.maxAlternatives = 1 // 只获取最佳结果

	rec.onstart = () => {
		listening.value = true
		sessionTranscript.value = '' // 重置会话文本
		lastFinalTime.value = Date.now()
		lastProcessedIndex.value = 0 // 重置处理索引
		optimizer.clearHistory() // 清除优化器历史记录，开始新会话
	}

	rec.onend = () => {
		listening.value = false
	}

	rec.onerror = (event) => {
		console.error('语音识别错误:', event.error)
		listening.value = false
	}

	rec.onresult = (event) => {
		// 只处理新的结果，避免重复处理
		// event.results 是累积的，包含从开始到现在的所有结果
		// 我们只需要处理 lastProcessedIndex 之后的新结果

		let interimText = '' // 临时的中间结果

		for (let i = lastProcessedIndex.value; i < event.results.length; ++i) {
			const result = event.results[i]
			const text = result[0].transcript

			if (result.isFinal) {
				// 这是一个最终确定的结果
				// 计算距离上次 final 结果的时间间隔
				const now = Date.now()
				const timeSinceLastFinal = now - lastFinalTime.value
				lastFinalTime.value = now

				// 使用优化器进行文本处理
				// 优化器会自动处理：
				// 1. 移除口语化词汇
				// 2. 同音字纠错
				// 3. 技术词汇识别
				// 4. 上下文感知优化
				// 5. 智能标点符号
				const processedText = optimizer.optimize(text, {
					addPunctuation: true,
					timeSinceLastFinal
				})

				// 追加到会话文本
				sessionTranscript.value += processedText

				// 更新已处理的索引（final 结果已处理）
				lastProcessedIndex.value = i + 1

				// 更新最终的 transcript
				transcript.value = props.initialText + sessionTranscript.value

				// 实时更新到父组件
				props.onRealtimeUpdate(transcript.value)
			} else {
				// interim 结果（临时的、未确定的结果）
				// 用于实时预览，但不保存
				interimText += text
			}
		}

		// 如果有 interim 结果，也实时展示（但不保存）
		if (interimText) {
			// 对 interim 结果也进行优化（不添加标点）
			const optimizedInterim = optimizer.optimize(interimText, {
				addPunctuation: false
			})

			const tempText =
				props.initialText + sessionTranscript.value + optimizedInterim
			props.onRealtimeUpdate(tempText)
		}
	}

	recognitionRef.value = rec
}

const start = () => {
	if (!recognitionRef.value) initRecognition() // 确保初始化
	if (!recognitionRef.value) return
	try {
		// 重置会话状态
		sessionTranscript.value = ''
		lastFinalTime.value = Date.now()
		lastProcessedIndex.value = 0 // 重置处理索引
		optimizer.clearHistory() // 清除优化器历史记录
		recognitionRef.value.start()
	} catch (e) {
		console.warn('语音识别启动失败:', e)
	}
}

const stop = () => {
	if (!recognitionRef.value) return
	try {
		recognitionRef.value.stop()
	} catch {}
}

const toggleListening = () => {
	if (listening.value) stop()
	else start()
}

const handleKeydown = (e) => {
	// 如果是自动开始模式（PTT），则不处理空格键，交由外部处理松开事件
	if (props.autoStart && e.code === 'Space') return

	if (e.code === 'Space') {
		e.preventDefault() // 防止页面滚动
		toggleListening()
	} else if (e.code === 'Enter') {
		e.preventDefault()
		if (transcript.value.trim()) {
			stop()
			props.onConfirm()
		}
	}
}

// 监听职业类型变化，动态更新优化器
watch(
	() => props.profession,
	(newProfession) => {
		if (newProfession) {
			optimizer.setProfession(newProfession)
		}
	}
)

// 监听上下文类型变化，动态更新优化器
watch(
	() => props.context,
	(newContext) => {
		if (newContext) {
			optimizer.setContext(newContext)
		}
	}
)

onMounted(() => {
	initRecognition()
	window.addEventListener('keydown', handleKeydown)
	if (props.autoStart) {
		start()
	}
})

onBeforeUnmount(() => {
	stop()
	window.removeEventListener('keydown', handleKeydown)
})

const barStyle = (n) => {
	const delay = (n % 6) * 0.12
	const height = 6 + (n % 5) * 2
	return {
		animationDelay: `${delay}s`,
		height: `${height}px`
	}
}
</script>

<style scoped>
.bar {
	width: 4px;
	background: rgb(244 63 94); /* rose-500 */
	border-radius: 2px;
	animation: wave 0.9s infinite ease-in-out;
}
@keyframes wave {
	0% {
		transform: scaleY(0.6);
		opacity: 0.6;
	}
	50% {
		transform: scaleY(1.8);
		opacity: 1;
	}
	100% {
		transform: scaleY(0.6);
		opacity: 0.6;
	}
}
</style>
