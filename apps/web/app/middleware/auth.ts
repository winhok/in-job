import { useUIStore } from '@/stores/ui'

export default defineNuxtRouteMiddleware((to) => {
	if (!to.meta.requiresAuth) return

	const persistedUser = useCookie<{ isLogin?: boolean }>('in_job_auth')
	if (persistedUser.value?.isLogin) return

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
