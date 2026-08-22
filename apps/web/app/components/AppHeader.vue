<template>
	<header
		:class="[
			'w-full sticky top-0 z-50 border-b border-gray-200 bg-white/70 backdrop-blur supports-backdrop-filter:bg-white/50',
			scrolled ? 'shadow-sm bg-white/80 backdrop-blur' : ''
		]"
	>
		<div class="container px-4 py-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<ww-svg-icon name="hero" class="h-8 w-8"></ww-svg-icon>
				<NuxtLink to="/" class="text-xl font-semibold text-neutral-900"
					>面试汪</NuxtLink
				>
				<span
					class="hidden sm:inline-block text-xs text-neutral-500 translate-y-px"
					>押题·模拟·行测 三位一体</span
				>
			</div>
			<nav class="hidden md:flex items-center gap-6 text-sm text-neutral-600">
				<NuxtLink
					to="/interview/start"
					:class="[
						'transition-colors',
						activeNav === 'start'
							? 'text-neutral-900 font-bold'
							: 'hover:text-neutral-900'
					]"
					>开启 AI 服务</NuxtLink
				>
				<!-- <NuxtLink
					to="/#features"
					:class="[
						'transition-colors',
						activeNav === 'features'
							? 'text-neutral-900 font-bold'
							: 'hover:text-neutral-900'
					]"
					>功能</NuxtLink
				>
				<NuxtLink
					to="/#steps"
					:class="[
						'transition-colors',
						activeNav === 'steps'
							? 'text-neutral-900 font-bold'
							: 'hover:text-neutral-900'
					]"
					>流程</NuxtLink
				> -->
				<NuxtLink
					to="/history"
					:class="[
						'transition-colors',
						route.path === '/history'
							? 'text-neutral-900 font-bold'
							: 'hover:text-neutral-900'
					]"
					>服务记录</NuxtLink
				>
				<NuxtLink
					to="/profile?tab=redeem"
					:class="[
						'transition-colors',
						route.path === '/profile?tab=redeem'
							? 'text-neutral-900 font-bold'
							: 'hover:text-neutral-900'
					]"
					>兑换服务</NuxtLink
				>
				<NuxtLink
					to="/faq"
					:class="[
						'transition-colors',
						route.path === '/faq'
							? 'text-neutral-900 font-bold'
							: 'hover:text-neutral-900'
					]"
					>常见问题</NuxtLink
				>
				<NuxtLink
					to="/contact"
					:class="[
						'transition-colors',
						route.path === '/contact'
							? 'text-neutral-900 font-bold'
							: 'hover:text-neutral-900'
					]"
					>联系我们</NuxtLink
				>
			</nav>
			<div class="flex items-center gap-2">
				<template v-if="!userStore.isLogin">
					<UButton color="gray" variant="ghost" to="/login">登录</UButton>
				</template>
				<template v-else>
					<UDropdownMenu
						:items="userMenuItems"
						mode="hover"
						:popper="{ placement: 'bottom-end' }"
					>
						<UButton color="gray" variant="ghost">
							<UAvatar
								:src="userStore.userInfo.avatar || interviewAvatar"
								:alt="userStore.userInfo.username || '用户头像'"
								size="lg"
								class="cursor-pointer"
							/>
							{{ userStore.userInfo.username || '未命名用户' }}
							<UIcon name="i-heroicons-chevron-down" class="ml-1" />
						</UButton>
					</UDropdownMenu>
				</template>
				<!-- 外部链接：简历汪网站 -->
				<NuxtLink
					:to="`https://www.lgdsunday.club?token=${userStore.token}`"
					class="text-[12px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 hover:text-primary-700 transition-all font-medium border border-primary-200"
					target="_blank"
					rel="noopener noreferrer"
				>
					<span>免费制作简历（简历汪）</span>
					<UIcon
						name="i-heroicons-arrow-top-right-on-square"
						class="w-3.5 h-3.5"
					/>
				</NuxtLink>
			</div>
		</div>
		<UModal
			v-model:open="confirmLogoutOpen"
			title="是否确定退出当前账号？未保存的面试进度可能不会保留。"
		>
			<template #footer>
				<div class="flex gap-2 w-full justify-end">
					<UButton
						color="gray"
						variant="ghost"
						@click="confirmLogoutOpen = false"
						>取消</UButton
					>
					<UButton class="text-white" @click="handleConfirmLogout"
						>确定退出</UButton
					>
				</div>
			</template>
		</UModal>
	</header>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import interviewAvatar from '@/assets/imgs/interview.png'

const userStore = useUserStore()
const confirmLogoutOpen = ref(false)

const userMenuItems = [
	[
		{ label: '个人中心', icon: 'i-heroicons-user', to: '/profile' },
		{
			label: '服务记录',
			icon: 'i-heroicons-chart-bar',
			to: '/history'
		}
	],
	[
		{
			label: '退出登录',
			icon: 'i-heroicons-arrow-left-on-rectangle',
			onSelect: () => {
				confirmLogoutOpen.value = true
			}
		}
	]
]

const handleConfirmLogout = () => {
	userStore.logout()
	confirmLogoutOpen.value = false
	navigateTo('/')
}

const scrolled = ref(false)
const activeNav = ref(null)
const route = useRoute()

const setActiveByRoute = () => {
	if (route.path === '/faq') activeNav.value = 'faq'
	else if (route.path === '/contact') activeNav.value = 'contact'
	else if (route.path === '/start') activeNav.value = 'start'
	else if (route.path === '/' && route.hash === '#features')
		activeNav.value = 'features'
	else if (route.path === '/' && route.hash === '#steps')
		activeNav.value = 'steps'
	else if (route.path === '/') activeNav.value = null
}
watch(
	() => route.fullPath,
	() => setActiveByRoute(),
	{ immediate: true }
)

onMounted(() => {
	// 头部滚动阴影
	const onScroll = () => {
		scrolled.value = window.scrollY > 8
	}
	onScroll()
	window.addEventListener('scroll', onScroll, { passive: true })

	// 滚动高亮逻辑（首页锚点）
	let observer = null
	const features = document.getElementById('features')
	const steps = document.getElementById('steps')
	const targets = [features, steps].filter(Boolean)
	if (targets.length) {
		observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort(
						(a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0)
					)[0]
				if (visible) {
					const id = visible.target.id
					if (id === 'features') activeNav.value = 'features'
					else if (id === 'steps') activeNav.value = 'steps'
				}
			},
			{ rootMargin: '0px 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
		)
		if (observer) targets.forEach((t) => observer.observe(t))
	}

	onUnmounted(() => {
		window.removeEventListener('scroll', onScroll)
		if (observer) observer.disconnect()
	})
})
</script>

<style scoped></style>
