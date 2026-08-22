<template>
	<div class="space-y-4">
		<div
			class="rounded-lg border border-gray-100 bg-gray-50 max-h-72 overflow-auto"
		>
			<div
				class="text-sm leading-relaxed whitespace-pre-wrap text-neutral-700"
				v-html="marked.parse(interviewStore.referenceAnswer[index])"
			></div>
		</div>
	</div>
</template>

<script setup>
import { useInterviewStore } from '@/stores/interview'
import { marked } from 'marked'
const props = defineProps({
	questionContent: { type: String, required: true }
})

const interviewStore = useInterviewStore()

// 找到所有的面试官提出的问题
const interviewerMessages = interviewStore.messages.filter(
	(message) => message.role === 'interviewer'
)
// 根据问题，找到对应的 下标， 问题的下标和 答案的下标一定是对应的
const index = interviewerMessages.findIndex(
	(item) => item.content === props.questionContent
)
</script>

<style scoped></style>
