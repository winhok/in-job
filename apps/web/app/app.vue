<template>
	<NuxtLayout>
		<NuxtPage />
		<FeedbackButton />
	</NuxtLayout>
	<!-- 全局登录提示弹窗 -->
	<AuthPromptModal />
</template>

<script setup lang="ts">
import AuthPromptModal from '@/components/AuthPromptModal.vue'
import FeedbackButton from '@/components/feedback-button.vue'
import { useRoute, useRouter } from '#imports'
import { getUserInfoAPI } from '@/api/user'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const userStore = useUserStore()
const { locale, t } = useI18n()

useHead(() => ({ htmlAttrs: { lang: locale.value } }))
useSeoMeta((() => ({
	title: t('brand.name'),
	description: t('brand.description'),
	ogTitle: t('brand.name'),
	ogDescription: t('brand.description'),
	ogLocale: locale.value === 'en-US' ? 'en_US' : 'zh_CN',
	twitterTitle: t('brand.name'),
	twitterDescription: t('brand.description')
})) as any)

// 如果当前 url 中存在 token，则表示为 简历汪 跳转过来的，则获取 token，保存到 localstorage，并获取用户个人信息，标记用户登录状态为已登录
const isJianLiWangLogin = async () => {
	const token = route.query.token as string | undefined
	if (token) {
		localStorage.setItem('token', token)
		userStore.isLogin = true
		userStore.token = token
		const userInfo = await getUserInfoAPI($api)
		userStore.updateUserInfo(userInfo)
		// 去掉 url 中的 token
		router.replace({ query: { ...route.query, token: undefined } })
	}
}

isJianLiWangLogin()
</script>
