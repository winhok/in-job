/**
 * SEO 核心配置
 * 适配搜索引擎：Google、Bing（必应）、Baidu（百度）、360搜索
 *
 * 使用方式：
 * 1. 直接在 nuxt.config.js 中使用
 * 2. 在页面中通过 useSEO composable 使用
 * 3. 在组件中通过 useHead 使用
 */

// ==================== 基础配置 ====================
export const SEO = {
	// 站点基本信息
	siteUrl: 'https://mianshiwangoffer.com',
	siteName: '面试汪',
	siteNameEn: 'MianShiWang',

	// 默认 Meta 信息
	defaultTitle: '面试汪 - AI智能面试平台 | 押题 · 模拟 · 行测 三大服务全覆盖',
	defaultDescription:
		'面试汪是专业的AI智能面试平台，提供程序员、产品经理、设计师、律师、医生等各职业的智能面试训练、模拟面试、面试题库和面试技巧。助力求职者提升面试能力，快速拿到心仪offer。',
	defaultKeywords:
		'AI面试,智能面试,面试训练,模拟面试,面试题库,程序员面试,产品经理面试,设计师面试,律师面试,医生面试,面试技巧,在线面试,面试准备,求职面试,面试汪',

	// 作者信息
	author: '面试汪团队',

	// Open Graph 图片（用于社交媒体分享）
	ogImage: '/og-image.png',
	ogImageWidth: 1200,
	ogImageHeight: 630,

	// Twitter Card 配置
	twitterCard: 'summary_large_image',
	twitterSite: '@mianshiwang',

	// 联系方式
	contactEmail: 'contact@mianshiwangoffer.com',

	// 备案信息（中国网站必需）
	icp: '鲁 ICP 备 2025206060 号-1', // 如：京ICP备12345678号-1

	// 公司信息
	companyName: '济南于思信息技术有限公司',
	companyAddress: '山东省济南市',

	// 多语言支持
	locale: 'zh_CN',
	alternateLocales: ['zh_CN', 'en_US'],

	// 百度相关
	baiduSiteId: '', // 百度统计站点ID
	baiduVerification: 'codeva-6o8U6rhDTH', // 百度站长验证码
	// 其他搜索引擎验证
	googleVerification: 'AGuYDOPXYXlsuFtFtW-AoibR4JrW8AnoRGmvoD2Gb_w', // Google Search Console 验证码
	bingVerification: 'B30BA2B4BE274FC862D5D489A48B7EC0', // Bing Webmaster 验证码
	so360Verification: '8d732d5c4e2d72ea393735ddbc0286ed' // 360搜索站长验证码
}

// ==================== 辅助函数 ====================

/**
 * 生成绝对URL
 * @param {string} path - 相对路径或绝对路径
 * @param {string} base - 基础URL，默认使用 SEO.siteUrl
 * @returns {string} 绝对URL
 */
export const absoluteUrl = (path, base = SEO.siteUrl) => {
	if (!path) return base
	if (path.startsWith('http://') || path.startsWith('https://')) return path
	// 确保 base 没有尾部斜杠，path 有前导斜杠
	const cleanBase = base.replace(/\/$/, '')
	const cleanPath = path.startsWith('/') ? path : `/${path}`
	return `${cleanBase}${cleanPath}`
}

/**
 * 生成页面标题
 * @param {string} pageTitle - 页面标题
 * @param {boolean} withSuffix - 是否添加站点名称后缀
 * @returns {string} 完整标题
 */
export const generateTitle = (pageTitle, withSuffix = true) => {
	if (!pageTitle) return SEO.defaultTitle
	return withSuffix ? `${pageTitle} - ${SEO.siteName}` : pageTitle
}

/**
 * 限制描述长度
 * @param {string} description - 描述内容
 * @param {number} maxLength - 最大长度，默认160
 * @returns {string} 截取后的描述
 */
export const truncateDescription = (description, maxLength = 160) => {
	if (!description) return SEO.defaultDescription
	if (description.length <= maxLength) return description
	return description.substring(0, maxLength - 3) + '...'
}

// ==================== 页面配置预设 ====================

/**
 * 页面SEO配置映射表
 * 可根据路由自动应用SEO配置
 */
export const PAGE_SEO_CONFIG = {
	'/': {
		title: '面试汪 - AI智能面试平台 | 在线面试训练与题库',
		description:
			'面试汪是专业的AI智能面试平台，提供程序员、产品经理、设计师等各职业的智能面试训练、模拟面试和面试题库。助力求职者提升面试能力，快速拿到心仪offer。',
		keywords: 'AI面试,智能面试,面试训练,模拟面试,面试题库,在线面试,面试汪'
	},
	'/interview': {
		title: '开始面试',
		description:
			'选择您的职业和岗位，开始AI智能面试训练，提升面试技巧，获得专业的面试反馈和建议。',
		keywords: 'AI面试,智能面试,模拟面试,面试训练,面试准备'
	},
	'/history': {
		title: '面试历史',
		description: '查看您的历史面试记录，分析面试表现，持续提升面试能力。',
		keywords: '面试记录,面试历史,面试分析'
	},
	'/profile': {
		title: '个人中心',
		description: '管理您的个人信息、简历和会员服务。',
		keywords: '个人中心,用户中心,简历管理'
	},
	'/faq': {
		title: '常见问题',
		description: '面试汪平台常见问题解答，帮助您更好地使用AI面试训练服务。',
		keywords: '常见问题,帮助中心,使用指南'
	},
	'/contact': {
		title: '联系我们',
		description: '联系面试汪团队，获取技术支持或商务合作。',
		keywords: '联系我们,客服支持,商务合作'
	}
}

// ==================== 结构化数据 (JSON-LD Schema) ====================

/**
 * 生成 WebSite 结构化数据
 * 用于告诉搜索引擎网站的基本信息
 */
export const jsonLdWebsite = (seo = SEO) => ({
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	name: seo.siteName,
	alternateName: seo.siteNameEn,
	url: seo.siteUrl,
	description: seo.defaultDescription,
	inLanguage: 'zh-CN',
	potentialAction: {
		'@type': 'SearchAction',
		target: {
			'@type': 'EntryPoint',
			urlTemplate: `${seo.siteUrl}/search?q={search_term_string}`
		},
		'query-input': 'required name=search_term_string'
	}
})

/**
 * 生成 Organization 结构化数据
 * 用于告诉搜索引擎组织/公司信息
 */
export const jsonLdOrganization = (seo = SEO) => ({
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: seo.companyName || seo.siteName,
	alternateName: seo.siteNameEn,
	url: seo.siteUrl,
	logo: {
		'@type': 'ImageObject',
		url: absoluteUrl(seo.ogImage),
		width: seo.ogImageWidth,
		height: seo.ogImageHeight
	},
	description: seo.defaultDescription,
	email: seo.contactEmail,
	address: seo.companyAddress
		? {
				'@type': 'PostalAddress',
				addressCountry: 'CN',
				addressLocality: seo.companyAddress
		  }
		: undefined,
	sameAs: [
		// 可以添加社交媒体链接
		// 'https://weibo.com/mianshiwang',
		// 'https://www.zhihu.com/people/mianshiwang'
	].filter(Boolean)
})

/**
 * 生成 WebPage 结构化数据
 * 用于每个具体页面
 */
export const jsonLdWebPage = (options = {}) => {
	const {
		title = SEO.defaultTitle,
		description = SEO.defaultDescription,
		url = SEO.siteUrl,
		datePublished,
		dateModified,
		author = SEO.author
	} = options

	return {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: title,
		description: description,
		url: absoluteUrl(url),
		inLanguage: 'zh-CN',
		isPartOf: {
			'@type': 'WebSite',
			name: SEO.siteName,
			url: SEO.siteUrl
		},
		...(datePublished && { datePublished }),
		...(dateModified && { dateModified }),
		...(author && {
			author: {
				'@type': 'Organization',
				name: author
			}
		})
	}
}

/**
 * 生成 FAQPage 结构化数据
 * 用于常见问题页面
 */
export const jsonLdFAQPage = (faqs = []) => {
	if (!faqs.length) return null

	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.answer
			}
		}))
	}
}

/**
 * 生成 BreadcrumbList 结构化数据
 * 用于面包屑导航
 */
export const jsonLdBreadcrumb = (breadcrumbs = []) => {
	if (!breadcrumbs.length) return null

	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: breadcrumbs.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url ? absoluteUrl(item.url) : undefined
		}))
	}
}

/**
 * 生成 SoftwareApplication 结构化数据
 * 用于应用/软件介绍页面
 */
export const jsonLdSoftwareApplication = (options = {}) => {
	const {
		name = SEO.siteName,
		description = SEO.defaultDescription,
		offers = []
	} = options

	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: name,
		description: description,
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web Browser',
		offers: offers.length
			? offers.map((offer) => ({
					'@type': 'Offer',
					price: offer.price || 0,
					priceCurrency: 'CNY',
					name: offer.name
			  }))
			: undefined,
		aggregateRating: options.rating
			? {
					'@type': 'AggregateRating',
					ratingValue: options.rating.value,
					ratingCount: options.rating.count
			  }
			: undefined
	}
}

// ==================== Meta 标签生成器 ====================

/**
 * 生成完整的 Meta 标签配置
 * 包含所有搜索引擎的特殊标签
 */
export const generateMetaTags = (options = {}) => {
	const {
		title = SEO.defaultTitle,
		description = SEO.defaultDescription,
		keywords = SEO.defaultKeywords,
		image = absoluteUrl(SEO.ogImage),
		url = SEO.siteUrl,
		type = 'website',
		author = SEO.author,
		publishTime,
		modifiedTime,
		noIndex = false
	} = options

	const metaTags = [
		// 基础 Meta
		{ charset: 'utf-8' },
		{
			name: 'viewport',
			content: 'width=device-width, initial-scale=1, maximum-scale=5'
		},
		{ name: 'description', content: truncateDescription(description) },
		{ name: 'keywords', content: keywords },
		{ name: 'author', content: author },

		// 搜索引擎抓取控制
		{
			name: 'robots',
			content: noIndex
				? 'noindex,nofollow'
				: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
		},
		{
			name: 'googlebot',
			content: noIndex ? 'noindex,nofollow' : 'index,follow'
		},
		{ name: 'bingbot', content: noIndex ? 'noindex,nofollow' : 'index,follow' },
		{
			name: 'baiduspider',
			content: noIndex ? 'noindex,nofollow' : 'index,follow'
		},

		// Open Graph (Facebook, LinkedIn 等)
		{ property: 'og:type', content: type },
		{ property: 'og:site_name', content: SEO.siteName },
		{ property: 'og:title', content: title },
		{ property: 'og:description', content: truncateDescription(description) },
		{ property: 'og:url', content: absoluteUrl(url) },
		{ property: 'og:image', content: image },
		{ property: 'og:image:width', content: String(SEO.ogImageWidth) },
		{ property: 'og:image:height', content: String(SEO.ogImageHeight) },
		{ property: 'og:locale', content: SEO.locale },

		// Twitter Card
		{ name: 'twitter:card', content: SEO.twitterCard },
		{ name: 'twitter:site', content: SEO.twitterSite },
		{ name: 'twitter:title', content: title },
		{ name: 'twitter:description', content: truncateDescription(description) },
		{ name: 'twitter:image', content: image },

		// 移动端优化
		{ name: 'format-detection', content: 'telephone=no' },
		{ name: 'mobile-web-app-capable', content: 'yes' },
		{ name: 'apple-mobile-web-app-capable', content: 'yes' },
		{ name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
		{ name: 'apple-mobile-web-app-title', content: SEO.siteName },

		// 应用名称
		{ name: 'application-name', content: SEO.siteName },

		// 百度特殊标签
		{ name: 'baidu-site-verification', content: SEO.baiduVerification || '' },
		{ name: 'mobile-agent', content: 'format=html5;url=' + absoluteUrl(url) }, // 百度移动适配

		// Google 验证
		{ name: 'google-site-verification', content: SEO.googleVerification || '' },

		// Bing 验证
		{ name: 'msvalidate.01', content: SEO.bingVerification || '' },

		// 360 搜索验证
		{ name: '360-site-verification', content: SEO.so360Verification || '' },

		// 防止搜索引擎转码（百度、360等）
		{ 'http-equiv': 'Cache-Control', content: 'no-transform' },
		{ 'http-equiv': 'Cache-Control', content: 'no-siteapp' },

		// 版权信息
		{
			name: 'copyright',
			content: `Copyright © ${new Date().getFullYear()} ${SEO.siteName}`
		}
	]

	// 添加发布时间和修改时间（如果提供）
	if (publishTime) {
		metaTags.push({ property: 'article:published_time', content: publishTime })
	}
	if (modifiedTime) {
		metaTags.push({ property: 'article:modified_time', content: modifiedTime })
		metaTags.push({ property: 'og:updated_time', content: modifiedTime })
	}

	// 过滤掉空值
	return metaTags.filter((tag) => {
		const value = tag.content || tag.charset
		return value && value !== ''
	})
}

/**
 * 生成 Link 标签配置
 */
export const generateLinkTags = (options = {}) => {
	const {
		canonical = SEO.siteUrl,
		prevPage,
		nextPage,
		alternates = []
	} = options

	const linkTags = [
		// Canonical URL（规范链接）
		{ rel: 'canonical', href: absoluteUrl(canonical) },

		// DNS 预解析
		{ rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
		{ rel: 'dns-prefetch', href: 'https://hm.baidu.com' },

		// 图标
		{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
		{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }

		// RSS (如果有)
		// { rel: 'alternate', type: 'application/rss+xml', title: `${SEO.siteName} RSS Feed`, href: '/rss.xml' },
	]

	// 分页链接
	if (prevPage) {
		linkTags.push({ rel: 'prev', href: absoluteUrl(prevPage) })
	}
	if (nextPage) {
		linkTags.push({ rel: 'next', href: absoluteUrl(nextPage) })
	}

	// 多语言版本
	if (alternates.length) {
		alternates.forEach((alt) => {
			linkTags.push({
				rel: 'alternate',
				hreflang: alt.lang,
				href: absoluteUrl(alt.url)
			})
		})
	}

	return linkTags
}

// ==================== 导出所有配置 ====================

export default {
	SEO,
	absoluteUrl,
	generateTitle,
	truncateDescription,
	PAGE_SEO_CONFIG,
	jsonLdWebsite,
	jsonLdOrganization,
	jsonLdWebPage,
	jsonLdFAQPage,
	jsonLdBreadcrumb,
	jsonLdSoftwareApplication,
	generateMetaTags,
	generateLinkTags
}
