<template>
	<UModal v-model:open="isOpen" title="上传简历" :ui="{ width: 'sm:max-w-md' }">
		<template #body>
			<div class="space-y-6 py-4">
				<!-- 拖拽上传区域 -->
				<div
					:class="[
						'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
						dragOver
							? 'border-primary-500 bg-primary-50'
							: 'border-gray-300 hover:border-gray-400',
						uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
					]"
					@click="triggerFileUpload"
					@dragover.prevent="handleDragOver"
					@dragleave.prevent="handleDragLeave"
					@drop.prevent="handleDrop"
				>
					<input
						ref="fileInputRef"
						type="file"
						accept=".pdf,.doc,.docx"
						class="hidden"
						@change="handleFileChange"
					/>

					<div v-if="!uploading && !selectedFile">
						<UIcon
							name="i-heroicons-cloud-arrow-up"
							class="w-12 h-12 mx-auto mb-4 text-gray-400"
						/>
						<p class="text-sm font-medium text-gray-700 mb-1">
							点击或拖拽文件到此处上传
						</p>
						<p class="text-xs text-gray-500">
							支持 PDF、DOC、DOCX 格式，文件大小不超过 5MB
							<br />
							（简历最多支持 {{ MAX_RESUME_COUNT }} 份）
						</p>
					</div>

					<div v-else-if="uploading" class="flex flex-col items-center">
						<UIcon
							name="i-heroicons-arrow-path"
							class="w-12 h-12 mx-auto mb-4 text-primary-500 animate-spin"
						/>
						<p class="text-sm font-medium text-gray-700">上传中...</p>
					</div>

					<div v-else-if="selectedFile" class="flex flex-col items-center">
						<UIcon
							name="i-heroicons-document-check"
							class="w-12 h-12 mx-auto mb-4 text-green-500"
						/>
						<p class="text-sm font-medium text-gray-700 mb-1">
							{{ selectedFile.name }}
						</p>
						<p class="text-xs text-gray-500">
							{{ formatFileSize(selectedFile.size) }}
						</p>
						<UButton
							color="gray"
							variant="ghost"
							size="sm"
							class="mt-2"
							@click.stop="selectedFile = null"
						>
							重新选择
						</UButton>
					</div>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex gap-2 w-full justify-end">
				<UButton color="gray" variant="ghost" @click="handleCancel">
					取消
				</UButton>
				<UButton
					color="primary"
					:loading="uploading"
					:disabled="!selectedFile"
					@click="handleUpload"
				>
					上传
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from '#imports'
import { getOSSClient } from '@/utils/sts'
import { useUserStore } from '@/stores/user'
import { uploadResumeAPI } from '@/api/resume'
import { createActionGuard } from '@/utils/actionGuard'
import { MAX_RESUME_COUNT, FILE_SIZE_LIMIT } from '@/constants'

const props = defineProps({
	open: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['update:open', 'uploaded'])
const { $api } = useNuxtApp()
const userStore = useUserStore()
const toast = useToast()

const fileInputRef = ref(null)
const selectedFile = ref(null)
const resumeName = ref('')
const uploading = ref(false)
const dragOver = ref(false)

const isOpen = computed({
	get: () => props.open,
	set: (value) => emit('update:open', value)
})

const errors = ref({
	resumeName: ''
})

// 监听弹窗打开，重置表单
watch(isOpen, (open) => {
	if (open) {
		selectedFile.value = null
		resumeName.value = ''
		errors.value = { resumeName: '' }
		dragOver.value = false
	}
})

// 触发文件选择
const triggerFileUpload = () => {
	if (!uploading.value) {
		fileInputRef.value?.click()
	}
}

// 处理文件选择
const handleFileChange = (event) => {
	const file = event.target.files?.[0]
	if (file) {
		processFile(file)
	}
	// 清空input，以便可以重新选择同一个文件
	event.target.value = ''
}

// 处理拖拽悬停
const handleDragOver = (event) => {
	event.preventDefault()
	dragOver.value = true
}

// 处理拖拽离开
const handleDragLeave = () => {
	dragOver.value = false
}

// 处理拖拽放下
const handleDrop = (event) => {
	event.preventDefault()
	dragOver.value = false

	const file = event.dataTransfer.files?.[0]
	if (file) {
		processFile(file)
	}
}

// 处理文件
const processFile = (file) => {
	// 验证文件类型
	const allowedTypes = [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	]
	const allowedExtensions = ['.pdf', '.doc', '.docx']
	const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

	if (
		!allowedTypes.includes(file.type) &&
		!allowedExtensions.includes(fileExtension)
	) {
		toast.add({
			title: '不支持的文件格式',
			description: '请上传 PDF、DOC 或 DOCX 格式的文件',
			color: 'error'
		})
		return
	}

	// 验证文件大小（限制 5MB）
	if (file.size > FILE_SIZE_LIMIT) {
		toast.add({
			title: '文件大小不能超过 5MB',
			color: 'error'
		})
		return
	}

	selectedFile.value = file
	resumeName.value = file.name.replace(/\.[^/.]+$/, '') // 去掉扩展名作为默认名称
}

// 格式化文件大小
const formatFileSize = (bytes) => {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 处理上传
const handleUpload = async () => {
	if (!selectedFile.value) {
		return
	}

	// 限流器，防止用户频繁多次上传简历
	const guard = createActionGuard(
		`resume-upload-${userStore.userInfo.openid || 'guest'}`,
		{
			maxAttempts: 3,
			windowMs: 1 * 60 * 1000 // 1 分钟内最多三次
		}
	)

	const { allowed, retryAfter } = guard.attempt()

	if (!allowed) {
		const seconds = Math.ceil(retryAfter / 1000)
		toast.add({
			title: '操作过于频繁，一分钟最多上传 3 份简历',
			description: `请${seconds || 1}秒后再试`,
			color: 'warning'
		})
		return
	}

	uploading.value = true

	let ossClient = null
	const updateAvatar = async (file) => {
		if (!ossClient) {
			ossClient = await getOSSClient($api)
		}
		try {
			// 因为当前凭证只具备 images 文件夹下的访问权限，所以图片需要上传到 images/xxx.xx 。否则你将得到一个 《AccessDeniedError: You have no right to access this object because of bucket acl.》 的错误
			const fileTypeArr = file.type.split('/')
			const fileName = `${userStore.userInfo.openid}/resumes/${Date.now()}.${
				fileTypeArr[fileTypeArr.length - 1]
			}`

			// 文件存放路径，文件
			const res = await ossClient.put(`user-resumes/${fileName}`, file)

			await uploadResumeAPI($api, {
				url: res.url,
				resumeName: file.name,
				uploadTime: new Date().toISOString()
			})

			// 简历上传成功
			toast.add({
				title: '上传成功',
				description: '简历上传成功',
				color: 'success'
			})
			isOpen.value = false
			// 通知父组件
			emit('uploaded')
		} catch (e) {
			console.log('e.message', e.message)

			toast.add({
				title: '上传失败',
				description: e.message,
				color: 'error'
			})
		} finally {
			uploading.value = false
		}
	}
	updateAvatar(selectedFile.value)
}

// 处理取消
const handleCancel = () => {
	if (!uploading.value) {
		isOpen.value = false
	}
}
</script>

<style scoped></style>
