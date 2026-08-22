<template>
	<div
		class="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 py-8"
	>
		<div class="container px-4 mx-auto max-w-6xl">
			<!-- 页面标题 -->
			<div class="mb-8">
				<h1 class="text-2xl font-bold text-gray-900">服务记录</h1>
				<p class="text-gray-500 text-sm mt-1">查看您的历史面试押题与评估记录</p>
			</div>

			<div class="flex flex-col md:flex-row gap-6 items-start">
				<!-- 左侧导航栏 -->
				<div class="w-full md:w-64 shrink-0 space-y-4">
					<div
						class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-2"
					>
						<div class="space-y-1">
							<button
								v-for="tab in tabs"
								:key="tab.key"
								@click="handleTabChange(tab.key)"
								class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
								:class="[
									activeTab === tab.key
										? 'bg-primary-50 text-primary-700 shadow-primary-100/50'
										: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
								]"
							>
								<div
									class="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors"
									:class="[
										activeTab === tab.key
											? 'bg-white text-primary-600 shadow-sm'
											: 'bg-gray-100 text-gray-400'
									]"
								>
									<UIcon :name="tab.icon" class="w-5 h-5" />
								</div>
								<span>{{ tab.label }}</span>
								<UIcon
									v-if="activeTab === tab.key"
									name="i-heroicons-chevron-right"
									class="w-4 h-4 ml-auto text-primary-400"
								/>
							</button>
						</div>
					</div>

					<!-- 简单的统计或提示卡片 (可选) -->
					<div
						class="bg-linear-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white shadow-lg shadow-primary-500/20 hidden md:block"
					>
						<div class="flex items-center gap-2 mb-2 opacity-90">
							<UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
							<span class="text-xs font-medium">AI 面试助手</span>
						</div>
						<p class="text-sm opacity-90 leading-relaxed">
							定期回顾面试记录，复盘总结是提升面试成功率的关键。
						</p>
					</div>
				</div>

				<!-- 右侧内容区 -->
				<div class="flex-1 min-w-0 w-full">
					<div
						class="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[600px] flex flex-col"
					>
						<!-- 列表头部 -->
						<div
							class="px-6 py-4 border-b border-gray-100 flex justify-between items-center"
						>
							<h2 class="font-semibold text-gray-900 flex items-center gap-2">
								{{ currentTabLabel }}列表
								<span class="text-gray-500 text-xs">{{ total }} 条</span>
							</h2>
							<UButton
								color="gray"
								variant="ghost"
								size="xs"
								icon="i-heroicons-arrow-path"
								:loading="isLoading"
								@click="loadData"
							>
								刷新
							</UButton>
						</div>

						<!-- 列表内容 -->
						<div class="p-4 flex-1 relative">
							<!-- 加载状态 -->
							<div
								v-if="isLoading"
								class="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center"
							>
								<UIcon
									name="i-heroicons-arrow-path"
									class="w-8 h-8 animate-spin text-primary-500 mb-2"
								/>
								<p class="text-sm text-gray-500">加载数据中...</p>
							</div>

							<!-- 空状态 -->
							<div
								v-if="!isLoading && list.length === 0"
								class="h-full flex flex-col items-center justify-center py-20 text-center"
							>
								<div
									class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"
								>
									<UIcon
										name="i-heroicons-clipboard-document-list"
										class="w-10 h-10 text-gray-300"
									/>
								</div>
								<h3 class="text-gray-900 font-medium mb-1">暂无相关记录</h3>
								<p class="text-gray-500 text-sm mb-6">
									您还没有进行过{{ currentTabLabel }}
								</p>
								<UButton
									:to="`/interview/start`"
									color="primary"
									icon="i-heroicons-plus"
								>
									去体验服务
								</UButton>
							</div>

							<!-- 列表数据 -->
							<div v-else class="space-y-3">
								<div
									v-for="record in list"
									:key="record.id || record.resultId"
									class="group relative bg-white p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4"
								>
									<!-- 左侧图标与基本信息 -->
									<div class="flex items-start gap-4 flex-1 min-w-0">
										<div
											class="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-primary-50 text-gray-400 group-hover:text-primary-600 flex items-center justify-center shrink-0 transition-colors"
										>
											<UIcon
												name="i-heroicons-building-office-2"
												class="w-6 h-6"
											/>
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2 mb-1">
												<h3
													class="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors"
												>
													{{ record.inputData?.company || '未知公司' }}
												</h3>
												<span class="text-gray-300 hidden sm:inline">|</span>
												<span
													class="text-sm text-gray-600 truncate hidden sm:inline"
												>
													{{
														record.inputData?.positionName ||
														record.inputData?.position ||
														'通用岗位'
													}}
												</span>
											</div>
											<!-- 移动端岗位名称显示 -->
											<div
												class="text-sm text-gray-600 truncate sm:hidden mb-1"
											>
												{{
													record.inputData?.positionName ||
													record.inputData?.position ||
													'通用岗位'
												}}
											</div>

											<div class="flex flex-wrap items-center gap-3 text-xs">
												<span class="text-gray-400 flex items-center gap-1">
													<UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
													{{ formatDate(record.createdAt) }}
												</span>
												<UBadge
													v-if="record.status === 'success'"
													color="green"
													variant="subtle"
													size="xs"
													class="font-normal"
												>
													已完成
												</UBadge>
												<UBadge
													v-else
													color="gray"
													variant="subtle"
													size="xs"
													class="font-normal"
												>
													处理中
												</UBadge>
											</div>
										</div>
									</div>

									<!-- 右侧操作 -->
									<div
										class="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50 mt-2 sm:mt-0 flex justify-end"
									>
										<UButton
											color="gray"
											variant="ghost"
											size="sm"
											icon="i-heroicons-eye"
											@click="handleView(record)"
											class="group-hover:bg-primary-50 group-hover:text-primary-600"
										>
											查看报告
										</UButton>
									</div>
								</div>
							</div>
						</div>

						<!-- 底部底部分页 -->
						<div
							v-if="total > 0"
							class="px-6 py-4 border-t border-gray-100 flex justify-center"
						>
							<UPagination
								:page-count="limit"
								:total="total"
								:ui="{
									wrapper: 'flex items-center gap-1',
									rounded: 'rounded-lg'
								}"
								@update:page="handlePageChange"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
	getInterviewResumeHistoryAPI,
	getInterviewSpecialHistoryAPI,
	getInterviewBehaviorHistoryAPI
} from '@/api/interview'
import { SERVICE_TAGS } from '@/constants/vip'
import dayjs from 'dayjs'
import { navigateTo } from '#imports'

definePageMeta({
	middleware: 'auth'
})

useHead({
	title: '服务记录 - 面试汪'
})

const { $api } = useNuxtApp()

// 标签页配置
const tabs = [
	{
		key: SERVICE_TAGS.RESUME,
		label: '面试押题',
		icon: 'i-heroicons-document-text'
	},
	{
		key: SERVICE_TAGS.SPECIAL,
		label: '专项面试',
		icon: 'i-heroicons-light-bulb'
	},
	{
		key: SERVICE_TAGS.BEHAVIOR,
		label: '行测 + HR',
		icon: 'i-heroicons-users'
	}
]

// 状态管理
const activeTab = ref(SERVICE_TAGS.RESUME)
const isLoading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)

// 当前选中的标签名称
const currentTabLabel = computed(() => {
	return tabs.find((t) => t.key === activeTab.value)?.label || ''
})

/**
 * 切换标签
 */
const handleTabChange = (key) => {
	if (activeTab.value === key) return
	activeTab.value = key
	page.value = 1
	list.value = [] // 切换时清空列表，避免展示旧数据
	loadData()
}

/**
 * 切换分页
 */
const handlePageChange = (newPage) => {
	page.value = newPage
	loadData()
}

/**
 * 加载数据
 */
const loadData = async () => {
	isLoading.value = true
	try {
		let res = null

		switch (activeTab.value) {
			case SERVICE_TAGS.RESUME:
				res = await getInterviewResumeHistoryAPI($api, page.value, limit.value)
				break
			case SERVICE_TAGS.SPECIAL:
				res = await getInterviewSpecialHistoryAPI($api, page.value, limit.value)
				break
			case SERVICE_TAGS.BEHAVIOR:
				res = await getInterviewBehaviorHistoryAPI(
					$api,
					page.value,
					limit.value
				)
				break
		}

		if (res) {
			list.value = res.records || []
			total.value = res.total || 0
		}
	} catch (error) {
		console.error('获取历史记录失败', error)
		list.value = []
		total.value = 0
	} finally {
		isLoading.value = false
	}
}

// 初始加载
loadData()

/**
 * 格式化日期
 */
const formatDate = (date) => {
	if (!date) return ''
	return dayjs(date).format('YYYY-MM-DD HH:mm')
}

/**
 * 查看详情
 */
const handleView = (record) => {
	if (record.resultId) {
		// 动态传递当前的 serviceType
		navigateTo(
			`/interview?serviceType=${activeTab.value}&history=true&resultId=${record.resultId}`
		)
	} else {
		console.warn('记录缺少 resultId', record)
	}
}
</script>
