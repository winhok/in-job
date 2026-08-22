import { computed, createApp, defineComponent, h, onMounted, ref } from 'vue'
import { UModal, UButton, UIcon } from '#components'

const buildFallbackButtons = (options = {}) => {
	if (Array.isArray(options.buttons)) {
		return options.buttons
	}

	return []
}

const createContainer = () => {
	const container = document.createElement('div')
	document.body.appendChild(container)
	return container
}

const destroyContainer = (container, app) => {
	if (!container) return
	// 延迟 200 ms ，保证动画
	setTimeout(() => {
		if (app) {
			app.unmount()
		}
		container.remove()
	}, 200)
}

const ModalHost = defineComponent({
	name: 'ProgrammaticModalHost',
	props: {
		options: {
			type: Object,
			required: true
		},
		onResolve: {
			type: Function,
			required: true
		},
		onReady: {
			type: Function,
			default: null
		}
	},
	setup(props) {
		const open = ref(true)
		const loadingIndex = ref(null)
		const closed = ref(false)

		const modalUi = computed(() => ({
			content: 'max-w-[560px]',
			...(props.options.ui || {})
		}))

		const buttons = computed(() => buildFallbackButtons(props.options))

		const close = (reason = 'dismiss') => {
			if (closed.value) return
			closed.value = true
			open.value = false
			props.onResolve(reason)
		}

		const handleUpdateOpen = (value) => {
			if (!value) {
				close('dismiss')
			}
		}

		const handleButtonClick = async (button, index) => {
			if (!button || button.disabled) return
			if (loadingIndex.value !== null && loadingIndex.value !== index) return

			let shouldClose = button.closeOnClick ?? true

			try {
				const result = button.onClick ? button.onClick() : undefined
				if (result && typeof result.then === 'function') {
					loadingIndex.value = index
					const resolved = await result
					if (resolved === false) {
						shouldClose = false
					}
				} else if (result === false) {
					shouldClose = false
				}
			} catch (error) {
				console.error('Modal button execution failed:', error)
				shouldClose = false
			} finally {
				if (loadingIndex.value === index) {
					loadingIndex.value = null
				}
			}

			if (shouldClose) {
				close(button.reason || 'action')
			}
		}

		onMounted(() => {
			props.onReady?.({
				close: (reason = 'programmatic') => close(reason)
			})
		})

		const bodyContainer = () => {
			// 在没有内容和 buttons 的时候，只显示标题和 description，不显示 footer 区域和分割线
			if (
				!props.options.contentComponent &&
				!props.options.content &&
				!props.options.buttons
			) {
				return null
			}
			return {
				body: () => {
					// 内容部分
					const contentVNode = props.options.contentComponent
						? h(
								props.options.contentComponent,
								props.options.contentProps || {}
						  )
						: props.options.content
						? h(
								'div',
								{
									class:
										'text-sm text-neutral-600 leading-relaxed whitespace-pre-line'
								},
								props.options.content
						  )
						: null

					// 按钮部分（仅在有按钮时渲染）
					const buttonsVNode =
						buttons.value.length > 0
							? h(
									'div',
									{
										class:
											'flex flex-col-reverse gap-3 mt-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4'
									},
									buttons.value.map((button, index) =>
										h(
											UButton,
											{
												key: button.key ?? `${button.label || 'btn'}-${index}`,
												color: button.color || 'primary',
												variant: button.variant || 'solid',
												size: button.size || 'md',
												block: button.block ?? false,
												class: ['w-full', 'sm:w-auto', button.class || ''],
												loading: loadingIndex.value === index,
												disabled:
													button.disabled ||
													(loadingIndex.value !== null &&
														loadingIndex.value !== index),
												onClick: () => handleButtonClick(button, index)
											},
											() =>
												h(
													'span',
													{
														class:
															'inline-flex items-center justify-center gap-2'
													},
													[
														button.icon
															? h(UIcon, {
																	name: button.icon,
																	class: 'w-4 h-4'
															  })
															: null,
														h('span', null, button.label || '确认')
													]
												)
										)
									)
							  )
							: null

					// 只返回存在的部分
					return h('div', {}, [contentVNode, buttonsVNode].filter(Boolean))
				}
			}
		}

		return () => {
			return h(
				UModal,
				{
					open: open.value,
					dismissible: props.options.dismissible ?? true,
					title: props.options.title,
					description: props.options.description,
					'onUpdate:open': handleUpdateOpen,
					preventClose: props.options.preventClose ?? false,
					close: props.options.close ?? true,
					ui: modalUi.value
				},
				bodyContainer()
			)
		}
	}
})

// 全局模态框控制器管理
const modalControllers = new Set()

export const useGlobalModal = () => {
	const showModal = (options = {}) => {
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			console.warn(
				'[useGlobalModal] Modal rendering is only available in the browser.'
			)
			return { close: () => {} }
		}

		const container = createContainer()
		let app = null

		let controller = {
			close: () => {}
		}

		const handleResolve = (reason) => {
			options.onClose?.(reason)
			modalControllers.delete(controller)
			destroyContainer(container, app)
		}

		const vnode = h(ModalHost, {
			options,
			onResolve: handleResolve,
			onReady: (api) => {
				controller = api
				modalControllers.add(controller)
			}
		})

		// 创建 Vue 应用实例并挂载
		app = createApp(vnode)

		// 获取当前 Nuxt 应用实例，复用其插件和配置
		const nuxtApp = useNuxtApp()

		if (nuxtApp) {
			// 复制全局属性和配置
			if (nuxtApp.vueApp?.config?.globalProperties) {
				app.config.globalProperties = {
					...nuxtApp.vueApp.config.globalProperties
				}
			}

			// 注册全局组件（包括 NuxtLink/RouterLink）
			if (nuxtApp.vueApp?._context?.components) {
				Object.entries(nuxtApp.vueApp._context.components).forEach(
					([name, component]) => {
						app.component(name, component)
					}
				)
			}

			// 注册 Router（解决 RouterLink 问题）
			if (nuxtApp.$router) {
				app.use(nuxtApp.$router)
			}

			// 注册其他可能需要的插件
			if (nuxtApp.vueApp?._context?.app) {
				const nuxtVueApp = nuxtApp.vueApp._context.app
				// 复制插件
				if (nuxtVueApp._plugins) {
					nuxtVueApp._plugins.forEach((plugin) => {
						try {
							app.use(plugin)
						} catch (e) {
							// 某些插件可能不支持重复注册，忽略错误
							console.debug('Plugin registration skipped:', e)
						}
					})
				}
			}
		}

		app.mount(container)

		return controller
	}

	/**
	 * 关闭最后一个打开的模态框
	 * @param {string} reason - 关闭原因，默认为 'programmatic'
	 */
	const closeModal = (reason = 'programmatic') => {
		if (modalControllers.size === 0) {
			console.warn('[useGlobalModal] No modal to close.')
			return
		}

		// 获取最后一个打开的模态框（Set 的最后一个元素）
		const controllers = Array.from(modalControllers)
		const lastController = controllers[controllers.length - 1]
		lastController?.close(reason)
	}

	/**
	 * 关闭所有打开的模态框
	 * @param {string} reason - 关闭原因，默认为 'programmatic'
	 */
	const closeAllModals = (reason = 'programmatic') => {
		modalControllers.forEach((controller) => {
			controller?.close(reason)
		})
		modalControllers.clear()
	}

	return {
		showModal,
		closeModal,
		closeAllModals
	}
}
