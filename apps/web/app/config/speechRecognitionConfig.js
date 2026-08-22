/**
 * 语音识别优化器自定义配置
 * 
 * 在这个文件中可以添加项目特定的词汇和规则
 * 这些配置会被合并到默认的优化器中
 */

/**
 * 项目特定的技术词汇
 * 根据你的业务领域添加专业术语
 */
export const PROJECT_TECH_VOCABULARY = {
	// 示例：公司内部技术栈
	// '内部说法': '标准写法'
	
	// 云服务
	'阿里云': '阿里云',
	'腾讯云': '腾讯云',
	'AWS': 'AWS',
	'阿里巴巴云': '阿里云',
	
	// 中间件和工具
	'卡夫卡': 'Kafka',
	'兔子艾母扣': 'RabbitMQ',
	'艾拉斯提克撕扯吃': 'Elasticsearch',
	'艾拉斯提克': 'Elasticsearch',
	
	// CI/CD
	'詹肯斯': 'Jenkins',
	'居特拉布': 'GitLab',
	'居特艾': 'Gitee',
	
	// 测试框架
	'杰斯特': 'Jest',
	'摸卡': 'Mocha',
	'切艾': 'Chai',
	
	// 其他常用技术
	'网拍克斯': 'Nginx',
	'恩近克斯': 'Nginx',
	'阿帕奇': 'Apache',
	'推马': 'Tomcat',
	'推猫': 'Tomcat',
	
	// 前端相关
	'网拍克': 'Webpack',
	'围特': 'Vite',
	'罗尔阿普': 'Rollup',
	'巴贝尔': 'Babel',
	'伊斯林特': 'ESLint',
	'普瑞提艾': 'Prettier',
	
	// 移动端
	'瑞艾克特内踢屋': 'React Native',
	'夫拉特': 'Flutter',
	'优尼艾屁屁': 'uni-app',
	'微信小程序': '微信小程序',
	
	// 数据库相关
	'奥拉扣': 'Oracle',
	'SQL撕儿瓦': 'SQL Server',
	'撕扣欧莱特': 'SQLite'
}

/**
 * 项目特定的业务词汇
 */
export const PROJECT_BUSINESS_VOCABULARY = {
	// 示例：面试相关业务词汇
	'面试汪': '面试汪',
	'简历汪': '简历汪',
	'AI面试': 'AI面试',
	'智能面试': '智能面试',
	'模拟面试': '模拟面试',
	'面试训练': '面试训练',
	'面试报告': '面试报告',
	'面试评分': '面试评分',
	
	// 通用业务词汇
	'用户画像': '用户画像',
	'转化率': '转化率',
	'留存率': '留存率',
	'日活': 'DAU',
	'月活': 'MAU',
	'付费用户': '付费用户',
	'订单量': '订单量',
	'客单价': '客单价',
	'GMV': 'GMV',
	'ROI': 'ROI',
	'KPI': 'KPI',
	'OKR': 'OKR',
	'SLA': 'SLA',
	'QPS': 'QPS',
	'TPS': 'TPS'
}

/**
 * 行业特定词汇
 */
export const INDUSTRY_VOCABULARY = {
	// 金融行业
	finance: {
		'反洗钱': '反洗钱',
		'风控': '风控',
		'征信': '征信',
		'区块链': '区块链',
		'比特币': '比特币',
		'以太坊': '以太坊'
	},
	
	// 电商行业
	ecommerce: {
		'SKU': 'SKU',
		'SPU': 'SPU',
		'库存': '库存',
		'订单': '订单',
		'物流': '物流',
		'供应链': '供应链',
		'选品': '选品',
		'运营': '运营'
	},
	
	// 教育行业
	education: {
		'在线教育': '在线教育',
		'直播课': '直播课',
		'录播课': '录播课',
		'题库': '题库',
		'知识点': '知识点',
		'学习路径': '学习路径'
	},
	
	// 医疗行业
	healthcare: {
		'电子病历': '电子病历',
		'远程医疗': '远程医疗',
		'医学影像': '医学影像',
		'诊断': '诊断',
		'处方': '处方'
	}
}

/**
 * 自定义同音字纠错规则
 */
export const CUSTOM_HOMOPHONE_CORRECTIONS = {
	// 添加你发现的常见识别错误
	// '错误识别': '正确文本'
	
	// 示例
	'面试网': '面试汪',
	'面试王': '面试汪',
	'面试往': '面试汪',
	
	// 常见技术词错误
	'带吗': '代码',
	'倒入': '导入',
	'函素': '函数',
	'街口': '接口',
	'数剧库': '数据库'
}

/**
 * 自定义标点规则
 */
export const CUSTOM_PUNCTUATION_RULES = {
	// 需要问号的问句标志词
	questionMarkers: [
		'怎么样',
		'如何',
		'为何',
		'哪些',
		'多少',
		'几个',
		'什么时候',
		'在哪里'
	],
	
	// 句子结束标志词
	endMarkers: [
		'完毕',
		'结束了',
		'好了',
		'就这样',
		'差不多',
		'大概',
		'应该'
	],
	
	// 需要逗号的连接词
	commaMarkers: [
		'首先',
		'其次',
		'再次',
		'最后',
		'总之',
		'综上所述',
		'例如',
		'比如',
		'另外',
		'此外',
		'而且',
		'并且',
		'或者',
		'以及'
	]
}

/**
 * 优化器默认配置
 */
export const DEFAULT_OPTIMIZER_CONFIG = {
	// 上下文类型
	context: 'interview',
	
	// 职业类型
	profession: 'programmer',
	
	// 最大历史记录数
	maxHistoryLength: 10,
	
	// 是否启用智能标点
	enableSmartPunctuation: true,
	
	// 是否移除口语化词汇
	removeFillerWords: true,
	
	// 是否进行同音字纠错
	correctHomophones: true,
	
	// 是否替换技术词汇
	replaceTechTerms: true,
	
	// 是否启用上下文感知优化
	enableContextAware: true
}

/**
 * 根据职业获取推荐配置
 */
export function getOptimizerConfigByProfession(profession) {
	const configs = {
		programmer: {
			context: 'tech',
			profession: 'programmer',
			enableTechVocabulary: true,
			customVocabulary: {
				...PROJECT_TECH_VOCABULARY,
				...PROJECT_BUSINESS_VOCABULARY
			}
		},
		
		designer: {
			context: 'design',
			profession: 'designer',
			customVocabulary: {
				'切图': '切图',
				'标注': '标注',
				'组件库': '组件库',
				'设计系统': '设计系统',
				'原型': '原型',
				'线框图': '线框图',
				'高保真': '高保真',
				'低保真': '低保真',
				'交互稿': '交互稿',
				'视觉稿': '视觉稿'
			}
		},
		
		pm: {
			context: 'product',
			profession: 'pm',
			customVocabulary: {
				'PRD': 'PRD',
				'MRD': 'MRD',
				'用户故事': '用户故事',
				'敏捷': '敏捷',
				'迭代': '迭代',
				'需求池': '需求池',
				'优先级': '优先级',
				'里程碑': '里程碑',
				'路线图': '路线图',
				'MVP': 'MVP'
			}
		},
		
		general: {
			context: 'general',
			profession: 'general',
			customVocabulary: {
				...PROJECT_BUSINESS_VOCABULARY
			}
		}
	}
	
	return configs[profession] || configs.general
}

/**
 * 合并所有自定义词汇
 */
export function getAllCustomVocabulary(industry = null) {
	const base = {
		...PROJECT_TECH_VOCABULARY,
		...PROJECT_BUSINESS_VOCABULARY,
		...CUSTOM_HOMOPHONE_CORRECTIONS
	}
	
	// 如果指定了行业，添加行业词汇
	if (industry && INDUSTRY_VOCABULARY[industry]) {
		return {
			...base,
			...INDUSTRY_VOCABULARY[industry]
		}
	}
	
	return base
}

export default {
	PROJECT_TECH_VOCABULARY,
	PROJECT_BUSINESS_VOCABULARY,
	INDUSTRY_VOCABULARY,
	CUSTOM_HOMOPHONE_CORRECTIONS,
	CUSTOM_PUNCTUATION_RULES,
	DEFAULT_OPTIMIZER_CONFIG,
	getOptimizerConfigByProfession,
	getAllCustomVocabulary
}

