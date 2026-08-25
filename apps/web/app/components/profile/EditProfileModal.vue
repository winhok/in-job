<template>
	<UModal
		v-model:open="isOpen"
		:title="$t('profile.editor.title')"
		:ui="{ width: 'sm:max-w-md' }"
	>
		<template #body>
			<div class="space-y-6 py-4">
				<!-- 头像上传 -->
				<div class="flex flex-col items-center">
					<div class="relative group mb-4">
						<div class="relative">
							<UAvatar
								:src="formData.avatar"
								:alt="formData.username || $t('account.avatarAlt')"
								size="3xl"
								class="cursor-pointer ring-4 ring-primary-100 transition-all hover:ring-primary-200"
							/>
							<!-- hover 遮罩 + loading 态 -->
							<div
								v-if="avatarUploading"
								class="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm"
							>
								<UIcon
									name="i-heroicons-arrow-path"
									class="w-7 h-7 text-white animate-spin"
								/>
							</div>
							<div
								v-else
								class="absolute inset-0 rounded-full bg-gradient-to-t from-black/60 to-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs transition-all cursor-pointer"
								@click="triggerAvatarUpload"
							>
								<UIcon name="i-heroicons-camera" class="w-5 h-5 mb-1" />
								<span class="text-[10px]">{{
									$t('profile.editor.change')
								}}</span>
							</div>
						</div>
						<!-- 状态指示器 -->
						<div
							v-if="avatarUploading"
							class="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
						>
							{{ $t('profile.editor.uploading') }}
						</div>
					</div>
					<UButton
						color="primary"
						variant="soft"
						size="sm"
						class="gap-2"
						:loading="avatarUploading"
						:disabled="avatarUploading"
						@click="triggerAvatarUpload"
					>
						<UIcon name="i-heroicons-photo" class="w-4 h-4" />
						{{ $t('profile.editor.changeAvatar') }}
					</UButton>
					<p class="text-xs text-gray-500 mt-2 text-center">
						{{ $t('profile.editor.avatarHint') }}
					</p>
					<input
						ref="avatarInputRef"
						type="file"
						accept="image/*"
						class="hidden"
						@change="handleAvatarChange"
					/>
				</div>

				<!-- 用户名 -->
				<div>
					<UInput
						class="w-full"
						icon="i-lucide-user"
						v-model="formData.username"
						:placeholder="$t('profile.editor.username')"
						size="lg"
					>
					</UInput>
				</div>
				<!-- 邮箱 -->
				<div>
					<UInput
						class="w-full"
						icon="i-lucide-at-sign"
						v-model="formData.email"
						:placeholder="$t('profile.editor.email')"
						size="lg"
					>
					</UInput>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex gap-3 w-full">
				<UButton
					color="gray"
					variant="ghost"
					class="flex-1 justify-center"
					:disabled="loading"
					@click="handleCancel"
				>
					{{ $t('common.cancel') }}
				</UButton>
				<UButton
					color="primary"
					class="flex-1 justify-center shadow-md"
					:loading="loading"
					@click="handleSubmit"
				>
					{{ $t('profile.editor.save') }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from '#imports'
import { updateUserInfoAPI } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { getOSSClient } from '@/utils/sts'

const props = defineProps({
	open: {
		type: Boolean,
		default: false
	},
	userInfo: {
		type: Object,
		default: () => ({
			username: '',
			email: '',
			avatar: ''
		})
	}
})

const emit = defineEmits(['update:open'])
const userStore = useUserStore()
const { $api } = useNuxtApp()

const toast = useToast()
const { t } = useI18n()
const loading = ref(false)
const avatarUploading = ref(false)
const avatarInputRef = ref(null)

const isOpen = computed({
	get: () => props.open,
	set: (value) => emit('update:open', value)
})

const formData = ref({
	username: '',
	email: '',
	avatar: ''
})

const errors = ref({
	username: '',
	email: ''
})

// 监听 userInfo 变化，初始化表单数据
watch(
	() => props.userInfo,
	(newVal) => {
		if (newVal) {
			formData.value = {
				username: newVal.username || '',
				email: newVal.email || '',
				avatar: newVal.avatar || ''
			}
		}
	},
	{ immediate: true, deep: true }
)

// 监听弹窗打开，重置表单
watch(isOpen, (open) => {
	if (open) {
		formData.value = {
			username: props.userInfo.username || '',
			email: props.userInfo.email || '',
			avatar: props.userInfo.avatar || ''
		}
		errors.value = {
			username: '',
			email: ''
		}
	}
})

// 触发头像上传
const triggerAvatarUpload = () => {
	avatarInputRef.value?.click()
}

// 处理头像选择
const handleAvatarChange = async (event) => {
	const file = event.target.files?.[0]
	if (!file) return

	// 验证文件类型
	if (!file.type.startsWith('image/')) {
		toast.add({
			title: t('profile.editor.imageOnly'),
			color: 'error'
		})
		return
	}

	// 验证文件大小（限制 500 kb）
	if (file.size > 500 * 1024) {
		toast.add({
			title: t('profile.editor.imageSize'),
			color: 'error'
		})
		return
	}

	avatarUploading.value = true
	try {
		// 预览图片（使用 FileReader）
		const reader = new FileReader()
		reader.onload = (e) => {
			// 实际上传到服务器
			updateAvatar(file)
		}
		reader.readAsDataURL(file)
	} catch (error) {
		toast.add({
			title: t('profile.editor.uploadFailed'),
			description: error.message,
			color: 'error'
		})
	} finally {
		avatarUploading.value = false
	}

	let ossClient = null
	const updateAvatar = async (file) => {
		if (!ossClient) {
			ossClient = await getOSSClient($api)
		}
		try {
			// 因为当前凭证只具备 images 文件夹下的访问权限，所以图片需要上传到 images/xxx.xx 。否则你将得到一个 《AccessDeniedError: You have no right to access this object because of bucket acl.》 的错误
			const fileTypeArr = file.type.split('/')
			const fileName = `${userStore.userInfo.openid}/${Date.now()}.${
				fileTypeArr[fileTypeArr.length - 1]
			}`

			// 文件存放路径，文件
			const res = await ossClient.put(`user-img/${fileName}`, file)
			formData.value.avatar = res.url
			event.target.value = ''
		} catch (e) {
			event.target.value = ''
			toast.add({
				title: t('profile.editor.uploadFailed'),
				description: e.message,
				color: 'error'
			})
		}
	}
}

// 验证表单
const validate = () => {
	// 简单验证下，用户名在 2 ~ 20 个字符之间
	if (!formData.value.username.trim()) {
		errors.value.username = t('profile.editor.usernameRequired')
		return false
	} else if (formData.value.username.trim().length < 2) {
		errors.value.username = t('profile.editor.usernameShort')
		return false
	} else if (formData.value.username.trim().length > 20) {
		errors.value.username = t('profile.editor.usernameLong')
		return false
	}
	// 验证邮箱
	if (
		formData.value.email &&
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)
	) {
		errors.value.email = t('profile.editor.emailInvalid')
		return false
	}

	return true
}

// 处理提交
const handleSubmit = async () => {
	if (!validate()) {
		return
	}

	loading.value = true
	try {
		const updatedInfo = {
			username: formData.value.username.trim(),
			email: formData.value.email.trim() || '',
			avatar: formData.value.avatar
		}

		// 通过接口修改用户信息
		const res = await updateUserInfoAPI($api, updatedInfo)

		// 提示用户修改成功，关闭 dialog，修改 userSotre 中的数据
		toast.add({
			title: t('profile.editor.success'),
			color: 'success'
		})
		isOpen.value = false
		// 更新 userStore 中的数据
		userStore.userInfo = {
			...userStore.userInfo,
			...updatedInfo
		}
	} catch (error) {
		toast.add({
			title: t('profile.editor.saveFailed'),
			description: error.message,
			color: 'error'
		})
	} finally {
		loading.value = false
	}
}

// 处理取消
const handleCancel = () => {
	isOpen.value = false
}
</script>

<style scoped></style>
