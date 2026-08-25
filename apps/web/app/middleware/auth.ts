import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'

export default defineNuxtRouteMiddleware((to) => {
	console.log('defineNuxtRouteMiddleware~~~~')

	if (!to.meta.requiresAuth) return

	const userStore = useUserStore()
	if (userStore.isLogin) return

	// SSR 场景无法弹窗，直接跳转登录页
	if (import.meta.server) {
		return navigateTo({
			path: '/login',
			query: { redirect: to.fullPath }
		})
	}

	const uiStore = useUIStore()
	uiStore.showAuthPrompt(to.fullPath)
	return abortNavigation()
})
