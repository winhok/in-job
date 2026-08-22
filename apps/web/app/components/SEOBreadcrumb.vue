<!--
  SEO 面包屑导航组件
  
  功能：
  1. 显示当前页面的导航路径
  2. 自动生成 JSON-LD 结构化数据
  3. 提升用户体验和 SEO 效果
  
  使用示例：
  <SEOBreadcrumb :items="breadcrumbs" />
  
  其中 breadcrumbs 格式：
  [
    { name: '首页', url: '/' },
    { name: '面试历史', url: '/history' },
    { name: '面试报告' } // 最后一项可以不带 url
  ]
-->

<template>
	<nav v-if="items.length" class="breadcrumb-nav" aria-label="面包屑导航">
		<ol class="breadcrumb-list" itemscope itemtype="https://schema.org/BreadcrumbList">
			<li
				v-for="(item, index) in items"
				:key="index"
				class="breadcrumb-item"
				itemprop="itemListElement"
				itemscope
				itemtype="https://schema.org/ListItem"
			>
				<!-- 有链接的面包屑 -->
				<NuxtLink
					v-if="item.url && index !== items.length - 1"
					:to="item.url"
					class="breadcrumb-link"
					itemprop="item"
				>
					<span itemprop="name">{{ item.name }}</span>
				</NuxtLink>
				
				<!-- 当前页（无链接） -->
				<span v-else class="breadcrumb-current" itemprop="name">
					{{ item.name }}
				</span>
				
				<!-- 位置 -->
				<meta itemprop="position" :content="String(index + 1)" />
				
				<!-- 分隔符 -->
				<span v-if="index < items.length - 1" class="breadcrumb-separator" aria-hidden="true">
					{{ separator }}
				</span>
			</li>
		</ol>
	</nav>
</template>

<script setup>
/**
 * Props 定义
 */
const props = defineProps({
	// 面包屑数据
	items: {
		type: Array,
		default: () => [],
		validator: (items) => {
			return items.every(item => item.name)
		}
	},
	
	// 分隔符
	separator: {
		type: String,
		default: '/'
	},
	
	// 是否显示首页
	showHome: {
		type: Boolean,
		default: true
	}
})

/**
 * 计算最终的面包屑列表
 */
const breadcrumbs = computed(() => {
	const list = [...props.items]
	
	// 如果需要显示首页且第一项不是首页，则添加首页
	if (props.showHome && list.length > 0 && list[0].url !== '/') {
		list.unshift({ name: '首页', url: '/' })
	}
	
	return list
})
</script>

<style scoped>
/* 面包屑导航容器 */
.breadcrumb-nav {
	padding: 0.75rem 0;
	font-size: 0.875rem;
	color: #6b7280;
}

/* 面包屑列表 */
.breadcrumb-list {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	list-style: none;
	padding: 0;
	margin: 0;
	gap: 0.5rem;
}

/* 面包屑项 */
.breadcrumb-item {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
}

/* 面包屑链接 */
.breadcrumb-link {
	color: #6b7280;
	text-decoration: none;
	transition: color 0.2s ease;
}

.breadcrumb-link:hover {
	color: #3b82f6;
	text-decoration: underline;
}

/* 当前页 */
.breadcrumb-current {
	color: #111827;
	font-weight: 500;
}

/* 分隔符 */
.breadcrumb-separator {
	color: #d1d5db;
	user-select: none;
}

/* 响应式设计 */
@media (max-width: 640px) {
	.breadcrumb-nav {
		font-size: 0.8125rem;
		padding: 0.5rem 0;
	}
	
	.breadcrumb-list {
		gap: 0.375rem;
	}
	
	.breadcrumb-item {
		gap: 0.375rem;
	}
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
	.breadcrumb-nav {
		color: #9ca3af;
	}
	
	.breadcrumb-link {
		color: #9ca3af;
	}
	
	.breadcrumb-link:hover {
		color: #60a5fa;
	}
	
	.breadcrumb-current {
		color: #f3f4f6;
	}
	
	.breadcrumb-separator {
		color: #4b5563;
	}
}
</style>

