import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import { watch } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
	const locale = nuxtApp.$i18n.locale
	watch(locale, (value) => dayjs.locale(value === 'zh-CN' ? 'zh-cn' : 'en'), {
		immediate: true
	})
})
