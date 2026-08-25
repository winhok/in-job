<template>
	<div class="h-full flex flex-col gap-6">
		<div
			class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-center lg:text-left"
		>
			<div>
				<h1 class="text-xl font-bold text-neutral-900 mb-1">
					{{ $t('interview.start.title') }}
				</h1>
				<p class="text-neutral-600 text-sm">
					{{ $t('interview.start.description') }}
				</p>
			</div>
			<div
				class="inline-flex items-center gap-2 text-xs text-neutral-500 justify-center"
			>
				<UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-primary-500" />
				{{ $t('interview.start.hint') }}
			</div>
		</div>

		<div class="grid lg:grid-cols-2 gap-6 flex-1 min-h-0 auto-rows-fr">
			<!-- 左侧：岗位选择 -->
			<div
				class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col min-h-0"
			>
				<h2 class="text-lg font-semibold text-neutral-900 mb-4">
					{{ $t('interview.start.choosePosition') }}
				</h2>

				<!-- 搜索框 -->
				<UInput
					v-model="searchQuery"
					:placeholder="$t('interview.start.searchPlaceholder')"
					icon="i-heroicons-magnifying-glass"
					size="lg"
					class="mb-4"
					@input="handleSearch"
				/>

				<!-- 快速分类筛选 -->
				<div class="mb-4">
					<p class="text-xs text-neutral-500 mb-2">
						{{ $t('interview.start.quickFilter') }}
					</p>
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
							<span>{{
								showAllCategories
									? $t('interview.start.collapse')
									: $t('interview.start.more')
							}}</span>
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
							{{
								$t('interview.start.selectFromList', {
									count: filteredPositions.length
								})
							}}
						</span>
						<span v-else class="text-neutral-400">
							{{ $t('interview.start.noMatch') }}
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
							<p class="text-sm text-neutral-400">
								{{ $t('interview.start.noMatchTitle') }}
							</p>
							<p class="text-xs text-neutral-400 mt-1">
								{{ $t('interview.start.noMatchHint') }}
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
								{{ $t('interview.start.chooseResume') }}
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
						{{ $t('interview.start.next') }}
					</UButton>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useHead } from 'nuxt/app'
import { SEO } from '@/constants/seo'
import { ref, computed, onMounted } from 'vue'
import jobCatalog from '@/data/job-categories.json'
import { useInterviewStore } from '@/stores/interview'
import { useRouter, useToast } from '#imports'
import ResumeSelector from '@/components/interview/ResumeSelector.vue'
import { useGlobalModal } from '@/composables/useGlobalModal'
import ServiceSelectionContent from '@/components/interview/ServiceSelectionContent.vue'
import { serviceHighlights, SERVICE_TAGS } from '@/constants/vip'
import { useUserStore } from '@/stores/user'
import { categoryNames, localizeJobPosition } from '@/data/job-catalog.en'

definePageMeta({
	requiresAuth: true,
	middleware: 'auth',
	layout: 'interview'
})

const emit = defineEmits(['next'])

const userStore = useUserStore()
const { t, locale } = useI18n()
useHead(() => ({
	title: `${t('nav.start')} - ${t('brand.name')}`,
	meta: [{ name: 'description', content: t('seo.startDescription') }]
}))

const interviewStore = useInterviewStore()
// 确定当前为 第一步
interviewStore.currentStep = 1
// 重置面试状态
interviewStore.reset()

const toast = useToast()
const globalModal = useGlobalModal()
const router = useRouter()

const searchQuery = ref('')
const activeCategory = ref('all')
const showAllCategories = ref(false)

const catalogCategories = jobCatalog.categories ?? []

const categories = computed(() => [
	{ key: 'all', label: t('interview.start.all') },
	...catalogCategories.map((category) => ({
		key: category.key,
		label:
			locale.value === 'en-US' ? categoryNames[category.key] : category.label
	}))
])

const positions = computed(() =>
	(jobCatalog.positions ?? []).map((position, index) => ({
		...localizeJobPosition(position, locale.value),
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
	const cat = categories.value.find((c) => c.key === category)
	return cat ? cat.label : category
}

const serviceOptionMeta = {
	[SERVICE_TAGS.RESUME]: {
		accent: 'bg-blue-50 text-blue-500',
		ctaKey: 'home.services.quiz',
		badgeClass: 'text-blue-700 bg-blue-100',
		badgeIcon: 'i-heroicons-document-text',
		badgeKey: 'home.services.prep',
		pointKeys: [
			'home.services.quizPoint1',
			'home.services.quizPoint2',
			'home.services.quizPoint3'
		]
	},
	[SERVICE_TAGS.SPECIAL]: {
		accent: 'bg-emerald-50 text-emerald-600',
		ctaKey: 'home.services.special',
		badgeClass: 'text-emerald-700 bg-emerald-100',
		badgeIcon: 'i-heroicons-sparkles',
		badgeKey: 'home.services.popular',
		pointKeys: [
			'home.services.specialPoint1',
			'home.services.specialPoint2',
			'home.services.specialPoint3'
		]
	},
	[SERVICE_TAGS.BEHAVIOR]: {
		accent: 'bg-violet-50 text-violet-600',
		ctaKey: 'home.services.behavior',
		badgeClass: 'text-violet-700 bg-violet-100',
		badgeIcon: 'i-heroicons-chat-bubble-left-right',
		badgeKey: 'home.services.assessment',
		pointKeys: [
			'home.services.behaviorPoint1',
			'home.services.behaviorPoint2',
			'home.services.behaviorPoint3'
		]
	}
}

const serviceOptions = computed(() =>
	serviceHighlights.map((item) => ({
		...item,
		title: t(
			`home.services.${item.id === SERVICE_TAGS.RESUME ? 'quiz' : item.id === SERVICE_TAGS.SPECIAL ? 'special' : 'behavior'}`
		),
		description: t(
			`home.services.${item.id === SERVICE_TAGS.RESUME ? 'quizDesc' : item.id === SERVICE_TAGS.SPECIAL ? 'specialDesc' : 'behaviorDesc'}`
		),
		badge: t(serviceOptionMeta[item.id]?.badgeKey),
		points: serviceOptionMeta[item.id]?.pointKeys.map((key) => t(key)),
		accent: serviceOptionMeta[item.id]?.accent || 'bg-gray-100 text-gray-500',
		cta: t(serviceOptionMeta[item.id]?.ctaKey),
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
			await router.push(target)
		} else {
			toast.add({
				title: t('interview.start.unavailable'),
				description: t('interview.start.unavailableDesc'),
				color: 'warning'
			})
		}
	}

	controller = globalModal.showModal({
		title: t('interview.start.selectNext'),
		description: t('interview.start.selectNextDesc'),
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
			title: t('interview.start.prompt'),
			content: t('interview.start.required')
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
