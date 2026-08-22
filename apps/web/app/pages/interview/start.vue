<template>
	<div class="h-full flex flex-col gap-6">
		<div
			class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-center lg:text-left"
		>
			<div>
				<h1 class="text-xl font-bold text-neutral-900 mb-1">
					选择岗位和导入简历
				</h1>
				<p class="text-neutral-600 text-sm">
					锁定目标岗位并导入简历，AI 将定制专属题库
				</p>
			</div>
			<div
				class="inline-flex items-center gap-2 text-xs text-neutral-500 justify-center"
			>
				<UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-primary-500" />
				一步完成岗位筛选与资料上传
			</div>
		</div>

		<div class="grid lg:grid-cols-2 gap-6 flex-1 min-h-0 auto-rows-fr">
			<!-- 左侧：岗位选择 -->
			<div
				class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col min-h-0"
			>
				<h2 class="text-lg font-semibold text-neutral-900 mb-4">选择岗位</h2>

				<!-- 搜索框 -->
				<UInput
					v-model="searchQuery"
					placeholder="搜索岗位名称或描述..."
					icon="i-heroicons-magnifying-glass"
					size="lg"
					class="mb-4"
					@input="handleSearch"
				/>

				<!-- 快速分类筛选 -->
				<div class="mb-4">
					<p class="text-xs text-neutral-500 mb-2">快速筛选</p>
					<div class="flex flex-wrap gap-2">
						<UButton
							v-for="category in categories.slice(0, 6)"
							:key="category.key"
							:variant="activeCategory === category.key ? 'solid' : 'ghost'"
							:color="activeCategory === category.key ? 'primary' : 'gray'"
							size="xs"
							@click="handleCategoryFilter(category.key)"
						>
							{{ category.label }}
						</UButton>
						<button
							v-if="categories.length > 6"
							:class="[
								'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200',
								'border border-dashed',
								showAllCategories
									? 'border-primary-300 text-primary-700 bg-primary-50/50'
									: 'border-gray-300 text-neutral-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/30'
							]"
							@click="showAllCategories = !showAllCategories"
						>
							<UIcon
								:name="
									showAllCategories
										? 'i-heroicons-chevron-up'
										: 'i-heroicons-chevron-down'
								"
								class="w-3.5 h-3.5 transition-transform duration-200"
							/>
							<span>{{ showAllCategories ? '收起' : '更多' }}</span>
							<span class="text-[10px] opacity-60 ml-0.5">
								({{ categories.length - 6 }})
							</span>
						</button>
					</div>
					<div
						v-if="showAllCategories"
						class="flex flex-wrap gap-2 mt-2 animate-in"
					>
						<UButton
							v-for="category in categories.slice(6)"
							:key="category.key"
							:variant="activeCategory === category.key ? 'solid' : 'ghost'"
							:color="activeCategory === category.key ? 'primary' : 'gray'"
							size="xs"
							@click="handleCategoryFilter(category.key)"
						>
							{{ category.label }}
						</UButton>
					</div>
				</div>

				<!-- 岗位列表（可选，用于浏览） -->
				<div class="flex-1 min-h-0 overflow-hidden flex flex-col">
					<p class="text-xs text-neutral-500 mb-2">
						<span v-if="filteredPositions.length > 0">
							或从下方列表中选择（{{ filteredPositions.length }} 个岗位）
						</span>
						<span v-else class="text-neutral-400">
							暂无匹配的岗位，请尝试其他搜索条件
						</span>
					</p>
					<div
						v-if="filteredPositions.length > 0"
						class="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar"
					>
						<div
							v-for="position in filteredPositions"
							:key="position.positionId"
							class="p-3 rounded-lg border cursor-pointer transition-all border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm"
							:class="{
								'border-primary-300 bg-primary-50/50 shadow-sm':
									position.positionId === interviewStore.selectedPosition?.id
							}"
							@click="selectPosition(position)"
						>
							<div class="flex items-center justify-between gap-2">
								<div class="flex-1 min-w-0">
									<h3
										class="font-medium text-neutral-900 text-sm mb-1 truncate"
									>
										{{ position.positionName }}
										<span
											v-if="getCategoryLabel(position.category)"
											class="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500"
										>
											{{ getCategoryLabel(position.category) }}
										</span>
									</h3>
									<p class="text-xs text-neutral-600 line-clamp-1 mb-1">
										{{ position.description }}
									</p>
									<!-- <div
										class="flex items-center gap-2 text-[10px] text-neutral-500"
									>
										<span
											v-if="getCategoryLabel(position.category)"
											class="px-1.5 py-0.5 rounded bg-gray-100"
										>
											{{ getCategoryLabel(position.category) }}
										</span>
										<span v-if="position.level" class="opacity-70">
											{{ position.level }}
										</span>
									</div> -->
								</div>
								<UIcon
									:name="
										position.positionId === interviewStore.selectedPosition?.id
											? 'i-heroicons-check-circle'
											: 'i-heroicons-chevron-right'
									"
									class="w-4 h-4 text-neutral-400 shrink-0 mt-0.5"
									:class="{
										'text-primary-500 w-5 h-5':
											position.positionId ===
											interviewStore.selectedPosition?.id
									}"
								/>
							</div>
						</div>
					</div>
					<div v-else class="flex-1 flex items-center justify-center py-8">
						<div class="text-center">
							<UIcon
								name="i-heroicons-magnifying-glass"
								class="w-10 h-10 text-gray-300 mx-auto mb-2"
							/>
							<p class="text-sm text-neutral-400">未找到匹配的岗位</p>
							<p class="text-xs text-neutral-400 mt-1">
								尝试调整搜索关键词或选择其他分类
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- 右侧：简历导入 -->
			<div
				class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col min-h-0"
			>
				<div class="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
					<ResumeSelector>
						<template #title>
							<h2 class="text-lg font-semibold text-neutral-900">
								选择简历
								<span
									class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
								>
									{{ userStore.resumes.length }}/5
								</span>
							</h2>
						</template>
					</ResumeSelector>
				</div>

				<!-- 下一步按钮 -->
				<div class="pt-4 border-t border-gray-200 mt-4">
					<UButton color="primary" size="lg" block @click="handleNext">
						下一步：开启专项服务
					</UButton>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useHead } from 'nuxt/app'
import { SEO } from '@/constants/seo'
import { ref, computed, onMounted } from 'vue'
import jobCatalog from '@/data/job-categories.json'
import { useInterviewStore } from '@/stores/interview'
import { useToast } from '#imports'
import { navigateTo } from '#app'
import ResumeSelector from '@/components/interview/ResumeSelector.vue'
import { useGlobalModal } from '@/composables/useGlobalModal'
import ServiceSelectionContent from '@/components/interview/ServiceSelectionContent.vue'
import { serviceHighlights, SERVICE_TAGS } from '@/constants/vip'
import { useUserStore } from '@/stores/user'

definePageMeta({
	requiresAuth: true,
	middleware: 'auth',
	layout: 'interview'
})

useHead({
	title: `开启 AI 面试服务 - ${SEO.siteName}`,
	meta: [
		{
			name: 'description',
			content:
				'选择岗位、上传简历，体验面试押题、专项面试模拟、行测+HR面试三大核心服务'
		}
	]
})

const emit = defineEmits(['next'])

const userStore = useUserStore()

const interviewStore = useInterviewStore()
// 确定当前为 第一步
interviewStore.currentStep = 1
// 重置面试状态
interviewStore.reset()

const toast = useToast()
const globalModal = useGlobalModal()

const searchQuery = ref('')
const activeCategory = ref('all')
const showAllCategories = ref(false)

const catalogCategories = jobCatalog.categories ?? []

const categories = [
	{ key: 'all', label: '全部' },
	...catalogCategories.map((category) => ({
		key: category.key,
		label: category.label
	}))
]

const positions = ref(
	(jobCatalog.positions ?? []).map((position, index) => ({
		...position,
		id: position.positionId || `position-${index}`
	}))
)

const selectPosition = (position) => {
	interviewStore.setSelectedPosition(position)
}

const handleCategoryFilter = (categoryKey) => {
	activeCategory.value = categoryKey
	searchQuery.value = '' // 清空搜索
}

const handleSearch = () => {
	// 搜索时自动清除分类筛选
	if (searchQuery.value.trim()) {
		activeCategory.value = 'all'
	}
}

const clearPosition = () => {
	interviewStore.setSelectedPosition(null)
	searchQuery.value = ''
	activeCategory.value = 'all'
}

const filteredPositions = computed(() => {
	let result = positions.value

	// 按分类过滤
	if (activeCategory.value !== 'all') {
		result = result.filter((p) => p.category === activeCategory.value)
	}

	// 按搜索关键词过滤
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase().trim()
		console.log('result', result)

		result = result.filter(
			(p) =>
				p.positionName.toLowerCase().includes(query) ||
				p.description.toLowerCase().includes(query)
		)
	}

	return result
})

const canProceed = computed(() => {
	return (
		interviewStore.selectedPosition &&
		interviewStore.resumeType &&
		(interviewStore.resumeId || interviewStore.resumeText)
	)
})

const getCategoryLabel = (category) => {
	const cat = categories.find((c) => c.key === category)
	return cat ? cat.label : category
}

const serviceOptionMeta = {
	[SERVICE_TAGS.RESUME]: {
		accent: 'bg-blue-50 text-blue-500',
		cta: '前往' + serviceHighlights[0].title,
		badgeClass: 'text-blue-700 bg-blue-100',
		badgeIcon: 'i-heroicons-document-text'
	},
	[SERVICE_TAGS.SPECIAL]: {
		accent: 'bg-emerald-50 text-emerald-600',
		cta: '开启' + serviceHighlights[1].title,
		badgeClass: 'text-emerald-700 bg-emerald-100',
		badgeIcon: 'i-heroicons-sparkles'
	},
	[SERVICE_TAGS.BEHAVIOR]: {
		accent: 'bg-violet-50 text-violet-600',
		cta: '进入' + serviceHighlights[2].title,
		badgeClass: 'text-violet-700 bg-violet-100',
		badgeIcon: 'i-heroicons-chat-bubble-left-right'
	}
}

const serviceOptions = computed(() =>
	serviceHighlights.map((item) => ({
		...item,
		accent: serviceOptionMeta[item.id]?.accent || 'bg-gray-100 text-gray-500',
		cta: serviceOptionMeta[item.id]?.cta,
		badgeClass: serviceOptionMeta[item.id]?.badgeClass,
		badgeIcon: serviceOptionMeta[item.id]?.badgeIcon
	}))
)

const serviceRouteMap = {
	[SERVICE_TAGS.RESUME]: '/interview?serviceType=resume&step=input',
	[SERVICE_TAGS.SPECIAL]: '/interview?serviceType=special&step=input',
	[SERVICE_TAGS.BEHAVIOR]: '/interview?serviceType=behavior&step=input'
}

const presentServiceSelection = () => {
	let controller = null

	const handleSelection = async (serviceId) => {
		interviewStore.setSelectedService(serviceId)

		const target = serviceRouteMap[serviceId]
		controller?.close('selected')

		if (target) {
			await navigateTo(target)
		} else {
			toast.add({
				title: '暂未开放',
				description: '该服务暂未配置跳转地址，请稍后再试',
				color: 'warning'
			})
		}
	}

	controller = globalModal.showModal({
		title: '选择下一步体验',
		description: '根据目标需求选择想要开启的服务形态',
		contentComponent: ServiceSelectionContent,
		contentProps: {
			options: serviceOptions.value,
			onSelect: handleSelection
		},
		buttons: []
	})
}

const handleNext = async () => {
	if (!canProceed.value) {
		globalModal.showModal({
			title: '提示',
			content: '选择「岗位」和「简历」后，即可开始面试'
		})
		// toast.add({
		// 	title: '请完成必填项',
		// 	description: '请选择岗位并选择简历或输入简历内容',
		// 	color: 'warning'
		// })
		return
	}

	presentServiceSelection()
}
</script>
