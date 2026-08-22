<template>
	<UModal
		v-model:open="isOpen"
		title="充值享优惠"
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
								<span class="text-sm text-gray-600 mr-2">当前余额</span>
								<span class="text-2xl font-bold text-primary-600">
									{{ userStore.userInfo.wwCoinBalance.toFixed(2) }} 旺旺币
								</span>
								<p class="text-xs text-gray-500 mt-1">
									充值成功后即时到账，
									<span class="text-primary-600 font-bold text-sm"
										>{{ REDEEM_COST }}
									</span>
									<!-- TODO：实现兑换功能 -->
									旺旺币可兑换一次 {{ serviceHighlights[0].title }} /
									{{ serviceHighlights[1].title }} /
									{{ serviceHighlights[2].title }}
									<span class="text-gray-500 text-xs ml-4">
										目前可兑换
										<span class="text-primary-600 font-bold text-sm">{{
											redeemableCount
										}}</span>
										次
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
								placeholder="输入 1 - 10000 的整数"
								min="1"
								max="10000"
								:ui="{
									base: 'pr-[50px]'
								}"
							>
								<template #leading>
									<span class="text-xs text-gray-500">购买</span>
								</template>
								<template #trailing>
									<span class="text-xs text-gray-500">旺旺币</span>
								</template>
							</UInput>
							<UButton
								color="warning"
								size="xs"
								variant="outline"
								@click="handleCustomRecharge"
								>确定</UButton
							>
						</div>
						<p class="text-[11px] text-gray-500">
							旺旺币可用于兑换 {{ serviceHighlights[0].title }} /
							{{ serviceHighlights[1].title }} /
							{{ serviceHighlights[2].title }} 等服务
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
										购买套餐 / 旺旺币
									</p>
									<p class="text-xs text-gray-500">一次支付，解锁更多权益</p>
								</div>
								<p class="text-xs text-gray-400">套餐权益实时生效</p>
							</div>
							<!-- 套餐包列表 -->
							<div
								class="flex gap-4 overflow-x-auto pt-0.5 pb-2 snap-x snap-mandatory"
							>
								<!-- 套餐包 -->
								<button
									v-for="plan in rechargePlans"
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
											<span>{{ perk.count }} 次 {{ perk.label }}</span>
										</li>
									</ul>

									<div
										class="flex flex-col items-start justify-between text-xs"
									>
										<span class="text-amber-600 font-medium">
											原价 {{ plan.originalPrice }} 元 · 立省
											{{ plan.saving }} 元
										</span>
										<span class="text-gray-500 mt-1"
											>支付之后，套餐永久有效</span
										>
									</div>
									<div class="mt-3">
										<p class="text-3xl font-bold text-gray-900">
											¥{{ plan.price }}
										</p>
										<p class="text-xs text-gray-500">
											≈ {{ plan.coins }} 旺旺币
										</p>
									</div>
								</button>
							</div>
						</div>

						<div
							class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600"
						>
							<div
								v-for="service in serviceHighlights"
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
									v-for="method in paymentMethods"
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
							<span class="text-[11px] text-gray-400">安全支付</span>
						</div>

						<div class="text-center py-2 border rounded-2xl bg-gray-50/70">
							<p class="text-xs text-gray-500">
								{{ selectedPaymentInfo?.label }} 支付
							</p>
							<p class="text-3xl font-bold text-primary-600 mt-1">
								¥{{ selectedPlan?.price || '--' }}
							</p>
							<p
								v-if="selectedPlan?.saving"
								class="text-xs text-amber-600 font-medium mt-1"
							>
								限时立省 {{ selectedPlan.saving }} 元
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
								<p class="text-base font-semibold">支付成功</p>
								<p class="text-xs">权益已更新，可立即使用</p>
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
									<p class="text-xs text-gray-500">正在生成二维码...</p>
								</div>
							</div>
							<!-- 支付二维码 -->
							<img
								v-else-if="order?.qrcode"
								:src="order?.qrcode"
								class="w-full h-full object-contain"
								alt="支付二维码"
							/>
							<!-- 无二维码时的占位提示 -->
							<div
								v-else
								class="flex items-center justify-center h-full text-gray-400"
							>
								请选择套餐和支付方式
							</div>
						</div>

						<p class="text-[11px] text-gray-400 text-center">
							支付即视为同意相关<NuxtLink
								to="/agreement"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:underline"
							>
								服务协议
							</NuxtLink>
							与
							<NuxtLink
								to="/policy"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:underline"
							>
								隐私政策
							</NuxtLink>
						</p>
					</div>
				</div>
			</div>
		</template>
	</UModal>
</template>

<script setup>
import { ref, watch, computed, onUnmounted, onMounted } from 'vue'
import QRCode from 'qrcode'
import { useToast } from '#imports'
import {
	rechargePlans,
	paymentMethods,
	serviceHighlights,
	redeemServices,
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
const loading = ref(false)
const paymentSuccess = ref(false)

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
	const res = rechargePlans.find((plan) => plan.id === selectedPlanId.value)
	if (!res) {
		// 表示为自定义充值
		return {
			id: CUSTOM_RECHARGE_ID,
			name: '自定义充值',
			description: '自定义充值',
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
	paymentMethods.find((method) => method.id === selectedPayment.value)
)

// 定时查询订单状态的定时器
let interval = null

// 监听弹窗打开，重置表单
watch(isOpen, (open) => {
	if (open) {
		order.value = null
		selectedPlanId.value = 'pro'
		selectedPayment.value = 'wechat'
		loading.value = false
		paymentSuccess.value = false
		customAmount.value = ''
		// 生成订单二维码
		generateOrderQRCode()
		// 定时查询订单状态
		interval = setInterval(queryOrderStatus, 3000)
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
			title: '请输入 1-10000 的旺旺币数量',
			color: 'warning'
		})
		return
	}

	// 修改 selectedPlanId 为 custom
	selectedPlanId.value = CUSTOM_RECHARGE_ID
}

// 订单对象
const order = ref(null)
// 生成订单二维码，监听 selectedPlan 变化
const generateOrderQRCode = async () => {
	try {
		loading.value = true
		paymentSuccess.value = false
		const req = {
			amount: selectedPlan.value.price,
			description: selectedPlan.value.description,
			channel: selectedPayment.value,
			planId: selectedPlan.value.id,
			planName: selectedPlan.value.name,
			source: 'web'
		}

		order.value = await createOrderAPI($api, req)

		// 处理订单二维码
		const qrcode = await QRCode.toDataURL(order.value.codeUrl)
		order.value.qrcode = qrcode
	} catch (error) {
		console.error('生成订单二维码失败:', error)
		toast.add({
			title: '生成二维码失败，请重试',
			color: 'error'
		})
		order.value = null
	} finally {
		loading.value = false
	}
}

watch(selectedPlan, generateOrderQRCode)
watch(selectedPayment, generateOrderQRCode)

// 常见定时查询器，每 4 秒查询一次
const queryOrderStatus = async () => {
	if (!order.value || paymentSuccess.value) return
	const res = await queryOrderStatusAPI($api, {
		orderId: order.value.orderId,
		channel: selectedPayment.value
	})

	// 用户支付成功
	if (res.success) {
		paymentSuccess.value = true
		emit('recharge')
		toast.add({
			title: '支付成功',
			color: 'success'
		})
	}
}

/**
 * 关闭弹窗，清除定时器
 */
const handleClose = () => {
	interval && clearInterval(interval)
}

// TODO：实现旺旺币充值功能
// TODO：实现旺旺币兑换功能
// TODO：获取消费与充值记录
// TODO：实现微信支付
// TODO：验证支付结果是否是全部正确的，需要从头做一次完整的测试
</script>

<style scoped></style>
