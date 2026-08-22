<template>
	<section
		class="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-[0px_30px_80px_rgba(15,23,42,0.35)] backdrop-blur-md"
	>
		<div
			class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
		>
			<div class="flex items-center gap-3">
				<div
					class="inline-flex p-2 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner shadow-primary/20"
				>
					<UIcon name="i-heroicons-map" class="h-6 w-6" />
				</div>
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-white/50">
						极简流程
					</p>
					<h2 class="text-lg font-semibold text-white">
						3 步完成你的 AI 面试训练
					</h2>
				</div>
			</div>
			<p class="text-sm text-white/70 md:max-w-xs lg:max-w-sm">
				一次扫码即可同步历史数据，无需繁琐配置。极简三步，即刻进入真实面试场景。
			</p>
		</div>
		<div class="mt-6 grid gap-4 sm:grid-cols-3">
			<div
				v-for="(step, index) in steps"
				:key="step.title"
				class="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 text-white/80 transition hover:border-primary/40 hover:bg-white/10"
			>
				<div class="flex items-center gap-3">
					<div
						class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<UIcon :name="step.icon" class="h-5 w-5" />
					</div>
					<span class="text-xs text-white/60">Step {{ index + 1 }}</span>
				</div>
				<div>
					<h3 class="text-sm font-medium text-white">{{ step.title }}</h3>
					<p class="mt-1 text-xs leading-relaxed text-white/70">
						{{ step.description }}
					</p>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
const steps = [
	{
		title: '选择岗位与目标',
		description: '设置目标岗位/公司，并导入简历，系统自动生成专属题集。',
		icon: 'i-heroicons-briefcase'
	},
	{
		title: '开启多轮模拟面试',
		description: 'AI 面试官进行追问与反问，贴近真实场景，可选语音或文本作答。',
		icon: 'i-heroicons-chat-bubble-left-right'
	},
	{
		title: '获取结构化反馈',
		description: '生成能力雷达、风险点与改进建议，支持导出练习计划。',
		icon: 'i-heroicons-presentation-chart-bar'
	}
] 
</script>

<style scoped></style>
