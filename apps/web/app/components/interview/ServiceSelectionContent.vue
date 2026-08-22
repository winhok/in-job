<template>
	<div class="space-y-4">
		<p class="text-xs text-neutral-500">
			请选择本次练习的服务类型，每项都会引导至对应的体验流程。
		</p>
		<div class="grid gap-3">
			<button
				v-for="option in options"
				:key="option.id"
				type="button"
				class="text-left rounded-2xl border border-gray-200 bg-white px-4 py-4 transition-all hover:border-primary-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
				@click="handleSelect(option.id)"
			>
				<div class="flex items-start gap-3">
					<div
						class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
						:class="option.accent"
					>
						<UIcon :name="option.icon" class="w-5 h-5" />
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<p class="text-base font-semibold text-neutral-900">
								{{ option.title }}
							</p>
							<span
								v-if="option.badge"
								class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
								:class="option.badgeClass"
							>
								<UIcon
									v-if="option.badgeIcon"
									:name="option.badgeIcon"
									class="w-3.5 h-3.5"
								/>
								{{ option.badge }}
							</span>
						</div>
						<p class="text-sm text-neutral-500 leading-relaxed line-clamp-2">
							{{ option.description }}
						</p>
						<ul
							v-if="option.points?.length"
							class="mt-3 space-y-1.5 text-xs text-neutral-500"
						>
							<li
								v-for="(point, idx) in option.points"
								:key="`${option.id}-${idx}`"
								class="flex items-center gap-2"
							>
								<span class="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
								<span>{{ point }}</span>
							</li>
						</ul>
						<div
							class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary-600"
						>
							{{ option.cta || '进入服务流程' }}
							<UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5" />
						</div>
					</div>
				</div>
			</button>
		</div>
	</div>
</template>

<script setup>
const props = defineProps({
	options: {
		type: Array,
		default: () => []
	},
	onSelect: {
		type: Function,
		default: null
	}
})

const handleSelect = (serviceId) => {
	console.log('serviceId', serviceId)

	props.onSelect?.(serviceId)
}
</script>
