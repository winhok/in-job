<template>
	<div
		class="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/90 backdrop-blur-sm px-6 py-3 shadow-lg shadow-neutral-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-200/30 hover:-translate-y-1"
	>
		<!-- 背景装饰 -->
		<div
			class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary-400/10 blur-2xl transition-all duration-500 group-hover:bg-primary-400/20"
		></div>
		<div
			class="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-xl transition-all duration-500 group-hover:bg-emerald-400/20"
		></div>

		<div class="relative flex justify-between">
			<!-- 标题和图标 -->
			<div class="flex items-center gap-2">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
				>
					<UIcon name="i-heroicons-users" class="h-5 w-5" />
				</div>
				<div>
					<p class="text-xs font-medium text-neutral-500">实时在线</p>
					<p class="text-xs text-neutral-400">正在模拟面试</p>
				</div>
			</div>

			<!-- 数字展示 -->
			<div class="">
				<div
					v-if="count !== null"
					class="flex items-baseline gap-2"
					:class="{ 'count-pulse': countUpdated }"
				>
					<span
						class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-600 transition-all duration-300"
					>
						{{ count }}
					</span>
					<span class="text-sm font-semibold text-neutral-500">位同学</span>
				</div>
				<div v-else class="flex items-center gap-2">
					<div
						class="h-10 w-20 animate-pulse rounded-lg bg-gradient-to-r from-neutral-200 to-neutral-100"
					></div>
					<span class="text-sm text-neutral-400">加载中...</span>
				</div>
			</div>
		</div>

		<!-- 装饰性边框动画 -->
		<div
			class="absolute inset-0 rounded-2xl border-2 border-primary-500/0 transition-all duration-300 group-hover:border-primary-500/20"
		></div>
	</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useNuxtApp } from '#imports'
import { getMockInterviewCountAPI } from '@/api/admin'

const { $api } = useNuxtApp()

const count = ref(null)
const countUpdated = ref(false)

// 获取数据
const fetchData = async () => {
	try {
		const response = await getMockInterviewCountAPI($api)
		const newCount = response.count

		// 如果数字发生变化，触发更新动画
		if (count.value !== null && count.value !== newCount) {
			countUpdated.value = true
			setTimeout(() => {
				countUpdated.value = false
			}, 600)
		}

		count.value = newCount
	} catch (err) {
		console.error('获取模拟面试人数失败:', err)
	}
}

// 自动刷新定时器
let refreshTimer = null

// 启动自动刷新（每30秒刷新一次）
const startAutoRefresh = () => {
	if (refreshTimer) {
		clearInterval(refreshTimer)
	}
	refreshTimer = setInterval(() => {
		fetchData()
	}, 30000) // 30秒
}

// 停止自动刷新
const stopAutoRefresh = () => {
	if (refreshTimer) {
		clearInterval(refreshTimer)
		refreshTimer = null
	}
}

onMounted(() => {
	fetchData()
	startAutoRefresh()
})

onBeforeUnmount(() => {
	stopAutoRefresh()
})
</script>

<style scoped>
/* 数字更新时的脉冲动画 */
@keyframes count-pulse {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
	100% {
		transform: scale(1);
	}
}

.count-pulse {
	animation: count-pulse 0.6s ease-out;
}
</style>
