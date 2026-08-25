const zh = [
	[
		'general',
		'什么是面试汪？',
		'面试汪是一套 AI 面试准备工具，覆盖岗位押题、模拟面试和结构化评估。系统结合岗位描述与简历生成问题，通过多轮追问帮助你练习，并给出可执行的改进建议。'
	],
	[
		'general',
		'支持哪些职业方向？',
		'岗位库覆盖技术、数据、产品、设计、运营、市场、销售、职能、医疗、教育、学术与公共部门等方向。也可以直接输入自定义岗位和完整 JD。'
	],
	[
		'usage',
		'如何开始使用？',
		'登录后先选择目标岗位并导入简历，再选择押题、专项模拟或行测加 HR 服务。完成后可在服务记录中查看问题、答案和评估报告。'
	],
	[
		'usage',
		'如何导入简历？支持哪些格式？',
		'可以选择已有简历、粘贴纯文本，或上传 PDF、DOC、DOCX 文件。系统会解析简历内容并用于生成针对性问题。'
	],
	[
		'features',
		'评估报告包含哪些内容？',
		'报告包含岗位匹配度、能力雷达、已具备与缺失技能、知识缺口、学习优先级和面试准备建议。模拟面试报告还会结合实际问答评估表达、逻辑和专业能力。'
	],
	[
		'features',
		'支持语音面试吗？',
		'支持文字和浏览器语音输入。语音识别结果会显示在输入框中，发送前可以核对和修改。当前核心评估依据是最终提交的文本答案。'
	],
	[
		'features',
		'可以自定义面试场景吗？',
		'可以设置公司、岗位、薪资范围、详细 JD 和简历。AI 会根据这些资料调整问题方向、难度和追问重点。'
	],
	[
		'pricing',
		'面试汪如何计费？',
		'各项服务使用对应次数，也可以使用旺旺币兑换。具体套餐、价格、剩余次数和消费记录以个人中心展示为准。'
	],
	[
		'pricing',
		'支持退款吗？',
		'数字服务的退款与补偿以服务协议、购买页面和适用法律为准。发生异常时系统会按业务规则返还未成功消费的服务次数。'
	],
	[
		'security',
		'如何保护个人信息？',
		'系统采用传输保护、访问控制、最小权限和日志脱敏等措施。简历、面试和账户数据只在提供服务所需的范围内处理。'
	],
	[
		'security',
		'录音会如何使用？',
		'浏览器语音输入用于把你的回答转换为文本。除非页面明确说明并获得授权，平台不会把录音用于其他目的。你也可以始终选择纯文本模式。'
	],
	[
		'usage',
		'报告多久生成？',
		'押题结果通常需要数分钟。模拟面试结束后会在后台生成报告；失败任务会自动重试，也可以在报告页手动重试。实际耗时受内容长度与模型服务状态影响。'
	]
]

const en = [
	[
		'general',
		'What is InterviewPup?',
		'InterviewPup is an AI interview-preparation suite covering targeted question generation, realistic mock interviews, and structured assessment. It uses your job description and résumé to tailor questions and practical recommendations.'
	],
	[
		'general',
		'Which career paths are supported?',
		'The role catalog covers technology, data, product, design, operations, marketing, sales, corporate functions, healthcare, education, academia, and the public sector. You can also enter a custom role and job description.'
	],
	[
		'usage',
		'How do I get started?',
		'Sign in, choose a target role, add a résumé, and select Targeted Questions, a Role-specific Mock, or Aptitude + HR practice. Results remain available in Service History.'
	],
	[
		'usage',
		'How can I import a résumé?',
		'Choose an existing résumé, paste plain text, or upload a PDF, DOC, or DOCX file. The parsed content is used to tailor questions and assessments.'
	],
	[
		'features',
		'What is included in an assessment report?',
		'Reports include role fit, competency radar data, demonstrated and missing skills, knowledge gaps, learning priorities, and preparation tips. Mock-interview reports also assess communication, logic, and professional depth from your answers.'
	],
	[
		'features',
		'Is voice input supported?',
		'Yes. You can answer with text or browser speech recognition. The recognized text appears in the input field so you can review and edit it before sending.'
	],
	[
		'features',
		'Can I customize the interview scenario?',
		'Yes. Set the company, role, salary range, full job description, and résumé. AI adapts question topics, difficulty, and follow-up depth to those materials.'
	],
	[
		'pricing',
		'How does pricing work?',
		'Each service uses its corresponding session balance, and credits can be redeemed for services. Current plans, prices, remaining sessions, and transactions are shown in Profile.'
	],
	[
		'pricing',
		'Are refunds supported?',
		'Refunds and compensation for digital services follow the Terms of Service, purchase-page terms, and applicable law. Failed service consumption is returned automatically according to the business rules.'
	],
	[
		'security',
		'How is personal information protected?',
		'The service uses transport protection, access controls, least privilege, and redacted logs. Résumé, interview, and account data are processed only as needed to provide the service.'
	],
	[
		'security',
		'How is voice data used?',
		'Browser speech input converts your answer to text. Unless a page explicitly explains otherwise and obtains permission, recordings are not used for another purpose. Text-only mode is always available.'
	],
	[
		'usage',
		'How long does report generation take?',
		'Targeted questions usually take several minutes. Mock reports are generated in the background after an interview; failed jobs retry automatically and can also be retried manually. Timing depends on content length and model availability.'
	]
]

export const getFaqContent = (locale) =>
	(locale === 'en-US' ? en : zh).map(([category, question, answer]) => ({
		label: question,
		content: answer,
		category
	}))
