<template>
	<span
		class="cursor-pointer text-emerald-500 font-bold underline decoration-dotted"
		@click="isOpen = true"
	>
		STAR
	</span>
	<UModal
		v-model:open="isOpen"
		:title="$t('star.title')"
		:description="$t('star.description')"
	>
		<template #body>
			<div class="space-y-3 text-sm text-neutral-700">
				<p>
					STAR
					{{ $t('star.intro') }}
				</p>
				<ul class="list-disc list-inside space-y-1">
					<li>
						<span class="font-semibold text-neutral-900">{{
							$t('star.situation')
						}}</span
						>: {{ $t('star.situationDesc') }}
					</li>
					<li>
						<span class="font-semibold text-neutral-900">{{
							$t('star.task')
						}}</span
						>: {{ $t('star.taskDesc') }}
					</li>
					<li>
						<span class="font-semibold text-neutral-900">{{
							$t('star.action')
						}}</span
						>: {{ $t('star.actionDesc') }}
					</li>
					<li>
						<span class="font-semibold text-neutral-900">{{
							$t('star.result')
						}}</span
						>: {{ $t('star.resultDesc') }}
					</li>
				</ul>
				<p class="text-xs text-neutral-500">
					{{ $t('star.tip') }}
				</p>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
</script>

<style scoped></style>
