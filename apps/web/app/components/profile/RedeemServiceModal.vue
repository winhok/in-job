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
					<h3 class="text-lg font-bold text-gray-900">旺旺币兑换服务</h3>
					<p class="text-xs text-gray-500">使用旺旺币兑换面试服务权益</p>
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
								<p class="text-sm text-white/80 mb-2">当前旺旺币余额</p>
								<div class="flex items-baseline gap-2">
									<span class="text-5xl font-bold">{{
										userStore.userInfo?.wwCoinBalance || 0
									}}</span>
									<span class="text-lg text-white/80">旺旺币</span>
								</div>
							</div>
							<div
								class="text-right bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20"
							>
								<p class="text-xs text-white/80 mb-1">可兑换次数</p>
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
							<span>{{ REDEEM_COST }} 旺旺币可兑换任意服务一次</span>
						</div>
					</div>
				</div>

				<!-- 服务选择卡片 -->
				<div>
					<div class="mb-4">
						<h4 class="text-sm font-semibold text-gray-900 mb-1">
							选择要兑换的服务
						</h4>
						<p class="text-xs text-gray-500">
							选择一项服务进行兑换，兑换成功后立即生效
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
									<span class="text-xs text-gray-500">兑换成本</span>
									<div class="flex items-baseline gap-1">
										<span class="text-xl font-bold text-amber-600">{{
											REDEEM_COST
										}}</span>
										<span class="text-xs text-gray-500">旺旺币</span>
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
						<p class="text-sm font-medium text-red-900 mb-1">余额不足</p>
						<p class="text-xs text-red-700">
							您的旺旺币余额不足，无法兑换服务。请先充值旺旺币。
						</p>
					</div>
					<UButton
						color="red"
						variant="soft"
						size="xs"
						@click="handleGoToRecharge"
					>
						去充值
					</UButton>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex items-center justify-between w-full">
				<div class="text-xs text-gray-500">
					<p>兑换后服务立即生效，可在个人中心查看剩余次数</p>
				</div>
				<div class="flex items-center gap-3">
					<UButton color="gray" variant="ghost" @click="handleCancel">
						取消
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
						确认兑换
					</UButton>
				</div>
			</div>
		</template>
	</UModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { serviceHighlights, SERVICE_TAGS, REDEEM_COST } from '@/constants/vip'
import { exchangePackageAPI } from '@/api/interview'

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

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit('update:modelValue', value)
})

const selectedService = ref(null)
const isRedeeming = ref(false)

// 服务配置
const services = [
	{
		id: SERVICE_TAGS.RESUME,
		title: serviceHighlights[0].title,
		badge: serviceHighlights[0].badge,
		description: serviceHighlights[0].description,
		points: serviceHighlights[0].points,
		icon: serviceHighlights[0].icon,
		bgClass: 'bg-blue-50',
		iconClass: 'text-blue-600',
		activeBgClass: 'bg-blue-100',
		activeIconClass: 'text-blue-700',
		badgeClass: 'bg-blue-100 text-blue-700'
	},
	{
		id: SERVICE_TAGS.SPECIAL,
		title: serviceHighlights[1].title,
		badge: serviceHighlights[1].badge,
		description: serviceHighlights[1].description,
		points: serviceHighlights[1].points,
		icon: serviceHighlights[1].icon,
		bgClass: 'bg-emerald-50',
		iconClass: 'text-emerald-600',
		activeBgClass: 'bg-emerald-100',
		activeIconClass: 'text-emerald-700',
		badgeClass: 'bg-emerald-100 text-emerald-700'
	},
	{
		id: SERVICE_TAGS.BEHAVIOR,
		title: serviceHighlights[2].title,
		badge: serviceHighlights[2].badge,
		description: serviceHighlights[2].description,
		points: serviceHighlights[2].points,
		icon: serviceHighlights[2].icon,
		bgClass: 'bg-purple-50',
		iconClass: 'text-purple-600',
		activeBgClass: 'bg-purple-100',
		activeIconClass: 'text-purple-700',
		badgeClass: 'bg-purple-100 text-purple-700'
	}
]

const handleCancel = () => {
	isOpen.value = false
	selectedService.value = null
}

const handleRedeem = async () => {
	if (!selectedService.value) return
	if ((userStore.userInfo?.wwCoinBalance || 0) < REDEEM_COST) return

	// 对接兑换接口
	const { success } = await exchangePackageAPI($api, {
		packageType: selectedService.value
	})

	if (success) {
		// 触发兑换事件，由父组件处理实际的兑换逻辑
		emit('redeem-success', {
			serviceType: serviceHighlights.find(
				(service) => service.id === selectedService.value
			)?.title,
			cost: REDEEM_COST
		})
	} else {
		toast.add({
			title: '哎呀，出错了...',
			description: '请稍等一会再试试哦～',
			color: 'error'
		})
	}
}

const handleGoToRecharge = () => {
	isOpen.value = false
	emit('go-to-recharge')
}
</script>
