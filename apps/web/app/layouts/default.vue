<template>
	<UApp :toaster="toaster">
		<div class="min-h-screen flex flex-col">
			<AppHeader />
			<main class="flex-1 bg-gray-50">
				<slot />
			</main>
			<footer class="border-t border-gray-200 bg-white">
				<div class="container px-4 py-12">
					<div
						class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"
					>
						<!-- 关于我们 -->
						<div>
							<h3 class="text-sm font-semibold text-neutral-900 mb-4">
								关于我们
							</h3>
							<div class="flex items-center gap-2 mb-3">
								<ww-svg-icon name="hero" class="h-6 w-6"></ww-svg-icon>
								<span class="text-base font-semibold text-neutral-900"
									>面试汪</span
								>
							</div>
							<p class="text-sm text-neutral-600 leading-relaxed">
								极简三步，完成 AI 面试。专业的 AI
								面试平台，帮助您更好地准备面试。
							</p>
						</div>

						<!-- 快速链接 -->
						<div>
							<h3 class="text-sm font-semibold text-neutral-900 mb-4">
								快速链接
							</h3>
							<ul class="space-y-2 text-sm">
								<li>
									<NuxtLink
										to="/interview/start"
										class="text-neutral-600 hover:text-neutral-900 transition-colors"
									>
										开始 AI 面试
									</NuxtLink>
								</li>
								<li>
									<NuxtLink
										to="/faq"
										class="text-neutral-600 hover:text-neutral-900 transition-colors"
									>
										常见问题
									</NuxtLink>
								</li>
								<li>
									<NuxtLink
										to="/contact"
										class="text-neutral-600 hover:text-neutral-900 transition-colors"
									>
										联系我们
									</NuxtLink>
								</li>
								<li>
									<a
										href="https://www.lgdsunday.club/"
										target="_blank"
										rel="noopener noreferrer"
										class="text-neutral-600 hover:text-neutral-900 transition-colors inline-flex items-center gap-1"
									>
										简历汪
										<UIcon
											name="i-heroicons-arrow-top-right-on-square"
											class="w-3.5 h-3.5"
										/>
									</a>
								</li>
							</ul>
						</div>

						<!-- 联系方式 -->
						<div>
							<h3 class="text-sm font-semibold text-neutral-900 mb-4">
								联系我们
							</h3>
							<ul class="space-y-3 text-sm">
								<li class="flex items-center gap-2 text-neutral-600">
									<UIcon
										name="i-heroicons-chat-bubble-left-right"
										class="w-4 h-4 text-green-600 shrink-0"
									/>
									<span>微信：</span>
									<button
										@click="copyWeChat"
										class="font-mono hover:text-neutral-900 transition-colors"
									>
										LGD_Sunday
									</button>
								</li>
								<li class="flex items-center gap-2 text-neutral-600">
									<UIcon
										name="i-heroicons-envelope"
										class="w-4 h-4 text-blue-600 shrink-0"
									/>
									<a
										href="mailto:lgd_sunday@163.com"
										class="font-mono hover:text-neutral-900 transition-colors"
									>
										lgd_sunday@163.com
									</a>
								</li>
								<li
									class="relative flex items-start gap-2 text-neutral-600 group"
								>
									<UIcon
										name="i-heroicons-qr-code"
										class="w-4 h-4 text-green-600 shrink-0 mt-0.5"
									/>
									<span class="cursor-pointer">关注公众号获取更多信息</span>
									<!-- 二维码悬停展示 -->
									<div
										class="absolute bottom-full left-0 mb-2 opacity-100 transition-all duration-200 z-50 w-[520px] invisible group-hover:opacity-100 group-hover:visible"
									>
										<div
											class="bg-white rounded-lg border border-gray-200 shadow-lg p-3"
										>
											<img
												:src="wechatQRCode"
												alt="微信公众号二维码"
												class="w-[520px] object-contain"
											/>
											<p
												class="text-xs text-center text-neutral-600 mt-2 whitespace-nowrap"
											>
												扫码关注公众号
											</p>
										</div>
										<!-- 小三角箭头 -->
										<div
											class="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"
										></div>
										<div
											class="absolute top-full left-4 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"
										></div>
									</div>
								</li>
							</ul>
						</div>

						<!-- 相关产品 -->
						<div>
							<h3 class="text-sm font-semibold text-neutral-900 mb-4">
								相关产品
							</h3>
							<a
								href="https://www.lgdsunday.club/"
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors group"
							>
								<div
									class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors"
								>
									<UIcon
										name="i-heroicons-document-text"
										class="w-5 h-5 text-primary-600"
									/>
								</div>
								<div>
									<div class="font-semibold text-neutral-900">简历汪</div>
									<div class="text-xs text-neutral-500">免费在线制作简历</div>
								</div>
								<UIcon
									name="i-heroicons-arrow-top-right-on-square"
									class="w-4 h-4 ml-auto text-neutral-400 group-hover:text-neutral-600"
								/>
							</a>
						</div>
					</div>

					<!-- 分割线 -->
					<div class="border-t border-gray-200 pt-8">
						<div
							class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500"
						>
							<div class="flex flex-col md:flex-row items-center gap-4">
								<p>© {{ new Date().getFullYear() }} 面试汪 · AI 面试平台</p>
								<span class="hidden md:inline">|</span>
								<a
									href="https://beian.miit.gov.cn/"
									target="_blank"
									rel="noopener noreferrer"
									class="hover:text-neutral-700 transition-colors"
								>
									鲁 ICP 备 2025206060 号-1
								</a>
							</div>
							<div class="flex items-center gap-4">
								<NuxtLink
									to="/agreement"
									class="hover:text-neutral-700 transition-colors"
								>
									用户协议
								</NuxtLink>
								<span>|</span>
								<NuxtLink
									to="/policy"
									class="hover:text-neutral-700 transition-colors"
								>
									隐私政策
								</NuxtLink>
							</div>
						</div>
					</div>
				</div>
			</footer>
			<BackToTop />
		</div>
	</UApp>
</template>

<script setup>
import { useUIStore } from '@/stores/ui'
import { navigateTo, useToast } from '#imports'
import wechatQRCode from '@/assets/imgs/sunday-gong-zhong-hao.png'

const toaster = { position: 'top-right' }
const uiStore = useUIStore()
const toast = useToast()

const wechatId = 'LGD_Sunday'

// 复制微信号到剪贴板
const copyWeChat = async () => {
	try {
		await navigator.clipboard.writeText(wechatId)
		toast.add({
			title: '复制成功',
			description: '微信号已复制到剪贴板',
			color: 'green'
		})
	} catch (err) {
		// 降级方案
		const textArea = document.createElement('textarea')
		textArea.value = wechatId
		textArea.style.position = 'fixed'
		textArea.style.opacity = '0'
		document.body.appendChild(textArea)
		textArea.select()
		try {
			document.execCommand('copy')
			toast.add({
				title: '复制成功',
				description: '微信号已复制到剪贴板',
				color: 'green'
			})
		} catch (fallbackErr) {
			toast.add({
				title: '复制失败',
				description: '请手动复制：' + wechatId,
				color: 'red'
			})
		}
		document.body.removeChild(textArea)
	}
}
</script>

<style scoped></style>
