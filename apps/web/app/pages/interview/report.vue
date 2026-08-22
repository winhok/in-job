<template>
	<div class="h-full flex flex-col gap-6">
		<!-- 头部 -->
		<div
			class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
		>
			<div>
				<div
					class="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full mb-3"
				>
					<UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
					<span class="font-medium">评估已完成</span>
				</div>
				<h1 class="text-3xl font-bold text-neutral-900">面试评估报告</h1>
				<p class="text-neutral-600 mt-2 text-sm">
					针对
					<span class="font-semibold text-primary-600"
						>{{ reportData.company }} - {{ reportData.position }}</span
					>
					岗位的详细评估
				</p>
			</div>
			<div
				class="flex flex-wrap items-center justify-start lg:justify-end gap-3"
			>
				<UButton
					color="gray"
					variant="ghost"
					icon="i-heroicons-arrow-left"
					@click="handleBackHome"
				>
					返回首页
				</UButton>
				<UButton
					color="info"
					variant="outline"
					icon="i-heroicons-arrow-left-on-rectangle-solid"
					@click="handleBackToQuestion"
				>
					上一步，查看详情问题
				</UButton>
				<UButton
					color="primary"
					icon="i-heroicons-arrow-path"
					@click="handleRestart"
				>
					趁热打铁，再来一次～
				</UButton>
			</div>
		</div>

		<div class="flex-1 min-h-0 overflow-hidden">
			<div class="h-full overflow-y-auto pr-1 space-y-6 pb-10">
				<!-- 概览区域：匹配度 & 雷达图 -->
				<div class="grid lg:grid-cols-2 gap-6">
					<!-- 左侧：匹配度评分 -->
					<div
						class="bg-linear-to-br from-primary-50 to-white rounded-xl border border-primary-100 p-8 flex flex-col justify-center relative overflow-hidden"
					>
						<div class="relative z-10">
							<h2 class="text-lg font-semibold text-neutral-900 mb-6">
								岗位匹配度
							</h2>
							<div class="flex items-baseline gap-4 mb-4">
								<span
									class="text-6xl font-bold text-primary-600 tracking-tight"
								>
									{{ reportData.matchScore }}
								</span>
								<span class="text-xl text-neutral-600 font-medium">分</span>
								<span
									class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-bold"
								>
									{{ reportData.matchLevel }}
								</span>
							</div>
							<p
								class="text-neutral-600 leading-relaxed mb-6"
								v-html="marked.parse(reportData.summary)"
							></p>

							<!-- 私教训练营按钮 -->
							<div v-if="showTrainingButton" class="mb-6">
								<UButton
									color="primary"
									variant="soft"
									block
									class="animate-pulse hover:animate-none font-bold"
									@click="showTrainingModal = true"
								>
									<UIcon name="i-heroicons-sparkles" class="w-5 h-5" />
									匹配度较低？获取 1v1 私教特训方案
								</UButton>
							</div>

							<div class="grid grid-cols-3 gap-4 text-center">
								<div
									class="bg-white/60 rounded-lg p-3 border border-primary-100"
								>
									<div class="text-2xl font-bold text-neutral-900">
										{{ reportData.matchedSkills.length }}
									</div>
									<div class="text-xs text-neutral-500 mt-1">匹配技能</div>
								</div>
								<div
									class="bg-white/60 rounded-lg p-3 border border-primary-100"
								>
									<div class="text-2xl font-bold text-neutral-900">
										{{ reportData.missingSkills.length }}
									</div>
									<div class="text-xs text-neutral-500 mt-1">缺失技能</div>
								</div>
								<div
									class="bg-white/60 rounded-lg p-3 border border-primary-100"
								>
									<div class="text-2xl font-bold text-neutral-900">
										{{ reportData.knowledgeGaps.length }}
									</div>
									<div class="text-xs text-neutral-500 mt-1">知识缺口</div>
								</div>
							</div>
						</div>
						<!-- 装饰背景 -->
						<div
							class="absolute -right-10 -bottom-10 w-64 h-64 bg-primary-100/50 rounded-full blur-3xl"
						></div>
					</div>

					<!-- 右侧：能力雷达图 -->
					<div
						class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col"
					>
						<h2 class="text-lg font-semibold text-neutral-900 mb-4">
							能力维度分析
						</h2>
						<div class="flex-1 flex items-center justify-center min-h-[300px]">
							<!-- SVG 雷达图 -->
							<RadarChart :data="reportData.radarData" />
						</div>
					</div>
				</div>

				<!-- 技能分析 -->
				<div class="grid lg:grid-cols-2 gap-6">
					<!-- 匹配技能 -->
					<div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
						<h2
							class="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2"
						>
							<UIcon
								name="i-heroicons-check-badge"
								class="w-5 h-5 text-green-500"
							/>
							已具备技能
						</h2>
						<div class="space-y-4">
							<div
								v-for="(skill, index) in reportData.matchedSkills"
								:key="index"
								class="p-3 bg-green-50/50 rounded-lg border border-green-100"
							>
								<div class="flex items-center justify-between mb-1">
									<span class="font-bold text-green-800">{{
										skill.skill
									}}</span>
									<UIcon
										name="i-heroicons-check"
										class="w-4 h-4 text-green-600"
									/>
								</div>
								<p class="text-xs text-green-700/80">{{ skill.proficiency }}</p>
							</div>
						</div>
					</div>

					<!-- 缺失技能与知识缺口 -->
					<div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
						<h2
							class="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2"
						>
							<UIcon
								name="i-heroicons-exclamation-triangle"
								class="w-5 h-5 text-amber-500"
							/>
							需补充技能 & 知识
						</h2>
						<div class="space-y-6">
							<div>
								<h3 class="text-sm font-medium text-neutral-700 mb-2">
									缺失技能
								</h3>
								<div class="flex flex-wrap gap-2">
									<span
										v-for="skill in reportData.missingSkills"
										:key="skill"
										class="px-2.5 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-100 font-medium"
									>
										{{ skill }}
									</span>
								</div>
							</div>
							<div>
								<h3 class="text-sm font-medium text-neutral-700 mb-2">
									知识缺口
								</h3>
								<ul class="space-y-2">
									<li
										v-for="(gap, index) in reportData.knowledgeGaps"
										:key="index"
										class="flex items-start gap-2 text-sm text-neutral-600"
									>
										<div
											class="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
										></div>
										<span>{{ gap }}</span>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<!-- 学习优先级 -->
				<div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
					<h2
						class="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2"
					>
						<UIcon
							name="i-heroicons-academic-cap"
							class="w-5 h-5 text-primary-600"
						/>
						建议学习路径
					</h2>
					<div class="space-y-4">
						<div
							v-for="(item, index) in reportData.learningPriorities"
							:key="index"
							class="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-all hover:shadow-md"
							:class="
								item.priority === 'high'
									? 'bg-red-50/30 border-red-100'
									: 'bg-blue-50/30 border-blue-100'
							"
						>
							<div class="shrink-0">
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide"
									:class="
										item.priority === 'high'
											? 'bg-red-100 text-red-800'
											: 'bg-blue-100 text-blue-800'
									"
								>
									{{ item.priority === 'high' ? '高优先级' : '中优先级' }}
								</span>
							</div>
							<div class="flex-1">
								<h3 class="font-bold text-neutral-900 mb-1">
									{{ item.topic }}
								</h3>
								<p class="text-sm text-neutral-600">{{ item.reason }}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- 面试准备建议 -->
				<div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
					<h2
						class="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2"
					>
						<UIcon
							name="i-heroicons-chat-bubble-bottom-center-text"
							class="w-5 h-5 text-purple-600"
						/>
						面试准备建议
					</h2>
					<div class="grid md:grid-cols-2 gap-4">
						<div
							v-for="(tip, index) in reportData.interviewTips"
							:key="index"
							class="flex gap-3 p-3 bg-purple-50/50 rounded-lg border border-purple-100"
						>
							<div
								class="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 text-xs font-bold"
							>
								{{ index + 1 }}
							</div>
							<p class="text-sm text-neutral-700 pt-0.5">{{ tip }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- 私教训练营弹窗 -->
		<UModal v-model:open="showTrainingModal" title="1v1 私教训练营">
			<template #body>
				<div class="px-6 text-center space-y-6">
					<div class="space-y-4">
						<p class="text-neutral-600 text-sm">
							针对您的薄弱环节，提供定制化的一对一辅导，助您快速补齐短板，拿下心仪
							Offer！
						</p>
						<div class="flex justify-center">
							<div
								class="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
							>
								<img
									:src="sundayImg"
									alt="私教微信"
									class="w-full h-full object-cover"
								/>
							</div>
						</div>
						<p class="text-xs text-neutral-500">
							扫码添加微信（备注：<span class="font-bold text-neutral-800"
								>训练营</span
							>）
						</p>
					</div>
					<div class="pt-2">
						<UButton
							to="https://mp.weixin.qq.com/s/q4oxZlVKfz96XqmK2l56iQ"
							target="_blank"
							color="primary"
							block
							size="lg"
						>
							查看训练营详情
							<UIcon
								name="i-heroicons-arrow-top-right-on-square"
								class="w-4 h-4 ml-1"
							/>
						</UButton>
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>

<script setup>
import { useInterviewStore } from '@/stores/interview'
import { navigateTo } from '#imports'
import { useHead } from 'nuxt/app'
import { SEO } from '@/constants/seo'
import { ref, computed } from 'vue'
import { useToast } from '#imports'
import { getAnalysisReportAPI } from '@/api/interview'
import { useRoute, useRouter } from 'vue-router'
import sundayImg from '@/assets/imgs/sunday.jpg'
import { useGlobalModal } from '@/composables/useGlobalModal'
import { marked } from 'marked'

// 引入简单的雷达图组件（如果没有外部组件，我们可以在这里定义一个局部组件）
import RadarChart from '@/components/interview/RadarChart.vue'

definePageMeta({
	requiresAuth: true,
	middleware: 'auth',
	layout: 'interview'
})

useHead({
	title: `面试评估报告 - ${SEO.siteName}`,
	meta: [
		{
			name: 'description',
			content: '查看 AI 面试评估报告，获取多维度分析与提升建议'
		}
	]
})

const { $api } = useNuxtApp()
const route = useRoute()
const router = useRouter()
const interviewStore = useInterviewStore()
interviewStore.currentStep = 3
const toast = useToast()
const globalModal = useGlobalModal()
const showTrainingModal = ref(false)

/**
 * 是否显示私教训练营按钮
 */
const showTrainingButton = computed(() => {
	// 岗位匹配关键词
	const keywords = ['前端', 'web', '开发']
	const position = reportData.value.position?.toLowerCase() || ''
	const isRelatedPosition = keywords.some((k) => position.includes(k))

	// 分数判断
	const score = Number(reportData.value.matchScore) || 0
	const isLowScore = score < 70

	return isRelatedPosition && isLowScore
})

// 报告数据
const reportData = ref({
	resultId: '',
	type: '',
	company: '加载中...',
	position: '加载中...',
	salaryRange: '',
	createdAt: '',
	matchScore: 0,
	matchLevel: '-',
	matchedSkills: [],
	missingSkills: [],
	knowledgeGaps: [],
	learningPriorities: [],
	radarData: [], // 确保雷达图数据初始为空数组
	strengths: [],
	weaknesses: [],
	summary: '正在加载评估报告...',
	interviewTips: [],
	totalQuestions: 0,
	questionDistribution: {},
	viewCount: 0
})

/**
 * 获取分析报告数据
 */
const getAnalysisReport = async () => {
	try {
		const res = await getAnalysisReportAPI($api, route.query.resultId)
		if (res) {
			reportData.value = res
		}
	} catch (error) {
		toast.add({
			title: '获取报告失败',
			description: error.message,
			color: 'error'
		})
	}
}

getAnalysisReport()

const handleRestart = () => {
	interviewStore.reset()
	navigateTo('/interview/start')
}

const handleBackHome = () => {
	globalModal.showModal({
		title: '确定要返回首页吗？',
		description: '返回首页后，该次记录可在「服务记录」中查看',
		buttons: [
			{
				label: '确定',
				onClick: () => {
					navigateTo('/')
				}
			}
		]
	})
}

const handleBackToQuestion = () => {
	router.back()
}
</script>
