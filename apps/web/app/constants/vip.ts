// 兑换一次服务（服务包含简历押题 / 专项面试 / 综合面试）的成本
export const REDEEM_COST = 20

// 自定义充值
export const CUSTOM_RECHARGE_ID = 'custom'
// 服务标记
export const SERVICE_TAGS = {
	RESUME: 'resume',
	SPECIAL: 'special',
	BEHAVIOR: 'behavior'
}

// 服务亮点列表 - 三大核心服务类型
export const serviceHighlights = [
	{
		id: SERVICE_TAGS.RESUME,
		title: '面试押题',
		badge: '精准预测',
		description:
			'基于岗位 JD 和简历，AI 智能预测高频面试题，让你提前做好准备。',
		points: [
			'结合岗位 JD 智能生成押题清单',
			'附带高分参考答案与回答技巧',
			'覆盖技术、项目、行为等多维度'
		],
		icon: 'i-heroicons-document-text',
		highlight: '3-5 分钟快速生成，命中率 80%+'
	},
	{
		id: SERVICE_TAGS.SPECIAL,
		title: '专项面试',
		badge: '实战模拟',
		description: '针对技术面、业务面进行深度模拟，AI 面试官实时追问与反馈。',
		points: [
			'真实面试场景 1v1 模拟对话',
			'AI 即时追问与深度挖掘',
			'多轮问答评估技术深度'
		],
		icon: 'i-heroicons-bolt',
		highlight: '约 1 小时，支持语音/文字多模态'
	},
	{
		id: SERVICE_TAGS.BEHAVIOR,
		title: '行测 + HR 面试',
		badge: '综合评估',
		description: '覆盖行政能力测试 + HR 软技能面试，全方位提升面试综合素质。',
		points: [
			'行测题库与限时模拟测试',
			'HR 面试软技能评估',
			'沟通表达与情商评估反馈'
		],
		icon: 'i-heroicons-chat-bubble-left-right',
		highlight: '约 45 分钟，双重评估维度'
	}
]

// 充值套餐列表
// 需要和 后端套餐验证一致才有效。不从后端获取数据的原因为：尽量减少接口请求次数
export const rechargePlans = [
	{
		id: 'single',
		name: '单次包',
		description: '搞定 1 轮面试，低门槛应急',
		tagline: '搞定 1 轮面试，低门槛应急',
		price: 18.8,
		originalPrice: 20,
		saving: 1.2,
		coins: 18.8,
		badge: '',
		perks: [
			{ key: SERVICE_TAGS.RESUME, label: serviceHighlights[0].title, count: 0 },
			{
				key: SERVICE_TAGS.SPECIAL,
				label: serviceHighlights[1].title,
				count: 1
			},
			{
				key: SERVICE_TAGS.BEHAVIOR,
				label: serviceHighlights[2].title,
				count: 0
			}
		]
	},
	{
		id: 'pro',
		name: '突击包',
		description: '适合临时面试，快速补齐短板',
		tagline: '搞定 1 轮面试，低门槛应急',
		price: 28.8,
		originalPrice: 60,
		saving: 28.8,
		coins: 28.8,
		badge: '热销',
		perks: [
			{ key: SERVICE_TAGS.RESUME, label: serviceHighlights[0].title, count: 1 },
			{
				key: SERVICE_TAGS.SPECIAL,
				label: serviceHighlights[1].title,
				count: 1
			},
			{
				key: SERVICE_TAGS.BEHAVIOR,
				label: serviceHighlights[2].title,
				count: 1
			}
		]
	},
	{
		id: 'max',
		name: '冲刺包',
		description: '性价比之王，覆盖多轮面试',
		tagline: '3.8 折！入职性价比之王',
		price: 68.8,
		originalPrice: 180,
		saving: 111.2,
		coins: 68.8,
		perks: [
			{ key: SERVICE_TAGS.RESUME, label: serviceHighlights[0].title, count: 3 },
			{
				key: SERVICE_TAGS.SPECIAL,
				label: serviceHighlights[1].title,
				count: 3
			},
			{
				key: SERVICE_TAGS.BEHAVIOR,
				label: serviceHighlights[2].title,
				count: 3
			}
		]
	},
	{
		id: 'ultra',
		name: '上岸包',
		description: '高频练习，多岗位冲刺专用',
		tagline: '2.1 折！面试次数拉满',
		price: 128.8,
		originalPrice: 600,
		saving: 471.2,
		coins: 128.8,
		badge: '高性价比',
		perks: [
			{ key: SERVICE_TAGS.RESUME, label: serviceHighlights[0].title, count: 6 },
			{
				key: SERVICE_TAGS.SPECIAL,
				label: serviceHighlights[1].title,
				count: 16
			},
			{
				key: SERVICE_TAGS.BEHAVIOR,
				label: serviceHighlights[2].title,
				count: 8
			}
		]
	}
]

// 支付方式列表
export const paymentMethods = [
	{
		id: 'wechat',
		label: '微信支付',
		description: '推荐，秒级到账',
		icon: 'wechat'
	},
	{
		id: 'alipay',
		label: '支付宝',
		description: '支持花呗分期',
		icon: 'alipay'
	}
]

// 兑换服务列表
export const redeemServices = [
	{ type: SERVICE_TAGS.RESUME, label: serviceHighlights[0].title },
	{ type: SERVICE_TAGS.SPECIAL, label: serviceHighlights[1].title },
	{ type: SERVICE_TAGS.BEHAVIOR, label: serviceHighlights[2].title }
]
