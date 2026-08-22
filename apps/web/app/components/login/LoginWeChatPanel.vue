<template>
	<div
		class="card relative overflow-hidden border border-gray-200 bg-white p-8 shadow-lg"
	>
		<!-- 增加一个测试登录的按钮，只在测试环境下展示 -->
		<UButton v-if="isDev" @click="testLogin">测试登录</UButton>
		<div
			class="absolute -top-24 right-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl"
		></div>
		<div class="flex items-center justify-between gap-4">
			<div>
				<h2 class="text-xl font-semibold text-neutral-900">微信登录</h2>
				<p class="text-sm text-neutral-500">扫码或点击按钮，快速进入面试汪</p>
			</div>
			<div
				class="rounded-full bg-emerald-500/10 p-2 text-emerald-600 leading-0"
			>
				<UIcon name="i-simple-icons-wechat" class="h-6 w-6" />
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
						:src="qrCodeUrl"
						alt="微信扫码登录二维码"
						class="relative z-10 h-full w-full rounded-2xl object-cover p-3"
						:class="{ 'opacity-20': isExpired }"
					/>
					<div
						v-if="isExpired"
						class="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/90 text-sm text-neutral-600"
					>
						<p>二维码已过期</p>
						<UButton
							class="mt-3 text-white"
							color="primary"
							size="sm"
							@click="refreshQr"
						>
							<template #leading>
								<UIcon name="i-heroicons-arrow-path" />
							</template>
							刷新二维码
						</UButton>
					</div>
					<!-- 刷新二维码按钮 -->
					<button
						type="button"
						class="absolute -bottom-3 -right-4 z-30 rounded-full border border-white bg-white p-2 shadow-md transition hover:scale-105 leading-0"
						@click="refreshQr"
						aria-label="刷新二维码"
					>
						<UIcon
							name="i-heroicons-arrow-path"
							class="h-4 w-4 text-neutral-500"
						/>
					</button>
				</div>
				<p class="text-xs text-neutral-500 mt-4">
					使用微信扫一扫登录，{{ countDown }} 秒后二维码将自动更新。
				</p>
				<div
					class="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 mt-4 text-xs text-emerald-600"
				>
					<UIcon name="i-heroicons-lock-closed" />
					微信官方授权，账号安全无忧
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
						<p class="mt-3 text-sm text-neutral-800">扫码确认成功</p>
						<p class="mt-1 text-xs text-neutral-500">
							正在跳转到刚才浏览的页面…
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
				aria-label="同意协议"
			/>
			<p class="leading-[20px]">
				继续登录即表示你已阅读并同意
				<NuxtLink
					to="/agreement"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline"
				>
					《服务协议》
				</NuxtLink>
				和
				<NuxtLink
					to="/policy"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline"
				>
					《隐私政策》
				</NuxtLink>
			</p>
		</div>
	</div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useNuxtApp, useToast } from '#imports'
import {
	generateWechatQRCodeAPI,
	checkWechatQRCodeStatusAPI,
	testLogin as testLoginAPI
} from '@/api/login'
import { useUserStore } from '@/stores/user'
import { handleLoginSuccess } from '@/permission'

// 判断是否是开发环境
const isDev = process.dev

// 组件向父级抛出的事件：微信快速登录请求、二维码刷新提示
const emit = defineEmits(['refreshQr'])

const userStore = useUserStore()

// 二维码有效倒计时（秒）
const countDown = ref(300)
// 用于触发二维码刷新（防缓存）
const qrSeed = ref(Date.now())
// 同意协议开关
const agree = ref(true)

// 二维码图片地址（由后端返回的真实登录二维码链接）
const qrCodeUrl = ref('')
const qrCodeId = ref('') // 二维码ID
const scanSuccess = ref(false)

// 是否过期：倒计时归零视为过期
const isExpired = computed(() => countDown.value <= 0)

// 倒计时计时器句柄
let timer = null
// 扫码状态轮询计时器
let qrCodeCheckTimer = null

// 启动倒计时（每次刷新二维码都会重置）
const startTimer = () => {
	if (timer) {
		window.clearInterval(timer)
		timer = null
	}
	countDown.value = 300
	timer = window.setInterval(() => {
		if (countDown.value > 0) {
			countDown.value -= 1
		} else {
			// 到期后自动刷新二维码（与文案保持一致）
			refreshQr()
		}
	}, 1000)
}

// 通过接口获取微信扫码登录二维码，并更新展示
const { $api } = useNuxtApp()

// 拉取二维码地址（后端可能返回不同字段名，做兼容处理）
const loadQrCode = async () => {
	const response = await generateWechatQRCodeAPI($api)
	qrCodeUrl.value = response.qrCodeUrl
	qrCodeId.value = response.qrCodeId
	startQRCodeCheck()
}

// 检查二维码状态
async function checkQRCodeStatus() {
	try {
		// 调用后端接口检查扫码状态
		const response = await checkWechatQRCodeStatusAPI($api, qrCodeId.value)

		if (response.user && response.token) {
			// 登录成功之后的操作
			loginHandle(response)
		}
	} catch (error) {
		// console.error('检查二维码状态失败:', error)
		// 如果是网络错误，继续检查
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
	if (qrCodeCheckTimer) {
		clearInterval(qrCodeCheckTimer)
		qrCodeCheckTimer = null
	}
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
	qrCodeCheckTimer = setInterval(() => {
		checkQRCodeStatus()
	}, 2000)
}

// 刷新二维码：更新种子、重置倒计时、拉取新链接并通知父组件
const refreshQr = async () => {
	qrSeed.value = Date.now()
	startTimer()
	await loadQrCode()
	emit('refreshQr')
}

// 组件挂载后，启动倒计时并立即拉取一次二维码
onMounted(async () => {
	startTimer()
	await loadQrCode()
})

// 组件卸载前清理计时器
onBeforeUnmount(() => {
	if (timer) {
		window.clearInterval(timer)
	}
})

/**
 * 本地测试登录
 */
const testLogin = async () => {
	const response = await testLoginAPI($api)
	loginHandle(response)
}
</script>

<style scoped></style>
