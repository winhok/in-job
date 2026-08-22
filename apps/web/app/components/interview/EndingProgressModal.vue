<template>
	<div class="space-y-5">
		<div class="flex items-center gap-2">
			<UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-indigo-600" />
			<div class="text-sm text-neutral-700">正在生成面试报告</div>
			<div class="ml-auto text-xs text-neutral-400">{{ percent }}%</div>
		</div>

		<UProgress :value="percent" />

		<div class="text-xs text-neutral-400">预计约 7 秒完成</div>

		<div class="grid gap-3">
			<div
				class="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
				:class="step >= 1 ? 'bg-primary-50' : 'bg-white'"
			>
				<UIcon
					:name="
						step > 1
							? 'i-heroicons-check-circle'
							: step === 1
							? 'i-heroicons-arrow-path'
							: 'i-heroicons-clock'
					"
					:class="[
						'w-5 h-5',
						step > 1
							? 'text-green-600'
							: step === 1
							? 'text-indigo-600 animate-spin'
							: 'text-neutral-400'
					]"
				/>
				<div
					:class="
						step >= 1 ? 'text-primary-600 font-medium' : 'text-neutral-600'
					"
				>
					正在保存面试问题
				</div>
			</div>

			<div
				class="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
				:class="step >= 2 ? 'bg-primary-50' : 'bg-white'"
			>
				<UIcon
					:name="
						step > 2
							? 'i-heroicons-check-circle'
							: step === 2
							? 'i-heroicons-arrow-path'
							: 'i-heroicons-clock'
					"
					:class="[
						'w-5 h-5',
						step > 2
							? 'text-green-600'
							: step === 2
							? 'text-indigo-600 animate-spin'
							: 'text-neutral-400'
					]"
				/>
				<div
					:class="
						step >= 2 ? 'text-primary-600 font-medium' : 'text-neutral-600'
					"
				>
					正在生成面试标准答案
				</div>
			</div>

			<div
				class="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
				:class="step >= 3 ? 'bg-primary-50' : 'bg-white'"
			>
				<UIcon
					:name="
						step > 3
							? 'i-heroicons-check-circle'
							: step === 3
							? 'i-heroicons-arrow-path'
							: 'i-heroicons-clock'
					"
					:class="[
						'w-5 h-5',
						step > 3
							? 'text-green-600'
							: step === 3
							? 'text-indigo-600 animate-spin'
							: 'text-neutral-400'
					]"
				/>
				<div
					:class="
						step >= 3 ? 'text-primary-600 font-medium' : 'text-neutral-600'
					"
				>
					正在准备面试结果数据
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useGlobalModal } from '@/composables/useGlobalModal'

const props = defineProps({
	onFinished: { type: Function, required: true }
})

const percent = ref(0)
const step = ref(0)

onMounted(async () => {
	step.value = 1
	await new Promise((r) => setTimeout(r, 2200))
	percent.value = 34
	step.value = 2
	await new Promise((r) => setTimeout(r, 2300))
	percent.value = 67
	step.value = 3
	await new Promise((r) => setTimeout(r, 2500))
	percent.value = 100

	try {
		await props.onFinished()
	} finally {
		const gm = useGlobalModal()
		gm.closeModal('completed')
	}
})
</script>

<style scoped></style>
