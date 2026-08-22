<template>
	<div class="p-5 border-t border-gray-100 bg-gray-50/50">
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<div
					class="flex items-center gap-2 text-neutral-800 font-medium text-sm"
				>
					<UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-amber-500" />
					面试小贴士
				</div>

				<div class="text-xs text-neutral-500 flex items-center gap-2">
					<UIcon name="i-heroicons-clock" class="w-4 h-4 text-primary-500" />
					平均面试时长 {{ rangeTime }} 分钟
				</div>
			</div>
			<div
				class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-xs text-neutral-600 space-y-2"
			>
				<div class="flex gap-2 items-start">
					<span
						class="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"
					></span>
					<p>回答问题时请尽量清晰、有条理</p>
				</div>
				<div class="flex gap-2 items-start">
					<span
						class="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"
					></span>
					<p>
						推荐使用
						<StarMethodModal />
						法则来描述您的经历
					</p>
				</div>
				<div class="flex gap-2 items-start">
					<span
						class="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"
					></span>
					<p>保持自信，像真实的面试一样交流</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
defineProps({
	rangeTime: {
		type: Number,
		default: 60
	}
})
</script>
