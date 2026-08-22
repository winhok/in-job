<template>
	<section class="container py-12">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-neutral-900">联系我们</h1>
			<p class="mt-2 text-sm text-neutral-500">
				有任何问题或建议，欢迎通过以下方式联系我们
			</p>
		</div>

		<div class="grid md:grid-cols-3 gap-6 mt-8">
			<!-- 微信二维码 -->
			<div
				class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
			>
				<div class="flex flex-col items-center text-center">
					<div
						class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
					>
						<UIcon name="i-heroicons-qr-code" class="w-8 h-8 text-green-600" />
					</div>
					<h2 class="text-xl font-semibold text-neutral-900 mb-2">
						关注更多面试机会
					</h2>
					<p class="text-sm text-neutral-500 mb-4">微信扫码关注</p>
					<div
						class="w-48 h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-2"
					>
						<img
							:src="wechatQRCode"
							alt="微信公众号二维码"
							class="w-full h-full object-contain"
						/>
					</div>
				</div>
			</div>

			<!-- 微信添加好友 -->
			<div
				class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
			>
				<div class="flex flex-col items-center text-center h-full">
					<div
						class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
					>
						<UIcon
							name="i-heroicons-chat-bubble-left-right"
							class="w-8 h-8 text-green-600"
						/>
					</div>
					<h2 class="text-xl font-semibold text-neutral-900 mb-2">
						微信添加好友
					</h2>
					<p class="text-sm text-neutral-500 mb-4">添加微信好友进行咨询</p>
					<div class="mt-auto w-full">
						<div
							class="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-2 cursor-pointer hover:bg-gray-100 transition-colors"
							@click="copyWeChat"
						>
							<div class="flex items-center justify-between">
								<span class="font-mono text-sm text-neutral-900 break-all"
									>LGD_Sunday</span
								>
								<UIcon
									name="i-heroicons-clipboard-document"
									class="w-5 h-5 text-neutral-400"
								/>
							</div>
						</div>
						<p class="text-xs text-neutral-400">点击复制微信号</p>
					</div>
				</div>
			</div>

			<!-- 邮箱联系 -->
			<div
				class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
			>
				<div class="flex flex-col items-center text-center h-full">
					<div
						class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4"
					>
						<UIcon name="i-heroicons-envelope" class="w-8 h-8 text-blue-600" />
					</div>
					<h2 class="text-xl font-semibold text-neutral-900 mb-2">邮箱联系</h2>
					<p class="text-sm text-neutral-500 mb-4">发送邮件与我们取得联系</p>
					<div class="mt-auto w-full">
						<a
							:href="`mailto:${email}`"
							class="block bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors"
						>
							<div class="flex items-center justify-between">
								<span class="font-mono text-sm text-neutral-900 break-all">{{
									email
								}}</span>
								<UIcon
									name="i-heroicons-arrow-top-right-on-square"
									class="w-5 h-5 text-neutral-400 flex-shrink-0 ml-2"
								/>
							</div>
						</a>
						<p class="text-xs text-neutral-400 mt-2">点击发送邮件</p>
					</div>
				</div>
			</div>
		</div>

		<!-- 其他信息 -->
		<div class="mt-12 bg-gray-50 rounded-lg border border-gray-200 p-6">
			<h2 class="text-lg font-semibold text-neutral-900 mb-4">联系说明</h2>
			<ul class="space-y-2 text-sm text-neutral-600">
				<li class="flex items-start">
					<UIcon
						name="i-heroicons-check-circle"
						class="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
					/>
					<span>我们会尽快回复您的咨询，通常在工作日 24 小时内回复</span>
				</li>
				<li class="flex items-start">
					<UIcon
						name="i-heroicons-check-circle"
						class="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
					/>
					<span>如遇到紧急问题，建议优先使用微信方式联系</span>
				</li>
				<li class="flex items-start">
					<UIcon
						name="i-heroicons-check-circle"
						class="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
					/>
					<span>商务合作或其他重要事宜，请通过邮箱详细说明</span>
				</li>
			</ul>
		</div>
	</section>
</template>

<script setup>
import { SEO } from '@/constants/seo'
import { useHead } from 'nuxt/app'
import wechatQRCode from '@/assets/imgs/sunday.jpg'

const email = 'lgd_sunday@163.com'
const wechatId = 'LGD_Sunday'

// 复制微信号到剪贴板
const copyWeChat = async () => {
	try {
		await navigator.clipboard.writeText(wechatId)
		// 这里可以添加一个 toast 提示，但需要检查项目中是否有 toast 组件
		alert('微信号已复制到剪贴板')
	} catch (err) {
		// 降级方案
		const textArea = document.createElement('textarea')
		textArea.value = wechatId
		document.body.appendChild(textArea)
		textArea.select()
		try {
			document.execCommand('copy')
			alert('微信号已复制到剪贴板')
		} catch (fallbackErr) {
			alert('复制失败，请手动复制：' + wechatId)
		}
		document.body.removeChild(textArea)
	}
}

useHead({
	title: `联系我们 - ${SEO.siteName}`,
	meta: [
		{
			name: 'description',
			content:
				'联系我们 - 通过微信、邮箱等方式与我们取得联系，我们会在24小时内回复您的问题'
		},
		{ name: 'robots', content: 'index,follow' }
	]
})
</script>

<style scoped></style>
