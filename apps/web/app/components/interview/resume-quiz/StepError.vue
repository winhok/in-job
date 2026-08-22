<template>
	<div
		class="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm p-8"
	>
		<div class="w-full max-w-md text-center space-y-6">
			<!-- 错误图标 -->
			<div class="relative inline-block">
				<div
					class="w-24 h-24 mx-auto bg-red-50 rounded-full flex items-center justify-center relative z-10"
				>
					<UIcon
						name="i-heroicons-exclamation-triangle"
						class="w-12 h-12 text-red-500"
					/>
				</div>
				<!-- 装饰光晕 -->
				<div
					class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-400/20 rounded-full animate-pulse"
				></div>
			</div>

			<div class="space-y-2">
				<h2 class="text-xl font-bold text-neutral-900">服务器压力过大</h2>
				<p class="text-neutral-600">
					AI 正在处理大量请求，暂时无法响应。<br />
					<span class="text-green-600 font-medium">本次押题消费已自动返还</span
					>，请稍后再试。
				</p>
			</div>

			<div class="pt-4">
				<UButton
					size="xl"
					color="primary"
					class="px-8 shadow-lg shadow-primary-500/20"
					@click="handleRetry"
				>
					<UIcon name="i-heroicons-arrow-path" class="w-5 h-5 mr-2" />
					重新押题
				</UButton>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useInterviewStore } from '@/stores/interview'
import { navigateTo } from '#imports'

const interviewStore = useInterviewStore()

const handleRetry = () => {
	// 清空选择的所有内容
	interviewStore.reset()
	// 跳转到选择岗位页面
	navigateTo('/interview/start')
}
</script>
