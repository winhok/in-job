/**
 * useSEO Composable
 * 
 * 统一的 SEO 管理工具，封装了所有 SEO 相关的功能
 * 
 * 使用示例：
 * 
 * ```vue
 * <script setup>
 * // 基础使用
 * useSEO({
 *   title: '页面标题',
 *   description: '页面描述',
 *   keywords: '关键词1,关键词2'
 * })
 * 
 * // 使用结构化数据
 * useSEO({
 *   title: '面试历史',
 *   description: '查看您的面试记录',
 *   structuredData: [
 *     jsonLdBreadcrumb([
 *       { name: '首页', url: '/' },
 *       { name: '面试历史', url: '/history' }
 *     ])
 *   ]
 * })
 * 
 * // 使用面包屑
 * useSEO({
 *   title: '面试报告',
 *   breadcrumbs: [
 *     { name: '首页', url: '/' },
 *     { name: '面试历史', url: '/history' },
 *     { name: '面试报告' }
 *   ]
 * })
 * </script>
 * ```
 */

import { useHead, useRoute } from '#imports'
import {
	SEO,
	PAGE_SEO_CONFIG,
	generateTitle,
	truncateDescription,
	absoluteUrl,
	generateMetaTags,
	generateLinkTags,
	jsonLdBreadcrumb,
	jsonLdWebPage
} from '@/constants/seo'

/**
 * SEO 配置选项类型定义
 * @typedef {Object} SEOOptions
 * @property {string} [title] - 页面标题
 * @property {string} [description] - 页面描述
 * @property {string} [keywords] - 页面关键词
 * @property {string} [image] - 页面分享图片
 * @property {string} [url] - 页面URL（相对或绝对）
 * @property {string} [type] - Open Graph 类型（website/article等）
 * @property {string} [author] - 作者
 * @property {boolean} [noIndex] - 是否禁止搜索引擎索引
 * @property {string} [publishTime] - 发布时间（ISO 8601格式）
 * @property {string} [modifiedTime] - 修改时间（ISO 8601格式）
 * @property {Array} [breadcrumbs] - 面包屑导航数组 [{name, url}]
 * @property {Array} [structuredData] - 自定义结构化数据（JSON-LD）
 * @property {string} [prevPage] - 上一页URL（用于分页）
 * @property {string} [nextPage] - 下一页URL（用于分页）
 * @property {boolean} [autoConfig] - 是否根据路由自动配置（默认true）
 */

/**
 * SEO 配置 Composable
 * @param {SEOOptions} options - SEO配置选项
 */
export const useSEO = (options = {}) => {
	const route = useRoute()
	
	// 自动配置：根据当前路由获取预设的SEO配置
	let config = { ...options }
	if (options.autoConfig !== false) {
		const routePath = route.path
		const autoConfig = PAGE_SEO_CONFIG[routePath] || {}
		config = { ...autoConfig, ...options }
	}

	// 解构配置
	const {
		title: rawTitle,
		description,
		keywords,
		image,
		url,
		type = 'website',
		author,
		noIndex = false,
		publishTime,
		modifiedTime,
		breadcrumbs = [],
		structuredData = [],
		prevPage,
		nextPage
	} = config

	// 生成完整标题
	const fullTitle = rawTitle ? generateTitle(rawTitle, true) : SEO.defaultTitle

	// 生成当前页面URL
	const currentUrl = url || route.path
	const absoluteCurrentUrl = absoluteUrl(currentUrl)

	// 生成 Meta 标签
	const metaTags = generateMetaTags({
		title: fullTitle,
		description,
		keywords,
		image,
		url: currentUrl,
		type,
		author,
		noIndex,
		publishTime,
		modifiedTime
	})

	// 生成 Link 标签
	const linkTags = generateLinkTags({
		canonical: currentUrl,
		prevPage,
		nextPage
	})

	// 生成结构化数据
	const schemas = [...structuredData]

	// 如果有面包屑，自动生成面包屑结构化数据
	if (breadcrumbs.length > 0) {
		schemas.push(jsonLdBreadcrumb(breadcrumbs))
	}

	// 自动添加 WebPage 结构化数据
	schemas.push(
		jsonLdWebPage({
			title: fullTitle,
			description: description || SEO.defaultDescription,
			url: currentUrl,
			datePublished: publishTime,
			dateModified: modifiedTime,
			author
		})
	)

	// 构建完整的 head 配置
	const headConfig = {
		title: fullTitle,
		htmlAttrs: {
			lang: 'zh-CN'
		},
		meta: metaTags,
		link: linkTags,
		script: schemas.filter(Boolean).map(schema => ({
			type: 'application/ld+json',
			innerHTML: JSON.stringify(schema)
		}))
	}

	// 应用 head 配置
	useHead(headConfig)

	// 返回配置信息（供调试或其他用途）
	return {
		title: fullTitle,
		description: description || SEO.defaultDescription,
		url: absoluteCurrentUrl,
		config: headConfig
	}
}

/**
 * 简化版 SEO 配置
 * 只需要标题和描述即可
 */
export const useSimpleSEO = (title, description, keywords) => {
	return useSEO({
		title,
		description,
		keywords
	})
}

/**
 * 文章页面 SEO 配置
 * 适用于博客、新闻等内容页面
 */
export const useArticleSEO = (options = {}) => {
	const {
		title,
		description,
		keywords,
		author,
		publishTime,
		modifiedTime,
		image,
		...rest
	} = options

	return useSEO({
		title,
		description,
		keywords,
		author: author || SEO.author,
		type: 'article',
		publishTime,
		modifiedTime,
		image,
		...rest
	})
}

/**
 * 列表页面 SEO 配置
 * 适用于有分页的列表页
 */
export const useListSEO = (options = {}) => {
	const {
		title,
		description,
		keywords,
		page = 1,
		totalPages = 1,
		baseUrl,
		...rest
	} = options

	// 如果是分页，在标题中加入页码
	const pageTitle = page > 1 ? `${title} - 第${page}页` : title

	// 生成上一页和下一页URL
	const prevPage = page > 1 && baseUrl ? `${baseUrl}?page=${page - 1}` : null
	const nextPage = page < totalPages && baseUrl ? `${baseUrl}?page=${page + 1}` : null

	// 分页页面（除了第一页）建议不索引，避免重复内容
	const noIndex = page > 1

	return useSEO({
		title: pageTitle,
		description,
		keywords,
		noIndex,
		prevPage,
		nextPage,
		...rest
	})
}

/**
 * 获取当前页面的 SEO 信息
 * 用于在组件中读取 SEO 配置
 */
export const useSEOInfo = () => {
	const route = useRoute()
	const routePath = route.path
	const config = PAGE_SEO_CONFIG[routePath] || {}

	return {
		title: config.title || SEO.defaultTitle,
		description: config.description || SEO.defaultDescription,
		keywords: config.keywords || SEO.defaultKeywords,
		url: absoluteUrl(routePath)
	}
}

export default useSEO

