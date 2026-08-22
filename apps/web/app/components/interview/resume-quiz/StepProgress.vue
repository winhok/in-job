<template>
	<div
		class="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm p-8"
	>
		<div class="w-full max-w-md space-y-8 text-center">
			<div class="relative">
				<div
					class="w-24 h-24 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-6 relative z-10"
				>
					<UIcon
						name="i-heroicons-cpu-chip"
						class="w-12 h-12 text-primary-500 animate-pulse"
					/>
				</div>
				<!-- 脉冲波纹动画 -->
				<div
					class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary-400/20 rounded-full animate-ping"
				></div>
			</div>

			<h2 class="text-xl font-bold text-neutral-900">
				{{ currentProgressStep.label }}
			</h2>

			<div class="space-y-2">
				<UProgress
					:value="currentProgressStep.progress"
					color="success"
					indicator
				/>
				<div
					class="flex items-center justify-between text-xs text-neutral-500 pt-1"
				>
					<span class="flex items-center gap-1.5">
						<UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
						预计耗时 5 - 7 分钟
					</span>
					<span class="flex items-center gap-2">
						<span class="font-mono">已耗时 {{ formattedElapsedTime }}</span>
						<span class="text-gray-300">|</span>
						<span>{{ currentProgressStep.progress.toFixed(0) }}%</span>
					</span>
				</div>
			</div>

			<!-- 步骤列表：只显示去重后的关键步骤 -->
			<div
				ref="progressStepsContainer"
				class="flex flex-col gap-3 pt-4 h-[260px] overflow-y-auto custom-scrollbar scroll-smooth"
			>
				<div
					v-for="(s, index) in uniqueProgressSteps"
					:key="index"
					class="flex items-center gap-3 text-sm transition-colors duration-300"
					:class="
						index < uniqueProgressSteps.length - 1
							? 'text-neutral-700'
							: 'text-primary-600'
					"
				>
					<div
						class="w-6 h-6 rounded-full flex items-center justify-center border text-xs shrink-0"
						:class="
							index < uniqueProgressSteps.length - 1
								? 'bg-primary-500 border-primary-500 text-white'
								: 'border-primary-500 text-primary-600 bg-white animate-pulse'
						"
					>
						<UIcon
							v-if="index < uniqueProgressSteps.length - 1"
							name="i-heroicons-check"
							class="w-3.5 h-3.5"
						/>
						<span v-else>
							<UIcon
								name="i-heroicons-arrow-path"
								class="w-3.5 h-3.5 animate-spin"
							/>
						</span>
					</div>
					<span class="text-left">{{ s.label }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

defineProps({
	currentProgressStep: {
		type: Object,
		required: true
	},
	uniqueProgressSteps: {
		type: Array,
		required: true
	}
})

// 计时逻辑
const elapsedSeconds = ref(0)
let timer = null

const formattedElapsedTime = computed(() => {
	const m = Math.floor(elapsedSeconds.value / 60)
	const s = elapsedSeconds.value % 60
	return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

onMounted(() => {
	timer = setInterval(() => {
		elapsedSeconds.value++
	}, 1000)
})

onUnmounted(() => {
	if (timer) clearInterval(timer)
})

const progressStepsContainer = ref(null)

defineExpose({
	progressStepsContainer
})
</script>
