<template>
	<div class="space-y-4">
		<!-- 简历选择区域 -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<slot name="title">
					<h3 class="text-sm font-semibold text-neutral-900">
						{{ $t('interview.resume.chooseExisting') }}
					</h3>
				</slot>
				<UButton
					v-if="userStore.canAddResume"
					color="primary"
					variant="ghost"
					size="sm"
					icon="i-heroicons-plus"
					@click="isUploadResumeModalVisible = true"
				>
					{{ $t('interview.resume.uploadNew') }}
				</UButton>
				<span v-else class="text-sm text-gray-500">
					{{ $t('interview.resume.max', { count: MAX_RESUME_COUNT }) }}
				</span>
			</div>

			<!-- 简历列表 -->
			<div
				v-if="userStore.resumes.length > 0"
				class="space-y-2 max-h-[300px] overflow-y-auto pr-1"
			>
				<div
					v-for="(resume, index) in userStore.resumes"
					:key="resume.resumeId"
					:class="[
						'group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
						interviewStore.resumeId === resume.resumeId
							? 'border-primary-300 bg-primary-50/50'
							: 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
					]"
					@click="selectResume(resume)"
				>
					<div
						class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0"
					>
						<UIcon
							name="i-heroicons-document-text"
							class="w-5 h-5 text-primary-600"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<p class="font-medium text-neutral-900 truncate text-sm">
							{{ resume.resumeName }}
						</p>
						<p class="text-xs text-neutral-500 mt-0.5">
							{{ formatDate(resume.createTime) }}
						</p>
					</div>

					<!-- 预览按钮 -->
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						icon="i-heroicons-eye"
						class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
						@click.stop="handlePreview(resume)"
					/>

					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						icon="i-heroicons-trash"
						class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
						@click.stop="handleDelete(index, resume)"
					/>

					<UIcon
						v-if="interviewStore.resumeId === resume.resumeId"
						name="i-heroicons-check-circle"
						class="w-5 h-5 text-primary-500 shrink-0"
					/>
				</div>
			</div>

			<!-- 空状态 -->
			<div
				v-else
				class="flex flex-col items-center justify-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg"
			>
				<UIcon name="i-heroicons-document-text" class="w-10 h-10 mb-2" />
				<p class="text-sm">{{ $t('interview.resume.empty') }}</p>
				<UButton
					v-if="userStore.canAddResume"
					color="primary"
					variant="ghost"
					size="sm"
					class="mt-2"
					@click="isUploadResumeModalVisible = true"
				>
					{{ $t('interview.resume.uploadNow') }}
				</UButton>
			</div>
		</div>

		<!-- 分隔线 -->
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-gray-200"></div>
			</div>
			<div class="relative flex justify-center text-xs">
				<span class="bg-white px-2 text-gray-500">{{
					$t('interview.resume.or')
				}}</span>
			</div>
		</div>

		<!-- 手动输入 -->
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-neutral-900">
				{{ $t('interview.resume.manual') }}
			</h3>
			<UTextarea
				v-model="interviewStore.resumeText"
				:placeholder="$t('interview.resume.paste')"
				:rows="6"
				class="w-full"
				@update:model-value="handleTextChange"
			/>
			<p class="text-xs text-gray-500">
				{{ $t('interview.resume.pasteHint') }}
			</p>
		</div>

		<!-- 上传简历弹窗 -->
		<UploadResumeModal
			v-model:open="isUploadResumeModalVisible"
			@uploaded="handleResumeUploaded"
		/>

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
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import UploadResumeModal from '@/components/profile/UploadResumeModal.vue'
import { getResumeListAPI, deleteResumeAPI } from '@/api/resume'
import dayjs from 'dayjs'
import { useInterviewStore } from '@/stores/interview'
import { useGlobalModal } from '@/composables/useGlobalModal'
import { useToast } from '#imports'
import { MAX_RESUME_COUNT } from '@/constants'

const props = defineProps({
	modelValue: {
		type: [String, Number, Object],
		default: null
	}
})

const emit = defineEmits(['update:modelValue'])

const globalModal = useGlobalModal()
const toast = useToast()
const userStore = useUserStore()
const interviewStore = useInterviewStore()
const { $api } = useNuxtApp()
const config = useRuntimeConfig()
const { t } = useI18n()

const isUploadResumeModalVisible = ref(false)

// 预览相关
const previewModal = ref(false)
const previewResume = ref(null)

// 初始化时加载简历列表
onMounted(async () => {
	const res = await getResumeListAPI($api)
	userStore.resumes = res || []
})

// 格式化日期
const formatDate = (date) => {
	if (!date) return ''
	return dayjs(date).format('YYYY-MM-DD')
}

// 选择简历
const selectResume = (resume) => {
	interviewStore.resumeId = resume.resumeId
	interviewStore.resumeText = '' // 清空手动输入
	emit('update:modelValue', {
		type: 'resume',
		resumeId: resume.resumeId,
		resume: resume
	})
}

// 手动输入变化
const handleTextChange = (value) => {
	if (value.trim()) {
		interviewStore.resumeId = null // 清空选择的简历
		emit('update:modelValue', {
			type: 'text',
			text: value.trim()
		})
	} else {
		emit('update:modelValue', null)
	}
}

const deleteIndex = ref(-1)
const deleteResume = ref(null)

// 删除简历
const handleDelete = (index, resume) => {
	deleteIndex.value = index
	deleteResume.value = resume

	globalModal.showModal({
		title: t('interview.resume.confirmDelete'),
		description: t('interview.resume.confirmDeleteDesc'),
		buttons: [
			{
				label: t('common.cancel'),
				color: 'gray',
				variant: 'ghost'
			},
			{
				label: t('interview.resume.deleteConfirm'),
				color: 'error',
				onClick: confirmDelete
			}
		]
	})
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
		deleteIndex.value = -1
		deleteResume.value = null
	}
}

// 预览简历
const handlePreview = (resume) => {
	// 判断是否为用户单独上传的简历
	if (!resume.isJianLiWang) {
		previewResume.value = resume
		previewModal.value = true
		return
	}

	// 简历汪简历：拼接预览地址
	previewResume.value = {
		...resume,
		resumeUrl: `${config.public.resumePreviewUrl}edit?id=${resume.resumeId}&template=${resume.templateName}&token=${userStore.token}`
	}
	previewModal.value = true
}

// 预览标题
const previewTitle = computed(() => {
	if (!previewResume.value) return t('interview.resume.preview')

	if (!previewResume.value.isJianLiWang) {
		return previewResume.value?.resumeName
	}

	return t('interview.resume.editablePreview', {
		name: previewResume.value?.resumeName
	})
})

// 简历上传成功
const handleResumeUploaded = async () => {
	const res = await getResumeListAPI($api)
	userStore.resumes = res || []
	isUploadResumeModalVisible.value = false
}

// 监听外部值变化
watch(
	() => props.modelValue,
		(newValue) => {
			if (!newValue) {
				return
			}
			const value = newValue as any

			if (value.type === 'text') {
				interviewStore.resumeText = value.text || ''
				interviewStore.resumeId = null
			} else if (value.type === 'resume') {
				interviewStore.resumeId = value.resumeId
			interviewStore.resumeText = ''
		}
	},
	{ immediate: true }
)
</script>

<style scoped></style>
