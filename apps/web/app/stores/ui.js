import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
	state: () => ({
		authPromptOpen: false,
		authRedirectPath: '/'
	}),
	actions: {
		showAuthPrompt(path = '/') {
			this.authPromptOpen = true
			this.authRedirectPath = path || '/'
		},
		hideAuthPrompt() {
			this.authPromptOpen = false
			this.authRedirectPath = '/'
		}
	}
})
