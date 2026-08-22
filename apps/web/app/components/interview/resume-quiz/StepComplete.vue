<template>
	<div class="space-y-6 pb-12">
		<!-- 顶部操作栏 -->
		<div
			class="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-4 z-20"
		>
			<div class="flex items-center gap-2 text-sm text-neutral-600">
				<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
				<span v-if="serviceType === 'resume'">
					{{ $route.query.history ? '历史押题数据' : '押题完成' }}
					，共生成 {{ predictionResults.length }} 道预测题</span
				>
				<span v-else-if="serviceType === 'special'"
					>专项面试完成，共提问 {{ predictionResults.length }} 道题目</span
				>
				<span v-else-if="serviceType === 'behavior'"
					>行测 + HR 面试完成，共提问
					{{ predictionResults.length }} 道题目</span
				>
				<span
					class="text-xs text-success-500 cursor-pointer underline hover:text-success-600 transition-colors"
					@click="$emit('navigate-history')"
					>后续可在「历史记录」中查看</span
				>
			</div>
			<div class="flex items-center gap-3 w-full sm:w-auto">
				<UButton
					color="gray"
					variant="ghost"
					icon="i-heroicons-arrow-path"
					class="flex-1 sm:flex-none"
					@click="handleRetry"
				>
					重新开始
				</UButton>
				<UButton
					color="primary"
					variant="solid"
					class="flex-1 sm:flex-none"
					@click="$emit('next-step')"
				>
					下一步：查看提升计划
					<UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
				</UButton>
			</div>
		</div>

		<div
			class="overflow-y-auto max-h-[calc(100vh-200px)] pb-10 custom-scrollbar"
		>
			<!-- 押题总结 -->
			<div
				v-if="predictionSummary"
				class="bg-linear-to-br from-primary-50 to-white rounded-2xl p-6 border border-primary-100 shadow-sm"
			>
				<div class="flex gap-3">
					<div class="shrink-0 mt-1">
						<div
							class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center"
						>
							<UIcon
								name="i-heroicons-sparkles"
								class="w-5 h-5 text-primary-600"
							/>
						</div>
					</div>
					<div class="space-y-2">
						<h3 class="font-bold text-neutral-900">AI 押题分析总结</h3>
						<p
							class="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap"
							v-html="marked.parse(predictionSummary)"
						></p>
					</div>
				</div>
			</div>

			<!-- 题目列表 -->
			<div class="space-y-6 mt-2" id="prediction-results">
				<div
					v-for="(item, index) in predictionResults"
					:key="index"
					class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300"
				>
					<!-- 题目头部 -->
					<div class="p-5 border-b border-gray-100 bg-gray-50/30">
						<div class="flex flex-col gap-3">
							<!-- 标签行 -->
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2 flex-wrap">
									<span
										class="shrink-0 px-2.5 py-1 rounded-md bg-primary-100 text-primary-700 text-sm font-bold"
									>
										Q{{ index + 1 }}
									</span>
									<UBadge
										v-if="item.category"
										color="secondary"
										variant="soft"
										size="sm"
										class="capitalize"
									>
										考察类型：{{ getCategoryName(item.category) }}
									</UBadge>
									<UBadge
										v-if="item.difficulty"
										:color="getDifficultyConfig(item.difficulty).color"
										variant="subtle"
										size="sm"
										class="capitalize"
									>
										题目难度：{{ getDifficultyConfig(item.difficulty).label }}
									</UBadge>
									<UBadge
										v-for="(keyword, kIndex) in item.keywords"
										:key="kIndex"
										color="white"
										variant="solid"
										size="sm"
										class="text-neutral-500 border border-gray-200 font-normal"
									>
										# {{ keyword }}
									</UBadge>
								</div>
								<!-- 预留操作区：收藏/练习 -->
								<div class="flex gap-2">
									<UButton
										color="neutral"
										variant="outline"
										:icon="
											item.isOpen
												? 'i-heroicons-chevron-up'
												: 'i-heroicons-chevron-down'
										"
										size="xs"
										@click="item.isOpen = !item.isOpen"
										>{{ item.isOpen ? '折叠' : '展开' }}</UButton
									>
								</div>
							</div>

							<!-- 题目内容 -->
							<h3
								class="text-lg font-medium text-neutral-900 leading-relaxed cursor-pointer hover:text-primary-600 transition-colors"
								@click="item.isOpen = !item.isOpen"
							>
								{{ item.question }}
							</h3>

							<!-- 考察意图 -->
							<div
								v-if="item.reasoning"
								class="flex items-start gap-2 text-xs text-neutral-500 bg-gray-100/50 p-2 rounded-lg"
								v-show="item.isOpen"
							>
								<UIcon name="i-heroicons-eye" class="w-4 h-4 shrink-0 mt-0.5" />
								<span
									><span class="font-medium">考察意图：</span
									>{{ item.reasoning }}</span
								>
							</div>
						</div>
					</div>

					<!-- 题目内容主体 -->
					<div class="p-6 space-y-5" v-show="item.isOpen">
						<!-- 回答要点 Tips -->
						<div v-if="item.tips" class="space-y-2">
							<div
								class="flex items-center gap-2 text-sm font-semibold text-amber-600"
							>
								<UIcon name="i-heroicons-light-bulb" class="w-4 h-4" />
								<span>回答要点</span>
							</div>
							<div
								class="pl-6 text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap bg-amber-50/50 p-3 rounded-xl border border-amber-100/50"
							>
								{{ item.tips }}
							</div>
						</div>

						<!-- 参考回答 -->
						<div class="space-y-2">
							<div
								class="flex items-center gap-2 text-sm font-semibold text-primary-600"
							>
								<UIcon
									name="i-heroicons-chat-bubble-bottom-center-text"
									class="w-4 h-4"
								/>
								<span>参考回答思路</span>
							</div>
							<div
								class="pl-6 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap"
								v-html="marked.parse(item.answer)"
							></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useInterviewStore } from '@/stores/interview'
import { navigateTo } from '#imports'
import { marked } from 'marked'

defineProps({
	// resume: 面试押题
	// special: 专项面试
	// behavior: 行测 + HR 面试
	serviceType: {
		type: String,
		default: 'resume'
	},
	predictionResults: {
		type: Array,
		required: true
	},
	predictionSummary: {
		type: String,
		default: ''
	}
})

defineEmits(['retry', 'next-step', 'navigate-history'])

// 辅助函数
const getCategoryName = (category) => {
	const categoryMap = {
		technical: '技术',
		project: '项目经验',
		'soft-skill': '软技能',
		'problem-solving': '问题解决',
		'self-introduction': '自我介绍'
	}
	return categoryMap[category] || category
}

const getDifficultyConfig = (difficulty) => {
	const difficultyMap = {
		easy: { label: '简单', color: 'green' },
		medium: { label: '中等', color: 'amber' },
		hard: { label: '困难', color: 'red' }
	}
	return difficultyMap[difficulty] || { label: difficulty, color: 'gray' }
}

const interviewStore = useInterviewStore()
const globalModal = useGlobalModal()

const handleRetry = () => {
	globalModal.showModal({
		title: '趁热打铁，再来一次？',
		buttons: [
			{
				label: '点错了',
				color: 'gray',
				variant: 'ghost',
				onClick: () => console.log('cancel')
			},
			{
				label: '那必须的',
				color: 'primary',
				onClick: () => {
					// 清空选择的所有内容
					interviewStore.reset()
					// 跳转到选择岗位页面
					navigateTo('/interview/start')
				}
			}
		]
	})
}
</script>
