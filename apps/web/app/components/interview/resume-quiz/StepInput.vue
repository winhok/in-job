<template>
	<div
		class="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden"
	>
		<!-- 顶部装饰条 -->
		<div
			class="h-1.5 bg-linear-to-r from-primary-400 via-purple-400 to-primary-400 bg-size-[200%_100%] animate-[gradient_3s_ease-in-out_infinite]"
		></div>

		<div class="p-8 space-y-8">
			<!-- 顶部提示 - 根据服务类型动态展示 -->
			<div
				class="rounded-xl p-4 flex gap-4 border"
				:class="serviceConfig.containerClass"
			>
				<div class="shrink-0">
					<div
						class="w-8 h-8 rounded-full flex items-center justify-center"
						:class="serviceConfig.iconBgClass"
					>
						<UIcon
							:name="serviceConfig.icon"
							class="w-5 h-5"
							:class="serviceConfig.iconClass"
						/>
					</div>
				</div>
				<div class="text-sm text-neutral-600 leading-relaxed flex-1">
					<p class="font-bold text-neutral-900 mb-1 flex items-center gap-2">
						{{ serviceConfig.title }}
						<span
							class="text-[10px] px-1.5 py-0.5 rounded-full border"
							:class="serviceConfig.badgeClass"
							>{{ serviceConfig.badge }}</span
						>
					</p>
					<p class="text-neutral-500 text-xs mb-2">
						{{ serviceConfig.description }}
					</p>
					<ul class="grid sm:grid-cols-2 gap-2 text-xs text-neutral-500">
						<li
							v-for="(point, index) in serviceConfig.points"
							:key="index"
							class="flex items-center gap-1.5"
						>
							<UIcon
								name="i-heroicons-check-circle"
								class="w-3.5 h-3.5 text-green-500"
							/>
							<span>{{ point }}</span>
						</li>
					</ul>
				</div>
			</div>

			<div class="grid gap-8 md:grid-cols-3">
				<!-- 公司名称 -->
				<div class="space-y-2.5 group">
					<label
						class="flex items-center justify-between text-sm font-semibold text-neutral-700"
					>
						<span class="flex items-center gap-1.5">
							<UIcon
								name="i-heroicons-building-office-2"
								class="w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
							/>
							目标公司
						</span>
					</label>
					<UInput
						v-model="interviewStore.selectedPosition.company"
						class="w-full text-sm"
						placeholder="请输入公司全称，如：字节跳动"
						size="lg"
					/>
				</div>

				<!-- 岗位名称 -->
				<div class="space-y-2.5 group">
					<label
						class="flex items-center justify-between text-sm font-semibold text-neutral-700"
					>
						<span class="flex items-center gap-1.5">
							<UIcon
								name="i-heroicons-building-office-2"
								class="w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
							/>
							岗位名称
						</span>
					</label>
					<UInput
						v-model="interviewStore.selectedPosition.positionName"
						class="w-full text-sm"
						placeholder="请输入岗位名称，如：前端开发工程师"
						size="lg"
					/>
				</div>

				<!-- 薪资范围 -->
				<div class="space-y-2.5 group">
					<label
						class="flex items-center justify-between text-sm font-semibold text-neutral-700"
					>
						<span class="flex items-center gap-1.5">
							<UIcon
								name="i-heroicons-currency-yen"
								class="w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
							/>
							薪资范围
							<span
								class="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100"
								>必填</span
							>
							<span class="text-xs text-neutral-400">以 千（K）为单位</span>
						</span>
					</label>
					<div class="flex items-center gap-3">
						<div class="relative flex-1">
							<UInput
								v-model="interviewStore.selectedPosition.minSalary"
								class="w-full"
								placeholder="最低 (k)"
								size="lg"
								type="number"
							>
								<template #trailing>
									<span class="text-xs text-neutral-400">k/月</span>
								</template>
							</UInput>
						</div>
						<div class="shrink-0 text-neutral-400">
							<UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
						</div>
						<div class="relative flex-1">
							<UInput
								v-model="interviewStore.selectedPosition.maxSalary"
								class="w-full"
								placeholder="最高 (k)"
								size="lg"
								type="number"
							>
								<template #trailing>
									<span class="text-xs text-neutral-400">k/月</span>
								</template>
							</UInput>
						</div>
					</div>
				</div>
			</div>

			<!-- 岗位职责 (JD) -->
			<div class="space-y-3 group">
				<div class="flex items-center justify-between">
					<label
						class="flex items-center gap-1.5 text-sm font-semibold text-neutral-700"
					>
						<UIcon
							name="i-heroicons-document-text"
							class="w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
						/>
						岗位职责 (JD)
						<span
							class="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100"
							>必填</span
						>
						<span class="text-xs text-neutral-400"
							>{{ MIN_JD_LENGTH }} ~ {{ MAX_JD_LENGTH }} 字</span
						>
					</label>
					<div class="flex items-center gap-2">
						<transition
							enter-active-class="transition duration-200 ease-out"
							enter-from-class="transform scale-95 opacity-0"
							enter-to-class="transform scale-100 opacity-100"
							leave-active-class="transition duration-75 ease-in"
							leave-from-class="transform scale-100 opacity-100"
							leave-to-class="transform scale-95 opacity-0"
						>
							<span
								v-if="interviewStore.selectedPosition.jd?.length > 0"
								class="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1"
							>
								<UIcon name="i-heroicons-check" class="w-3 h-3" />
								内容已输入
							</span>
						</transition>
						<span
							class="text-xs text-neutral-400 font-mono"
							:class="{
								'text-primary-600 font-medium':
									interviewStore.selectedPosition?.jd?.length > 0
							}"
						>
							{{ interviewStore.selectedPosition?.jd?.length || 0 }} 字
						</span>
					</div>
				</div>
				<div class="relative">
					<UTextarea
						class="w-full"
						v-model="interviewStore.selectedPosition.jd"
						minlength="50"
						maxlength="800"
						placeholder="请直接粘贴目标岗位的职位描述（JD）...

💡 提示：越详细的 JD（包含任职要求、技术栈、加分项），生成的押题越准确，最少 50 字，最大 2000 字。

示例：
1. 负责前端核心业务功能的开发与维护
2. 熟练掌握 Vue3、TypeScript 等技术栈
3. 具备良好的跨部门沟通协作能力"
						:rows="15"
						size="lg"
						required
					/>
					<!-- 装饰角标 -->
					<div
						class="absolute bottom-4 right-4 pointer-events-none transition-opacity duration-300"
						:class="
							interviewStore.selectedPosition.jd?.length > 0
								? 'opacity-0'
								: 'opacity-100'
						"
					>
						<UIcon
							name="i-heroicons-pencil-square"
							class="w-12 h-12 text-gray-100"
						/>
					</div>
				</div>
			</div>

			<div
				class="pt-4 border-t border-gray-100 flex items-center justify-between"
			>
				<div class="text-xs text-neutral-400 hidden sm:block">
					* 点击按钮即表示消耗 1 次{{ serviceConfig.consumeText }}
				</div>
				<UButton
					size="xl"
					:color="serviceConfig.buttonColor"
					class="w-full sm:w-auto px-12 hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300"
					@click="handleSubmit"
					:ui="{ rounded: 'rounded-xl' }"
				>
					<span class="font-bold text-base">{{
						serviceConfig.buttonText
					}}</span>
					<template #trailing>
						<UIcon
							:name="serviceConfig.buttonIcon"
							class="w-5 h-5 animate-pulse"
						/>
					</template>
				</UButton>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import { useToast } from '#imports'
import { MIN_JD_LENGTH, MAX_JD_LENGTH } from '@/constants'

const props = defineProps({
	serviceType: {
		type: String,
		default: 'resume', // 'resume' | 'special' | 'behavior'
		validator: (value) => ['resume', 'special', 'behavior'].includes(value)
	}
})

const emit = defineEmits(['submit'])

const interviewStore = useInterviewStore()

const toast = useToast()

// 服务类型配置
const SERVICE_CONFIGS = {
	resume: {
		title: '开启 AI 精准押题',
		badge: '采用 Ultra 级模型',
		description:
			'请输入目标岗位的详细信息，AI 将为您生成专属的预测题库与高分回答思路。',
		points: [
			'智能分析岗位 JD',
			'预测高频面试题',
			'提供参考答案与技巧',
			'生成专业评估报告'
		],
		icon: 'i-heroicons-document-text',
		iconClass: 'text-blue-600',
		iconBgClass: 'bg-blue-100',
		containerClass: 'bg-blue-50/40 border-blue-100/50',
		badgeClass: 'text-blue-600 bg-blue-50 border-blue-100',
		buttonText: '立即押题',
		buttonIcon: 'i-heroicons-sparkles',
		buttonColor: 'primary',
		consumeText: '押题权益'
	},
	special: {
		title: '开启专项面试模拟',
		badge: '1v1 实战训练',
		description:
			'请输入目标岗位的详细信息，AI 面试官将与您进行深度 1v1 模拟面试对话。',
		points: [
			'真实面试场景模拟',
			'AI 智能追问反馈',
			'多轮深度问答评估',
			'生成专业评估报告'
		],
		icon: 'i-heroicons-bolt',
		iconClass: 'text-emerald-600',
		iconBgClass: 'bg-emerald-100',
		containerClass: 'bg-emerald-50/40 border-emerald-100/50',
		badgeClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
		buttonText: '开始面试模拟',
		buttonIcon: 'i-heroicons-bolt',
		buttonColor: 'primary',
		consumeText: '专项面试权益'
	},
	behavior: {
		title: '开启行测 + HR 面试',
		badge: '综合能力评估',
		description:
			'请输入目标岗位的详细信息，系统将为您生成行测题库与 HR 面试评估方案。',
		points: [
			'行测题库模拟测试',
			'HR 面试软技能评估',
			'沟通表达能力分析',
			'生成专业评估报告'
		],
		icon: 'i-heroicons-chat-bubble-left-right',
		iconClass: 'text-purple-600',
		iconBgClass: 'bg-purple-100',
		containerClass: 'bg-purple-50/40 border-purple-100/50',
		badgeClass: 'text-purple-600 bg-purple-50 border-purple-100',
		buttonText: '开始行测+HR',
		buttonIcon: 'i-heroicons-chat-bubble-left-right',
		buttonColor: 'primary',
		consumeText: '行测+HR权益'
	}
}

// 根据服务类型获取配置
const serviceConfig = computed(() => {
	return SERVICE_CONFIGS[props.serviceType] || SERVICE_CONFIGS.resume
})

/**
 * 提交押题
 */
const handleSubmit = () => {
	// 薪资范围也是必填的
	if (
		!interviewStore.selectedPosition.minSalary ||
		!interviewStore.selectedPosition.maxSalary
	) {
		toast.add({
			title: '请填写薪资范围',
			description: '以便生成更加准确的服务数据',
			color: 'error'
		})
		return
	}

	// JD 字数判断 50 ~ 800 字之间
	if (
		interviewStore.selectedPosition.jd?.trim().length < MIN_JD_LENGTH ||
		interviewStore.selectedPosition.jd?.trim().length > MAX_JD_LENGTH
	) {
		toast.add({
			title: '请填写更加详细的岗位职责（JD）',
			description: '以便生成更加准确的服务数据（最少 50 字）',
			color: 'error'
		})
		return
	}

	emit('submit')
}
</script>
