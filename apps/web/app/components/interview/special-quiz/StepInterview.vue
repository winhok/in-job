<template>
	<div class="h-full flex flex-col gap-6">
		<div
			class="grid lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-6 flex-1 min-h-0"
		>
			<!-- 左侧：对话区域（占2列） -->
			<AIDialogue
				ref="AIDialogueRef"
				:service-type="serviceType"
				@endInterview="$emit('endInterview', $event)"
			/>

			<!-- 右侧：3D 数字人（占1列） -->
			<ThreeDDigitalPeople :service-type="serviceType" />
		</div>

		<!-- 倒计时遮罩 -->
		<div
			v-if="showCountdown"
			class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white"
		>
			<div class="text-9xl font-bold mb-12 animate-pulse text-primary-400">
				{{ countdown }}
			</div>
			<div class="text-3xl font-medium tracking-wider animate-bounce">
				面试中请保持网络稳定，如遇网络波动导致面试中断，可刷新页面继续进行面试
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import { useGlobalModal } from '@/composables/useGlobalModal'
import ThreeDDigitalPeople from '@/components/interview/3DDigitalPeople.vue'
import AIDialogue from '@/components/interview/AIDialogue.vue'

defineProps({
	serviceType: {
		type: String,
		required: true
	}
})

const emit = defineEmits(['handleEndInterview', 'interviewCompleted'])

const interviewStore = useInterviewStore()

const globalModal = useGlobalModal()

const showCountdown = ref(false)
const countdown = ref(5)

const AIDialogueRef = ref(null)

const startCountdown = () => {
	showCountdown.value = true
	countdown.value = 5
	const timer = setInterval(() => {
		countdown.value--
		if (countdown.value <= 0) {
			clearInterval(timer)
			showCountdown.value = false
			AIDialogueRef.value.startInterview()
		}
	}, 1000)
}

onMounted(() => {
	// 只有空闲状态才需要进行这样的提示
	if (interviewStore.interviewStatus === 'starting') {
		// 改变面试的状态标记
		interviewStore.interviewStatus = 'starting'
		// 开始倒计时
		startCountdown()
	}
})
</script>

<style scoped>
@keyframes bounce {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10px);
	}
}
</style>
