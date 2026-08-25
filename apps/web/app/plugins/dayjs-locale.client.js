import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import { watch } from 'vue'

export default defineNuxtPlugin(() => {
	const { locale } = useI18n()
	watch(locale, (value) => dayjs.locale(value === 'zh-CN' ? 'zh-cn' : 'en'), {
		immediate: true
	})
})
