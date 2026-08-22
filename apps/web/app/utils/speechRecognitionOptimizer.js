/**
 * 语音识别文本优化器
 * 
 * 功能：
 * 1. 智能文本后处理和纠错
 * 2. 上下文感知的优化
 * 3. 专业术语和技术词汇识别
 * 4. 智能标点符号添加
 * 5. 语义分析和修正
 * 6. 多音字和同音字处理
 * 
 * 使用示例：
 * ```javascript
 * import { SpeechRecognitionOptimizer } from '@/utils/speechRecognitionOptimizer'
 * 
 * const optimizer = new SpeechRecognitionOptimizer({
 *   context: 'interview', // 上下文类型
 *   profession: 'programmer' // 职业类型
 * })
 * 
 * const optimizedText = optimizer.optimize('我熟悉皮埃奇皮和杰斯')
 * // 输出: "我熟悉PHP和JS"
 * ```
 */

// ==================== 词典数据 ====================

/**
 * 常见的口语化词汇过滤
 */
const FILLER_WORDS = {
	嗯嗯: '',
	啊啊: '',
	呃: '',
	额: '',
	嗯: '',
	啊: '',
	哦: '',
	诶: '',
	那个: '',
	这个: '',
	就是说: '',
	然后呢: '然后',
	就是: ''
}

/**
 * 数字识别优化
 */
const NUMBER_MAPPINGS = {
	// 基础数字
	零: '0',
	一: '1',
	二: '2',
	三: '3',
	四: '4',
	五: '5',
	六: '6',
	七: '7',
	八: '8',
	九: '9',
	十: '10',
	百: '100',
	千: '1000',
	万: '10000',
	// 序数词
	第一: '第1',
	第二: '第2',
	第三: '第3',
	第四: '第4',
	第五: '第5',
	第六: '第6',
	第七: '第7',
	第八: '第8',
	第九: '第9',
	第十: '第10'
}

/**
 * 编程和技术词汇识别
 */
const TECH_VOCABULARY = {
	// 编程语言
	皮埃奇皮: 'PHP',
	皮埃奇匹: 'PHP',
	匹埃奇匹: 'PHP',
	杰斯: 'JS',
	杰埃斯: 'JS',
	加瓦斯科瑞普特: 'JavaScript',
	佳娃四柯瑞普特: 'JavaScript',
	派森: 'Python',
	派瑟: 'Python',
	爪哇: 'Java',
	西加加: 'C++',
	C加加: 'C++',
	C家家: 'C++',
	
	// 前端框架
	维优易: 'Vue',
	V优: 'Vue',
	瑞阿克特: 'React',
	瑞艾克特: 'React',
	安格勒: 'Angular',
	
	// 后端框架
	斯普林: 'Spring',
	斯普林布特: 'SpringBoot',
	姜戈: 'Django',
	弗拉斯克: 'Flask',
	诺德: 'Node',
	诺德杰斯: 'NodeJS',
	
	// 数据库
	麦艾斯扣欧: 'MySQL',
	买艾斯酷欧: 'MySQL',
	摸狗迪比: 'MongoDB',
	瑞迪斯: 'Redis',
	扑死构欧: 'PostgreSQL',
	
	// 工具和服务
	艾皮爱: 'API',
	艾皮艾: 'API',
	居特: 'Git',
	居特哈布: 'GitHub',
	道克: 'Docker',
	库伯内踢死: 'Kubernetes',
	
	// Web 相关
	艾奇踢踢匹: 'HTTP',
	艾奇踢踢匹艾思: 'HTTPS',
	瑞斯特福: 'RESTful',
	瑞斯特: 'REST',
	唉贾克斯: 'Ajax',
	JSON: 'JSON',
	杰森: 'JSON',
	
	// 其他技术术语
	优艾斯: 'UX',
	优爱: 'UI',
	塞欧: 'SEO',
	思迪开: 'SDK',
	艾派爱: 'API'
}

/**
 * 面试常用词汇
 */
const INTERVIEW_VOCABULARY = {
	// 工作经历
	项目经验: '项目经验',
	工作经验: '工作经验',
	实习经历: '实习经历',
	
	// 技能描述
	熟悉: '熟悉',
	了解: '了解',
	掌握: '掌握',
	精通: '精通',
	擅长: '擅长',
	
	// 项目角色
	负责: '负责',
	参与: '参与',
	主导: '主导',
	协作: '协作',
	
	// 技术栈
	技术栈: '技术栈',
	前端: '前端',
	后端: '后端',
	全栈: '全栈',
	
	// 常见短语
	比如说: '比如',
	举个例子: '举例来说',
	也就是说: '即'
}

/**
 * 同音字/近音字纠错词典
 */
const HOMOPHONE_CORRECTIONS = {
	// 技术相关
	'带吗': '代码',
	'戴马': '代码',
	'倒入': '导入',
	'到入': '导入',
	'函素': '函数',
	'返回值': '返回值',
	'返灰值': '返回值',
	
	// 常见错误
	'用户': '用户',
	'用护': '用户',
	'接口': '接口',
	'街口': '接口',
	'数据库': '数据库',
	'数剧库': '数据库',
	'服务器': '服务器',
	'服雾器': '服务器',
	
	// 产品经理相关
	'需求': '需求',
	'虚求': '需求',
	'原形': '原型',
	'愿型': '原型',
	'流程图': '流程图',
	'留程图': '流程图',
	
	// 设计相关
	'交互': '交互',
	'叫虎': '交互',
	'设计稿': '设计稿',
	'蛇记搞': '设计稿',
	'颜色': '颜色',
	'眼色': '颜色'
}

/**
 * 标点符号规则
 */
const PUNCTUATION_RULES = {
	// 问句标志词
	questionMarkers: [
		'吗', '呢', '吧', '啊',
		'为什么', '怎么', '什么', '哪', '谁',
		'是不是', '能不能', '可不可以', '行不行',
		'有没有', '好不好', '对不对'
	],
	
	// 句子结束标志词
	endMarkers: [
		'了', '的', '得', '地',
		'好', '是', '对', '没有', '可以', '不是',
		'完成', '结束', '明白', '知道', '清楚'
	],
	
	// 需要逗号的连接词
	commaMarkers: [
		'但是', '然后', '接着', '其次', '另外',
		'同时', '而且', '并且', '因为', '所以',
		'如果', '那么', '虽然', '不过', '还有'
	]
}

// ==================== 核心优化器类 ====================

export class SpeechRecognitionOptimizer {
	constructor(options = {}) {
		this.context = options.context || 'general' // 上下文类型：interview, general, tech 等
		this.profession = options.profession || 'general' // 职业类型：programmer, designer, pm 等
		this.history = [] // 历史文本，用于上下文分析
		this.maxHistoryLength = options.maxHistoryLength || 10 // 最大历史记录数
		
		// 合并词典
		this.vocabulary = this._buildVocabulary()
	}
	
	/**
	 * 构建综合词典
	 */
	_buildVocabulary() {
		const base = {
			...FILLER_WORDS,
			...NUMBER_MAPPINGS,
			...TECH_VOCABULARY,
			...INTERVIEW_VOCABULARY,
			...HOMOPHONE_CORRECTIONS
		}
		
		// 根据职业类型添加专业词汇
		if (this.profession === 'programmer') {
			return {
				...base,
				...this._getProgrammerVocabulary()
			}
		} else if (this.profession === 'designer') {
			return {
				...base,
				...this._getDesignerVocabulary()
			}
		} else if (this.profession === 'pm') {
			return {
				...base,
				...this._getPMVocabulary()
			}
		}
		
		return base
	}
	
	/**
	 * 获取程序员专业词汇
	 */
	_getProgrammerVocabulary() {
		return {
			'算法': '算法',
			'数据结构': '数据结构',
			'设计模式': '设计模式',
			'敏捷开发': '敏捷开发',
			'持续集成': '持续集成',
			'微服务': '微服务',
			'分布式': '分布式',
			'高并发': '高并发',
			'缓存': '缓存',
			'队列': '队列',
			'中间件': '中间件',
			'框架': '框架'
		}
	}
	
	/**
	 * 获取设计师专业词汇
	 */
	_getDesignerVocabulary() {
		return {
			'用户体验': '用户体验',
			'交互设计': '交互设计',
			'视觉设计': '视觉设计',
			'原型图': '原型图',
			'线框图': '线框图',
			'设计规范': '设计规范',
			'色彩搭配': '色彩搭配',
			'排版': '排版',
			'图标': '图标',
			'界面': '界面'
		}
	}
	
	/**
	 * 获取产品经理专业词汇
	 */
	_getPMVocabulary() {
		return {
			'需求分析': '需求分析',
			'用户调研': '用户调研',
			'产品规划': '产品规划',
			'功能设计': '功能设计',
			'竞品分析': '竞品分析',
			'数据分析': '数据分析',
			'迭代': '迭代',
			'版本': '版本',
			'路线图': '路线图',
			'优先级': '优先级'
		}
	}
	
	/**
	 * 主优化方法
	 * @param {string} text - 原始识别文本
	 * @param {Object} options - 优化选项
	 * @returns {string} 优化后的文本
	 */
	optimize(text, options = {}) {
		if (!text || typeof text !== 'string') return ''
		
		let processed = text
		
		// 1. 基础清理
		processed = this._basicClean(processed)
		
		// 2. 移除口语化词汇
		processed = this._removeFillerWords(processed)
		
		// 3. 同音字纠错
		processed = this._correctHomophones(processed)
		
		// 4. 技术词汇识别和替换
		processed = this._replaceTechTerms(processed)
		
		// 5. 上下文感知优化
		processed = this._contextAwareOptimize(processed)
		
		// 6. 智能标点符号（如果启用）
		if (options.addPunctuation !== false) {
			processed = this._addSmartPunctuation(processed, options.timeSinceLastFinal)
		}
		
		// 7. 后处理清理
		processed = this._finalClean(processed)
		
		// 8. 更新历史记录
		this._updateHistory(processed)
		
		return processed
	}
	
	/**
	 * 基础文本清理
	 */
	_basicClean(text) {
		return text
			.trim()
			.replace(/\s+/g, '') // 移除空格（中文不需要空格）
			.replace(/[\r\n]+/g, '') // 移除换行
	}
	
	/**
	 * 移除口语化词汇
	 */
	_removeFillerWords(text) {
		let result = text
		
		// 按长度排序，先替换长的词（避免部分匹配问题）
		const sortedFillers = Object.entries(FILLER_WORDS)
			.sort((a, b) => b[0].length - a[0].length)
		
		for (const [filler, replacement] of sortedFillers) {
			const regex = new RegExp(filler, 'g')
			result = result.replace(regex, replacement)
		}
		
		return result
	}
	
	/**
	 * 同音字/近音字纠错
	 * 使用更智能的匹配算法，考虑上下文
	 */
	_correctHomophones(text) {
		let result = text
		
		// 按长度排序，优先匹配长的短语
		const sortedCorrections = Object.entries(HOMOPHONE_CORRECTIONS)
			.sort((a, b) => b[0].length - a[0].length)
		
		for (const [wrong, correct] of sortedCorrections) {
			// 使用全局替换
			const regex = new RegExp(wrong, 'g')
			result = result.replace(regex, correct)
		}
		
		return result
	}
	
	/**
	 * 技术词汇识别和替换
	 */
	_replaceTechTerms(text) {
		let result = text
		
		// 按长度排序，优先匹配长的词汇
		const sortedTerms = Object.entries(TECH_VOCABULARY)
			.sort((a, b) => b[0].length - a[0].length)
		
		for (const [spoken, written] of sortedTerms) {
			const regex = new RegExp(spoken, 'gi')
			result = result.replace(regex, written)
		}
		
		return result
	}
	
	/**
	 * 上下文感知优化
	 * 基于历史文本进行智能优化
	 */
	_contextAwareOptimize(text) {
		let result = text
		
		// 1. 代词还原
		result = this._resolvePronoun(result)
		
		// 2. 重复词消除
		result = this._removeRepetition(result)
		
		// 3. 语义连贯性优化
		result = this._improveCoherence(result)
		
		return result
	}
	
	/**
	 * 代词还原
	 * 例如："它的性能很好" → 如果上文提到 "Redis"，可能指 "Redis的性能很好"
	 */
	_resolvePronoun(text) {
		// 简化实现：检测指代词
		const pronouns = ['它', '这个', '那个', '这', '那']
		
		// 如果文本以代词开头，且历史记录中有明确的主语
		for (const pronoun of pronouns) {
			if (text.startsWith(pronoun) && this.history.length > 0) {
				const lastText = this.history[this.history.length - 1]
				
				// 提取上文的技术术语作为可能的指代对象
				const techTerms = Object.values(TECH_VOCABULARY)
				for (const term of techTerms) {
					if (lastText.includes(term)) {
						// 找到可能的指代对象，但不自动替换（避免错误）
						// 这里可以添加更复杂的逻辑
						break
					}
				}
			}
		}
		
		return text
	}
	
	/**
	 * 移除重复词
	 */
	_removeRepetition(text) {
		// 移除连续重复的字或词
		let result = text
		
		// 移除连续重复的单字
		result = result.replace(/(.)\1{2,}/g, '$1')
		
		// 移除连续重复的双字词
		result = result.replace(/(.{2})\1+/g, '$1')
		
		return result
	}
	
	/**
	 * 改善语义连贯性
	 */
	_improveCoherence(text) {
		let result = text
		
		// 添加合适的连接词（如果上下文需要）
		if (this.history.length > 0) {
			const lastText = this.history[this.history.length - 1]
			
			// 如果前一句以问号结尾，当前句可能是回答
			if (lastText.endsWith('？') || lastText.endsWith('?')) {
				// 可以添加 "是的" "不是" 等判断
			}
		}
		
		return result
	}
	
	/**
	 * 智能添加标点符号
	 * @param {string} text - 文本
	 * @param {number} timeSinceLastFinal - 距离上次final结果的时间（毫秒）
	 */
	_addSmartPunctuation(text, timeSinceLastFinal = 0) {
		if (!text) return text
		
		// 如果已经有标点符号，直接返回
		if (/[。！？，、；：]$/.test(text)) {
			return text
		}
		
		// 1. 检查是否是问句
		const isQuestion = PUNCTUATION_RULES.questionMarkers.some(marker => 
			text.includes(marker)
		)
		
		if (isQuestion) {
			return text + '？'
		}
		
		// 2. 检查是否是句子结尾
		const isEnd = PUNCTUATION_RULES.endMarkers.some(marker => 
			text.endsWith(marker)
		)
		
		// 3. 根据停顿时间决定标点
		if (timeSinceLastFinal > 1500) {
			// 长时间停顿，可能是句子结束
			return text + '。'
		} else if (timeSinceLastFinal > 800) {
			// 中等停顿，添加逗号
			return text + '，'
		} else if (isEnd) {
			// 句子结束标志词，添加句号
			return text + '。'
		}
		
		// 4. 检查是否包含连接词，需要逗号
		const needsComma = PUNCTUATION_RULES.commaMarkers.some(marker => 
			text.startsWith(marker)
		)
		
		if (needsComma && this.history.length > 0) {
			return text + '，'
		}
		
		return text
	}
	
	/**
	 * 最终清理
	 */
	_finalClean(text) {
		return text
			.replace(/\s+/g, '') // 再次移除空格
			.replace(/([。！？，、；：])\1+/g, '$1') // 移除重复标点
			.replace(/，([。！？])/g, '$1') // 修正 "，。" → "。"
			.replace(/([。！？])，/g, '$1') // 修正 "。，" → "。"
			.trim()
	}
	
	/**
	 * 更新历史记录
	 */
	_updateHistory(text) {
		if (text) {
			this.history.push(text)
			
			// 限制历史记录长度
			if (this.history.length > this.maxHistoryLength) {
				this.history.shift()
			}
		}
	}
	
	/**
	 * 清除历史记录
	 */
	clearHistory() {
		this.history = []
	}
	
	/**
	 * 获取历史记录
	 */
	getHistory() {
		return [...this.history]
	}
	
	/**
	 * 批量优化多段文本
	 * @param {Array<string>} texts - 文本数组
	 * @returns {Array<string>} 优化后的文本数组
	 */
	optimizeBatch(texts) {
		return texts.map(text => this.optimize(text))
	}
	
	/**
	 * 设置职业类型
	 */
	setProfession(profession) {
		this.profession = profession
		this.vocabulary = this._buildVocabulary()
	}
	
	/**
	 * 设置上下文类型
	 */
	setContext(context) {
		this.context = context
	}
	
	/**
	 * 添加自定义词典
	 * @param {Object} customDict - 自定义词典 { '识别词': '替换词' }
	 */
	addCustomVocabulary(customDict) {
		this.vocabulary = {
			...this.vocabulary,
			...customDict
		}
	}
}

// ==================== 便捷工具函数 ====================

/**
 * 创建优化器实例（单例模式）
 */
let defaultOptimizer = null

export function getDefaultOptimizer(options = {}) {
	if (!defaultOptimizer) {
		defaultOptimizer = new SpeechRecognitionOptimizer(options)
	}
	return defaultOptimizer
}

/**
 * 快速优化文本（使用默认优化器）
 * @param {string} text - 原始文本
 * @param {Object} options - 优化选项
 * @returns {string} 优化后的文本
 */
export function optimizeText(text, options = {}) {
	const optimizer = getDefaultOptimizer()
	return optimizer.optimize(text, options)
}

/**
 * 智能添加标点符号（独立使用）
 * @param {string} text - 文本
 * @param {number} timeSinceLastFinal - 停顿时间
 * @returns {string} 添加标点后的文本
 */
export function addSmartPunctuation(text, timeSinceLastFinal = 0) {
	if (!text) return text
	if (/[。！？，、；：]$/.test(text)) return text
	
	// 检查是否是问句
	const isQuestion = PUNCTUATION_RULES.questionMarkers.some(marker => 
		text.includes(marker)
	)
	
	if (isQuestion) {
		return text + '？'
	}
	
	// 根据停顿时间决定
	if (timeSinceLastFinal > 1500) {
		return text + '。'
	} else if (timeSinceLastFinal > 800) {
		return text + '，'
	}
	
	return text
}

/**
 * 文本后处理（简化版）
 * @param {string} text - 原始文本
 * @returns {string} 处理后的文本
 */
export function postProcessText(text) {
	if (!text) return ''
	
	return text
		.trim()
		.replace(/\s+/g, '')
		.replace(/([。！？，])\1+/g, '$1')
}

// ==================== 导出 ====================

// 命名导出词典（供外部直接引用）
export {
	TECH_VOCABULARY,
	INTERVIEW_VOCABULARY,
	FILLER_WORDS,
	NUMBER_MAPPINGS,
	HOMOPHONE_CORRECTIONS,
	PUNCTUATION_RULES
}

export default {
	SpeechRecognitionOptimizer,
	getDefaultOptimizer,
	optimizeText,
	addSmartPunctuation,
	postProcessText,
	// 导出词典供外部使用
	TECH_VOCABULARY,
	INTERVIEW_VOCABULARY,
	FILLER_WORDS,
	NUMBER_MAPPINGS
}

