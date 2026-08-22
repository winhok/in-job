/**
 * SEO 工具函数集合
 * 
 * 提供各种 SEO 相关的辅助函数
 */

import { SEO, absoluteUrl } from '@/constants/seo'

/**
 * 生成结构化数据（JSON-LD）脚本标签
 * @param {Object|Array} schema - 结构化数据对象或数组
 * @returns {Object} 可用于 useHead 的 script 配置
 */
export const createStructuredDataScript = (schema) => {
	const schemas = Array.isArray(schema) ? schema : [schema]
	
	return schemas.map(s => ({
		type: 'application/ld+json',
		children: JSON.stringify(s)
	}))
}

/**
 * 生成当前页面的完整 URL
 * @param {Object} route - Vue Router 的 route 对象
 * @returns {string} 完整 URL
 */
export const getCurrentPageUrl = (route) => {
	const path = route.path
	const query = route.query
	
	let url = absoluteUrl(path)
	
	// 如果有查询参数，添加到 URL
	if (Object.keys(query).length > 0) {
		const queryString = new URLSearchParams(query).toString()
		url += `?${queryString}`
	}
	
	return url
}

/**
 * 生成分页的 URL
 * @param {string} basePath - 基础路径
 * @param {number} page - 页码
 * @returns {string} 完整 URL
 */
export const getPaginationUrl = (basePath, page) => {
	if (page <= 1) {
		return absoluteUrl(basePath)
	}
	return absoluteUrl(`${basePath}?page=${page}`)
}

/**
 * 从文本中提取关键词
 * @param {string} text - 文本内容
 * @param {number} limit - 关键词数量限制
 * @returns {string} 逗号分隔的关键词
 */
export const extractKeywords = (text, limit = 10) => {
	if (!text) return ''
	
	// 简单的关键词提取（实际项目中可以使用更复杂的算法）
	const words = text
		.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 只保留中文、英文、数字
		.split(/\s+/)
		.filter(word => word.length >= 2) // 过滤太短的词
		.slice(0, limit)
	
	return words.join(',')
}

/**
 * 检查 URL 是否为外部链接
 * @param {string} url - URL
 * @returns {boolean} 是否为外部链接
 */
export const isExternalLink = (url) => {
	if (!url) return false
	return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * 为外部链接添加 rel 属性
 * @param {string} url - URL
 * @returns {string} rel 属性值
 */
export const getExternalLinkRel = (url) => {
	if (isExternalLink(url)) {
		return 'noopener noreferrer'
	}
	return ''
}

/**
 * 生成社交分享链接
 */
export const generateShareLinks = (options = {}) => {
	const {
		url = SEO.siteUrl,
		title = SEO.defaultTitle,
		description = SEO.defaultDescription,
		image = absoluteUrl(SEO.ogImage)
	} = options

	const encodedUrl = encodeURIComponent(url)
	const encodedTitle = encodeURIComponent(title)
	const encodedDescription = encodeURIComponent(description)

	return {
		// 微信（需要扫码）
		wechat: url,
		
		// 微博
		weibo: `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}&pic=${encodeURIComponent(image)}`,
		
		// QQ空间
		qzone: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodedUrl}&title=${encodedTitle}&desc=${encodedDescription}&pics=${encodeURIComponent(image)}`,
		
		// Facebook
		facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
		
		// Twitter
		twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
		
		// LinkedIn
		linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
		
		// Email
		email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
	}
}

/**
 * 生成 Open Graph 图片 URL
 * 如果使用动态 OG 图片生成服务
 */
export const generateOGImage = (options = {}) => {
	const {
		title = SEO.defaultTitle,
		description = SEO.defaultDescription,
		template = 'default'
	} = options

	// 如果使用第三方服务（如 cloudinary、imgix 等）生成 OG 图片
	// return `https://your-og-image-service.com/api/generate?title=${encodeURIComponent(title)}&template=${template}`

	// 默认返回静态图片
	return absoluteUrl(SEO.ogImage)
}

/**
 * SEO 健康检查
 * 用于开发环境检查 SEO 配置是否完整
 */
export const checkSEOHealth = (pageConfig = {}) => {
	const issues = []

	// 检查标题
	if (!pageConfig.title || pageConfig.title.length < 10) {
		issues.push('标题太短或缺失（建议 10-60 个字符）')
	} else if (pageConfig.title.length > 60) {
		issues.push('标题太长（建议不超过 60 个字符）')
	}

	// 检查描述
	if (!pageConfig.description || pageConfig.description.length < 50) {
		issues.push('描述太短或缺失（建议 50-160 个字符）')
	} else if (pageConfig.description.length > 160) {
		issues.push('描述太长（建议不超过 160 个字符）')
	}

	// 检查关键词
	if (!pageConfig.keywords) {
		issues.push('缺少关键词')
	}

	// 检查图片
	if (!pageConfig.image) {
		issues.push('缺少分享图片')
	}

	// 检查 URL
	if (!pageConfig.url) {
		issues.push('缺少页面 URL')
	}

	return {
		isHealthy: issues.length === 0,
		issues,
		score: Math.max(0, 100 - issues.length * 20)
	}
}

/**
 * 格式化日期为 ISO 8601 格式（用于结构化数据）
 */
export const formatDateForSchema = (date) => {
	if (!date) return new Date().toISOString()
	if (date instanceof Date) return date.toISOString()
	return new Date(date).toISOString()
}

/**
 * 生成面包屑数据
 * 根据路由自动生成面包屑
 */
export const generateBreadcrumbs = (route) => {
	const pathSegments = route.path.split('/').filter(Boolean)
	const breadcrumbs = [{ name: '首页', url: '/' }]

	let currentPath = ''
	pathSegments.forEach((segment, index) => {
		currentPath += `/${segment}`
		
		// 路径名称映射（可以扩展）
		const nameMap = {
			'interview': '开始面试',
			'history': '面试历史',
			'profile': '个人中心',
			'faq': '常见问题',
			'contact': '联系我们',
			'agreement': '用户协议',
			'policy': '隐私政策',
			'login': '登录',
			'start': '开始面试',
			'report': '面试报告'
		}

		const name = nameMap[segment] || segment

		// 最后一项不需要 URL
		if (index === pathSegments.length - 1) {
			breadcrumbs.push({ name })
		} else {
			breadcrumbs.push({ name, url: currentPath })
		}
	})

	return breadcrumbs
}

/**
 * 预加载关键资源
 * 用于提升页面加载性能
 */
export const preloadResources = (resources = []) => {
	return resources.map(resource => {
		const { href, as, type, crossorigin } = resource
		const link = {
			rel: 'preload',
			href,
			as
		}
		
		if (type) link.type = type
		if (crossorigin) link.crossorigin = crossorigin
		
		return link
	})
}

/**
 * 生成 Canonical URL
 * 处理查询参数、多语言等情况
 */
export const generateCanonicalUrl = (route, options = {}) => {
	const {
		ignoredParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'],
		includeQuery = false
	} = options

	let path = route.path
	
	// 如果需要包含查询参数
	if (includeQuery && Object.keys(route.query).length > 0) {
		const filteredQuery = {}
		Object.keys(route.query).forEach(key => {
			if (!ignoredParams.includes(key)) {
				filteredQuery[key] = route.query[key]
			}
		})
		
		if (Object.keys(filteredQuery).length > 0) {
			const queryString = new URLSearchParams(filteredQuery).toString()
			path += `?${queryString}`
		}
	}
	
	return absoluteUrl(path)
}

/**
 * 获取页面类型（用于 Open Graph）
 */
export const getPageType = (route) => {
	const path = route.path
	
	if (path === '/') return 'website'
	if (path.startsWith('/interview/report')) return 'article'
	if (path.startsWith('/profile')) return 'profile'
	
	return 'website'
}

export default {
	createStructuredDataScript,
	getCurrentPageUrl,
	getPaginationUrl,
	extractKeywords,
	isExternalLink,
	getExternalLinkRel,
	generateShareLinks,
	generateOGImage,
	checkSEOHealth,
	formatDateForSchema,
	generateBreadcrumbs,
	preloadResources,
	generateCanonicalUrl,
	getPageType
}

