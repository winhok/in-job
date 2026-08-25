<template>
	<div class="space-y-5">
		<!-- 基本信息卡片 -->
		<div class="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
			<div class="space-y-3">
				<div>
					<p class="text-sm text-neutral-500 mb-1">
						{{ $t('interview.confirm.targetRole') }}
					</p>
					<p class="text-base font-semibold text-neutral-900">
						{{ interviewStore.selectedPosition.positionName }}
					</p>
				</div>
				<div>
					<label class="text-sm text-neutral-500 mb-1 block">{{
						$t('interview.confirm.targetCompany')
					}}</label>
					<UInput
						v-model="interviewStore.selectedPosition.company"
						class="w-full"
						:placeholder="$t('interview.confirm.companyPlaceholder')"
						size="lg"
					/>
				</div>
			</div>
		</div>

		<!-- 服务详情卡片 -->
		<div
			class="rounded-2xl border border-dashed p-4"
			:class="serviceConfig.borderColor"
		>
			<ul class="space-y-3 text-sm text-neutral-600">
				<li
					v-for="(item, index) in serviceConfig.infoItems"
					:key="index"
					class="flex items-start gap-2"
				>
					<UIcon
						:name="item.icon"
						class="w-4 h-4 mt-0.5"
						:class="serviceConfig.iconColor"
					/>
					<span>{{ item.text }}</span>
				</li>
			</ul>
		</div>

		<!-- 确认按钮 -->
		<UButton
			block
			v-if="remainingCount > 0"
			color="primary"
			size="lg"
			@click="handleConfirm"
		>
			{{ serviceConfig.buttonText }}
		</UButton>
		<UButton block v-else color="primary" size="lg" @click="handleGoToRecharge">
			{{ $t('interview.confirm.recharge') }}
		</UButton>

		<!-- 余额不足提示 -->
		<div
			v-if="remainingCount <= 0"
			class="text-center text-sm text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200"
		>
			<UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline" />
			{{ $t('interview.confirm.insufficient') }}
		</div>
	</div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { SERVICE_TAGS } from '@/constants/vip'
import { useInterviewStore } from '@/stores/interview'
import { useGlobalModal } from '@/composables/useGlobalModal'

const props = defineProps({
	/**
	 * 服务类型：resume | special | behavior
	 */
	serviceType: {
		type: String,
		required: true,
		validator: (value) => Object.values(SERVICE_TAGS).includes(value)
	},
	/**
	 * 剩余次数
	 */
	remainingCount: {
		type: Number,
		default: 0
	},
	/**
	 * 目标公司更新回调
	 */
	onCompanyUpdate: {
		type: Function,
		default: null
	},
	/**
	 * 确认回调
	 */
	onConfirm: {
		type: Function,
		default: null
	}
})

const globalModal = useGlobalModal()
const interviewStore = useInterviewStore()
const { t } = useI18n()

// 服务配置映射
const serviceConfig = computed(() => {
	const configs = {
		[SERVICE_TAGS.RESUME]: {
			borderColor: 'border-blue-200',
			iconColor: 'text-blue-500',
			buttonText: t('interview.confirm.startQuiz'),
			infoItems: [
				{
					icon: 'i-heroicons-document-text',
					text: t('interview.confirm.quizInfo')
				},
				{
					icon: 'i-heroicons-clock',
					text: t('interview.confirm.quizTime')
				},
				{
					icon: 'i-heroicons-credit-card',
					text: t('interview.confirm.deduct', {
						name: t('home.services.quiz'),
						count: props.remainingCount
					})
				}
			]
		},
		[SERVICE_TAGS.SPECIAL]: {
			borderColor: 'border-primary-200',
			iconColor: 'text-primary-500',
			buttonText: t('interview.confirm.startSpecial'),
			infoItems: [
				{
					icon: 'i-heroicons-bolt',
					text: t('interview.confirm.specialInfo')
				},
				{
					icon: 'i-heroicons-clock',
					text: t('interview.confirm.specialTime')
				},
				{
					icon: 'i-heroicons-credit-card',
					text: t('interview.confirm.deduct', {
						name: t('home.services.special'),
						count: props.remainingCount
					})
				}
			]
		},
		[SERVICE_TAGS.BEHAVIOR]: {
			borderColor: 'border-purple-200',
			iconColor: 'text-purple-500',
			buttonText: t('interview.confirm.startBehavior'),
			infoItems: [
				{
					icon: 'i-heroicons-chat-bubble-left-right',
					text: t('interview.confirm.behaviorInfo')
				},
				{
					icon: 'i-heroicons-clock',
					text: t('interview.confirm.behaviorTime')
				},
				{
					icon: 'i-heroicons-credit-card',
					text: t('interview.confirm.deduct', {
						name: t('home.services.behavior'),
						count: props.remainingCount
					})
				}
			]
		}
	}

	return configs[props.serviceType] || configs[SERVICE_TAGS.SPECIAL]
})

const handleConfirm = () => {
	if (props.remainingCount <= 0) {
		return
	}
	props.onConfirm?.()
}

const handleGoToRecharge = () => {
	globalModal.closeModal()
	navigateTo('/profile')
}
</script>
