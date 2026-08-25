<template>
	<USelect
		v-model="selectedLocale"
		:items="localeItems"
		value-key="value"
		label-key="label"
		size="sm"
		class="w-32"
		:aria-label="t('language.label')"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { locale, setLocale, t } = useI18n()

const selectedLocale = computed({
	get: () => locale.value,
	set: (value) => setLocale(value)
})

const localeItems = computed(() => [
	{ label: t('language.zh'), value: 'zh-CN' },
	{ label: t('language.en'), value: 'en-US' }
])
</script>
