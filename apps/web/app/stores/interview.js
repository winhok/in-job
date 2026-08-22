import { defineStore } from 'pinia'
import { isEmpty } from '@/utils'

export const useInterviewStore = defineStore('interview', {
	state: () => ({
		// 当前步骤：1-选择岗位和简历, 2-面试中, 3-查看报告
		currentStep: 1,
		// 侧边栏是否打开
		isSidebarOpen: true,
		// 选中的服务类型：special, resume, behavior
		selectedService: null,

		// 第一步：岗位和简历
		/*

category: "tech"
description: "负责 Web / 跨端界面开发、组件工程和性能优化"
positionId: "tech-frontend-mid"
level: "初级-高级"
positionName: "前端开发工程师"
company: 字节跳动,
minSalary: 25,
maxSalary: 35,
jd: '' 
		*/
		selectedPosition: {},
		resumeId: null, // 简历 ID（当 type='resume' 时）
		resumeText: '', // 简历文本（当 type='text' 时）

		// 第二步：面试过程
		// idle：未进入面试状态，不需要关心
		// starting：面试已经开始，但是费用暂未扣除，处于倒计时阶段
		// in_progress：面试已经开始，费用已经扣除。此时用户进入服务页面，将直接跳转到面试页面
		// suspend：用户点击了暂停面试的按钮，但并不意味着面试结束
		// ended：面试已经结束
		interviewStatus: 'idle',

		/*
		  START = 'start', // 面试开始
  QUESTION = 'question', // 面试官提问
  WAITING = 'waiting', // 等待候选人回答
  THINKING = 'thinking', // AI正在思考
  END = 'end', // 面试结束
  ERROR = 'error', // 发生错误 */
		// 面试中进度类型
		interviewEventType: 'start',
		// 已面试时长（字符串，格式：HH:mm:ss）
		interviewDuration: '00:00:00',
		/*
		所有的对话集合，包括了：面试官（interviewer） + 候选人（user）
	 {"role": "interviewer","type":"start","sessionId":"f61f5e8c-8b2b-4793-b015-711dfa0ab7d2","interviewerName":"孙娜","content":"你好，","questionNumber":0,"totalQuestions":12,"elapsedMinutes":0}
*/
		messages: [],
		// 记录标准答案
		referenceAnswer: [],
		// 面试官名称：
		interviewerName: '正在分配面试官...',

		// 持久化生效的 面试链接 ID
		resultId: null,
		// 面试会话 ID。注意：该 id 保存在内存中，服务器是会清除的
		sessionId: null,

		// 第三步：报告
		report: null, // 结构化报告数据
		plan7Days: null, // 7天强化计划
		reportGenerated: false // 是否已生成报告
	}),

	getters: {
		// 返回简历选择的类型: 'resume' | 'text'
		resumeType: (state) => {
			if (state.resumeId) return 'resume'
			if (state.resumeText) return 'text'
			return ''
		},
		// 是否可以进入下一步
		canGoToNextStep: (state) => {
			if (state.currentStep === 1) {
				return (
					!isEmpty(state.selectedPosition) &&
					(state.resumeId || state.resumeText)
				)
			}
			if (state.currentStep === 2) {
				return state.interviewStatus === 'ended'
			}
			return false
		},

		// 是否正在进行面试
		isInterviewing: (state) => {
			return (
				state.interviewStatus === 'in_progress' ||
				state.interviewStatus === 'starting'
			)
		}
	},

	actions: {
		// 选择岗位
		setSelectedPosition(position) {
			this.selectedPosition = position
		},

		// 选择服务类型
		setSelectedService(service) {
			this.selectedService = service
		},

		// 添加消息
		addMessage(role, content, metadata = {}) {
			this.messages.push({
				role,
				content,
				timestamp: new Date(),
				...metadata
			})
		},

		// 更新最后一条消息（用于流式输出）- 优化版
		updateLastMessage(content, role = 'interviewer') {
			const lastMessage = this.messages[this.messages.length - 1]

			// 如果最后一条消息的角色匹配，则更新内容
			if (lastMessage && lastMessage.role === role) {
				lastMessage.content = content
			} else {
				// 否则创建新消息
				this.addMessage(role, content)
			}
		},

		// 更新标准答案（注：只有面试官的提问才有标准答案）
		updateReferenceAnswer(content, index) {
			this.referenceAnswer[index] = content
		},

		// 开始流式消息（创建占位消息）
		startStreamingMessage(role = 'interviewer') {
			// 检查最后一条消息是否已经是该角色的空消息
			const lastMessage = this.messages[this.messages.length - 1]
			if (
				!lastMessage ||
				lastMessage.role !== role ||
				lastMessage.content !== ''
			) {
				this.addMessage(role, '')
			}
		},

		// 设置报告
		setReport(report, plan7Days) {
			this.report = report
			this.plan7Days = plan7Days
			this.reportGenerated = true
			this.currentStep = 3
		},

		// 重置面试数据
		resetInterview() {
			this.interviewId = null
			this.interviewStatus = 'idle'
			this.interviewDuration = '00:00:00'
			this.messages = []
			this.interviewerName = '正在分配面试官...'
			this.interviewEventType = 'start'
			this.sessionId = null
			this.report = null
			this.plan7Days = null
			this.reportGenerated = false
			this.selectedService = null
		},

		// 完全重置（重新开始）
		reset() {
			this.currentStep = 1
			this.selectedPosition = {}
			this.resumeType = null
			this.resumeId = null
			this.resumeText = ''
			this.resetInterview()
		}
	},

	persist: true
})
