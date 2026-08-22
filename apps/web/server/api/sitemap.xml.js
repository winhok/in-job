/**
 * 动态 Sitemap 生成 API
 * 
 * 功能：
 * 1. 自动生成网站地图
 * 2. 支持多语言（如需要）
 * 3. 支持移动端标记
 * 4. 支持图片 sitemap
 * 5. 自动更新 lastmod
 * 
 * 访问地址：/api/sitemap.xml
 * 
 * 注意：
 * - 如果网站内容是动态的（如文章、产品等），应该从数据库读取
 * - 定期更新 sitemap 有利于 SEO
 */

export default defineEventHandler((event) => {
	const siteUrl = 'https://mianshiwangoffer.com'
	const currentDate = new Date().toISOString().split('T')[0]

	// 定义网站的所有页面
	// priority: 0.0-1.0，表示页面的重要程度
	// changefreq: always, hourly, daily, weekly, monthly, yearly, never
	const pages = [
		{
			loc: '/',
			lastmod: currentDate,
			changefreq: 'daily',
			priority: 1.0,
			mobile: true
		},
		{
			loc: '/interview',
			lastmod: currentDate,
			changefreq: 'weekly',
			priority: 0.9,
			mobile: true
		},
		{
			loc: '/interview/start',
			lastmod: currentDate,
			changefreq: 'weekly',
			priority: 0.85,
			mobile: true
		},
		{
			loc: '/history',
			lastmod: currentDate,
			changefreq: 'daily',
			priority: 0.8,
			mobile: true
		},
		{
			loc: '/profile',
			lastmod: currentDate,
			changefreq: 'weekly',
			priority: 0.7,
			mobile: true
		},
		{
			loc: '/faq',
			lastmod: currentDate,
			changefreq: 'monthly',
			priority: 0.6,
			mobile: true
		},
		{
			loc: '/contact',
			lastmod: currentDate,
			changefreq: 'monthly',
			priority: 0.6,
			mobile: true
		},
		{
			loc: '/agreement',
			lastmod: currentDate,
			changefreq: 'yearly',
			priority: 0.3,
			mobile: false
		},
		{
			loc: '/policy',
			lastmod: currentDate,
			changefreq: 'yearly',
			priority: 0.3,
			mobile: false
		},
		{
			loc: '/login',
			lastmod: currentDate,
			changefreq: 'monthly',
			priority: 0.5,
			mobile: true
		}
	]

	// 如果有动态内容（如博客文章、新闻等），可以在这里从数据库读取并添加
	// 例如：
	// const articles = await db.articles.findAll()
	// articles.forEach(article => {
	//   pages.push({
	//     loc: `/article/${article.slug}`,
	//     lastmod: article.updatedAt,
	//     changefreq: 'monthly',
	//     priority: 0.6,
	//     mobile: true
	//   })
	// })

	// 生成 XML
	const xml = generateSitemapXML(pages, siteUrl)

	// 设置响应头
	event.node.res.setHeader('Content-Type', 'application/xml; charset=utf-8')
	event.node.res.setHeader('Cache-Control', 'public, max-age=3600') // 缓存1小时

	return xml
})

/**
 * 生成 Sitemap XML
 */
function generateSitemapXML(pages, siteUrl) {
	const urls = pages
		.map((page) => {
			const url = `${siteUrl}${page.loc}`
			let xml = '    <url>\n'
			xml += `        <loc>${escapeXml(url)}</loc>\n`
			xml += `        <lastmod>${page.lastmod}</lastmod>\n`
			xml += `        <changefreq>${page.changefreq}</changefreq>\n`
			xml += `        <priority>${page.priority}</priority>\n`
			
			// 移动端标记（Google 移动优先索引）
			if (page.mobile) {
				xml += '        <mobile:mobile/>\n'
			}
			
			// 如果有图片，可以添加图片信息
			if (page.images && page.images.length > 0) {
				page.images.forEach((image) => {
					xml += '        <image:image>\n'
					xml += `            <image:loc>${escapeXml(image.url)}</image:loc>\n`
					if (image.title) {
						xml += `            <image:title>${escapeXml(image.title)}</image:title>\n`
					}
					if (image.caption) {
						xml += `            <image:caption>${escapeXml(image.caption)}</image:caption>\n`
					}
					xml += '        </image:image>\n'
				})
			}
			
			xml += '    </url>'
			return xml
		})
		.join('\n')

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${urls}

</urlset>`
}

/**
 * XML 转义
 */
function escapeXml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
}

