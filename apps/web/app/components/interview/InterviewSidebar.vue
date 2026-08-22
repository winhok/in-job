<template>
	<div class="relative">
		<!-- Toggle Button -->
		<button
			class="absolute right-0 translate-x-[50%] top-[50%] translate-y-[-50%] z-30 w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition-all duration-300"
			@click="toggleSidebar"
		>
			<UIcon
				:name="
					interviewStore.isSidebarOpen
						? 'i-heroicons-chevron-left'
						: 'i-heroicons-bars-3'
				"
				class="w-5 h-5 text-slate-600"
			/>
		</button>

		<!-- Sidebar -->
		<aside
			class="h-full bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-[width] duration-300 ease-in-out will-change-[width] overflow-hidden"
			:class="interviewStore.isSidebarOpen ? 'w-65 lg:w-72' : 'w-0 border-r-0'"
		>
			<!-- Width container to prevent content squeezing during transition -->
			<div class="w-65 lg:w-72 h-full flex flex-col">
				<!-- Header -->
				<div class="py-6 px-4 pb-2">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-200"
						>
							<UIcon name="i-heroicons-academic-cap" class="w-6 h-6" />
						</div>
						<div>
							<h1 class="font-bold text-slate-900 text-lg leading-tight mb-1">
								面试汪：全链路 AI 服务
							</h1>
							<p class="text-xs text-slate-500">押题·模拟·行测 三位一体</p>
						</div>
					</div>

					<div class="px-1">
						<h2
							class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4"
						>
							极简三步，快速开始
						</h2>
					</div>
				</div>

				<!-- Stepper -->
				<nav
					class="flex-1 overflow-y-auto px-4 pt-1 space-y-1 custom-scrollbar"
				>
					<div
						v-for="(step, index) in steps"
						:key="step.id"
						class="relative pb-8 last:pb-0"
					>
						<!-- Connecting Line -->
						<div
							v-if="index !== steps.length - 1"
							class="absolute top-8 left-4 bottom-0 w-px bg-slate-100 -ml-0.5"
							:class="{
								'bg-primary-100': isAllowClick(step)
							}"
						></div>

						<div
							class="group w-full text-left relative z-10 flex gap-4 transition-opacity"
							:class="[
								isAllowClick(step)
									? 'cursor-pointer hover:opacity-80'
									: 'cursor-not-allowed opacity-70'
							]"
							@click="handleStepClick(step.id)"
						>
							<!-- Icon/Number -->
							<div
								class="shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 bg-white"
								:class="[
									step.id === interviewStore.currentStep
										? 'border-primary-600 text-primary-600 shadow-md scale-110'
										: isAllowClick(step)
										? 'border-primary-200 bg-primary-50 text-primary-600'
										: 'border-slate-200 text-slate-300'
								]"
							>
								<UIcon
									v-if="isAllowClick(step)"
									name="i-heroicons-check"
									class="w-4 h-4"
								/>
								<UIcon
									v-else-if="!isAllowClick(step)"
									name="i-heroicons-lock-closed"
									class="w-3.5 h-3.5"
								/>
								<span v-else>{{ step.id }}</span>
							</div>

							<!-- Content -->
							<div class="pt-1">
								<h3
									class="text-sm font-semibold transition-colors duration-200"
									:class="[
										step.id === interviewStore.currentStep
											? 'text-slate-900'
											: isAllowClick(step)
											? 'text-slate-700'
											: 'text-slate-400'
									]"
								>
									{{ step.title }}
								</h3>
								<p
									class="text-xs mt-1 transition-colors duration-200 pr-2"
									:class="[
										step.id === interviewStore.currentStep
											? 'text-slate-500'
											: 'text-slate-400'
									]"
								>
									{{ step.summary }}
								</p>
							</div>
						</div>
					</div>
				</nav>

				<!-- Bottom Tips -->
				<div class="p-4 mt-auto">
					<div
						class="rounded-xl bg-linear-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg relative overflow-hidden group"
					>
						<!-- Decorative elements -->
						<div
							class="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:bg-white/10 transition-colors"
						></div>
						<div
							class="absolute bottom-0 left-0 w-20 h-20 bg-primary-500/20 rounded-full blur-xl transform -translate-x-8 translate-y-8"
						></div>

						<div class="relative z-10">
							<div class="flex items-center gap-2 mb-2 text-primary-300">
								<UIcon name="i-heroicons-light-bulb" class="w-4 h-4" />
								<span class="text-xs font-bold tracking-wider uppercase"
									>Tips</span
								>
							</div>
							<p class="text-sm font-medium leading-relaxed text-white/90">
								通过 AI 面试预演，提前暴露问题并快速迭代。
							</p>
							<div class="mt-3 flex flex-wrap gap-2">
								<span
									class="inline-flex items-center px-2 py-1 rounded bg-white/10 text-[10px] text-white/80 border border-white/10"
								>
									<StarMethodModal /> 法则
								</span>
								<span
									class="inline-flex items-center px-2 py-1 rounded bg-white/10 text-[10px] text-white/80 border border-white/10"
								>
									结构化回答
								</span>
							</div>
						</div>
					</div>

					<!-- Footer Info -->
					<div
						class="mt-4 px-2 flex justify-between items-center text-[10px] text-slate-400"
					>
						<span>© Resume Wang</span>
						<span>v1.0.0</span>
					</div>
				</div>
			</div>
		</aside>
	</div>
</template>

<script setup>
import { ref } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import { navigateTo, useRoute } from '#imports'
import { SERVICE_TAGS } from '@/constants/vip'
import { useGlobalModal } from '@/composables/useGlobalModal'
import { useToast } from '#imports'

const globalModal = useGlobalModal()
const interviewStore = useInterviewStore()
const route = useRoute()
const toast = useToast()

const steps = [
	{
		id: 1,
		title: '选择岗位与简历',
		summary: '定位目标岗位，导入简历'
	},
	{
		id: 2,
		title: '开启专项服务形态',
		summary: '根据不同服务形态，模拟真实场景'
	},
	{
		id: 3,
		title: '查看分析报告',
		summary: '多维度评估与提升计划'
	}
]

const toggleSidebar = () => {
	interviewStore.isSidebarOpen = !interviewStore.isSidebarOpen
}

/**
 * 是否允许点击
 */
const isAllowClick = (step) => {
	if (isHistory.value) {
		return false
	}
	return step.id <= interviewStore.currentStep
}

/**
 * 判断是否处于 押题进度条环节
 */
const isProgressing = computed(() => {
	return route.query.step === 'progress'
})

/**
 * 判断是否处于 面试中
 */
const isInterviewing = computed(() => {
	return (
		route.query.step === 'interview' &&
		route.query.resultId &&
		interviewStore.interviewStatus !== 'ended'
	)
})

/**
 * 判断是否处于历史记录中
 */
const isHistory = computed(() => {
	return route.query.history
})

/**
 * 处理步骤点击事件
 * 规则：
 * 1. 只能点击已完成或当前步骤
 * 2. Step 1: 总是跳转到 /interview/start
 * 3. Step 2: 根据选择的服务类型跳转到对应页面
 * 4. Step 3: 只有在报告生成后才能访问
 */
const handleStepClick = (stepId) => {
	if (isHistory.value) {
		return
	}

	// 当前处于押题进度条环节，不允许点击步骤
	if (isProgressing.value) {
		toast.add({
			title: '不要呀～～',
			description: '这时跳转会导致白白浪费一次押题机会哦～～',
			color: 'warning',
			icon: 'i-heroicons-lock-closed'
		})
		return
	}

	// 如果是在面试中，那么需要给用户提示，先结束面试
	if (isInterviewing.value) {
		toast.add({
			title: '请先结束面试，再进行跳转',
			description: '注意：中途结束面试，会导致消费一次面试机会哦～～',
			color: 'warning',
			icon: 'i-heroicons-lock-closed'
		})
		return
	}

	// 禁止点击未解锁的步骤
	if (stepId > interviewStore.currentStep) {
		toast.add({
			title: '不要着急嘛',
			description: '先把当前的步骤做完呗～',
			color: 'warning',
			icon: 'i-heroicons-lock-closed'
		})
		return
	}

	// Step 1: 返回开始页面
	if (stepId === 1) {
		navigateTo('/interview/start')
		return
	}

	// Step 2: 根据服务类型跳转
	if (stepId === 2) {
		const resultId = route.query.resultId
		const queryString = resultId ? `?resultId=${resultId}` : ''
		const serviceRouteMap = {
			[SERVICE_TAGS.SPECIAL]: `/interview?serviceType=special${
				queryString ? '&' + queryString.slice(1) : ''
			}`,
			[SERVICE_TAGS.RESUME]: `/interview?serviceType=resume${
				queryString ? '&' + queryString.slice(1) : ''
			}`,
			[SERVICE_TAGS.BEHAVIOR]: `/interview?serviceType=behavior${
				queryString ? '&' + queryString.slice(1) : ''
			}`
		}

		const targetPath = serviceRouteMap[interviewStore.selectedService]

		if (!targetPath) {
			toast.add({
				title: '未选择服务',
				description: '请先在第一步选择服务类型',
				color: 'warning'
			})
			navigateTo('/interview/start')
			return
		}

		// 避免重复跳转到当前页面
		if (route.path !== targetPath) {
			navigateTo(targetPath)
		}
		return
	}

	// Step 3: 跳转到报告页面
	if (stepId === 3) {
		// 检查报告是否已生成
		if (!interviewStore.report || !interviewStore.reportGenerated) {
			toast.add({
				title: '报告未生成',
				description: '请先完成面试以生成报告',
				color: 'warning',
				icon: 'i-heroicons-document-text'
			})
			return
		}

		// 避免重复跳转到当前页面
		if (route.path !== '/interview/report') {
			navigateTo('/interview/report')
		}
		return
	}
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: #94a3b8;
}
</style>
