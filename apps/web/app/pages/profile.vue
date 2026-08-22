<template>
	<div
		class="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 py-8"
	>
		<div class="container px-4 mx-auto max-w-7xl">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- 左侧：用户信息卡片 -->
				<div class="lg:col-span-1">
					<UCard
						class="sticky top-24 rounded-2xl shadow-md hover:shadow-lg transition-all border-0 bg-white/80 backdrop-blur-sm"
					>
						<template #header>
							<h2 class="text-xl font-semibold text-gray-900">个人信息</h2>
						</template>
						<div class="space-y-6">
							<div class="flex flex-col items-center">
								<!-- 头像 -->
								<div class="relative group mb-3">
									<div
										class="p-1 bg-white rounded-full shadow-sm ring-1 ring-gray-100"
									>
										<UAvatar
											:src="userStore.userInfo.avatar"
											:alt="userStore.userInfo.username || '用户头像'"
											size="3xl"
											:ui="{ rounded: 'rounded-full' }"
										/>
									</div>
									<!-- hover 遮罩 -->
									<div
										class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all cursor-pointer"
										@click="editProfileModal = true"
									>
										<UIcon name="i-heroicons-camera" class="w-6 h-6" />
									</div>
								</div>

								<!-- 用户名与 ID -->
								<div class="text-center mb-5 w-full px-4">
									<h3 class="text-lg font-bold text-gray-900 mb-1 truncate">
										{{ userStore.userInfo.username || '未设置昵称' }}
									</h3>
									<div
										class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-gray-100 text-xs text-gray-500 font-mono select-all hover:bg-gray-200 transition-colors"
										title="用户 ID"
									>
										<span>ID: {{ userStore.userInfo._id || '-' }}</span>
									</div>
								</div>

								<!-- 编辑按钮 -->
								<UButton
									block
									color="gray"
									variant="solid"
									class="w-full bg-gray-50 hover:bg-gray-100 border-0 text-gray-700 font-medium"
									@click="editProfileModal = true"
								>
									<UIcon
										name="i-heroicons-pencil-square"
										class="w-4 h-4 mr-1.5"
									/>
									编辑资料
								</UButton>
							</div>

							<!-- 旺旺币 与 套餐余额 -->
							<div class="pt-4 border-t border-gray-200">
								<div
									class="relative rounded-2xl p-4 shadow-xl bg-linear-to-br from-primary-600 via-primary-500 to-primary-700 overflow-hidden border border-white/20"
								>
									<span
										class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_55%)]"
									></span>
									<div
										class="absolute -right-12 -top-12 w-40 h-40 bg-white/10 blur-2xl rounded-full"
									></div>

									<div class="relative z-10">
										<div class="flex items-center justify-between mb-2">
											<div>
												<div class="flex items-center gap-2 text-white">
													<UIcon
														name="i-heroicons-currency-dollar"
														class="w-5 h-5 text-white/90"
													/>
													<p class="text-base font-semibold">账户总览</p>
												</div>
											</div>
										</div>

										<div class="mb-2 text-xs text-white/80">
											当前可用旺旺币余额
											<span
												class="ml-2 text-3xl font-bold text-white tracking-tight"
											>
												{{ userStore.userInfo.wwCoinBalance.toFixed(2) }}
											</span>
											<p class="mt-1 text-[11px] text-white/70">
												<span class="text-[#f3ea8e] font-bold text-sm"
													>20 旺旺币兑换一次</span
												>
												{{ serviceHighlights[0].title }} /
												{{ serviceHighlights[1].title }} /
												{{ serviceHighlights[2].title }}
											</p>
										</div>

										<div class="space-y-3 text-white mb-2">
											<div
												v-for="stat in [
													{
														label: serviceHighlights[0].title,
														value: userStore.userInfo.resumeRemainingCount,
														icon: 'i-heroicons-document-text',
														desc: `剩余${serviceHighlights[0].title}次数`
													},
													{
														label: serviceHighlights[1].title,
														value: userStore.userInfo.specialRemainingCount,
														icon: 'i-heroicons-light-bulb',
														desc: `剩余${serviceHighlights[1].title}次数`
													},
													{
														label: serviceHighlights[2].title,
														value: userStore.userInfo.behaviorRemainingCount,
														icon: 'i-heroicons-users',
														desc: `剩余${serviceHighlights[2].title}次数`
													}
												]"
												:key="stat.label"
												class="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3"
											>
												<div class="flex items-center gap-3">
													<div
														class="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center"
													>
														<UIcon
															:name="
																stat.icon || 'i-heroicons-question-mark-circle'
															"
															class="w-5 h-5"
														/>
													</div>
													<div>
														<p class="text-sm text-white/90 font-medium">
															{{ stat.label }}
														</p>
														<p class="text-xs text-white/70">{{ stat.desc }}</p>
													</div>
												</div>
												<p class="text-2xl font-semibold">
													{{ stat.value }}
													<span class="text-xs font-normal text-white/70 ml-1">
														次
													</span>
												</p>
											</div>
										</div>

										<!-- 快捷操作 -->
										<div class="flex flex-wrap gap-3 pt-1">
											<UButton
												variant="solid"
												color="warning"
												class="flex-1 min-w-[120px] justify-center shadow-lg shadow-white/20 hover:shadow-white/30"
												@click="redeemServiceModal = true"
											>
												<UIcon
													name="i-heroicons-arrow-path-rounded-square"
													class="w-4 h-4 mr-1"
												/>
												旺旺币兑换
											</UButton>
											<UButton
												variant="ghost"
												color="white"
												class="flex-4 min-w-[120px] justify-center text-white/90 border border-white/30 bg-white/5 hover:bg-white/15"
												@click="rechargeModal = true"
											>
												<UIcon
													name="i-heroicons-sparkles"
													class="w-4 h-4 mr-1"
												/>
												优惠充值
											</UButton>
										</div>
									</div>
								</div>

								<!-- 充值加赠提示 -->
								<!-- <div
									class="mt-4 rounded-xl border border-amber-200 bg-linear-to-r from-amber-50 via-white to-amber-50 p-3 pl-4"
								>
									<div class="flex items-center gap-3 text-xs text-amber-800">
										<div
											class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner"
										>
											<UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
										</div>
										<div class="flex-1">
											<p class="font-semibold text-sm">限时充值加赠</p>
											<p class="text-[11px] text-amber-700/80 mt-0.5">
												首次充值立返 20% 旺旺币，下一档折扣自动解锁
											</p>
										</div>
										<span
											class="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 px-2 py-1 rounded-full bg-amber-100 border border-amber-200"
										>
											<UIcon name="i-heroicons-bolt" class="w-3.5 h-3.5" />
											限时
										</span>
									</div>
								</div> -->
							</div>
						</div>
					</UCard>
				</div>

				<!-- 右侧：主要内容区域 -->
				<div class="lg:col-span-2 space-y-6">
					<!-- TODO：分享一次赠送 5 旺旺币-->

					<!-- 简历管理 -->
					<UCard
						class="rounded-2xl shadow-md hover:shadow-lg transition-all border-0 bg-white/80 backdrop-blur-sm"
					>
						<template #header>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<UIcon
										name="i-heroicons-folder"
										class="w-5 h-5 text-primary-600"
									/>
									<h2 class="text-base font-semibold text-gray-900">
										我的简历
									</h2>
									<span
										class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
									>
										{{ userStore.resumes.length }}/5
									</span>
								</div>
								<div class="flex items-center">
									<UButton
										v-if="userStore.canAddResume"
										color="primary"
										variant="solid"
										@click="isUploadResumeModalVisible = true"
									>
										<UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
										上传简历
									</UButton>
									<span v-else class="text-sm text-gray-500">
										最多上传 {{ MAX_RESUME_COUNT }} 份简历
									</span>
								</div>
							</div>
						</template>

						<!-- 简历列表 -->
						<ResumeList />
					</UCard>

					<!-- 消费与充值记录 -->
					<UCard
						class="rounded-2xl shadow-md hover:shadow-lg transition-all border-0 bg-white/80 backdrop-blur-sm"
					>
						<template #header>
							<div class="flex flex-wrap items-center justify-between gap-4">
								<div class="flex items-center gap-2">
									<UIcon
										name="i-heroicons-chart-bar"
										class="w-5 h-5 text-primary-600"
									/>
									<h2 class="text-base font-semibold text-gray-900">
										消费与充值记录
									</h2>
								</div>
								<div
									class="inline-flex rounded-full border border-gray-200 bg-white/70 p-0.5 shadow-inner"
								>
									<button
										type="button"
										class="px-3 py-1.5 text-xs font-medium rounded-full transition-all"
										:class="
											activeRecordTab === 'recharge'
												? 'bg-primary-600 text-white shadow-sm'
												: 'text-gray-500 hover:text-primary-600'
										"
										@click="activeRecordTab = 'recharge'"
									>
										充值记录
									</button>
									<button
										type="button"
										class="px-3 py-1.5 text-xs font-medium rounded-full transition-all"
										:class="
											activeRecordTab === 'consumption'
												? 'bg-primary-600 text-white shadow-sm'
												: 'text-gray-500 hover:text-primary-600'
										"
										@click="activeRecordTab = 'consumption'"
									>
										消费记录
									</button>
								</div>
							</div>
						</template>

						<div class="space-y-4">
							<div
								v-if="displayedRecords.length === 0"
								class="flex flex-col justify-center items-center py-12 text-gray-500"
							>
								<UIcon
									name="i-heroicons-wallet"
									class="w-12 h-12 mx-auto mb-4 text-gray-300"
								/>
								<p>{{ recordMeta.emptyText }}</p>
							</div>
							<div v-else class="space-y-2 overflow-y-auto max-h-[300px]">
								<div
									v-for="(record, index) in displayedRecords"
									:key="record.outTradeNo || record.recordId || index"
									class="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
								>
									<!-- 充值记录 -->
									<div
										v-if="activeRecordTab === 'recharge'"
										class="flex items-center justify-between gap-4"
									>
										<div class="min-w-0">
											<p
												class="text-sm font-semibold text-gray-900 truncate mb-1"
											>
												{{ record.planName }}
												<span class="ml-2 text-xs text-gray-500">
													{{ record.description || '暂无备注' }}
												</span>
											</p>

											<p class="text-[11px] text-gray-500">
												订单号：{{ record.outTradeNo || '—' }}
											</p>
										</div>
										<div
											class="text-right shrink-0 flex flex-col justify-between h-full"
										>
											<p
												class="text-xs font-semibold flex gap-2 mb-1"
												:class="recordMeta.amountClass"
											>
												<ww-svg-icon
													:name="record.channel || ''"
													class="w-4 h-4"
												/>
												<span
													>金额：{{ record.amount }}
													{{ record.channel === 'wwb' ? '币' : '元' }}</span
												>
											</p>

											<p
												class="inline-flex items-center gap-1 text-[11px] text-gray-500"
											>
												<UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
												{{ formatDate(record.paidAt) }}
											</p>
										</div>
									</div>

									<!-- 消费记录 -->
									<div v-else class="flex items-center justify-between gap-4">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2 mb-1">
												<p class="text-sm font-semibold text-gray-900 truncate">
													{{ record.typeName }}
												</p>
												<UBadge
													size="xs"
													:color="
														record.status === 'success' ? 'success' : 'error'
													"
													variant="subtle"
													class="font-normal"
												>
													{{ record.statusName }}
												</UBadge>
												<UBadge
													v-if="record.status !== 'success'"
													size="xs"
													color="success"
													variant="subtle"
													class="font-normal"
												>
													消费已返还
												</UBadge>
												<p
													class="text-xs text-gray-500 truncate"
													:title="record.description"
												></p>
											</div>
											<p class="text-xs font-semibold flex items-center">
												<span class="rounded font-mono text-gray-500">
													{{ record.description || '暂无备注' }}
												</span>
											</p>
										</div>
										<div
											class="text-right shrink-0 flex flex-col justify-between h-full pl-4"
										>
											<p
												class="inline-flex items-center gap-1 text-[11px] text-gray-500"
											>
												订单号：{{ record.recordId }}
											</p>
											<p
												class="inline-flex items-center gap-1 text-[11px] text-gray-500 justify-end"
											>
												<UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
												{{ formatDate(record.createdAt) }}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</UCard>
				</div>
			</div>
		</div>

		<!-- 编辑个人信息弹窗 -->
		<EditProfileModal
			v-model:open="editProfileModal"
			:user-info="userStore.userInfo"
			@update="handleProfileUpdate"
		/>

		<!-- 上传简历弹窗 -->
		<UploadResumeModal
			v-model:open="isUploadResumeModalVisible"
			@uploaded="handleResumeUploaded"
		/>

		<!-- 充值弹窗 -->
		<RechargeModal
			v-model:open="rechargeModal"
			:balance="userStore.walletBalance"
			@recharge="handleRecharge"
		/>

		<!-- 旺旺币兑换服务弹窗 -->
		<RedeemServiceModal
			v-model="redeemServiceModal"
			@redeem-success="handleRedeemSuccess"
			@go-to-recharge="handleGoToRecharge"
		/>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { serviceHighlights } from '@/constants/vip'
import { useUserStore } from '@/stores/user'
import { useToast } from '#imports'
import EditProfileModal from '@/components/profile/EditProfileModal.vue'
import UploadResumeModal from '@/components/profile/UploadResumeModal.vue'
import ResumeList from '@/components/profile/ResumeList.vue'
import RechargeModal from '@/components/profile/RechargeModal.vue'
import RedeemServiceModal from '@/components/profile/RedeemServiceModal.vue'
import { getResumeListAPI } from '@/api/resume'
import {
	getUserInfoAPI,
	getPaymentRecordsAPI,
	getConsumptionRecordsAPI
} from '@/api/user'
import dayjs from 'dayjs'
import { MAX_RESUME_COUNT } from '@/constants'

definePageMeta({
	requiresAuth: true,
	middleware: 'auth'
})

useHead({
	title: '个人中心 - 面试汪'
})

useSeoMeta({
	title: '个人中心 - 面试汪',
	description: '管理您的个人信息、旺旺币和简历'
})

// onMounted(() => {
// 	const tab = route.query.tab
// 	if (tab === 'redeem') {
// 		activeRecordTab.value = 'redeem'
// 	}
// })

const userStore = useUserStore()
const toast = useToast()
const { $api } = useNuxtApp()

const editProfileModal = ref(false)
const isUploadResumeModalVisible = ref(false)
const rechargeModal = ref(false)
const redeemServiceModal = ref(false)
const activeRecordTab = ref('recharge')

/**
 * 获取用户信息
 */
const initUserInfo = async () => {
	userStore.userInfo = await getUserInfoAPI($api)
}
initUserInfo()

// 格式化日期
const formatDate = (date) => {
	if (!date) return ''
	return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 处理个人信息更新
const handleProfileUpdate = async (updatedInfo) => {
	try {
		userStore.updateUserInfo(updatedInfo)
		toast.add({
			title: '更新成功',
			color: 'success'
		})
		editProfileModal.value = false
	} catch (error) {
		toast.add({
			title: '更新失败',
			description: error.message,
			color: 'error'
		})
	}
}

// 简历上传成功之后的回调
const handleResumeUploaded = async () => {
	const res = await getResumeListAPI($api)

	userStore.resumes = res || []
}

// 处理简历删除
const handleResumeDelete = (index) => {
	userStore.removeResume(index)
	toast.add({
		title: '删除成功',
		color: 'success'
	})
}

/**
 * 处理充值
 */
const handleRecharge = async () => {
	initUserInfo()
	getPaymentRecords()
}

/**
 * 处理旺旺币兑换服务
 */
const handleRedeemSuccess = (data) => {
	// 这里只是 UI 展示，实际兑换逻辑由后续实现
	toast.add({
		title: '兑换成功',
		description: `已成功兑换 ${data.serviceType}，消耗 ${data.cost} 旺旺币`,
		color: 'success'
	})
	redeemServiceModal.value = false
	// 刷新用户信息
	initUserInfo()
	// 获取充值记录
	getPaymentRecords()
}

/**
 * 从兑换弹窗跳转到充值
 */
const handleGoToRecharge = () => {
	rechargeModal.value = true
}

/**
 * 获取充值与消费记录
 */
const paymentRecords = ref([])
const consumptionRecords = ref([])
const displayedRecords = computed(() =>
	activeRecordTab.value === 'recharge'
		? paymentRecords.value
		: consumptionRecords.value
)
const recordMeta = computed(() => {
	const isRecharge = activeRecordTab.value === 'recharge'
	return {
		emptyText: isRecharge ? '暂无充值记录' : '暂无消费记录',
		defaultTitle: isRecharge ? '充值' : '消费',
		amountClass: isRecharge ? 'text-emerald-600' : 'text-rose-600',
		amountPrefix: isRecharge ? '+' : '-',
		showTypeTag: !isRecharge,
		typeLabel: isRecharge ? '' : '消费'
	}
})

/**
 * 获取充值记录
 */
const getPaymentRecords = async () => {
	try {
		const res = await getPaymentRecordsAPI($api)
		paymentRecords.value = Array.isArray(res) ? res : []
	} catch (error) {
		paymentRecords.value = []
		console.error('获取充值记录失败', error)
	}
}
getPaymentRecords()

/**
 * 获取消费记录
 */
const getConsumptionRecords = async () => {
	try {
		const res = await getConsumptionRecordsAPI($api)
		consumptionRecords.value = res.records
	} catch (error) {
		consumptionRecords.value = []
		console.error('获取消费记录失败', error)
	}
}
getConsumptionRecords()
</script>

<style scoped></style>
