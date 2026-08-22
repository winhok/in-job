<template>
	<span
		class="cursor-pointer text-emerald-500 font-bold underline decoration-dotted"
		@click="isOpen = true"
	>
		STAR
	</span>
	<UModal
		v-model:open="isOpen"
		title="STAR 法则"
		description="结构化回答行为类面试题的方法"
	>
		<template #body>
			<div class="space-y-3 text-sm text-neutral-700">
				<p>
					STAR
					是回答行为类问题的通用框架，通过清晰的情境、任务、行动、结果来展示你的能力与影响力。
				</p>
				<ul class="list-disc list-inside space-y-1">
					<li>
						<span class="font-semibold text-neutral-900"
							>S · Situation（情境）</span
						>：交代背景与环境，说明当时的场景与限制。
					</li>
					<li>
						<span class="font-semibold text-neutral-900"
							>T · Task（任务）</span
						>：明确你的目标或职责，为何必须解决这个问题。
					</li>
					<li>
						<span class="font-semibold text-neutral-900"
							>A · Action（行动）</span
						>：具体描述你采取了哪些措施、方法与思考过程。
					</li>
					<li>
						<span class="font-semibold text-neutral-900"
							>R · Result（结果）</span
						>：量化成果与影响，总结复盘与经验。
					</li>
				</ul>
				<p class="text-xs text-neutral-500">
					小提示：尽量量化结果（如提升 30% 效率），并突出个人贡献与协作方式。
				</p>
			</div>
		</template>
	</UModal>
</template>

<script setup>
import { ref } from 'vue'

const isOpen = ref(false)
</script>

<style scoped></style>
