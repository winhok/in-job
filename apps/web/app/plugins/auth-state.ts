import { watch } from 'vue'
import { useUserStore } from '@/stores/user'

interface PersistedAuthState {
	userInfo: Record<string, any>
	isLogin: boolean
	token: string
}

export default defineNuxtPlugin(() => {
	const userStore = useUserStore()
	const authCookie = useCookie<PersistedAuthState | null>('in_job_auth', {
		sameSite: 'lax'
	})

	if (authCookie.value?.isLogin && authCookie.value.token) {
		userStore.$patch(authCookie.value)
	}

	watch(
		() => ({
			userInfo: userStore.userInfo,
			isLogin: userStore.isLogin,
			token: userStore.token
		}),
		(value) => {
			authCookie.value = value.isLogin && value.token ? value : null
		},
		{ deep: true }
	)
})
