<template>
	<section class="mx-auto max-w-5xl px-6 py-12">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-semibold text-neutral-900">{{ title }}</h1>
			<p class="mt-3 text-sm text-neutral-500">
				{{ $t('legal.lastUpdated', { date: formattedDate }) }}
			</p>
		</div>
		<div class="prose prose-neutral prose-sm max-w-none">
			<section v-for="([heading, content], index) in sections" :key="index">
				<h2>{{ heading }}</h2>
				<p>{{ content }}</p>
			</section>
			<p v-if="document === 'privacy'">
				<a
					class="text-primary-600 hover:underline"
					href="mailto:lgd_sunday@163.com"
					>lgd_sunday@163.com</a
				>
			</p>
		</div>
	</section>
</template>

<script setup>
import { computed } from 'vue'
import { getLegalContent } from '@/data/legal-content'

const props = defineProps({ document: { type: String, required: true } })
const { locale, t } = useI18n()
const title = computed(() =>
	t(
		props.document === 'agreement'
			? 'legal.agreementTitle'
			: 'legal.privacyTitle'
	)
)
const sections = computed(() => getLegalContent(props.document, locale.value))
const formattedDate = computed(() =>
	new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(
		new Date('2025-11-18T00:00:00Z')
	)
)

useHead(() => ({
	title: `${title.value} - ${t('brand.name')}`,
	meta: [{ name: 'description', content: title.value }]
}))
</script>
