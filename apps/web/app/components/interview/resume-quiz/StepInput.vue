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
							{{ $t('interview.form.targetCompany') }}
						</span>
					</label>
					<UInput
						v-model="interviewStore.selectedPosition.company"
						class="w-full text-sm"
						:placeholder="$t('interview.form.companyPlaceholder')"
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
							{{ $t('interview.form.roleName') }}
						</span>
					</label>
					<UInput
						v-model="interviewStore.selectedPosition.positionName"
						class="w-full text-sm"
						:placeholder="$t('interview.form.rolePlaceholder')"
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
							{{ $t('interview.form.salary') }}
							<span
								class="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100"
								>{{ $t('interview.form.required') }}</span
							>
							<span class="text-xs text-neutral-400">{{
								$t('interview.form.salaryUnitHint')
							}}</span>
						</span>
					</label>
					<div class="flex items-center gap-3">
						<div class="relative flex-1">
							<UInput
								v-model="interviewStore.selectedPosition.minSalary"
								class="w-full"
								:placeholder="$t('interview.form.minSalary')"
								size="lg"
								type="number"
							>
								<template #trailing>
									<span class="text-xs text-neutral-400">{{
										$t('interview.form.monthlyK')
									}}</span>
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
								:placeholder="$t('interview.form.maxSalary')"
								size="lg"
								type="number"
							>
								<template #trailing>
									<span class="text-xs text-neutral-400">{{
										$t('interview.form.monthlyK')
									}}</span>
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
						{{ $t('interview.form.jd') }}
						<span
							class="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100"
							>{{ $t('interview.form.required') }}</span
						>
						<span class="text-xs text-neutral-400">{{
							$t('interview.form.charsRange', {
								min: MIN_JD_LENGTH,
								max: MAX_JD_LENGTH
							})
						}}</span>
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
								{{ $t('interview.form.entered') }}
							</span>
						</transition>
						<span
							class="text-xs text-neutral-400 font-mono"
							:class="{
								'text-primary-600 font-medium':
									interviewStore.selectedPosition?.jd?.length > 0
							}"
						>
							{{
								$t('interview.form.chars', {
									count: interviewStore.selectedPosition?.jd?.length || 0
								})
							}}
						</span>
					</div>
				</div>
				<div class="relative">
					<UTextarea
						class="w-full"
						v-model="interviewStore.selectedPosition.jd"
						minlength="50"
						maxlength="800"
						:placeholder="$t('interview.form.jdPlaceholder')"
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
					{{
						$t('interview.form.consume', { name: serviceConfig.consumeText })
					}}
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

<script setup lang="ts">
import { computed } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import { useToast } from '#imports'
import { MIN_JD_LENGTH, MAX_JD_LENGTH } from '@/constants'

const props = defineProps({
	serviceType: {
		type: String,
		default: 'resume', // 'resume' | 'special' | 'behavior'
		validator: (value: string) => ['resume', 'special', 'behavior'].includes(value)
	}
})

const emit = defineEmits(['submit'])

const interviewStore = useInterviewStore()

const toast = useToast()
const { t } = useI18n()

// 服务类型配置
const SERVICE_CONFIGS = computed(() => ({
	resume: {
		title: t('interview.form.resumeTitle'),
		badge: t('interview.form.resumeBadge'),
		description: t('interview.form.resumeDesc'),
		points: [
			t('interview.form.resumePoints.0'),
			t('interview.form.resumePoints.1'),
			t('interview.form.resumePoints.2'),
			t('interview.form.resumePoints.3')
		],
		icon: 'i-heroicons-document-text',
		iconClass: 'text-blue-600',
		iconBgClass: 'bg-blue-100',
		containerClass: 'bg-blue-50/40 border-blue-100/50',
		badgeClass: 'text-blue-600 bg-blue-50 border-blue-100',
		buttonText: t('interview.form.resumeButton'),
		buttonIcon: 'i-heroicons-sparkles',
		buttonColor: 'primary',
		consumeText: t('interview.form.resumeConsume')
	},
	special: {
		title: t('interview.form.specialTitle'),
		badge: t('interview.form.specialBadge'),
		description: t('interview.form.specialDesc'),
		points: [
			t('interview.form.specialPoints.0'),
			t('interview.form.specialPoints.1'),
			t('interview.form.specialPoints.2'),
			t('interview.form.specialPoints.3')
		],
		icon: 'i-heroicons-bolt',
		iconClass: 'text-emerald-600',
		iconBgClass: 'bg-emerald-100',
		containerClass: 'bg-emerald-50/40 border-emerald-100/50',
		badgeClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
		buttonText: t('interview.form.specialButton'),
		buttonIcon: 'i-heroicons-bolt',
		buttonColor: 'primary',
		consumeText: t('interview.form.specialConsume')
	},
	behavior: {
		title: t('interview.form.behaviorTitle'),
		badge: t('interview.form.behaviorBadge'),
		description: t('interview.form.behaviorDesc'),
		points: [
			t('interview.form.behaviorPoints.0'),
			t('interview.form.behaviorPoints.1'),
			t('interview.form.behaviorPoints.2'),
			t('interview.form.behaviorPoints.3')
		],
		icon: 'i-heroicons-chat-bubble-left-right',
		iconClass: 'text-purple-600',
		iconBgClass: 'bg-purple-100',
		containerClass: 'bg-purple-50/40 border-purple-100/50',
		badgeClass: 'text-purple-600 bg-purple-50 border-purple-100',
		buttonText: t('interview.form.behaviorButton'),
		buttonIcon: 'i-heroicons-chat-bubble-left-right',
		buttonColor: 'primary',
		consumeText: t('interview.form.behaviorConsume')
	}
}))

// 根据服务类型获取配置
const serviceConfig = computed(() => {
	return (
		SERVICE_CONFIGS.value[props.serviceType] || SERVICE_CONFIGS.value.resume
	)
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
			title: t('interview.form.salaryError'),
			description: t('interview.form.accurateData'),
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
			title: t('interview.form.jdError'),
			description: t('interview.form.jdErrorDesc', {
				min: MIN_JD_LENGTH,
				max: MAX_JD_LENGTH
			}),
			color: 'error'
		})
		return
	}

	emit('submit')
}
</script>
