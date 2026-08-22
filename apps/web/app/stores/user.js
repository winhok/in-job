import { defineStore } from 'pinia'
import { navigateTo } from '#app'
import { MAX_RESUME_COUNT } from '@/constants'

export const useUserStore = defineStore('user', {
	state: () => ({
		/**
		 *  "user": {
            "_id": "691db92e532b04d29b89ebaf",
            "username": "Sunday账号",
            "phone": "",
            "roles": [
                "user"
            ],
            "isActive": false,
            "gender": "other",
            "isVerified": false,
            "isVip": false,
            "aiInterviewRemainingCount": 0,
            "aiInterviewRemainingMinutes": 0,
            "wwCoinBalance": 0,
            "resumeRemainingCount": 1,
            "specialRemainingCount": 1,
            "behaviorRemainingCount": 1,
            "openid": "test-openid-1235",
            "isWechatBound": true,
            "wechatBoundTime": "2025-11-19T12:33:50.066Z",
            "createdAt": "2025-11-19T12:33:50.085Z",
            "updatedAt": "2025-11-19T13:00:47.194Z",
            "__v": 0,
            "avatar": "http://ww-zhi-dao.oss-cn-beijing.aliyuncs.com/user-img/test-openid-1235/1763557230746.jpeg",
            "email": "1205507971@qq.com"
        },
		 */
		userInfo: {},
		isLogin: false,
		token: '',
		resumes: []
	}),
	getters: {
		// 是否可以添加更多简历
		canAddResume: (state) => state.resumes.length < MAX_RESUME_COUNT
	},
	actions: {
		// 登出
		logout() {
			this.isLogin = false
			this.token = ''
			this.userInfo = {}
			this.resumes = []
			// navigateTo('/login')
		},
		// 更新用户信息
		updateUserInfo(userInfo) {
			this.userInfo = { ...this.userInfo, ...userInfo }
		},
		// 更新旺旺币余额
		updateWalletBalance(balance) {
			this.wallet.balance = balance
		},
		// 添加充值记录
		addRechargeRecord(record) {
			this.wallet.rechargeRecords.unshift(record)
		},
		// 添加消费记录
		addConsumptionRecord(record) {
			this.wallet.consumptionRecords.unshift(record)
		},
		// 添加简历
		addResume(resume) {
			if (this.resumes.length < 5) {
				this.resumes.push(resume)
			}
		},
		// 删除简历
		removeResume(index) {
			this.resumes.splice(index, 1)
		},
		// 更新简历列表（用于拖拽排序）
		updateResumes(resumes) {
			this.resumes = resumes
		}
	},
	persist: true
})
