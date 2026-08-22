<template>
	<div
		class="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-0 relative"
	>
		<!-- 语音播报开关 -->
		<div v-if="speechSupported" class="absolute top-4 right-4 z-10">
			<UButton
				:color="speechEnabled ? 'primary' : 'error'"
				:variant="speechEnabled ? 'soft' : 'ghost'"
				size="xs"
				:icon="
					speechEnabled
						? speechSpeaking
							? 'i-heroicons-speaker-wave'
							: 'i-heroicons-speaker-x-mark'
						: 'i-heroicons-speaker-x-mark'
				"
				@click="toggleSpeech()"
				:ui="{ rounded: 'rounded-lg' }"
			>
				{{ speechEnabled ? '语音播报已开启' : '语音播报已关闭' }}
			</UButton>
		</div>

		<!-- 对话消息列表 -->
		<div
			ref="messagesContainerRef"
			class="flex-1 overflow-y-auto p-6 space-y-4 pt-16"
		>
			<div
				v-if="interviewStore.messages.length === 0"
				class="flex items-center justify-center h-full"
			>
				<div class="text-center">
					<UIcon
						name="i-heroicons-chat-bubble-left-right"
						class="w-16 h-16 text-gray-300 mx-auto mb-4"
					/>
					<p class="text-neutral-500">面试即将开始...</p>
				</div>
			</div>

			<div
				v-for="(message, index) in interviewStore.messages"
				:key="index"
				:class="[
					'flex gap-4',
					message.role === 'candidate' ? 'flex-row-reverse' : 'flex-row'
				]"
			>
				<!-- 头像 -->
				<div
					class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
					:class="
						message.role === 'candidate'
							? 'bg-primary-100'
							: 'bg-linear-to-br from-indigo-500 to-purple-600 shadow-sm'
					"
				>
					<UIcon
						v-if="message.role === 'candidate'"
						name="i-heroicons-user"
						class="w-6 h-6 text-primary-600"
					/>
					<UIcon
						v-else
						name="i-heroicons-sparkles"
						class="w-6 h-6 text-white"
					/>
				</div>

				<!-- 消息气泡 -->
				<div
					:class="[
						'max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed',
						message.role === 'candidate'
							? 'bg-primary-600 text-white rounded-tr-none'
							: 'bg-white border border-gray-100 text-neutral-800 rounded-tl-none'
					]"
				>
					<div
						class="whitespace-pre-wrap wrap-break-word"
						v-html="marked.parse(message.content)"
					></div>
					<div v-if="message.role === 'interviewer'" class="mt-2 flex">
						<UButton
							color="info"
							variant="outline"
							size="xs"
							:ui="{ rounded: 'rounded-md' }"
							icon="i-heroicons-light-bulb"
							@click="showAdvice(message)"
						>
							参考答案
						</UButton>
					</div>
				</div>
			</div>

			<!-- 正在输入指示器 -->
			<div v-if="isStreaming" class="flex gap-4">
				<div
					class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600 shadow-sm"
				>
					<UIcon name="i-heroicons-sparkles" class="w-6 h-6 text-white" />
				</div>
				<div
					class="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-3"
				>
					<div class="flex gap-1">
						<div
							class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
							style="animation-delay: 0s"
						></div>
						<div
							class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
							style="animation-delay: 0.2s"
						></div>
						<div
							class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
							style="animation-delay: 0.4s"
						></div>
					</div>
					<span class="text-xs text-gray-400 font-medium">AI 思考中...</span>
				</div>
			</div>
		</div>

		<!-- 输入区域 -->
		<div class="border-t border-gray-100 p-6 bg-white rounded-b-2xl">
			<div class="relative">
				<UTextarea
					v-model="inputMessage"
					ref="textareaRef"
					:placeholder="
						isInputFocused ? '请输入您的回答...' : '长按空格 语音输入'
					"
					:rows="3"
					:maxrows="6"
					resize
					autoresize
					:disabled="!canSendMessage"
					class="w-full"
					:ui="{
						wrapper: 'relative',
						base: 'custom-scrollbar pr-24 py-3 pl-4 pb-10 rounded-xl border-gray-200 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 focus:bg-white transition-colors duration-200',
						placeholder: 'text-gray-400'
					}"
					@keydown.enter.exact.prevent="handleEnterKey"
					@keydown.escape.exact.prevent="handleEscapeKey"
					@compositionstart="handleCompositionStart"
					@compositionend="handleCompositionEnd"
					@focus="onInputFocus"
					@blur="onInputBlur"
				/>
				<div class="absolute bottom-3 right-3 flex items-end gap-2">
					<span
						v-if="isSpeechSupported && canSendMessage"
						class="text-xs text-gray-400 flex items-baseline"
					>
						<UIcon name="i-heroicons-microphone" class="w-4 h-4 mr-0.5" />
						长按空格 语音输入</span
					>
					<UButton
						color="primary"
						:disabled="!canSendMessage || !inputMessage.trim()"
						:ui="{ rounded: 'rounded-lg' }"
						@click="handleSendMessage"
					>
						发送
						<UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 ml-1" />
					</UButton>
				</div>
			</div>
			<div
				class="flex items-center justify-between mt-3 text-xs text-neutral-400 px-1"
			>
				<span class="flex items-center gap-1">
					<UKbd size="xs">Enter</UKbd> 发送
					<span class="mx-1">|</span>
					<UKbd size="xs">Shift + Enter</UKbd> 换行
					<span class="mx-1">|</span>
					<UKbd size="xs">长按「空格」</UKbd> 语音输入
				</span>
				<div class="flex items-center gap-3">
					<UButton
						v-if="interviewStore.interviewStatus === 'ended'"
						color="green"
						variant="soft"
						size="xs"
						icon="i-heroicons-document-text"
						@click="handleComplete"
					>
						查看报告
					</UButton>
					<UButton
						v-else-if="
							interviewStore.interviewStatus === 'starting' ||
							interviewStore.interviewStatus === 'in_progress'
						"
						color="warning"
						size="xs"
						variant="soft"
						icon="i-heroicons-pause"
						@click="suspendInterview"
					>
						暂停面试
					</UButton>
					<UButton
						v-else-if="interviewStore.interviewStatus === 'suspend'"
						color="warning"
						size="xs"
						variant="soft"
						icon="i-heroicons-play"
						@click="restartInterview"
					>
						继续面试
					</UButton>
					<UButton
						v-if="interviewStore.interviewEventType !== 'end'"
						color="error"
						variant="ghost"
						size="xs"
						icon="i-heroicons-stop-circle"
						@click="endInterview"
					>
						结束面试
					</UButton>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useInterviewStore } from '@/stores/interview'
import {
	startMockInterviewAPI,
	answerInterviewQuestionAPI,
	pauseInterviewAPI,
	resumeInterviewAPI,
	endInterviewAPI,
	getMockInterviewSessionHistoryAPI
} from '@/api/interview'
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { useToast } from '#imports'
import { useGlobalModal } from '@/composables/useGlobalModal'
import { useRoute, useRouter } from '#imports'
import EndingProgressModal from '@/components/interview/EndingProgressModal.vue'
import AnswerAdviceModal from '@/components/interview/AnswerAdviceModal.vue'
import VoiceInputModal from '@/components/interview/VoiceInputModal.vue'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { marked } from 'marked'
import { navigateTo } from 'nuxt/app'

const props = defineProps({
	serviceType: {
		type: String,
		required: true
	}
})

const emit = defineEmits(['endInterview'])

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const globalModal = useGlobalModal()

const interviewStore = useInterviewStore()

const userStore = useUserStore()
const toast = useToast()

const inputMessage = ref('')
const messagesContainerRef = ref(null)
const isComposing = ref(false) // 是否正在使用输入法组合输入
const isSpeechSupported = ref(false)

// 语音朗读功能
const {
	isEnabled: speechEnabled,
	isSpeaking: speechSpeaking,
	isSupported: speechSupported,
	handleStreamText: handleSpeechStreamText,
	stop: stopSpeech,
	toggle: toggleSpeech,
	reset: resetSpeech
} = useSpeechSynthesis()

// 用于存储上一次的消息内容，以便计算增量
const lastInterviewerMessage = ref('')
/**
 * 是否正在流式输出（AI 正在说话）
 */
const isStreaming = computed(() => {
	return (
		interviewStore.interviewEventType === 'question' ||
		interviewStore.interviewEventType === 'thinking' ||
		interviewStore.interviewEventType === 'start'
	)
})

// 监听消息变化，自动滚动
watch(
	interviewStore.messages,
	() => {
		scrollToBottom()
	},
	{ deep: true }
)

// 输入框是否有焦点
const isInputFocused = ref(false)
const isSpacePressed = ref(false)

// 输入框焦点事件处理
const onInputFocus = () => {
	console.log('输入框焦点事件处理')
	isInputFocused.value = true
}
const onInputBlur = (e) => {
	if (e.code === 'Space') {
		return
	}
	console.log('输入框焦点事件 离开～～～～', e.code)
	isInputFocused.value = false
}

/**
 * 全局按键按下事件处理
 * 处理空格长按唤起语音输入
 */
const handleGlobalKeydown = (e) => {
	if (
		e.code === 'Space' &&
		!isInputFocused.value &&
		!isSpacePressed.value &&
		!isComposing.value &&
		isSpeechSupported.value &&
		canSendMessage.value
	) {
		e.preventDefault() // 防止页面滚动
		isSpacePressed.value = true
		showVoiceModal(true) // 传入 true 表示 PTT (Push-To-Talk) 模式
	}

	// 如果按了回车键，并且输入框中是有内容的，则执行 发送操作
	if (e.code === 'Enter' && inputMessage.value.trim()) {
		handleSendMessage()
	}
}

/**
 * 全局按键松开事件处理
 * 处理松开空格结束语音输入
 */
const handleGlobalKeyup = (e) => {
	if (e.code === 'Space' && isSpacePressed.value) {
		e.preventDefault()
		isSpacePressed.value = false
		// 松开空格，关闭 modal (VoiceInputModal 会自动处理 stop 和 confirm 逻辑)
		// 注意：我们这里假设 VoiceInputModal 能够响应关闭
		// 由于我们使用的是 globalModal，关闭它会销毁组件
		// 我们需要在 VoiceInputModal 销毁前把数据保存下来，但这由 VoiceInputModal 的 onRealtimeUpdate 处理了
		// 这里的 closeModal 只是触发 UI 消失
		globalModal.closeModal()
	}
}

onMounted(async () => {
	// 用来处理 语音输入 的逻辑
	window.addEventListener('keydown', handleGlobalKeydown)
	window.addEventListener('keyup', handleGlobalKeyup)
	// 如果面试已开始，获取历史数据
	loadHistoryData()
	// 语音识别能力检测（仅浏览器）
	if (typeof window !== 'undefined') {
		isSpeechSupported.value =
			'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
	}
})

/**
 * 获取历史数据
 */
const loadHistoryData = async () => {
	const resultId = route.query.resultId
	if (resultId) {
		const { conversationHistory, sessionInfo } =
			await getMockInterviewSessionHistoryAPI($api, resultId)
		// 设置历史记录
		interviewStore.messages = conversationHistory
		// 设置标准答案
		interviewStore.referenceAnswer = conversationHistory
			.filter((item) => item.role === 'interviewer')
			.map((item) => item.referenceAnswer || '')
		// 设置 sessionId
		interviewStore.sessionId = sessionInfo.sessionId
		// 设置面试官名称
		interviewStore.interviewerName = sessionInfo.interviewerName
		// 设置岗位类型
		interviewStore.selectedPosition.positionName = sessionInfo.position
		// 判断当前面试状态是否为 in_progress（进行中）
		if (sessionInfo.status === 'in_progress') {
			// 改变状态标记
			interviewStore.interviewStatus = 'in_progress'
			// 重新进入，设置为 waiting 状态
			interviewStore.interviewEventType = 'waiting'
		}
		// 面试已经结束了，当前查看的应该是面试历史记录。避免 历史记录重新查询
		else if (sessionInfo.status === 'completed' && !route.query.history) {
			// 改变状态标记
			interviewStore.interviewStatus = 'ended'
			// 重新进入，设置为 waiting 状态
			interviewStore.interviewEventType = 'end'
			// 处理路由跳转
			router.replace({
				query: { ...route.query, history: true, step: 'complete' }
			})
			// 延迟 500 ms 重新加载页面，以重新获取历史记录的数据
			setTimeout(() => {
				window.location.reload()
			}, 500)
		}
	}
}

// 开始面试
const startInterview = async () => {
	// 如果 url 中包含 resultId 参数，则表示当前面试已经开始过了，不需要重新开始面试
	if (route.query.resultId) {
		return
	}

	// 重置语音状态
	resetSpeech()
	lastInterviewerMessage.value = ''

	try {
		const params = {
			interviewType: props.serviceType,
			resumeId: interviewStore.resumeId,
			resumeContent: interviewStore.resumeText,
			company: interviewStore.selectedPosition.company || '',
			positionName: interviewStore.selectedPosition.positionName || '',
			minSalary: interviewStore.selectedPosition.minSalary || '',
			maxSalary: interviewStore.selectedPosition.maxSalary || '',
			jd: interviewStore.selectedPosition.jd || ''
		}

		// 获取配置
		const config = useRuntimeConfig()

		const { close } = startMockInterviewAPI(params, {
			token: userStore.token,
			baseURL: config.public.apiBase,
			callbacks: {
				onMessage: (data) => {
					const { type, content } = data

					// 面试开始，包含开场白（流式输出）
					if (type === 'start') {
						interviewStore.interviewEventType = 'start'

						// 保存 resultId 到 URL 中
						router.replace({
							query: { ...route.query, resultId: data.resultId }
						})
						interviewStore.resultId = data.resultId
						interviewStore.sessionId = data.sessionId

						interviewStore.interviewerName = data.interviewerName

						// 开始流式消息（创建占位消息）
						// interviewStore.startStreamingMessage('interviewer')
						// 更新消息内容（流式追加）
						interviewStore.updateLastMessage(content, 'interviewer')
						scrollToBottom()

						// 处理语音播报（增量文本）
						const incrementalText = content.substring(
							lastInterviewerMessage.value.length
						)
						if (incrementalText) {
							handleSpeechStreamText(incrementalText, false)
							lastInterviewerMessage.value = content
						}
					}
					// 等待候选人回答
					else if (type === 'waiting') {
						interviewStore.interviewEventType = 'waiting'
					}
					// 面试结束
					else if (type === 'end') {
						interviewStore.interviewEventType = 'end'
						interviewStore.interviewStatus = 'ended'
					}
					// 发生错误
					else if (type === 'error') {
						interviewStore.interviewEventType = 'error'
						toast.add({
							title: '面试出错',
							description: content || '请稍后重试',
							color: 'error'
						})
					}
				},
				onError: (error) => {
					console.error('SSE Error:', error)
					interviewStore.interviewEventType = 'error'
					toast.add({
						title: '面试启动失败',
						description: error.message || '网络错误，请稍后重试',
						color: 'error'
					})
				}
			}
		})
		// 改变状态标记
		interviewStore.interviewStatus = 'in_progress'
	} catch (error) {
		interviewStore.interviewEventType = 'error'
		toast.add({
			title: '启动失败',
			description: error.message || '请稍后重试',
			color: 'error'
		})
		interviewStore.interviewStatus = 'idle'
	}
}

// 滚动到底部
const scrollToBottom = () => {
	nextTick(() => {
		if (messagesContainerRef.value) {
			messagesContainerRef.value.scrollTop =
				messagesContainerRef.value.scrollHeight
		}
	})
}

/**
 * 是否可以发送消息
 * 1. 面试状态为进行中
 * 2. 面试进度类型为等待候选人回答
 */
const canSendMessage = computed(() => {
	return (
		interviewStore.interviewStatus === 'in_progress' &&
		(interviewStore.interviewEventType === 'waiting' ||
			interviewStore.interviewEventType === 'error')
	)
})

// 处理输入法组合开始
const handleCompositionStart = () => {
	isComposing.value = true
}

// 处理输入法组合结束
const handleCompositionEnd = () => {
	isComposing.value = false
}

// 处理回车键
const handleEnterKey = (event) => {
	// 如果正在使用输入法组合输入，不发送消息
	if (isComposing.value) {
		return
	}

	// 否则发送消息
	handleSendMessage()
}

const textareaRef = ref(null)
// ESC 键处理
const handleEscapeKey = () => {
	// 让 textareaRef 失去焦点
	textareaRef.value.textareaRef.blur()
}

// 发送消息
const handleSendMessage = async () => {
	if (!inputMessage.value.trim() || !canSendMessage.value) return

	const userMessage = inputMessage.value.trim()
	interviewStore.addMessage('candidate', userMessage)
	inputMessage.value = ''

	scrollToBottom()

	try {
		const params = {
			sessionId: interviewStore.sessionId,
			answer: userMessage
		}

		// 获取配置
		const config = useRuntimeConfig()

		// 生成一个 标准答案的 Index。该 index 一定是和 interviewer 的回答对应的。不需要 -1 ，因为后面一定会增加一个新的问题
		const referenceAnswerIndex = interviewStore.messages.filter(
			(message) => message.role === 'interviewer'
		).length

		answerInterviewQuestionAPI(params, {
			token: userStore.token,
			baseURL: config.public.apiBase,
			callbacks: {
				onMessage: (data) => {
					const { type, content } = data
					// 面试官提问（流式输出）
					if (type === 'question') {
						interviewStore.interviewEventType = 'question'

						// 更新最后一条面试官消息（流式追加）
						interviewStore.updateLastMessage(content, 'interviewer')
						scrollToBottom()

						// 处理语音播报（增量文本）
						const incrementalText = content.substring(
							lastInterviewerMessage.value.length
						)
						if (incrementalText) {
							handleSpeechStreamText(incrementalText, false)
							lastInterviewerMessage.value = content
						}
					}
					// 等待候选人回答
					else if (type === 'waiting') {
						interviewStore.interviewEventType = 'waiting'
						// 标记当前消息为最终文本
						handleSpeechStreamText('', true)
						lastInterviewerMessage.value = ''
					}
					// 生成的标准答案
					else if (type === 'reference_answer') {
						interviewStore.updateReferenceAnswer(content, referenceAnswerIndex)
					}
					// 面试结束
					else if (type === 'end') {
						// 增加面试结束的内容展示
						interviewStore.updateLastMessage(content, 'interviewer')
						scrollToBottom()

						// 处理语音播报（最终文本）
						const incrementalText = content.substring(
							lastInterviewerMessage.value.length
						)
						if (incrementalText) {
							handleSpeechStreamText(incrementalText, true)
						} else {
							handleSpeechStreamText('', true)
						}
						lastInterviewerMessage.value = ''

						// 改变标记位置
						interviewStore.interviewEventType = 'end'
						interviewStore.interviewStatus = 'ended'
						// 给用户一个结束面试，点击查看面试报告的提示
						globalModal.showModal({
							title: '恭喜！面试完成～',
							description:
								'点击查看面试报告（也可以在页面底部，点击「查看报告哦～」）',
							buttons: [
								{
									label: '立刻查看报告',
									color: 'success',
									onClick: () => {
										handleComplete()
									}
								}
							]
						})
					}
					// 发生错误
					else if (type === 'error') {
						interviewStore.interviewEventType = 'error'
						toast.add({
							title: '回答失败',
							description: content || '请稍后重试',
							color: 'error'
						})
					}
				},
				onError: (error) => {
					console.error('SSE Error:', error)
					interviewStore.interviewEventType = 'error'
					toast.add({
						title: '网络错误',
						description: error.message || '请检查网络连接',
						color: 'error'
					})
				}
			}
		})
	} catch (error) {
		toast.add({
			title: '发送失败',
			description: error.message || '请稍后重试',
			color: 'error'
		})
		interviewStore.interviewEventType = 'waiting'
	}
}

/**
 * 暂停面试
 */
const suspendInterview = async () => {
	// 执行暂停面试的流程
	try {
		await pauseInterviewAPI($api, interviewStore.resultId)
		// 修改面试状态为暂停
		interviewStore.interviewStatus = 'suspend'

		// 给用户提示
		globalModal.showModal({
			title: '面试已暂停',
			description: '可在「服务记录」查看该面试记录',
			buttons: [
				{
					label: '继续面试',
					color: 'success',
					onClick: () => {
						restartInterview()
					}
				}
			]
		})
	} catch (error) {
		toast.add({
			title: '暂停面试失败',
			description: error.message || '请稍后重试',
			color: 'error'
		})
	}
}

/**
 * 恢复面试
 */
const restartInterview = async () => {
	// 恢复面试的流程

	try {
		await resumeInterviewAPI($api, interviewStore.resultId)
		// 修改面试状态为进行中
		interviewStore.interviewStatus = 'in_progress'

		// 给用户提示
		toast.add({
			title: '继续面试',
			color: 'success'
		})
	} catch (error) {
		toast.add({
			title: '恢复面试失败',
			description: error.message || '请稍后重试',
			color: 'error'
		})
	}
}

/**
 * 结束面试
 */
const endInterview = () => {
	// 先判断当前面试的状态，暂停中的面试不能结束
	if (interviewStore.interviewStatus === 'suspend') {
		globalModal.showModal({
			title: '暂停中的面试不能结束',
			description: '请先点击「继续面试」按钮'
		})
		return
	}

	globalModal.showModal({
		title: '提示',
		description: '确定要主动结束当前面试吗？结束后将生成面试报告。',
		buttons: [
			{
				label: '取消',
				color: 'gray',
				variant: 'ghost',
				onClick: () => {}
			},
			{
				label: '确定结束面试',
				color: 'error',
				onClick: async () => {
					try {
						// 增加结束面试时的延迟，从而给后端 AI 生成标准答案保存到数据库的时间
						globalModal.showModal({
							title: '正在生成面试报告',
							buttons: [],
							preventClose: true,
							contentComponent: EndingProgressModal,
							contentProps: {
								onFinished: async () => {
									try {
										const res = await endInterviewAPI(
											$api,
											interviewStore.resultId
										)
										interviewStore.interviewStatus = 'ended'
										handleComplete()
									} catch (error) {
										interviewStore.interviewStatus = 'ended'
										handleComplete()
									}
								}
							}
						})
					} catch (error) {
						toast.add({
							title: '结束失败',
							description: error.message || '请稍后重试',
							color: 'error'
						})
					}
				}
			}
		]
	})
}

/**
 * 查看报告
 */
const handleComplete = () => {
	emit('endInterview', interviewStore.resultId)
}

const showAdvice = (message) => {
	const content = message?.content || ''
	globalModal.showModal({
		title: '回答建议',
		buttons: [],
		preventClose: false,
		ui: { content: 'sm:max-w-xl' },
		contentComponent: AnswerAdviceModal,
		contentProps: { questionContent: content }
	})
}

const showVoiceModal = (autoStart = false) => {
	globalModal.showModal({
		title: '语音输入',
		description: autoStart
			? '松开空格键结束输入'
			: '请允许麦克风权限，并开始语音输入',
		buttons: [],
		preventClose: false,
		ui: { content: 'sm:max-w-xl' },
		contentComponent: VoiceInputModal,
		contentProps: {
			initialText: inputMessage.value,
			autoStart: autoStart, // 传入自动开始标记
			onRealtimeUpdate: (text) => {
				inputMessage.value = text || ''
			},
			onConfirm: () => {
				handleSendMessage()
				globalModal.closeModal()
			}
		}
	})
}

defineExpose({
	startInterview
})
</script>
