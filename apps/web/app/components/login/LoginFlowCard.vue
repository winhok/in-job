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
						{{ $t('login.flowLabel') }}
					</p>
					<h2 class="text-lg font-semibold text-white">
						{{ $t('login.flowTitle') }}
					</h2>
				</div>
			</div>
			<p class="text-sm text-white/70 md:max-w-xs lg:max-w-sm">
				{{ $t('login.flowDesc') }}
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

<script setup lang="ts">
import { computed } from 'vue'

const { t } = useI18n()
const steps = computed(() => [
	{
		title: t('login.step1'),
		description: t('login.step1Desc'),
		icon: 'i-heroicons-briefcase'
	},
	{
		title: t('login.step2'),
		description: t('login.step2Desc'),
		icon: 'i-heroicons-chat-bubble-left-right'
	},
	{
		title: t('login.step3'),
		description: t('login.step3Desc'),
		icon: 'i-heroicons-presentation-chart-bar'
	}
])
</script>

<style scoped></style>
