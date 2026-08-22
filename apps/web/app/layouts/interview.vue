<template>
	<UApp :toaster="{ position: 'top-right' }">
		<div class="h-screen bg-slate-50 flex overflow-hidden font-sans">
			<!-- Sidebar -->
			<InterviewSidebar />
			<!-- Main Content -->
			<main class="flex-1 min-w-0 bg-slate-50 flex flex-col h-full relative">
				<!-- Top Navigation / Status Bar -->
				<header
					class="h-16 px-6 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm flex items-center justify-between shrink-0 sticky top-0 z-20"
				>
					<div class="flex items-center gap-2 text-slate-500 text-sm">
						<NuxtLink
							@click="onGoHome"
							class="hover:text-primary-600 transition-colors flex items-center gap-1"
						>
							<UIcon name="i-heroicons-home" class="w-4 h-4" />
							首页
						</NuxtLink>
						<span class="text-slate-300">/</span>
						<NuxtLink
							@click="onGoStart"
							class="hover:text-primary-600 transition-colors flex items-center gap-1"
						>
							{{ isHistory ? '查看服务记录' : '开始专项服务' }}
						</NuxtLink>
						<span class="text-slate-300">/</span>
						<span class="text-slate-900 font-medium">{{ pageTitle }}</span>
					</div>

					<div class="flex items-center gap-4">
						<div
							class="text-xs text-slate-400 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200"
						>
							<span
								class="w-2 h-2 rounded-full bg-green-500 animate-pulse"
							></span>
							AI 服务在线
						</div>
					</div>
				</header>

				<!-- Content Area -->
				<div class="flex-1 overflow-auto relative w-full flex flex-col">
					<div class="flex-1 overflow-hidden px-4 py-2 lg:px-8 lg:py-2">
						<div class="max-w-[1600px] mx-auto h-full w-full">
							<slot />
						</div>
					</div>
				</div>
			</main>
		</div>
	</UApp>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, navigateTo, useToast } from '#imports'
import { useInterviewStore } from '@/stores/interview'
import { useUserStore } from '@/stores/user'
import { SERVICE_TAGS, serviceHighlights } from '@/constants/vip'
import InterviewSidebar from '@/components/interview/InterviewSidebar.vue'
import { getUserInfoAPI } from '@/api/user'
import { isEmpty } from '@/utils'

const route = useRoute()
const toast = useToast()
const interviewStore = useInterviewStore()
const userStore = useUserStore()
const { $api } = useNuxtApp()

// 页面标题映射
const pageTitle = computed(() => {
	if (route.path === '/interview/start') {
		return '选择岗位与简历'
	}

	// 处理统一的 /interview 页面
	if (route.path === '/interview' || route.path === '/interview/') {
		const serviceType = route.query.serviceType
		if (serviceType === SERVICE_TAGS.RESUME) {
			return serviceHighlights[0].title
		} else if (serviceType === SERVICE_TAGS.SPECIAL) {
			return serviceHighlights[1].title
		} else if (serviceType === SERVICE_TAGS.BEHAVIOR) {
			return serviceHighlights[2].title
		} else {
			return '未知路径'
		}
	}
})

// 服务路径与服务类型的映射
const serviceRouteMap = {
	'/interview/special': SERVICE_TAGS.SPECIAL,
	'/interview/resume': SERVICE_TAGS.RESUME,
	'/interview/behavior': SERVICE_TAGS.BEHAVIOR,
	'/interview': null // 统一页面，从 query 参数获取
}

// 获取用户信息
const fetchUserInfo = async () => {
	try {
		const userInfo = await getUserInfoAPI($api)
		userStore.updateUserInfo(userInfo)
		console.log('用户信息已更新:', userInfo)
	} catch (error) {
		console.error('获取用户信息失败:', error)
	}
}

// 统一的路由守卫逻辑
onMounted(() => {
	const currentPath = route.path

	// 获取用户信息
	fetchUserInfo()

	// 报告页面守卫
	if (currentPath === '/interview/report') {
		// 检查是否包含 resultId 参数
		if (!route.query.resultId) {
			// 根据当前选择的服务跳转到对应的面试页面
			const serviceTypeMap = {
				[SERVICE_TAGS.SPECIAL]: `/interview?serviceType=special&step=interview`,
				[SERVICE_TAGS.RESUME]: `/interview?serviceType=resume&step=input`,
				[SERVICE_TAGS.BEHAVIOR]: `/interview?serviceType=behavior&step=interview`
			}
			const targetPath =
				serviceTypeMap[interviewStore.selectedService] || '/interview/start'
			navigateTo(targetPath)
			return
		}
	}

	// 服务页面守卫（统一的 /interview 页面）
	if (currentPath === '/interview' || currentPath === '/interview/') {
		// 检查是否已选择岗位
		if (isEmpty(interviewStore.selectedPosition) && !route.query.resultId) {
			navigateTo('/interview/start')
			return
		}

		// 获取服务类型并检查是否匹配
		const serviceType = route.query.serviceType
		if (
			serviceType &&
			interviewStore.selectedService !== serviceType &&
			!route.query.resultId
		) {
			navigateTo('/interview/start')
			return
		}
	}

	// 旧的服务页面守卫（special/resume/behavior）- 兼容性保留
	const requiredService = serviceRouteMap[currentPath]
	if (requiredService) {
		// 检查是否已选择岗位
		if (isEmpty(interviewStore.selectedPosition)) {
			navigateTo('/interview/start')
			return
		}

		// 检查服务类型是否匹配
		if (interviewStore.selectedService !== requiredService) {
			navigateTo('/interview/start')
			return
		}
	}
})

// 监听路由变化，每次跳转都获取用户信息
watch(
	() => route.path,
	(newPath, oldPath) => {
		// 只在 interview 路径下的跳转才获取
		if (newPath.startsWith('/interview/') && newPath !== oldPath) {
			console.log(`路由从 ${oldPath} 跳转到 ${newPath}，获取用户信息`)
			fetchUserInfo()
		}
	}
)

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

const onGoHome = () => {
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

	navigateTo('/')
}

const onGoStart = () => {
	if (isHistory.value) {
		navigateTo('/history')
		return
	}

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

	navigateTo('/interview/start')
}
</script>

<style scoped></style>
