<template>
	<div class="space-y-5">
		<!-- 基本信息卡片 -->
		<div class="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
			<div class="space-y-3">
				<div>
					<p class="text-sm text-neutral-500 mb-1">目标岗位</p>
					<p class="text-base font-semibold text-neutral-900">
						{{ interviewStore.selectedPosition.positionName }}
					</p>
				</div>
				<div>
					<label class="text-sm text-neutral-500 mb-1 block"
						>目标公司（选填）</label
					>
					<UInput
						v-model="interviewStore.selectedPosition.company"
						class="w-full"
						placeholder="请输入公司名称，例如：字节跳动"
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
					<span v-html="item.text"></span>
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
			去充值
		</UButton>

		<!-- 余额不足提示 -->
		<div
			v-if="remainingCount <= 0"
			class="text-center text-sm text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200"
		>
			<UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline" />
			余额不足，请先充值
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

// 服务配置映射
const serviceConfig = computed(() => {
	const configs = {
		[SERVICE_TAGS.RESUME]: {
			borderColor: 'border-blue-200',
			iconColor: 'text-blue-500',
			buttonText: '开始押题',
			infoItems: [
				{
					icon: 'i-heroicons-document-text',
					text: '本次服务将<span class="text-blue-600 font-semibold">基于岗位 JD 生成押题清单</span>，附带示范答案与提醒。'
				},
				{
					icon: 'i-heroicons-clock',
					text: '预计生成时长：<span class="text-blue-600 font-semibold"> 5 - 7 分钟</span>。'
				},
				{
					icon: 'i-heroicons-credit-card',
					text: `确认后将<strong class="text-blue-600">扣除 1 次简历押题</strong>余额（当前剩余 ${props.remainingCount} 次）。`
				}
			]
		},
		[SERVICE_TAGS.SPECIAL]: {
			borderColor: 'border-primary-200',
			iconColor: 'text-primary-500',
			buttonText: '开始 专项面试',
			infoItems: [
				{
					icon: 'i-heroicons-bolt',
					text: '本次服务将进行<span class="text-primary-600 font-semibold">专项技能面试模拟</span>，包含 AI 即时反馈与追问。'
				},
				{
					icon: 'i-heroicons-clock',
					text: '本次专项面试<span class="text-primary-600 font-semibold">时长约 60 ～ 90 分钟</span>，包含提问与反馈环节。'
				},
				{
					icon: 'i-heroicons-credit-card',
					text: `确认后将<strong class="text-primary-600">扣除 1 次专项面试</strong>余额（当前剩余 ${props.remainingCount} 次）。`
				}
			]
		},
		[SERVICE_TAGS.BEHAVIOR]: {
			borderColor: 'border-purple-200',
			iconColor: 'text-purple-500',
			buttonText: '开始 行测 + HR 面试',
			infoItems: [
				{
					icon: 'i-heroicons-chat-bubble-left-right',
					text: '本次服务包含<span class="text-purple-600 font-semibold">行测题库与 HR 面试模拟</span>，全面评估软技能。'
				},
				{
					icon: 'i-heroicons-clock',
					text: '本次综合面试<span class="text-purple-600 font-semibold">时长约 45 ～ 70 分钟</span>，包含行测与 HR 问答。'
				},
				{
					icon: 'i-heroicons-credit-card',
					text: `确认后将<strong class="text-purple-600">扣除 1 次综合面试</strong>余额（当前剩余 ${props.remainingCount} 次）。`
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
