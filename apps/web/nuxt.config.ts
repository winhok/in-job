// nuxt.config.ts
import * as path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { defineNuxtConfig } from 'nuxt/config'
import {
	SEO,
	jsonLdWebsite,
	jsonLdOrganization,
	generateMetaTags,
	absoluteUrl
} from './app/constants/seo'

const useLightningCSS = true

export default defineNuxtConfig({
	// 源码目录
	srcDir: 'app',

	// 兼容性日期（用于 Nitro/平台兼容提示）
	compatibilityDate: '2025-11-11',

	// 开发服务器：绑定到 0.0.0.0 以便局域网访问
	devServer: {
		host: '0.0.0.0',
		port: 8080
	},

	// 站点基础信息由 app/constants/seo.ts 统一管理

	// —— 全局 <head> ——（完整的 SEO 优化配置）
	app: {
		head: {
			title: SEO.defaultTitle,
			titleTemplate: '%s', // 使用自定义的标题格式
			htmlAttrs: {
				lang: 'zh-CN',
				prefix: 'og: http://ogp.me/ns#' // Open Graph 协议命名空间
			},
			meta: [
				// 基础 Meta 标签
				{ charset: 'utf-8' },
				{
					name: 'viewport',
					content: 'width=device-width, initial-scale=1, maximum-scale=5'
				},
				{ name: 'description', content: SEO.defaultDescription },
				{ name: 'keywords', content: SEO.defaultKeywords },
				{ name: 'author', content: SEO.author },

				// 搜索引擎抓取控制（支持 Google、Bing、Baidu、360）
				{
					name: 'robots',
					content:
						'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
				},
				{ name: 'googlebot', content: 'index,follow' },
				{ name: 'bingbot', content: 'index,follow' },
				{ name: 'baiduspider', content: 'index,follow' },

				// Open Graph (Facebook、LinkedIn 等社交媒体)
				{ property: 'og:type', content: 'website' },
				{ property: 'og:site_name', content: SEO.siteName },
				{ property: 'og:title', content: SEO.defaultTitle },
				{ property: 'og:description', content: SEO.defaultDescription },
				{ property: 'og:url', content: SEO.siteUrl },
				{ property: 'og:image', content: absoluteUrl(SEO.ogImage) },
				{ property: 'og:image:width', content: String(SEO.ogImageWidth) },
				{ property: 'og:image:height', content: String(SEO.ogImageHeight) },
				{ property: 'og:locale', content: SEO.locale },

				// Twitter Card
				{ name: 'twitter:card', content: SEO.twitterCard },
				{ name: 'twitter:site', content: SEO.twitterSite },
				{ name: 'twitter:title', content: SEO.defaultTitle },
				{ name: 'twitter:description', content: SEO.defaultDescription },
				{ name: 'twitter:image', content: absoluteUrl(SEO.ogImage) },

				// 移动端优化
				{ name: 'format-detection', content: 'telephone=no' },
				{ name: 'mobile-web-app-capable', content: 'yes' },
				{ name: 'apple-mobile-web-app-capable', content: 'yes' },
				{ name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
				{ name: 'apple-mobile-web-app-title', content: SEO.siteName },
				{ name: 'application-name', content: SEO.siteName },

				// 百度特殊配置
				{ name: 'baidu-site-verification', content: SEO.baiduVerification },
				{ name: 'mobile-agent', content: `format=html5;url=${SEO.siteUrl}` },

				// 其他搜索引擎验证
				{ name: 'google-site-verification', content: SEO.googleVerification },
				{ name: 'msvalidate.01', content: SEO.bingVerification },
				{ name: '360-site-verification', content: SEO.so360Verification },

				// 防止搜索引擎转码（重要：百度、360 等中国搜索引擎）
				{ 'http-equiv': 'Cache-Control', content: 'no-transform' },
				{ 'http-equiv': 'Cache-Control', content: 'no-siteapp' },

				// 版权信息
				{
					name: 'copyright',
					content: `Copyright © ${new Date().getFullYear()} ${SEO.siteName}`
				},

				// 主题颜色（显示在浏览器地址栏）
				{ name: 'theme-color', content: '#3b82f6' },
				{ name: 'msapplication-TileColor', content: '#3b82f6' }
			],
			link: [
				// Canonical URL（规范链接，避免重复内容问题）
				{ rel: 'canonical', href: SEO.siteUrl },

				// 网站图标
				{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
				{
					rel: 'apple-touch-icon',
					sizes: '180x180',
					href: '/apple-touch-icon.png'
				},

				// DNS 预解析（提升第三方资源加载速度）
				{ rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
				{ rel: 'dns-prefetch', href: 'https://hm.baidu.com' },

				// 预连接
				{ rel: 'preconnect', href: SEO.siteUrl },

				// Sitemap
				{
					rel: 'sitemap',
					type: 'application/xml',
					title: 'Sitemap',
					href: '/sitemap.xml'
				}
			],
			script: [
				// 结构化数据（JSON-LD）- WebSite
				{
					type: 'application/ld+json',
					children: JSON.stringify(jsonLdWebsite(SEO))
				},
				// 结构化数据（JSON-LD）- Organization
				{
					type: 'application/ld+json',
					children: JSON.stringify(jsonLdOrganization(SEO))
				}
			]
		}
	},
	plugins: ['~/plugins/analytics.client'],
	// —— 路由级规则（模板仅预渲染首页）——
	routeRules: {
		'/': { prerender: true },
		// 忽略 API 路径，避免被 Vue Router 处理
		'/dev-api/**': { ssr: false, index: false }
	},

	// —— 模块（保留基础依赖）——
	modules: [
		'@nuxtjs/i18n',
		'@pinia/nuxt',
		'pinia-plugin-persistedstate/nuxt',
		'@nuxt/devtools',
		['@nuxt/ui', { fonts: false }]
	],
	i18n: {
		strategy: 'no_prefix',
		defaultLocale: 'zh-CN',
		langDir: 'locales',
		locales: [
			{ code: 'zh-CN', name: '简体中文', file: 'zh-CN.ts' },
			{ code: 'en-US', name: 'English', file: 'en-US.ts' }
		],
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: 'in_job_locale',
			fallbackLocale: 'zh-CN',
			redirectOn: 'root'
		}
	},
	colorMode: {
		classSuffix: '', // 如果你想去掉默认的类后缀（如 dark 会变为 dark-mode）
		preference: 'light', // 默认根据系统的颜色模式，值为 'light', 'dark' 或 'system'
		fallback: 'light', // 如果浏览器不支持 color-mode，则默认为 light 模式
		storageKey: 'nuxt-color-mode', // 存储在本地存储中的 key 名
		watch: ['colorMode.preference'] // 监听 colorMode.preference 的变化
	},

	// —— 资源与样式 ——（注意不要让 body/html 首帧 opacity: 0）
	css: ['~/assets/css/style.css'],

	// 别名
	alias: { '@': path.resolve(__dirname, './app') },

	runtimeConfig: {
		public: {
			appVersion: process.env.npm_package_version,
			buildTime: new Date().toISOString(),
			apiBase: process.env.VITE_API_BASE_URL || '/dev-api',
			ossRegion: process.env.NUXT_PUBLIC_OSS_REGION || '',
			ossBucket: process.env.NUXT_PUBLIC_OSS_BUCKET || '',
			resumePreviewUrl:
				process.env.VITE_RESUME_PREVIEW_URL || 'https://lgdsunday.club/'
		}
	},

	nitro: {
		devProxy: {
			// '/dev-api/': {
			// 	target: 'https://test.api.lgdsunday.club',
			// 	changeOrigin: true,
			// 	rewrite: (p) => p.replace(/^\/dev-api/, '')
			// }
			'/dev-api/': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				rewrite: (p) => p.replace(/^\/dev-api/, '')
			}
		}
	},

	// —— Vite 构建优化（精简） ——
	vite: {
		plugins: [
			createSvgIconsPlugin({
				iconDirs: [path.resolve(process.cwd(), 'app/assets/icons')],
				symbolId: 'icon-[name]'
			})
		],
		esbuild: { drop: ['console', 'debugger'] },
		resolve: {
			alias: { '@': path.resolve(__dirname, './app') }
		},
		optimizeDeps: { include: ['vue', 'vue-router', 'pinia'] },
		build: {
			minify: 'esbuild',
			cssMinify: useLightningCSS ? 'lightningcss' : 'esbuild',
			target: 'esnext',
			modulePreload: { polyfill: false },
			sourcemap: false,
			assetsInlineLimit: 2048,
			cssCodeSplit: true,
			chunkSizeWarningLimit: 700
		},
		define: {
			__APP_VERSION__: JSON.stringify(process.env.npm_package_version),
			__BUILD_TIME__: JSON.stringify(new Date().toISOString())
		}
	}
} as any)
