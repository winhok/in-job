<template>
	<section class="container py-12">
		<div class="mb-8 text-center">
			<h1 class="text-3xl md:text-4xl font-bold text-neutral-900">常见问题</h1>
			<p class="mt-3 text-neutral-600 max-w-2xl mx-auto">
				关于面试汪 AI 面试平台的常见问题解答，帮助你快速了解和使用我们的服务
			</p>
		</div>

		<div class="max-w-4xl mx-auto">
			<!-- 快速搜索 -->
			<div class="mb-8">
				<UInput
					v-model="searchQuery"
					placeholder="搜索问题..."
					size="lg"
					icon="i-heroicons-magnifying-glass"
					class="w-full"
				/>
			</div>

			<!-- FAQ 分类 -->
			<div class="flex flex-wrap gap-2 mb-8 justify-center">
				<UButton
					v-for="category in categories"
					:key="category.key"
					:variant="activeCategory === category.key ? 'solid' : 'ghost'"
					:color="activeCategory === category.key ? 'primary' : 'gray'"
					size="sm"
					@click="activeCategory = category.key"
				>
					{{ category.label }}
				</UButton>
			</div>

			<!-- FAQ 列表 -->
			<div class="space-y-4">
				<UCard
					v-for="(item, index) in filteredFaqs"
					:key="index"
					class="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
				>
					<UAccordion
						:items="[
							{
								label: item.question,
								content: item.answer,
								defaultOpen: item.defaultOpen,
								category: item.category
							}
						]"
						:ui="{
							item: {
								base: ''
							},
							trigger: {
								base: 'flex items-center justify-between w-full text-left',
								padding: 'py-4'
							},
							label: 'text-base font-semibold text-neutral-900',
							content: {
								base: 'text-sm text-neutral-600 leading-relaxed',
								padding: 'pb-4 pt-0'
							}
						}"
					>
						<template #label="{ item }">
							<div class="flex items-start gap-3 w-full pr-4">
								<div
									class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
									:class="getCategoryColor(item.category)"
								>
									<UIcon
										:name="getCategoryIcon(item.category)"
										class="w-5 h-5"
										:class="getCategoryIconColor(item.category)"
									/>
								</div>
								<span class="flex-1">{{ item.label }}</span>
							</div>
						</template>
						<template #content="{ item }">
							<div class="pl-11">
								<div
									class="prose prose-sm max-w-none text-neutral-600"
									v-html="formatAnswer(item.content)"
								></div>
							</div>
						</template>
					</UAccordion>
				</UCard>
			</div>

			<!-- 如果没有找到结果 -->
			<div v-if="filteredFaqs.length === 0" class="text-center py-12">
				<UIcon
					name="i-heroicons-question-mark-circle"
					class="w-16 h-16 text-neutral-300 mx-auto mb-4"
				/>
				<p class="text-neutral-500">未找到相关问题</p>
				<p class="text-sm text-neutral-400 mt-2">请尝试使用其他关键词搜索</p>
			</div>

			<!-- 联系支持 -->
			<div
				class="mt-12 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-8 text-center"
			>
				<UIcon
					name="i-heroicons-chat-bubble-left-right"
					class="w-12 h-12 text-primary-600 mx-auto mb-4"
				/>
				<h2 class="text-xl font-semibold text-neutral-900 mb-2">
					还有其他问题？
				</h2>
				<p class="text-neutral-600 mb-6">
					如果这里没有找到你想要的答案，欢迎通过以下方式联系我们
				</p>
				<div class="flex flex-col sm:flex-row gap-3 justify-center">
					<UButton color="primary" size="lg" to="/contact" class="text-white">
						联系我们
					</UButton>
					<UButton color="gray" variant="ghost" size="lg" to="/">
						返回首页
					</UButton>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { SEO } from '@/constants/seo'
import { useHead } from 'nuxt/app'
import { ref, computed } from 'vue'

const searchQuery = ref('')
const activeCategory = ref('all')

const categories = [
	{ key: 'all', label: '全部' },
	{ key: 'general', label: '通用问题' },
	{ key: 'usage', label: '使用指南' },
	{ key: 'features', label: '功能特性' },
	{ key: 'pricing', label: '价格与订阅' },
	{ key: 'security', label: '隐私与安全' }
]

const faqs = [
	{
		category: 'general',
		question: '什么是面试汪？它如何帮助我提升面试能力？',
		answer: `面试汪是一个 AI 驱动的智能面试训练平台，旨在帮助求职者通过模拟真实面试场景来提升面试技能。

我们通过以下方式帮助你：
• <strong>岗位级知识图谱</strong>：结合行业语料、JD 解析与经验库，生成贴合场景的面试问题
• <strong>多轮追问与深挖</strong>：动态生成追问与反问，评估你的深度思考与沟通表达能力
• <strong>结构化评估报告</strong>：覆盖 STAR 模型、技能矩阵、风险点与改进建议，让你清楚了解自己的优势和不足
• <strong>真实公司风格</strong>：按公司/岗位/等级定制问法与偏好，模拟真实面试氛围`,
		defaultOpen: false
	},
	{
		category: 'general',
		question: '面试汪支持哪些职业方向？',
		answer: `面试汪面向各个职业提供 AI 面试训练服务，目前支持但不限于：

• <strong>技术类</strong>：程序员、前端开发、后端开发、全栈开发、算法工程师、测试工程师等
• <strong>产品类</strong>：产品经理、产品运营、产品设计等
• <strong>设计类</strong>：UI/UX 设计师、交互设计师、视觉设计师等
• <strong>专业服务类</strong>：律师、医生、咨询顾问等
• <strong>其他职业</strong>：持续扩展中

你可以根据目标岗位设置专属的面试场景和题库。`,
		defaultOpen: false
	},
	{
		category: 'usage',
		question: '如何开始使用面试汪？需要注册账号吗？',
		answer: `使用面试汪非常简单，只需三个步骤：

<strong>第一步：选择岗位与简历</strong>
设置你的目标岗位/公司，并导入简历，系统会自动生成专属题集。

<strong>第二步：开启多轮模拟面试</strong>
模拟 HR/技术/业务面，支持多轮追问、反问与沟通演练。

<strong>第三步：获得评估与计划</strong>
查看结构化报告与提升建议，系统会为你生成 7 天强化练习计划。

你可以使用微信登录快速注册账号，也可以使用邮箱注册。注册后即可免费体验基础功能。`,
		defaultOpen: false
	},
	{
		category: 'usage',
		question: '如何导入简历？支持哪些格式？',
		answer: `你可以通过以下方式导入简历：

• <strong>上传文件</strong>：支持 PDF、Word（.doc, .docx）、文本文件（.txt）等常见格式
• <strong>在线编辑</strong>：如果暂时没有简历文件，也可以直接在平台上手动填写基本信息和工作经历
• <strong>粘贴文本</strong>：复制现有简历内容，粘贴到文本框中，系统会自动解析关键信息

导入简历后，系统会自动提取关键信息（如工作经历、技能、项目经验等），并根据这些信息为你定制个性化的面试问题和评估标准。`,
		defaultOpen: false
	},
	{
		category: 'features',
		question: '面试汪的评估报告包含哪些内容？',
		answer: `我们的评估报告非常全面，包含以下几个维度：

• <strong>STAR 模型分析</strong>：评估你在回答问题时是否遵循 Situation（情况）、Task（任务）、Action（行动）、Result（结果）的结构
• <strong>技能矩阵</strong>：展示你在各个技能维度上的得分和水平，包括专业技能、沟通能力、逻辑思维等
• <strong>风险点识别</strong>：指出你在面试中可能存在的问题，如回答不够具体、缺乏数据支撑、表达不够清晰等
• <strong>改进建议</strong>：提供针对性的提升建议和练习方向
• <strong>7 天强化计划</strong>：根据你的表现生成个性化的练习计划，帮助你在短时间内快速提升

报告支持一键导出为 PDF 格式，方便你保存和分享。`,
		defaultOpen: false
	},
	{
		category: 'features',
		question: '支持语音和视频面试模拟吗？',
		answer: `是的，面试汪支持多种面试模式：

• <strong>文本对话模式</strong>：通过文字问答的方式进行面试练习，适合随时随地使用
• <strong>语音模式</strong>：支持语音输入和回答，系统会分析你的语速、语调、停顿等，给出相应的反馈
• <strong>视频模式</strong>：通过摄像头进行视频面试模拟，系统会分析你的表情、肢体语言、眼神交流等非语言表达

这些功能都是可选的，你可以根据自己的需求选择使用。语音和视频分析功能可以帮助你全面了解自己的表现，包括语言和非语言方面的表现。`,
		defaultOpen: false
	},
	{
		category: 'features',
		question: '可以自定义面试场景和题目吗？',
		answer: `可以的！面试汪提供灵活的定制功能：

• <strong>目标公司/岗位定制</strong>：选择你心仪的公司和岗位，系统会根据这些信息生成相应的面试问题和场景
• <strong>面试类型选择</strong>：可以选择 HR 面、技术面、业务面、高管面等不同类型的面试
• <strong>难度级别调整</strong>：根据你的经验水平，调整面试的难度级别
• <strong>题目库补充</strong>：可以添加自定义题目，或者从我们的题库中选择特定类型的题目

这些定制功能让你能够针对性地准备特定的面试，提高面试成功率。`,
		defaultOpen: false
	},
	{
		category: 'pricing',
		question: '面试汪是免费的吗？有哪些付费功能？',
		answer: `面试汪采用免费 + 增值服务的模式：

<strong>免费功能包括：</strong>
• 基础面试模拟（每日限次数）
• 简单评估报告
• 基础题库访问

<strong>付费功能包括：</strong>
•  unlimited 面试次数
• 详细结构化评估报告（含 STAR 分析、技能矩阵等）
• 高级题库和自定义题目
• 语音和视频分析功能
• 个性化 7 天强化计划
• 专家建议和一对一指导（可选）
• 数据导出和长期记录

我们提供多种订阅方案，你可以根据需求选择合适的套餐。首次注册用户通常可以享受免费试用期。`,
		defaultOpen: false
	},
	{
		category: 'pricing',
		question: '如何取消订阅？支持退款吗？',
		answer: `你可以在账户设置中随时取消订阅：

• 取消后，已付费的服务在订阅期内仍可正常使用，到期后自动降级为免费版
• 订阅取消后不会自动续费，但也不会立即停止当前服务

关于退款政策：
• 虚拟服务一经开通，除法律法规另有规定或页面明确说明外，不支持无理由退款
• 如果遇到技术问题或服务异常，我们会在 24 小时内处理并可能提供相应补偿
• 具体退款政策请参考《服务协议》

如有任何疑问，请通过 <a href="/contact" class="text-primary-600 hover:underline">联系我们</a> 页面联系客服。`,
		defaultOpen: false
	},
	{
		category: 'security',
		question: '我的个人信息和数据安全如何保障？',
		answer: `数据安全是我们的首要任务，我们采用多重措施保障你的数据安全：

<strong>技术保障：</strong>
• 采用行业标准的数据加密技术（SSL/TLS）保护数据传输
• 敏感信息（如密码）使用加密存储
• 定期进行安全审计和漏洞扫描
• 采用访问控制和权限管理机制

<strong>隐私保护：</strong>
• 我们严格遵守《隐私政策》，不会向第三方出售你的个人信息
• 仅在必要范围内收集和使用数据，用于提供和改进服务
• 你可以随时查看、更正或删除个人信息
• 支持账户注销和数据导出

<strong>合规性：</strong>
• 遵循相关法律法规要求
• 配合监管和司法机关的合法要求

更多详情请查看我们的《隐私政策》和《服务协议》。`,
		defaultOpen: false
	},
	{
		category: 'security',
		question: '我的面试录音和视频会如何被使用？',
		answer: `关于面试录音和视频的使用：

<strong>存储与使用：</strong>
• 录音和视频数据仅用于面试分析和评估，不会用于其他目的
• 你可以随时删除这些数据
• 我们不会将这些内容分享给第三方

<strong>分析目的：</strong>
• 语音分析用于评估语速、语调、表达流畅度等
• 视频分析用于评估表情、肢体语言、眼神交流等
• 分析结果仅用于生成你的个人评估报告

<strong>数据保留：</strong>
• 默认情况下，数据会在你的账户内保留，直到你主动删除
• 账户注销后，所有数据将被永久删除

如果你对数据使用有任何担忧，可以关闭语音和视频功能，仅使用文本模式。`,
		defaultOpen: false
	},
	{
		category: 'general',
		question: '面试汪和真人面试官有什么区别？',
		answer: `面试汪 AI 面试官和真人面试官各有优势，可以互补使用：

<strong>AI 面试官的优势：</strong>
• 随时随地可用，不受时间和地点限制
• 可以反复练习，不用担心打扰别人
• 提供客观、结构化的评估报告
• 可以模拟不同类型的面试官风格
• 成本较低，适合大量练习

<strong>真人面试官的优势：</strong>
• 更加真实和自然
• 可以提供即时的个性化反馈
• 可以模拟真实的人际互动

我们建议：
• 使用 AI 面试官进行大量练习和基础技能提升
• 在 AI 练习有一定基础后，可以找真人朋友或导师进行模拟面试
• 两者结合使用，能够更全面地提升面试能力

面试汪的目标是帮助你建立扎实的基础，让你在面对真人面试时更加自信。`,
		defaultOpen: false
	},
	{
		category: 'usage',
		question: '评估报告多久能生成？需要等待吗？',
		answer: `评估报告生成非常快速：

• <strong>基础报告</strong>：面试结束后立即生成，通常在几秒钟内完成
• <strong>详细报告</strong>：如果需要包含深度分析和建议，可能需要 1-3 分钟
• <strong>PDF 导出</strong>：点击导出后，通常在几秒钟内即可下载

如果你的报告生成时间较长，可能是遇到了以下情况：
• 网络连接较慢
• 面试内容较长，需要更多处理时间
• 系统繁忙

如果超过 5 分钟仍未生成，请刷新页面或联系客服。通常情况下，报告都是即时生成的。`,
		defaultOpen: false
	}
]

// 过滤 FAQ
const filteredFaqs = computed(() => {
	let result = faqs

	// 按分类过滤
	if (activeCategory.value !== 'all') {
		result = result.filter((item) => item.category === activeCategory.value)
	}

	// 按搜索关键词过滤
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase().trim()
		result = result.filter(
			(item) =>
				item.question.toLowerCase().includes(query) ||
				item.answer.toLowerCase().includes(query)
		)
	}

	return result
})

// 获取分类颜色
const getCategoryColor = (category) => {
	const colors = {
		general: 'bg-blue-100',
		usage: 'bg-green-100',
		features: 'bg-purple-100',
		pricing: 'bg-amber-100',
		security: 'bg-red-100'
	}
	return colors[category] || 'bg-gray-100'
}

// 获取分类图标颜色
const getCategoryIconColor = (category) => {
	const colors = {
		general: 'text-blue-600',
		usage: 'text-green-600',
		features: 'text-purple-600',
		pricing: 'text-amber-600',
		security: 'text-red-600'
	}
	return colors[category] || 'text-gray-600'
}

// 获取分类图标
const getCategoryIcon = (category) => {
	const icons = {
		general: 'i-heroicons-question-mark-circle',
		usage: 'i-heroicons-rocket-launch',
		features: 'i-heroicons-sparkles',
		pricing: 'i-heroicons-currency-dollar',
		security: 'i-heroicons-shield-check'
	}
	return icons[category] || 'i-heroicons-information-circle'
}

// 格式化答案（支持 HTML）
const formatAnswer = (answer) => {
	if (!answer) return ''

	// 将加粗标记转换为 HTML
	let formatted = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

	// 按段落分割（双换行符）
	const paragraphs = formatted.split(/\n\n+/).filter((p) => p.trim())

	// 处理每个段落
	const processedParagraphs = paragraphs.map((para) => {
		para = para.trim()

		// 检查是否是列表项
		if (para.includes('\n• ') || para.startsWith('• ')) {
			// 处理列表
			const listItems = para
				.split(/\n/)
				.map((line) => line.trim())
				.filter((line) => line.startsWith('• '))
				.map((line) => line.replace(/^• /, '').trim())
				.filter(Boolean)
				.map((item) => `<li>${item}</li>`)
				.join('')

			return listItems
				? `<ul class="list-disc list-inside space-y-2 my-3 ml-2">${listItems}</ul>`
				: ''
		}

		// 处理普通段落，将单换行符转换为 <br>
		para = para.replace(/\n/g, '<br>')
		return para ? `<p class="my-3">${para}</p>` : ''
	})

	return processedParagraphs.filter(Boolean).join('')
}

useHead({
	title: `常见问题 - ${SEO.siteName}`,
	meta: [
		{
			name: 'description',
			content:
				'面试汪常见问题解答 - 了解如何使用 AI 面试平台提升面试能力，包含使用指南、功能特性、价格订阅、隐私安全等问题'
		},
		{ name: 'robots', content: 'index,follow' }
	]
})
</script>

<style scoped>
:deep(.prose ul) {
	margin-top: 1rem;
	margin-bottom: 1rem;
	padding-left: 1.5rem;
}

:deep(.prose li) {
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
}

:deep(.prose p) {
	margin-top: 0.75rem;
	margin-bottom: 0.75rem;
}

:deep(.prose strong) {
	font-weight: 600;
	color: var(--color-neutral-900);
}

:deep(.prose a) {
	color: var(--color-primary-600);
	text-decoration: underline;
}

:deep(.prose a:hover) {
	color: var(--color-primary-700);
}
</style>
