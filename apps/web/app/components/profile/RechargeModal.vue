<template>
	<UModal
		v-model:open="isOpen"
		:title="$t('profile.rechargeModal.title')"
		:ui="{ content: 'max-w-[1218px]' }"
	>
		<template #body>
			<div class="space-y-6">
				<!-- 旺旺币余额-->
				<div
					class="flex justify-between bg-linear-to-r from-primary-500/10 via-primary-500/5 to-primary-500/10 rounded-2xl p-5 border border-primary-100"
				>
					<div>
						<div class="flex items-center justify-between gap-4">
							<div>
								<span class="text-sm text-gray-600 mr-2">{{
									$t('profile.rechargeModal.balance')
								}}</span>
								<span class="text-2xl font-bold text-primary-600">
									{{
										Number(userStore.userInfo?.wwCoinBalance || 0).toFixed(2)
									}}
									{{ $t('profile.redeemModal.coin') }}
								</span>
								<p class="text-xs text-gray-500 mt-1">
									{{ $t('profile.rechargeModal.after') }}
									<span class="text-primary-600 font-bold text-sm"
										>{{ REDEEM_COST }}
									</span>
									<!-- 兑换入口位于个人中心的旺旺币兑换弹窗 -->
									{{ $t('profile.redeemModal.rate', { cost: REDEEM_COST }) }}
									<span class="text-gray-500 text-xs ml-4">
										{{
											$t('profile.rechargeModal.redeemable', {
												count: redeemableCount
											})
										}}
									</span>
								</p>
							</div>
						</div>
					</div>

					<div class="flex flex-col gap-2 w-[300px]">
						<div class="flex items-center gap-2">
							<UInput
								class="w-[80%]"
								v-model="customAmount"
								color="success"
								type="number"
								:placeholder="$t('profile.rechargeModal.amountPlaceholder')"
								min="1"
								max="10000"
								:ui="{
									base: 'pr-[50px]'
								}"
							>
								<template #leading>
									<span class="text-xs text-gray-500">{{
										$t('profile.rechargeModal.buy')
									}}</span>
								</template>
								<template #trailing>
									<span class="text-xs text-gray-500">{{
										$t('profile.redeemModal.coin')
									}}</span>
								</template>
							</UInput>
							<UButton
								color="warning"
								size="xs"
								variant="outline"
								@click="handleCustomRecharge"
								>{{ $t('common.confirm') }}</UButton
							>
						</div>
						<p class="text-[11px] text-gray-500">
							{{
								localizedServices.map((service) => service.title).join(' / ')
							}}
						</p>
					</div>
				</div>

				<div class="flex flex-col lg:flex-row gap-4">
					<!-- 左侧：套餐列表 -->
					<div class="flex-1 space-y-4">
						<div>
							<!-- 顶部标题 -->
							<div class="flex items-center justify-between mb-2">
								<div>
									<p class="text-sm font-semibold text-gray-900">
										{{ $t('profile.rechargeModal.plans') }}
									</p>
									<p class="text-xs text-gray-500">
										{{ $t('profile.rechargeModal.plansDesc') }}
									</p>
								</div>
								<p class="text-xs text-gray-400">
									{{ $t('profile.rechargeModal.immediate') }}
								</p>
							</div>
							<!-- 套餐包列表 -->
							<div
								class="flex gap-4 overflow-x-auto pt-0.5 pb-2 snap-x snap-mandatory"
							>
								<!-- 套餐包 -->
								<button
									v-for="plan in localizedRechargePlans"
									:key="plan.id"
									type="button"
									class="min-w-[208px] snap-start rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5"
									:class="
										selectedPlanId === plan.id
											? 'border-primary-500 bg-primary-50/80 shadow-lg'
											: 'border-transparent bg-white shadow'
									"
									@click="handlePlanSelect(plan.id)"
								>
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-1.5">
											<p class="text-base font-semibold text-gray-900">
												{{ plan.name }}
											</p>
											<span
												v-if="plan.badge"
												class="text-[11px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 font-medium"
											>
												{{ plan.badge }}
											</span>
										</div>
										<div
											class="w-5 h-5 rounded-full border"
											:class="
												selectedPlanId === plan.id
													? 'border-primary-500 bg-primary-500 text-white flex items-center justify-center'
													: 'border-gray-300'
											"
										>
											<UIcon
												v-if="selectedPlanId === plan.id"
												name="i-heroicons-check-mini"
												class="w-3 h-3"
											/>
										</div>
									</div>
									<p class="text-xs text-gray-500 mb-3">
										{{ plan.tagline || plan.description }}
									</p>

									<ul
										v-if="plan.perks?.length"
										class="space-y-1 text-sm text-gray-700 mb-3"
									>
										<li
											v-for="perk in plan.perks"
											:key="plan.id + perk.label"
											class="flex items-center gap-1.5"
										>
											<UIcon
												name="i-heroicons-check-circle"
												class="w-4 h-4 text-primary-500"
											/>
											<span>{{
												$t('profile.rechargeModal.perk', {
													count: perk.count,
													label: perk.label
												})
											}}</span>
										</li>
									</ul>

									<div
										class="flex flex-col items-start justify-between text-xs"
									>
										<span class="text-amber-600 font-medium">
											{{
												$t('profile.rechargeModal.original', {
													original: plan.originalPrice,
													saving: plan.saving
												})
											}}
										</span>
										<span class="text-gray-500 mt-1">{{
											$t('profile.rechargeModal.permanent')
										}}</span>
									</div>
									<div class="mt-3">
										<p class="text-3xl font-bold text-gray-900">
											¥{{ plan.price }}
										</p>
										<p class="text-xs text-gray-500">
											{{
												$t('profile.rechargeModal.coins', { coins: plan.coins })
											}}
										</p>
									</div>
								</button>
							</div>
						</div>

						<div
							class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600"
						>
							<div
								v-for="service in localizedServices"
								:key="service.title"
								class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex gap-3 items-start"
							>
								<div
									class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-inner"
								>
									<UIcon
										:name="service.icon"
										class="w-4 h-4 text-primary-500"
									/>
								</div>
								<div>
									<p class="font-medium text-gray-900 mb-0.5">
										{{ service.title }}
									</p>
									<p class="text-[11px] leading-relaxed">
										{{ service.description }}
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- 右侧：支付摘要 -->
					<div
						class="w-full lg:w-70 shrink-0 rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3"
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-sm font-medium">
								<UButton
									v-for="method in localizedPaymentMethods"
									:key="method.id"
									color="default"
									class="px-3 py-1.5 rounded-full border text-xs transition-all"
									:class="
										selectedPayment === method.id
											? 'border-emerald-500 bg-emerald-50 text-emerald-700'
											: 'border-transparent bg-gray-50 text-gray-500'
									"
									@click="handlePaymentSelect(method.id)"
								>
									{{ method.label }}
									<template #leading>
										<ww-svg-icon :name="method.icon" class="w-4 h-4" />
									</template>
								</UButton>
							</div>
							<span class="text-[11px] text-gray-400">{{
								$t('profile.rechargeModal.secure')
							}}</span>
						</div>

						<div class="text-center py-2 border rounded-2xl bg-gray-50/70">
							<p class="text-xs text-gray-500">
								{{
									$t('profile.rechargeModal.payWith', {
										method: selectedPaymentInfo?.label || ''
									})
								}}
							</p>
							<p class="text-3xl font-bold text-primary-600 mt-1">
								¥{{ selectedPlan?.price || '--' }}
							</p>
							<p
								v-if="selectedPlan?.saving"
								class="text-xs text-amber-600 font-medium mt-1"
							>
								{{
									$t('profile.rechargeModal.saving', {
										amount: selectedPlan.saving
									})
								}}
							</p>
						</div>

						<div
							class="h-[188px] rounded-xl border border-dashed border-gray-300 bg-white text-center text-xs text-gray-400 relative overflow-hidden"
						>
							<!-- 支付成功 -->
							<div
								v-if="paymentSuccess"
								class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-50 text-emerald-700"
							>
								<UIcon
									name="i-heroicons-check-circle"
									class="w-10 h-10 text-emerald-500"
								/>
								<p class="text-base font-semibold">
									{{ $t('profile.rechargeModal.success') }}
								</p>
								<p class="text-xs">
									{{ $t('profile.rechargeModal.successDesc') }}
								</p>
							</div>
							<!-- Loading 状态 -->
							<div
								v-else-if="loading"
								class="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl z-10"
							>
								<div class="flex flex-col items-center gap-2">
									<UIcon
										name="i-heroicons-arrow-path"
										class="w-6 h-6 text-primary-500 animate-spin"
									/>
									<p class="text-xs text-gray-500">
										{{ $t('profile.rechargeModal.qrLoading') }}
									</p>
								</div>
							</div>
							<!-- 支付二维码 -->
							<img
								v-else-if="order?.qrcode"
								:src="order?.qrcode"
								class="w-full h-full object-contain"
								:alt="$t('profile.rechargeModal.qrAlt')"
							/>
							<!-- 无二维码时的占位提示 -->
							<div
								v-else
								class="flex items-center justify-center h-full text-gray-400"
							>
								{{ $t('profile.rechargeModal.choosePlan') }}
							</div>
						</div>

						<p class="text-[11px] text-gray-400 text-center">
							{{ $t('profile.rechargeModal.agreementPrefix') }}
							<NuxtLink
								to="/agreement"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:underline"
							>
								{{ $t('legal.agreementTitle') }}
							</NuxtLink>
							{{ $t('login.and') }}
							<NuxtLink
								to="/policy"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:underline"
							>
								{{ $t('legal.privacyTitle') }}
							</NuxtLink>
						</p>
					</div>
				</div>
			</div>
		</template>
	</UModal>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { useToast } from '#imports'
import {
	rechargePlans,
	paymentMethods,
	serviceHighlights,
	REDEEM_COST,
	CUSTOM_RECHARGE_ID
} from '@/constants/vip'
import { createOrderAPI, queryOrderStatusAPI } from '@/api/payment'
import { useUserStore } from '@/stores/user'

const props = defineProps({
	open: {
		type: Boolean,
		default: false
	}
})

const { $api } = useNuxtApp()

const emit = defineEmits(['update:open', 'recharge'])

const userStore = useUserStore()

const toast = useToast()
const { t } = useI18n()
const loading = ref(false)
const paymentSuccess = ref(false)

const localizedServices = computed(() =>
	serviceHighlights.map((service, index) => ({
		...service,
		title: t(
			index === 0
				? 'home.services.quiz'
				: index === 1
					? 'home.services.special'
					: 'home.services.behavior'
		),
		description: t(
			index === 0
				? 'home.services.quizDesc'
				: index === 1
					? 'home.services.specialDesc'
					: 'home.services.behaviorDesc'
		)
	}))
)
const planCopy = {
	single: ['planSingle', 'planSingleDesc'],
	pro: ['planPro', 'planProDesc'],
	max: ['planMax', 'planMaxDesc'],
	ultra: ['planUltra', 'planUltraDesc']
}
const localizedRechargePlans = computed(() =>
	rechargePlans.map((plan) => ({
		...plan,
		name: t(`profile.rechargeModal.${planCopy[plan.id]?.[0] || 'custom'}`),
		description: t(
			`profile.rechargeModal.${planCopy[plan.id]?.[1] || 'custom'}`
		),
		tagline: t(`profile.rechargeModal.${planCopy[plan.id]?.[1] || 'custom'}`),
		badge: plan.badge
			? t(
					plan.id === 'pro'
						? 'profile.rechargeModal.hot'
						: 'profile.rechargeModal.value'
				)
			: '',
		perks: plan.perks.map((perk) => ({
			...perk,
			label:
				localizedServices.value.find((service) => service.id === perk.key)
					?.title || perk.label
		}))
	}))
)
const localizedPaymentMethods = computed(() =>
	paymentMethods.map((method) => ({
		...method,
		label: t(
			method.id === 'wechat'
				? 'profile.rechargeModal.wechat'
				: 'profile.rechargeModal.alipay'
		)
	}))
)

// 支持自定义充值，key === custom
const selectedPlanId = ref('pro')
const selectedPayment = ref('wechat')
const customAmount = ref('')

const isOpen = computed({
	get: () => props.open,
	set: (value) => emit('update:open', value)
})

/**
 * 获取当前选择的套餐
 * 如果选择的套餐不存在，则表示为自定义充值
 * 返回自定义充值的套餐对象
 * @returns {Object} 当前选择的套餐对象
 */
const selectedPlan = computed(() => {
	const res = localizedRechargePlans.value.find(
		(plan) => plan.id === selectedPlanId.value
	)
	if (!res) {
		// 表示为自定义充值
		return {
			id: CUSTOM_RECHARGE_ID,
			name: t('profile.rechargeModal.custom'),
			description: t('profile.rechargeModal.custom'),
			price: customAmount.value,
			coins: customAmount.value,
			originalPrice: customAmount.value,
			saving: 0,
			validDays: 0,
			perks: [],
			paymentMethod: CUSTOM_RECHARGE_ID
		}
	}
	return res
})

const selectedPaymentInfo = computed(() =>
	localizedPaymentMethods.value.find(
		(method) => method.id === selectedPayment.value
	)
)
const redeemableCount = computed(() =>
	Math.floor(Number(userStore.userInfo?.wwCoinBalance || 0) / REDEEM_COST)
)

// 定时查询订单状态的定时器
let interval = null

// 监听弹窗打开，重置表单
watch(isOpen, (open) => {
	if (open) {
		handleClose()
		order.value = null
		selectedPlanId.value = 'pro'
		selectedPayment.value = 'wechat'
		loading.value = false
		paymentSuccess.value = false
		customAmount.value = ''
		// 生成订单二维码
		generateOrderQRCode()
		// 定时查询订单状态
		interval = setInterval(() => void queryOrderStatus(), 3000)
	} else {
		handleClose()
	}
})

const handlePlanSelect = (planId) => {
	selectedPlanId.value = planId
}

const handlePaymentSelect = (methodId) => {
	selectedPayment.value = methodId
}

const handleCustomRecharge = async () => {
	const amount = Number(customAmount.value) || 0
	if (!amount || amount < 1 || amount > 10000) {
		toast.add({
			title: t('profile.rechargeModal.amountError'),
			color: 'warning'
		})
		return
	}

	// 修改 selectedPlanId 为 custom
	selectedPlanId.value = CUSTOM_RECHARGE_ID
	await generateOrderQRCode()
}

// 订单对象
const order = ref(null)
let orderGeneration = 0
// 生成订单二维码，监听 selectedPlan 变化
const generateOrderQRCode = async () => {
	if (!isOpen.value) return
	const generation = ++orderGeneration
	try {
		loading.value = true
		paymentSuccess.value = false
		order.value = null
		const req = {
			amount: selectedPlan.value.price,
			description: selectedPlan.value.description,
			channel: selectedPayment.value,
			planId: selectedPlan.value.id,
			planName: selectedPlan.value.name,
			source: 'web'
		}

		const createdOrder = await createOrderAPI($api, req)
		if (generation !== orderGeneration || !isOpen.value) return
		order.value = createdOrder

		// 处理订单二维码
		const qrcode = await QRCode.toDataURL(order.value.codeUrl)
		order.value.qrcode = qrcode
	} catch (error) {
		if (generation !== orderGeneration) return
		console.error('生成订单二维码失败:', error)
		toast.add({
			title: t('profile.rechargeModal.qrFailed'),
			color: 'error'
		})
		order.value = null
	} finally {
		if (generation === orderGeneration) loading.value = false
	}
}

watch([selectedPlanId, selectedPayment], () => void generateOrderQRCode())

// 常见定时查询器，每 4 秒查询一次
const queryOrderStatus = async () => {
	if (!order.value || paymentSuccess.value) return
	try {
		const res = await queryOrderStatusAPI($api, {
			orderId: order.value.orderId,
			channel: selectedPayment.value
		})

		if (res.success) {
			paymentSuccess.value = true
			handleClose()
			emit('recharge')
			toast.add({
				title: t('profile.rechargeModal.success'),
				color: 'success'
			})
		} else if (res.status === 'closed' || res.status === 'failed') {
			handleClose()
			toast.add({
				title: t('profile.rechargeModal.orderClosed'),
				color: 'warning'
			})
		}
	} catch (error) {
		console.error('查询支付状态失败:', error)
	}
}

/**
 * 关闭弹窗，清除定时器
 */
const handleClose = () => {
	orderGeneration += 1
	if (interval) clearInterval(interval)
	interval = null
}

onUnmounted(handleClose)
</script>

<style scoped></style>
