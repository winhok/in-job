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
								{{ $t('footer.about') }}
							</h3>
							<div class="flex items-center gap-2 mb-3">
								<ww-svg-icon name="hero" class="h-6 w-6"></ww-svg-icon>
								<span class="text-base font-semibold text-neutral-900">{{
									$t('brand.name')
								}}</span>
							</div>
							<p class="text-sm text-neutral-600 leading-relaxed">
								{{ $t('brand.description') }}
							</p>
						</div>

						<!-- 快速链接 -->
						<div>
							<h3 class="text-sm font-semibold text-neutral-900 mb-4">
								{{ $t('footer.quickLinks') }}
							</h3>
							<ul class="space-y-2 text-sm">
								<li>
									<NuxtLink
										to="/interview/start"
										class="text-neutral-600 hover:text-neutral-900 transition-colors"
									>
										{{ $t('footer.startInterview') }}
									</NuxtLink>
								</li>
								<li>
									<NuxtLink
										to="/faq"
										class="text-neutral-600 hover:text-neutral-900 transition-colors"
									>
										{{ $t('nav.faq') }}
									</NuxtLink>
								</li>
								<li>
									<NuxtLink
										to="/contact"
										class="text-neutral-600 hover:text-neutral-900 transition-colors"
									>
										{{ $t('nav.contact') }}
									</NuxtLink>
								</li>
								<li>
									<a
										href="https://www.lgdsunday.club/"
										target="_blank"
										rel="noopener noreferrer"
										class="text-neutral-600 hover:text-neutral-900 transition-colors inline-flex items-center gap-1"
									>
										{{ $t('footer.resumeMaker') }}
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
								{{ $t('nav.contact') }}
							</h3>
							<ul class="space-y-3 text-sm">
								<li class="flex items-center gap-2 text-neutral-600">
									<UIcon
										name="i-heroicons-chat-bubble-left-right"
										class="w-4 h-4 text-green-600 shrink-0"
									/>
									<span>{{ $t('footer.wechat') }}</span>
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
									<span class="cursor-pointer">{{
										$t('footer.followWechat')
									}}</span>
									<!-- 二维码悬停展示 -->
									<div
										class="absolute bottom-full left-0 mb-2 opacity-100 transition-all duration-200 z-50 w-[520px] invisible group-hover:opacity-100 group-hover:visible"
									>
										<div
											class="bg-white rounded-lg border border-gray-200 shadow-lg p-3"
										>
											<img
												:src="wechatQRCode"
												:alt="$t('footer.qrAlt')"
												class="w-[520px] object-contain"
											/>
											<p
												class="text-xs text-center text-neutral-600 mt-2 whitespace-nowrap"
											>
												{{ $t('footer.scanWechat') }}
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
								{{ $t('footer.relatedProducts') }}
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
									<div class="font-semibold text-neutral-900">
										{{ $t('footer.resumeMaker') }}
									</div>
									<div class="text-xs text-neutral-500">
										{{ $t('footer.resumeMakerDesc') }}
									</div>
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
								<p>
									© {{ new Date().getFullYear() }} {{ $t('footer.copyright') }}
								</p>
								<span class="hidden md:inline">|</span>
								<a
									href="https://beian.miit.gov.cn/"
									target="_blank"
									rel="noopener noreferrer"
									class="hover:text-neutral-700 transition-colors"
								>
									{{ $t('footer.icp') }}
								</a>
							</div>
							<div class="flex items-center gap-4">
								<NuxtLink
									to="/agreement"
									class="hover:text-neutral-700 transition-colors"
								>
									{{ $t('footer.agreement') }}
								</NuxtLink>
								<span>|</span>
								<NuxtLink
									to="/policy"
									class="hover:text-neutral-700 transition-colors"
								>
									{{ $t('footer.privacy') }}
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
const { t } = useI18n()

const wechatId = 'LGD_Sunday'

// 复制微信号到剪贴板
const copyWeChat = async () => {
	try {
		await navigator.clipboard.writeText(wechatId)
		toast.add({
			title: t('common.copySuccess'),
			description: t('footer.copyWechatSuccess'),
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
				title: t('common.copySuccess'),
				description: t('footer.copyWechatSuccess'),
				color: 'green'
			})
		} catch (fallbackErr) {
			toast.add({
				title: t('common.copyFailed'),
				description: t('footer.copyWechatManual', { id: wechatId }),
				color: 'red'
			})
		}
		document.body.removeChild(textArea)
	}
}
</script>

<style scoped></style>
