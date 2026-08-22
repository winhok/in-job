// 内存兜底存储：当 localStorage 不可用时（如 SSR 环境），使用内存 Map 作为替代方案
const memoryStore = new Map()

// 判断是否运行在客户端环境（浏览器）
// SSR 下 window 为 undefined，因此需要判断
const isClient = () => typeof window !== 'undefined'

// 读取指定 key 的存储状态（优先使用 localStorage）
const readState = (key) => {
	// 如果在浏览器环境，并支持 localStorage，则优先从 localStorage 读取
	if (isClient() && window.localStorage) {
		try {
			const raw = window.localStorage.getItem(key)
			// 如果有存储数据，则解析 JSON；否则返回默认结构
			return raw ? JSON.parse(raw) : { timestamps: [] }
		} catch (error) {
			// JSON 解析失败或读取异常，给出警告并使用默认值
			console.warn(`[actionGuard] Failed to read state for ${key}`, error)
			return { timestamps: [] }
		}
	}

	// 如果没有 localStorage（如 SSR），使用 memoryStore 存储
	if (!memoryStore.has(key)) {
		memoryStore.set(key, { timestamps: [] })
	}

	return memoryStore.get(key)
}

// 写入存储状态（优先写入 localStorage）
const writeState = (key, state) => {
	if (isClient() && window.localStorage) {
		try {
			window.localStorage.setItem(key, JSON.stringify(state))
			return
		} catch (error) {
			console.warn(`[actionGuard] Failed to persist state for ${key}`, error)
		}
	}

	// localStorage 不可用时写入内存 Map
	memoryStore.set(key, state)
}

// 清理 timestamps 数组，只保留在 windowMs 时间窗口内的记录
// windowMs: 时间窗口（毫秒）
// now: 当前时间戳
const prune = (timestamps, windowMs, now) =>
	timestamps.filter((timestamp) => now - timestamp < windowMs)

/**
 * 创建一个 “动作访问守卫器” (action guard)
 * 用于限制某个行为在一定时间内的最大触发次数（类似防刷机制）
 *
 * @param {string} actionKey - 行为唯一标识
 * @param {object} options
 * @param {number} options.maxAttempts - 时间窗口内最大允许触发次数
 * @param {number} options.windowMs - 时间窗口（毫秒）
 * @param {string} options.storageKeyPrefix - 存储 key 的前缀
 */
export const createActionGuard = (
	actionKey,
	{
		maxAttempts = 3,
		windowMs = 60 * 1000,
		storageKeyPrefix = 'action_guard'
	} = {}
) => {
	// 最终存储 key 格式：如 "action_guard:login"
	const storageKey = `${storageKeyPrefix}:${actionKey}`

	/**
	 * 尝试执行动作：返回当前是否允许
	 */
	const attempt = () => {
		const now = Date.now()

		// 获取当前 key 对应的状态数据
		const state = readState(storageKey)

		// 过滤掉过期的访问记录
		const activeTimestamps = prune(state.timestamps || [], windowMs, now)

		// 如果超出最大次数，计算需要等待的时间 retryAfter
		if (activeTimestamps.length >= maxAttempts) {
			// 获取第一个有效时间戳，通过它推算还需等待多久
			const retryAfter = Math.max(0, windowMs - (now - activeTimestamps[0]))
			return {
				allowed: false, // 不允许继续访问
				retryAfter // 需要等待多久（毫秒）
			}
		}

		// 允许访问：记录当前时间戳
		activeTimestamps.push(now)
		writeState(storageKey, { timestamps: activeTimestamps })

		return {
			allowed: true,
			retryAfter: 0,
			remainingAttempts: Math.max(0, maxAttempts - activeTimestamps.length)
		}
	}

	/**
	 * 手动重置窗口内的计数
	 */
	const reset = () => writeState(storageKey, { timestamps: [] })

	// 对外暴露 attempt（尝试）和 reset（重置）两个方法
	return { attempt, reset }
}
