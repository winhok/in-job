<template>
	<UModal v-model:open="isOpen" :ui="{ content: 'max-w-[480px]' }">
		<template #body>
			<div class="space-y-6 p-6">
				<!-- 图标和标题 -->
				<div class="flex flex-col items-center text-center">
					<div
						class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4"
					>
						<UIcon
							name="i-heroicons-lock-closed"
							class="w-8 h-8 text-primary-600"
						/>
					</div>
					<h2 class="text-xl font-bold text-gray-900 mb-2">需要登录</h2>
					<p class="text-sm text-gray-600">
						此功能需要登录后才能使用，请先登录您的账号
					</p>
				</div>

				<!-- 操作按钮 -->
				<div class="flex flex-col gap-3">
					<UButton
						color="primary"
						size="lg"
						block
						@click="handleLogin"
						class="justify-center"
					>
						<UIcon
							name="i-heroicons-arrow-right-on-rectangle"
							class="w-5 h-5"
						/>
						立即登录
					</UButton>
					<UButton
						color="gray"
						variant="ghost"
						size="lg"
						block
						@click="handleCancel"
						class="justify-center"
					>
						取消
					</UButton>
				</div>
			</div>
		</template>
	</UModal>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { navigateTo } from '#app'

const uiStore = useUIStore()

const isOpen = computed({
	get: () => uiStore.authPromptOpen,
	set: (value) => {
		if (!value) {
			uiStore.hideAuthPrompt()
		}
	}
})

const handleLogin = () => {
	const redirectPath = uiStore.authRedirectPath
	uiStore.hideAuthPrompt()
	navigateTo({
		path: '/login',
		query: { redirect: redirectPath }
	})
}

const handleCancel = () => {
	uiStore.hideAuthPrompt()
}
</script>
