import { useRoute, navigateTo } from '#imports'
import { useUserStore } from '~/stores/user'

export function handleLoginSuccess(overrideRedirect) {
	const user = useUserStore()
	user.isLogin = true

	const q = useRoute().query.redirect
	const fromQuery = Array.isArray(q) ? q[0] : q
	const raw = overrideRedirect || fromQuery || '/'
	const safe = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'

	return navigateTo(safe, { replace: true })
}
