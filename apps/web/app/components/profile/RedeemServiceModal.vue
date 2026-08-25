<template>
	<UModal v-model:open="isOpen" :ui="{ content: 'max-w-4xl' }">
		<template #header>
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"
				>
					<UIcon name="i-heroicons-sparkles" class="w-6 h-6 text-white" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-900">
						{{ $t('profile.redeemModal.title') }}
					</h3>
					<p class="text-xs text-gray-500">
						{{ $t('profile.redeemModal.description') }}
					</p>
				</div>
			</div>
		</template>

		<template #body>
			<div class="space-y-6">
				<!-- 旺旺币余额展示 -->
				<div
					class="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-xl"
				>
					<div class="absolute top-0 right-0 w-64 h-64 opacity-10">
						<UIcon name="i-heroicons-sparkles" class="w-full h-full" />
					</div>
					<div class="relative z-10">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm text-white/80 mb-2">
									{{ $t('profile.redeemModal.balance') }}
								</p>
								<div class="flex items-baseline gap-2">
									<span class="text-5xl font-bold">{{
										userStore.userInfo?.wwCoinBalance || 0
									}}</span>
									<span class="text-lg text-white/80">{{
										$t('profile.redeemModal.coin')
									}}</span>
								</div>
							</div>
							<div
								class="text-right bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20"
							>
								<p class="text-xs text-white/80 mb-1">
									{{ $t('profile.redeemModal.available') }}
								</p>
								<p class="text-2xl font-bold">
									{{
										Math.floor(
											(userStore.userInfo?.wwCoinBalance || 0) / REDEEM_COST
										)
									}}
								</p>
							</div>
						</div>
						<div
							class="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-sm text-white/90"
						>
							<UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
							<span>{{
								$t('profile.redeemModal.rate', { cost: REDEEM_COST })
							}}</span>
						</div>
					</div>
				</div>

				<!-- 服务选择卡片 -->
				<div>
					<div class="mb-4">
						<h4 class="text-sm font-semibold text-gray-900 mb-1">
							{{ $t('profile.redeemModal.choose') }}
						</h4>
						<p class="text-xs text-gray-500">
							{{ $t('profile.redeemModal.chooseDesc') }}
						</p>
					</div>

					<div class="grid md:grid-cols-3 gap-4">
						<div
							v-for="service in services"
							:key="service.id"
							class="group relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden"
							:class="[
								selectedService === service.id
									? 'border-primary-500 shadow-lg shadow-primary-500/20 scale-[1.02]'
									: 'border-gray-200 hover:border-primary-300 hover:shadow-md'
							]"
							@click="selectedService = service.id"
						>
							<!-- 选中标记 -->
							<div
								v-if="selectedService === service.id"
								class="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center z-10"
							>
								<UIcon name="i-heroicons-check" class="w-4 h-4 text-white" />
							</div>

							<!-- 背景装饰 -->
							<div
								class="absolute top-0 right-0 w-32 h-32 opacity-5 transition-opacity group-hover:opacity-10"
							>
								<UIcon :name="service.icon" class="w-full h-full" />
							</div>

							<div class="relative p-5 space-y-4">
								<!-- 图标和标题 -->
								<div class="flex items-start gap-3">
									<div
										class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
										:class="[
											selectedService === service.id
												? service.activeBgClass
												: service.bgClass
										]"
									>
										<UIcon
											:name="service.icon"
											class="w-6 h-6 transition-colors"
											:class="[
												selectedService === service.id
													? service.activeIconClass
													: service.iconClass
											]"
										/>
									</div>
									<div class="flex-1">
										<h5 class="font-bold text-gray-900 mb-1">
											{{ service.title }}
										</h5>
										<span
											class="inline-flex items-center text-xs px-2 py-0.5 rounded-full"
											:class="service.badgeClass"
										>
											{{ service.badge }}
										</span>
									</div>
								</div>

								<!-- 描述 -->
								<p class="text-xs text-gray-600 leading-relaxed">
									{{ service.description }}
								</p>

								<!-- 特点列表 -->
								<ul class="space-y-2">
									<li
										v-for="(point, index) in service.points"
										:key="index"
										class="flex items-start gap-2 text-xs text-gray-600"
									>
										<UIcon
											name="i-heroicons-check-circle"
											class="w-4 h-4 text-green-500 shrink-0 mt-0.5"
										/>
										<span>{{ point }}</span>
									</li>
								</ul>

								<!-- 兑换成本 -->
								<div
									class="pt-3 border-t border-gray-100 flex items-center justify-between"
								>
									<span class="text-xs text-gray-500">{{
										$t('profile.redeemModal.cost')
									}}</span>
									<div class="flex items-baseline gap-1">
										<span class="text-xl font-bold text-amber-600">{{
											REDEEM_COST
										}}</span>
										<span class="text-xs text-gray-500">{{
											$t('profile.redeemModal.coin')
										}}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- 余额不足提示 -->
				<div
					v-if="(userStore.userInfo?.wwCoinBalance || 0) < REDEEM_COST"
					class="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3"
				>
					<UIcon
						name="i-heroicons-exclamation-circle"
						class="w-5 h-5 text-red-600 shrink-0 mt-0.5"
					/>
					<div class="flex-1">
						<p class="text-sm font-medium text-red-900 mb-1">
							{{ $t('profile.redeemModal.insufficient') }}
						</p>
						<p class="text-xs text-red-700">
							{{ $t('profile.redeemModal.insufficientDesc') }}
						</p>
					</div>
					<UButton
						color="red"
						variant="soft"
						size="xs"
						@click="handleGoToRecharge"
					>
						{{ $t('profile.redeemModal.recharge') }}
					</UButton>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex items-center justify-between w-full">
				<div class="text-xs text-gray-500">
					<p>{{ $t('profile.redeemModal.effective') }}</p>
				</div>
				<div class="flex items-center gap-3">
					<UButton color="gray" variant="ghost" @click="handleCancel">
						{{ $t('common.cancel') }}
					</UButton>
					<UButton
						color="primary"
						:disabled="
							!selectedService ||
							(userStore.userInfo?.wwCoinBalance || 0) < REDEEM_COST ||
							isRedeeming
						"
						:loading="isRedeeming"
						@click="handleRedeem"
					>
						<UIcon name="i-heroicons-sparkles" class="w-4 h-4 mr-1" />
						{{ $t('profile.redeemModal.confirm') }}
					</UButton>
				</div>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { serviceHighlights, SERVICE_TAGS, REDEEM_COST } from '@/constants/vip'
import { exchangePackageAPI } from '@/api/interview'
import { useToast } from '#imports'

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits([
	'update:modelValue',
	'redeem-success',
	'go-to-recharge'
])

const { $api } = useNuxtApp()

const userStore = useUserStore()
const toast = useToast()
const { t } = useI18n()

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit('update:modelValue', value)
})

const selectedService = ref(null)
const isRedeeming = ref(false)

// 服务配置
const services = computed(() => [
	{
		id: SERVICE_TAGS.RESUME,
		title: t('home.services.quiz'),
		badge: t('home.services.prep'),
		description: t('home.services.quizDesc'),
		points: ['quizPoint1', 'quizPoint2', 'quizPoint3'].map((key) =>
			t(`home.services.${key}`)
		),
		icon: serviceHighlights[0].icon,
		bgClass: 'bg-blue-50',
		iconClass: 'text-blue-600',
		activeBgClass: 'bg-blue-100',
		activeIconClass: 'text-blue-700',
		badgeClass: 'bg-blue-100 text-blue-700'
	},
	{
		id: SERVICE_TAGS.SPECIAL,
		title: t('home.services.special'),
		badge: t('home.services.popular'),
		description: t('home.services.specialDesc'),
		points: ['specialPoint1', 'specialPoint2', 'specialPoint3'].map((key) =>
			t(`home.services.${key}`)
		),
		icon: serviceHighlights[1].icon,
		bgClass: 'bg-emerald-50',
		iconClass: 'text-emerald-600',
		activeBgClass: 'bg-emerald-100',
		activeIconClass: 'text-emerald-700',
		badgeClass: 'bg-emerald-100 text-emerald-700'
	},
	{
		id: SERVICE_TAGS.BEHAVIOR,
		title: t('home.services.behavior'),
		badge: t('home.services.assessment'),
		description: t('home.services.behaviorDesc'),
		points: ['behaviorPoint1', 'behaviorPoint2', 'behaviorPoint3'].map((key) =>
			t(`home.services.${key}`)
		),
		icon: serviceHighlights[2].icon,
		bgClass: 'bg-purple-50',
		iconClass: 'text-purple-600',
		activeBgClass: 'bg-purple-100',
		activeIconClass: 'text-purple-700',
		badgeClass: 'bg-purple-100 text-purple-700'
	}
])

const handleCancel = () => {
	isOpen.value = false
	selectedService.value = null
}

const handleRedeem = async () => {
	if (!selectedService.value) return
	if ((userStore.userInfo?.wwCoinBalance || 0) < REDEEM_COST) return

	isRedeeming.value = true
	try {
		const result = await exchangePackageAPI($api, {
			packageType: selectedService.value
		})

		if (!result.success) throw new Error(t('profile.redeemModal.failed'))
		userStore.updateUserInfo({
			wwCoinBalance: result.remainingWWCoin,
			[`${selectedService.value}RemainingCount`]: result.remainingCount
		})
		// 触发兑换事件，由父组件处理实际的兑换逻辑
		emit('redeem-success', {
			serviceType: services.value.find(
				(service) => service.id === selectedService.value
			)?.title,
			cost: REDEEM_COST
		})
		isOpen.value = false
	} catch (error) {
		toast.add({
			title: t('profile.redeemModal.error'),
			description: error?.message || t('profile.later'),
			color: 'error'
		})
	} finally {
		isRedeeming.value = false
	}
}

const handleGoToRecharge = () => {
	isOpen.value = false
	emit('go-to-recharge')
}
</script>
