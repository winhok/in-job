<template>
	<div class="h-full flex flex-col gap-6 w-full">
		<!-- 简历押题 - 输入步骤 -->
		<StepInput
			v-if="currentStep === 'input'"
			:service-type="currentServiceType"
			@submit="handleSubmit"
		/>

		<!-- 简历押题 - 进度条展示 -->
		<StepProgress
			v-if="currentStep === 'progress'"
			ref="stepProgressRef"
			:current-progress-step="currentProgressStep"
			:unique-progress-steps="uniqueProgressSteps"
		/>

		<!-- 专项面试/行测+HR - 面试界面 -->
		<StepInterview
			v-if="currentStep === 'interview'"
			:service-type="currentServiceType"
			@endInterview="handleEndInterview"
		/>

		<!-- 完成步骤 - 展示结果 -->
		<StepComplete
			v-if="currentStep === 'complete'"
			:service-type="currentServiceType"
			:prediction-results="predictionResults"
			:prediction-summary="predictionSummary"
			@next-step="handleNextStep"
			@navigate-history="navigateTo('/history')"
		/>

		<!-- 错误步骤 - 仅简历押题 -->
		<StepError v-if="currentStep === 'error'" />
	</div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch, nextTick, onMounted } from 'vue'
import { navigateTo, useRoute, useRouter } from '#imports'
import { useHead } from 'nuxt/app'
import { SEO } from '@/constants/seo'
import { serviceHighlights, SERVICE_TAGS } from '@/constants/vip'
import { useInterviewStore } from '@/stores/interview'
import { useGlobalModal } from '@/composables/useGlobalModal'
import SpecialInterviewConfirm from '@/components/interview/SpecialInterviewConfirm.vue'
import { useUserStore } from '@/stores/user'
import {
	generateResumeQuizSSE,
	getInterviewResultDetailAPI,
	getMockInterviewQAResultAPI,
	getAnalysisReportAPI
} from '@/api/interview'
import { useToast } from '#imports'
import { v4 as uuidv4 } from 'uuid'

// 导入步骤组件
import StepInput from '@/components/interview/resume-quiz/StepInput.vue'
import StepProgress from '@/components/interview/resume-quiz/StepProgress.vue'
import StepInterview from '@/components/interview/special-quiz/StepInterview.vue'
import StepComplete from '@/components/interview/resume-quiz/StepComplete.vue'
import StepError from '@/components/interview/resume-quiz/StepError.vue'

definePageMeta({
	requiresAuth: true,
	middleware: 'auth',
	layout: 'interview'
})

const route = useRoute()
const router = useRouter()
const globalModal = useGlobalModal()
const interviewStore = useInterviewStore()
const userStore = useUserStore()
const toast = useToast()
const { $api } = useNuxtApp()

// 从 URL query 中获取参数
const currentServiceType = computed(() => {
	const type = route.query.serviceType
	if (
		[SERVICE_TAGS.RESUME, SERVICE_TAGS.SPECIAL, SERVICE_TAGS.BEHAVIOR].includes(
			type
		)
	) {
		return type
	}
	// 默认值
	return SERVICE_TAGS.RESUME
})

const currentStep = computed(() => {
	const step = route.query.step
	// 有效的步骤值
	const validSteps = ['input', 'progress', 'interview', 'complete', 'error']
	if (validSteps.includes(step)) {
		return step
	}
	// 默认值
	return 'input'
})

// 动态设置页面标题
const pageTitle = computed(() => {
	const titleMap = {
		[SERVICE_TAGS.RESUME]: serviceHighlights[0].title,
		[SERVICE_TAGS.SPECIAL]: serviceHighlights[1].title,
		[SERVICE_TAGS.BEHAVIOR]: serviceHighlights[2].title
	}
	return titleMap[currentServiceType.value] || '面试服务'
})

useHead({
	title: computed(() => `${pageTitle.value} - ${SEO.siteName}`),
	meta: [
		{
			name: 'description',
			content: computed(() => {
				const descMap = {
					[SERVICE_TAGS.RESUME]: 'AI 智能简历押题，精准预测面试问题',
					[SERVICE_TAGS.SPECIAL]: 'AI 专项面试模拟，1v1 深度对话',
					[SERVICE_TAGS.BEHAVIOR]: '行测 + HR 面试综合评估'
				}
				return descMap[currentServiceType.value] || '面试服务'
			})
		}
	]
})

// 确定当前为第二步
interviewStore.currentStep = 2

// 更新 URL query 参数的辅助函数
const updateQuery = (updates) => {
	// 如果进度完成，那么自动标记为 历史查询
	const isComplete = updates.step === 'complete'
	router.push({
		query: {
			...route.query,
			...updates,
			history: isComplete ? true : route.query.history
		}
	})
}

// ==================== 简历押题相关 ====================
// SSE 连接控制器
const sseController = ref(null)
// 进度条配置
const currentProgressStep = ref({
	progress: 0,
	label: '正在解析岗位信息...',
	stage: 'prepare'
})
const progressSteps = ref([])
const uniqueProgressSteps = computed(() => {
	const unique = []
	const seenLabels = new Set()
	for (const step of progressSteps.value) {
		if (!seenLabels.has(step.label)) {
			seenLabels.add(step.label)
			unique.push(step)
		}
	}
	return unique
})

const stepProgressRef = ref(null)
const progressStepsContainer = computed(
	() => stepProgressRef.value?.progressStepsContainer
)

watch(uniqueProgressSteps, async () => {
	await nextTick()
	const container = progressStepsContainer.value
	if (container) {
		container.scrollTop = container.scrollHeight
	}
})

// ==================== 通用数据 ====================
let resultId = ''
const predictionResults = ref([])
const predictionSummary = ref('')

// 用户余额
const resumeBalance = computed(
	() => userStore.userInfo?.resumeRemainingCount ?? 0
)
const specialBalance = computed(
	() => userStore.userInfo?.specialRemainingCount ?? 0
)
const behaviorBalance = computed(
	() => userStore.userInfo?.behaviorRemainingCount ?? 0
)

// ==================== 处理提交 ====================
const handleSubmit = () => {
	const requestId = uuidv4()
	const serviceType = currentServiceType.value

	// 根据服务类型获取余额
	const balanceMap = {
		[SERVICE_TAGS.RESUME]: resumeBalance.value,
		[SERVICE_TAGS.SPECIAL]: specialBalance.value,
		[SERVICE_TAGS.BEHAVIOR]: behaviorBalance.value
	}

	globalModal.showModal({
		title:
			serviceType === SERVICE_TAGS.RESUME
				? '准备开始简历押题'
				: serviceType === SERVICE_TAGS.SPECIAL
				? '准备开始专项面试'
				: '准备开始行测 + HR 面试',
		description: '请确认以下信息后再开始服务流程',
		contentComponent: SpecialInterviewConfirm,
		contentProps: {
			serviceType: serviceType,
			remainingCount: balanceMap[serviceType],
			onConfirm: () => {
				globalModal.closeModal()
				if (serviceType === SERVICE_TAGS.RESUME) {
					startResumeQuiz(requestId)
				} else {
					startInterview(serviceType)
				}
			}
		},
		buttons: [],
		preventClose: true
	})
}

// ==================== 简历押题流程 ====================
const resumeQuizComplete = ref(false)
const startResumeQuiz = async (requestId) => {
	// 更新 URL 到 progress 步骤
	updateQuery({ step: 'progress' })
	// 重置 押题是否完成的状态
	resumeQuizComplete.value = false

	// 初始化状态
	currentProgressStep.value = {
		progress: 0,
		label: '正在准备...',
		stage: 'prepare'
	}
	progressSteps.value = []
	predictionResults.value = []
	predictionSummary.value = ''

	const params = {
		resumeId: interviewStore.resumeId,
		resumeContent: interviewStore.resumeText,
		company: interviewStore.selectedPosition.company || '未指定公司',
		positionName: interviewStore.selectedPosition.positionName || '',
		minSalary: interviewStore.selectedPosition.minSalary || '',
		maxSalary: interviewStore.selectedPosition.maxSalary || '',
		jd: interviewStore.selectedPosition.jd || '',
		requestId
	}

	const config = useRuntimeConfig()

	sseController.value = generateResumeQuizSSE(params, {
		token: userStore.token,
		baseURL: config.public.apiBase,
		callbacks: {
			onMessage: (data) => {
				// 进度中
				if (data.type === 'progress') {
					currentProgressStep.value = {
						progress: data.progress || 0,
						label: data.label || data.message || '处理中...',
						stage: data.stage || 'processing'
					}
					progressSteps.value.push(currentProgressStep.value)
				}

				// 简历押题数据获取完成
				else if (data.type === 'yati-complete') {
					resultId = data.data.resultId
					if (data.data?.questions) {
						predictionResults.value = data.data.questions.map((item) => ({
							...item,
							isOpen: true
						}))
					}
					if (data.data?.summary) {
						predictionSummary.value = data.data.summary
					}
					// 更新到 complete 步骤
					updateQuery({ step: 'complete', resultId })
				} else if (data.type === 'complete') {
					// console.log('所有数据解析完成', data)
					resumeQuizComplete.value = true
				}
				// 报错处理
				else if (data.type === 'error') {
					console.error('SSE Error:', data.error)
					updateQuery({ step: 'error' })
					toast.add({
						title: '押题失败',
						description: data.error.message || '网络错误，请稍后重试',
						color: 'error'
					})
				}
			},
			onError: (error) => {
				console.error('SSE Error:', error)
				updateQuery({ step: 'error' })
				toast.add({
					title: '押题失败',
					description: error.message || '网络错误，请稍后重试',
					color: 'error'
				})
			}
		}
	})
}

// ==================== 专项面试/行测+HR 流程 ====================
const startInterview = (serviceType) => {
	// 设置 store 状态
	interviewStore.selectedService = serviceType
	interviewStore.interviewStatus = 'starting'
	// 更新 URL 到 interview 步骤
	updateQuery({ step: 'interview' })
}

const handleEndInterview = async (interviewResultId) => {
	resultId = interviewResultId
	try {
		const res = await getMockInterviewQAResultAPI($api, interviewResultId)
		predictionResults.value = res.questions
		// 更新到 complete 步骤

		updateQuery({ step: 'complete' })
	} catch (error) {
		console.error('获取面试结果失败:', error)
		toast.add({
			title: '获取结果失败',
			description: error.message || '请稍后重试',
			color: 'error'
		})
	}
}

// ==================== 下一步：查看报告 ====================
const handleNextStep = async () => {
	const finalResultId = resultId || route.query.resultId

	if (!finalResultId) {
		toast.add({
			title: '无法跳转',
			description: '缺少结果 ID',
			color: 'error'
		})
		return
	}

	// 如果是专项面试或行测+HR，需要等待报告生成
	if (currentServiceType.value !== SERVICE_TAGS.RESUME) {
		try {
			await getAnalysisReportAPI($api, finalResultId)
		} catch (error) {
			console.error('获取报告失败:', error)
			// 失败了，则不进行跳转
			return
		}
	}
	// 后续增加的逻辑，简历押题被拆分两部分返还，如果 resumeQuizComplete 为 false，则需要等待押题完成
	else {
		if (!resumeQuizComplete.value && !route.query.history) {
			toast.add({
				title: '面试评估报告正在努力生成中...预计还需 1 - 2 分钟',
				description: '先看下押题的题目和报告吧～',
				color: 'warning'
			})
			return
		}
	}

	navigateTo(
		`/interview/report?resultId=${finalResultId}&serviceType=${route.query.serviceType}&history=${route.query.history}`
	)
}

// ==================== 初始化 ====================
onMounted(() => {
	initInterView()
})

const initInterView = async () => {
	// 判断是否为查看历史记录
	const historyResultId = route.query.resultId
	const isHistory = route.query.history
	if (historyResultId && isHistory) {
		resultId = historyResultId

		// 根据服务类型加载历史数据
		try {
			if (currentServiceType.value === SERVICE_TAGS.RESUME) {
				const res = await getInterviewResultDetailAPI($api, historyResultId)
				predictionResults.value = res.questions.map((item) => ({
					...item,
					isOpen: true
				}))
				predictionSummary.value = res.summary
			} else {
				const res = await getMockInterviewQAResultAPI($api, historyResultId)
				predictionResults.value = res.questions
			}
			// 确保显示 complete 步骤
			if (currentStep.value !== 'complete') {
				updateQuery({ step: 'complete' })
			}
		} catch (error) {
			console.error('加载历史记录失败:', error)
			toast.add({
				title: '加载失败',
				description: error.message || '请稍后重试',
				color: 'error'
			})
		}
	} else {
		// 如果没有 resultId，且 URL 中没有 step，默认设置为 input
		if (!route.query.step) {
			updateQuery({ step: 'input' })
		}
	}
}

// 组件卸载时清理 SSE 连接
onUnmounted(() => {
	// 因为简历押题分成了两段获取数据，为防止用户在押题阶段直接跳转，所以不去断链 sse
	// if (sseController.value) {
	// 	sseController.value.close()
	// 	sseController.value = null
	// }
})
</script>

<style scoped></style>
