<template>
	<div class="p-5 border-t border-gray-100 bg-gray-50/50">
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<div
					class="flex items-center gap-2 text-neutral-800 font-medium text-sm"
				>
					<UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-amber-500" />
					{{ $t('interview.tips.title') }}
				</div>

				<div class="text-xs text-neutral-500 flex items-center gap-2">
					<UIcon name="i-heroicons-clock" class="w-4 h-4 text-primary-500" />
					{{ $t('interview.tips.duration', { minutes: rangeTime }) }}
				</div>
			</div>
			<div
				class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-xs text-neutral-600 space-y-2"
			>
				<div class="flex gap-2 items-start">
					<span
						class="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"
					></span>
					<p>{{ $t('interview.tips.clear') }}</p>
				</div>
				<div class="flex gap-2 items-start">
					<span
						class="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"
					></span>
					<p>{{ $t('interview.tips.star') }}</p>
				</div>
				<div class="flex gap-2 items-start">
					<span
						class="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"
					></span>
					<p>{{ $t('interview.tips.confidence') }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps({
	rangeTime: {
		type: Number,
		default: 60
	}
})
</script>
