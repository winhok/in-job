<template>
	<section class="container py-12">
		<div class="mb-8 text-center">
			<h1 class="text-3xl md:text-4xl font-bold text-neutral-900">
				{{ $t('faq.title') }}
			</h1>
			<p class="mt-3 text-neutral-600 max-w-2xl mx-auto">
				{{ $t('faq.description') }}
			</p>
		</div>
		<div class="max-w-4xl mx-auto">
			<UInput
				v-model="searchQuery"
				:placeholder="$t('faq.search')"
				size="lg"
				icon="i-heroicons-magnifying-glass"
				class="w-full mb-8"
			/>
			<div class="flex flex-wrap gap-2 mb-8 justify-center">
				<UButton
					v-for="category in categories"
					:key="category.key"
					:variant="activeCategory === category.key ? 'solid' : 'ghost'"
					:color="activeCategory === category.key ? 'primary' : 'gray'"
					size="sm"
					@click="activeCategory = category.key"
				>
					{{ category.label }}
				</UButton>
			</div>
			<UAccordion
				:items="filteredFaqs"
				class="space-y-3"
				:ui="{
					trigger: { padding: 'px-5 py-4' },
					label: 'text-base font-semibold text-neutral-900',
					content: {
						base: 'px-5 text-sm text-neutral-600 leading-relaxed whitespace-pre-line',
						padding: 'pb-5 pt-0'
					},
					item: 'rounded-xl border border-gray-200 bg-white shadow-sm'
				}"
			>
				<template #leading="{ item }">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg"
						:class="categoryStyle[item.category]?.background || 'bg-gray-100'"
					>
						<UIcon
							:name="
								categoryStyle[item.category]?.icon ||
								'i-heroicons-information-circle'
							"
							class="h-5 w-5"
							:class="
								categoryStyle[item.category]?.foreground || 'text-gray-600'
							"
						/>
					</div>
				</template>
			</UAccordion>
			<div v-if="filteredFaqs.length === 0" class="text-center py-12">
				<UIcon
					name="i-heroicons-question-mark-circle"
					class="w-16 h-16 text-neutral-300 mx-auto mb-4"
				/>
				<p class="text-neutral-500">{{ $t('faq.noResult') }}</p>
				<p class="text-sm text-neutral-400 mt-2">
					{{ $t('faq.noResultHint') }}
				</p>
			</div>
			<div
				class="mt-12 bg-primary-50 rounded-xl border border-primary-200 p-8 text-center"
			>
				<UIcon
					name="i-heroicons-chat-bubble-left-right"
					class="w-12 h-12 text-primary-600 mx-auto mb-4"
				/>
				<h2 class="text-xl font-semibold text-neutral-900 mb-2">
					{{ $t('faq.moreQuestions') }}
				</h2>
				<p class="text-neutral-600 mb-6">{{ $t('faq.support') }}</p>
				<div class="flex flex-col sm:flex-row gap-3 justify-center">
					<UButton color="primary" size="lg" to="/contact" class="text-white">{{
						$t('nav.contact')
					}}</UButton>
					<UButton color="gray" variant="ghost" size="lg" to="/">{{
						$t('nav.home')
					}}</UButton>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getFaqContent } from '@/data/faq-content'

const { t, locale } = useI18n()
const searchQuery = ref('')
const activeCategory = ref('all')
const categories = computed(() =>
	['all', 'general', 'usage', 'features', 'pricing', 'security'].map((key) => ({
		key,
		label: t(`faq.${key}`)
	}))
)
const filteredFaqs = computed(() => {
	const query = searchQuery.value.trim().toLowerCase()
	return getFaqContent(locale.value).filter(
		(item) =>
			(activeCategory.value === 'all' ||
				item.category === activeCategory.value) &&
			(!query ||
				item.label.toLowerCase().includes(query) ||
				item.content.toLowerCase().includes(query))
	)
})
const categoryStyle = {
	general: {
		background: 'bg-blue-100',
		foreground: 'text-blue-600',
		icon: 'i-heroicons-question-mark-circle'
	},
	usage: {
		background: 'bg-green-100',
		foreground: 'text-green-600',
		icon: 'i-heroicons-rocket-launch'
	},
	features: {
		background: 'bg-purple-100',
		foreground: 'text-purple-600',
		icon: 'i-heroicons-sparkles'
	},
	pricing: {
		background: 'bg-amber-100',
		foreground: 'text-amber-600',
		icon: 'i-heroicons-currency-dollar'
	},
	security: {
		background: 'bg-red-100',
		foreground: 'text-red-600',
		icon: 'i-heroicons-shield-check'
	}
}

useHead(() => ({
	title: `${t('faq.title')} - ${t('brand.name')}`,
	meta: [
		{ name: 'description', content: t('faq.description') },
		{ name: 'robots', content: 'index,follow' }
	]
}))
</script>
