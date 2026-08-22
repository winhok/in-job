import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

export default defineNuxtPlugin(() => {
	// 将 dayjs 设为中文，以确保日期/月份/星期文本为中文
	dayjs.locale('zh-cn')
})
