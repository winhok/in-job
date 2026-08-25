<template>
	<div
		class="card relative overflow-hidden border border-gray-200 bg-white p-8 shadow-lg"
	>
		<div
			class="absolute -top-24 right-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl"
		></div>
		<div class="flex items-center justify-between gap-4">
			<div>
				<h2 class="text-xl font-semibold text-neutral-900">
					{{ $t('login.wechatTitle') }}
				</h2>
				<p class="text-sm text-neutral-500">{{ $t('login.wechatDesc') }}</p>
			</div>
			<div
				class="rounded-full bg-emerald-500/10 p-2 text-emerald-600 leading-0"
			>
				<ww-svg-icon name="wechat" class="h-6 w-6" />
			</div>
		</div>

		<div class="mt-8 text-center">
			<div v-if="!scanSuccess">
				<!-- 扫码登录二维码（包含二维码过期提示） -->
				<div class="relative mx-auto h-52 w-52">
					<div
						class="absolute inset-0 rounded-2xl border border-dashed border-neutral-200 bg-gradient-to-br from-white to-neutral-50 shadow-inner shadow-black/5"
					></div>
					<img
						v-if="qrCodeUrl"
						:src="qrCodeUrl"
						:alt="$t('login.qrAlt')"
						class="relative z-10 h-full w-full rounded-2xl object-cover p-3"
						:class="{ 'opacity-20': isExpired }"
					/>
					<div
						v-else
						class="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-neutral-500"
					>
						<UIcon
							v-if="isLoading"
							name="i-heroicons-arrow-path"
							class="h-7 w-7 animate-spin"
						/>
						<span>{{ loadError || $t('login.generating') }}</span>
					</div>
					<div
						v-if="isExpired && qrCodeUrl"
						class="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/90 text-sm text-neutral-600"
					>
						<p>{{ $t('login.expired') }}</p>
						<UButton
							class="mt-3 text-white"
							color="primary"
							size="sm"
							@click="refreshQr"
						>
							<template #leading>
								<UIcon name="i-heroicons-arrow-path" />
							</template>
							{{ $t('login.refresh') }}
						</UButton>
					</div>
					<!-- 刷新二维码按钮 -->
					<button
						type="button"
						class="absolute -bottom-3 -right-4 z-30 rounded-full border border-white bg-white p-2 shadow-md transition hover:scale-105 leading-0"
						:disabled="isLoading"
						@click="refreshQr"
						:aria-label="$t('login.refresh')"
					>
						<UIcon
							name="i-heroicons-arrow-path"
							class="h-4 w-4 text-neutral-500"
						/>
					</button>
				</div>
				<p class="text-xs text-neutral-500 mt-4">
					{{ $t('login.countdown', { seconds: countDown }) }}
				</p>
				<div
					class="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 mt-4 text-xs text-emerald-600"
				>
					<UIcon name="i-heroicons-lock-closed" />
					{{ $t('login.wechatSafe') }}
				</div>
			</div>

			<!-- 扫码成功之后的提示 -->
			<div v-else class="mt-8 space-y-4 text-center">
				<div class="relative mx-auto h-52 w-52">
					<div
						class="absolute inset-0 rounded-2xl border border-dashed border-neutral-200 bg-gradient-to-br from-white to-neutral-50 shadow-inner shadow-black/5"
					></div>
					<div
						class="relative z-10 h-full w-full rounded-2xl p-3 flex flex-col items-center justify-center"
					>
						<UIcon
							name="i-heroicons-check-circle"
							class="h-16 w-16 text-emerald-600"
						/>
						<p class="mt-3 text-sm text-neutral-800">
							{{ $t('login.scanSuccess') }}
						</p>
						<p class="mt-1 text-xs text-neutral-500">
							{{ $t('login.redirecting') }}
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-8 flex items-start gap-2 text-xs text-neutral-500">
			<UCheckbox
				v-model="agree"
				name="agreement"
				color="success"
				:aria-label="$t('login.agreeLabel')"
			/>
			<p class="leading-[20px]">
				{{ $t('login.agreePrefix') }}
				<NuxtLink
					to="/agreement"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline"
				>
					{{ $t('login.terms') }}
				</NuxtLink>
				{{ $t('login.and') }}
				<NuxtLink
					to="/policy"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline"
				>
					{{ $t('login.privacy') }}
				</NuxtLink>
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useNuxtApp } from '#imports'
import {
	generateWechatQRCodeAPI,
	checkWechatQRCodeStatusAPI
} from '@/api/login'
import { useUserStore } from '@/stores/user'
import { handleLoginSuccess } from '@/permission'

// 组件向父级抛出的事件：微信快速登录请求、二维码刷新提示
const emit = defineEmits(['refreshQr'])

const userStore = useUserStore()
const { $api } = useNuxtApp()
const { t } = useI18n()

// 二维码有效倒计时（秒）
const countDown = ref(300)
// 同意协议开关
const agree = ref(true)

// 二维码图片地址（由后端返回的真实登录二维码链接）
const qrCodeUrl = ref('')
const qrCodeId = ref('') // 二维码ID
const scanSuccess = ref(false)
const isLoading = ref(false)
const loadError = ref('')
let isChecking = false

// 是否过期：倒计时归零视为过期
const isExpired = computed(() => countDown.value <= 0)

// 倒计时计时器句柄
let timer = null
// 扫码状态轮询计时器
let qrCodeCheckTimer = null
let isUnmounted = false

// 启动倒计时（每次刷新二维码都会重置）
const startTimer = (expireTime) => {
	if (timer) {
		window.clearInterval(timer)
		timer = null
	}
	countDown.value = Math.max(0, Math.ceil((expireTime - Date.now()) / 1000))
	timer = window.setInterval(() => {
		if (countDown.value > 0) {
			countDown.value -= 1
		} else {
			window.clearInterval(timer)
			timer = null
			void refreshQr()
		}
	}, 1000)
}

const stopQRCodeCheck = () => {
	if (qrCodeCheckTimer) {
		window.clearInterval(qrCodeCheckTimer)
		qrCodeCheckTimer = null
	}
}

const loadQrCode = async () => {
	if (isLoading.value) return
	isLoading.value = true
	loadError.value = ''
	stopQRCodeCheck()
	try {
		const response = await generateWechatQRCodeAPI($api)
		if (isUnmounted) return
		qrCodeUrl.value = response.qrCodeUrl
		qrCodeId.value = response.qrCodeId
		scanSuccess.value = false
		startTimer(response.expireTime)
		startQRCodeCheck()
	} catch {
		qrCodeUrl.value = ''
		qrCodeId.value = ''
		loadError.value = t('login.qrFailed')
	} finally {
		isLoading.value = false
	}
}

// 检查二维码状态
async function checkQRCodeStatus() {
	if (!qrCodeId.value || isChecking || scanSuccess.value) return
	isChecking = true
	try {
		const response = await checkWechatQRCodeStatusAPI($api, qrCodeId.value)
		if (response.user && response.token) {
			await loginHandle(response)
		}
	} catch {
		// 202 等待状态由请求层转换为异常；保留轮询。
	} finally {
		isChecking = false
	}
}

/**
 * 登录成功之后的操作
 */
const loginHandle = async (response) => {
	// 为 userStore 赋值
	userStore.isLogin = true
	userStore.userInfo = response.user
	userStore.token = response.token

	// 停止轮询，避免多次跳转
	stopQRCodeCheck()
	// 切换组件 UI，隐藏二维码
	scanSuccess.value = true
	// 停止倒计时
	if (timer) {
		window.clearInterval(timer)
		timer = null
	}
	// 使用统一的登录成功处理，跳转回登录前的页面（稍作停留展示成功UI）
	setTimeout(() => handleLoginSuccess(), 1200)
}

// 开始检查扫码状态
function startQRCodeCheck() {
	stopQRCodeCheck()
	qrCodeCheckTimer = window.setInterval(() => {
		void checkQRCodeStatus()
	}, 2000)
}

const refreshQr = async () => {
	await loadQrCode()
	if (qrCodeUrl.value) {
		emit('refreshQr')
	}
}

onMounted(async () => {
	await loadQrCode()
})

onBeforeUnmount(() => {
	isUnmounted = true
	if (timer) {
		window.clearInterval(timer)
		timer = null
	}
	stopQRCodeCheck()
})
</script>

<style scoped></style>
