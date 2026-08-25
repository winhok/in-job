<template>
	<div class="space-y-3">
		<!-- 空状态：仅展示空 -->
		<div
			v-if="userStore.resumes.length === 0"
			class="flex flex-col justify-center items-center py-12 text-gray-500"
		>
			<UIcon
				name="i-heroicons-document-text"
				class="w-12 h-12 mx-auto mb-4 text-gray-300"
			/>
			{{ $t('interview.resume.empty') }}
		</div>

		<div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div
				v-for="(resume, index) in userStore.resumes"
				:key="resume.id"
				class="group relative flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
				@click="handlePreview(resume)"
			>
				<!-- 简历图标 -->
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 group-hover:from-primary-200 group-hover:to-primary-100 transition-colors"
				>
					<UIcon
						name="i-heroicons-document-text"
						class="w-7 h-7 text-primary-600"
					/>
				</div>

				<!-- 简历信息 -->
				<div class="flex-1 min-w-0">
					<p class="font-semibold text-gray-900 truncate text-sm mb-1">
						{{ resume.resumeName }}
					</p>
					<div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
						<!-- 求职意向字段存在时可启用以下标签 -->
						<!-- <span
							v-if="resume.jobInfo?.jobIntention"
							class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
						>
							{{ resume.jobInfo?.jobIntention }}
						</span>
						<span
							v-if="resume.jobInfo?.cityIntention"
							class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
						>
							{{ resume.jobInfo?.cityIntention }}
						</span> -->
						<span class="text-gray-400">{{
							formatDate(resume.createTime)
						}}</span>
					</div>
				</div>

				<!-- 操作按钮 -->
				<div
					class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
					@click.stop
				>
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						icon="i-heroicons-pencil"
						class="!p-2"
						@click="handleEditName(index, resume)"
					/>
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						icon="i-heroicons-eye"
						class="!p-2"
						@click="handlePreview(resume)"
					/>
					<UButton
						color="red"
						variant="ghost"
						size="sm"
						icon="i-heroicons-trash"
						class="!p-2"
						@click="handleDelete(index, resume)"
					/>
				</div>
			</div>
		</div>

		<!-- 预览弹窗 -->
		<UModal
			v-model:open="previewModal"
			:title="previewTitle"
			:ui="{ content: 'w-[1200px] max-w-[90vw]' }"
		>
			<template #body>
				<div class="border rounded-lg overflow-hidden">
					<iframe
						v-if="previewResume?.resumeUrl"
						:src="previewResume?.resumeUrl"
						class="w-full h-[600px]"
						frameborder="0"
					/>
					<div v-else class="p-12 text-center text-gray-500">
						<p>{{ $t('interview.resume.cannotPreview') }}</p>
					</div>
				</div>
			</template>
		</UModal>

		<!-- 重命名弹窗 -->
		<UModal
			v-model:open="editNameModal"
			:title="$t('profile.resumeList.rename')"
		>
			<template #body>
				<div class="space-y-4">
					<UInput
						class="w-full"
						v-model="editNameValue"
						:placeholder="$t('profile.resumeList.renamePlaceholder')"
						:disabled="editNameLoading"
						@input="editNameError = ''"
						@keyup.enter="confirmEditName"
						autofocus
					/>
					<p class="text-xs text-gray-400">
						{{ $t('profile.resumeList.renameHint') }}
					</p>
				</div>
			</template>
			<template #footer>
				<div class="flex gap-2 justify-end w-full">
					<UButton
						color="gray"
						variant="ghost"
						@click="closeEditNameModal"
						:disabled="editNameLoading"
					>
						{{ $t('common.cancel') }}
					</UButton>
					<UButton
						color="primary"
						:loading="editNameLoading"
						@click="confirmEditName"
					>
						{{ $t('common.save') }}
					</UButton>
				</div>
			</template>
		</UModal>

		<!-- 删除确认弹窗 -->
		<UModal
			v-model:open="deleteConfirmModal"
			:title="$t('interview.resume.confirmDelete')"
		>
			<template #body>
				<div class="py-4">
					<p class="text-gray-700" v-if="deleteResume?.isJianLiWang">
						{{ $t('profile.resumeList.syncDelete') }}
						<br />
						{{ $t('interview.resume.confirmDeleteDesc') }}
					</p>
					<p class="text-gray-700" v-else>
						{{ $t('interview.resume.confirmDeleteDesc') }}
					</p>
				</div>
			</template>
			<template #footer>
				<div class="flex gap-2 w-full justify-end">
					<UButton
						color="gray"
						variant="ghost"
						@click="deleteConfirmModal = false"
					>
						{{ $t('common.cancel') }}
					</UButton>
					<UButton color="error" @click="confirmDelete">{{
						$t('interview.resume.deleteConfirm')
					}}</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '#imports'
import {
	getResumeListAPI,
	deleteResumeAPI,
	updateResumeNameAPI
} from '@/api/resume'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'

const toast = useToast()
const userStore = useUserStore()
const { $api } = useNuxtApp()
const { t } = useI18n()
/**
 * 获取简历列表
 */
const getResumeList = async () => {
	const res = await getResumeListAPI($api)

	userStore.resumes = res || []
}
getResumeList()

const previewModal = ref(false)
const previewResume = ref(null)
const deleteConfirmModal = ref(false)
const deleteIndex = ref(-1)
const deleteResume = ref(null)
const editNameModal = ref(false)
const editNameValue = ref('')
const editNameError = ref('')
const editNameLoading = ref(false)
const editingResume = ref(null)
const editingIndex = ref(-1)
// 格式化日期
const formatDate = (date) => {
	if (!date) return ''
	return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 移除拖拽相关逻辑

// 预览简历
const handlePreview = (resume) => {
	// 判断是否为用户单独上传的简历
	if (!resume.isJianLiWang) {
		previewResume.value = resume
		previewModal.value = true
		return
	}
	console.log('resume', resume)

	// 环境变量的预览地址
	// 测试环境使用：http://192.168.0.102:3001/
	// 生成环境使用：https://www.lgdsunday.club/
	const config = useRuntimeConfig()

	previewResume.value = {
		...resume,
		resumeUrl: `${config.public.resumePreviewUrl}edit?id=${resume.resumeId}&template=${resume.templateName}&token=${userStore.token}`
	}
	previewModal.value = true
}

// 删除简历
const handleDelete = (index, resume) => {
	deleteIndex.value = index
	deleteResume.value = resume
	deleteConfirmModal.value = true
}

// 确认删除
const confirmDelete = async () => {
	const res = await deleteResumeAPI($api, deleteResume.value.resumeId)
	if (res) {
		toast.add({
			title: t('profile.deleteSuccess'),
			color: 'success'
		})
		userStore.resumes.splice(deleteIndex.value, 1)
		deleteConfirmModal.value = false
		deleteIndex.value = -1
		deleteResume.value = null
	}
}

const handleEditName = (index, resume) => {
	editingIndex.value = index
	editingResume.value = resume
	editNameValue.value = resume.resumeName
	editNameError.value = ''
	editNameModal.value = true
}

const closeEditNameModal = () => {
	editNameModal.value = false
	editNameLoading.value = false
	editNameError.value = ''
	editNameValue.value = ''
	editingIndex.value = -1
	editingResume.value = null
}

const confirmEditName = async () => {
	const value = editNameValue.value.trim()
	if (!value) {
		editNameError.value = t('profile.resumeList.nameRequired')
		return
	}
	if (value.length > 10) {
		editNameError.value = t('profile.resumeList.nameLong')
		return
	}

	if (!editingResume.value) {
		editNameError.value = t('profile.resumeList.notFound')
		return
	}

	editNameLoading.value = true
	try {
		await updateResumeNameAPI($api, {
			resumeId: editingResume.value.resumeId,
			resumeName: value
		})

		userStore.resumes[editingIndex.value].resumeName = value
		toast.add({
			title: t('profile.resumeList.renameSuccess'),
			color: 'success'
		})
		closeEditNameModal()
	} catch (error) {
		toast.add({
			title: t('profile.resumeList.renameFailed'),
			description: error?.message || t('profile.later'),
			color: 'error'
		})
	} finally {
		editNameLoading.value = false
	}
}

const previewTitle = computed(() => {
	if (!previewResume.value) return t('interview.resume.preview')

	if (!previewResume.value.isJianLiWang) {
		return previewResume.value?.resumeName
	}

	return t('interview.resume.editablePreview', {
		name: previewResume.value?.resumeName
	})
})
</script>

<style scoped>
/* 列表过渡动画 */
.list-move,
.list-enter-active,
.list-leave-active {
	transition: all 0.3s ease;
}

.list-enter-from {
	opacity: 0;
	transform: translateY(-10px);
}

.list-leave-to {
	opacity: 0;
	transform: translateX(30px);
}

.list-leave-active {
	position: absolute;
	width: 100%;
}
</style>
