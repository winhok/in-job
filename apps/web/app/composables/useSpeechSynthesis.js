import { ref, computed } from 'vue'

/**
 * 语音合成 Composable
 * 用于将文本转换为语音，支持流式文本实时朗读
 */
export const useSpeechSynthesis = () => {
	// 是否启用语音
	const isEnabled = ref(true)
	// 是否正在朗读
	const isSpeaking = ref(false)
	// 当前朗读队列
	const speechQueue = ref([])
	// 已朗读的文本缓存（用于去重）
	const spokenTextCache = ref(new Set())
	// 当前正在处理的文本片段
	const currentFragment = ref('')

	/**
	 * 检查浏览器是否支持语音合成
	 */
	const isSupported = computed(() => {
		return typeof window !== 'undefined' && 'speechSynthesis' in window
	})

	/**
	 * 从文本中提取完整的句子
	 * @param {string} text - 输入文本
	 * @returns {Array} - 句子数组
	 */
	const extractSentences = (text) => {
		if (!text) return []

		// 按照中文标点符号分割句子
		const sentences = text
			.split(/([。！？；\n]+)/)
			.reduce((acc, part, index, array) => {
				// 如果是标点符号，与前一个句子合并
				if (index % 2 === 0 && part.trim()) {
					const punctuation = array[index + 1] || ''
					acc.push(part.trim() + punctuation)
				}
				return acc
			}, [])
			.filter((s) => s.trim().length > 0)

		return sentences
	}

	/**
	 * 朗读单个句子
	 * @param {string} sentence - 要朗读的句子
	 */
	const speakSentence = (sentence) => {
		if (!isSupported.value || !isEnabled.value || !sentence.trim()) {
			return
		}

		return new Promise((resolve, reject) => {
			try {
				const utterance = new SpeechSynthesisUtterance(sentence)

				// 设置语音参数
				utterance.lang = 'zh-CN' // 中文
				// const voices = window.speechSynthesis.getVoices()
				// utterance.voice = voices.find((voice) => voice.lang === 'zh-CN') // 选择中文的语音
				utterance.rate = 1.1 // 语速（0.1-10，默认1）
				utterance.pitch = 1 // 音调（0-2，默认1）
				utterance.volume = 1 // 音量（0-1，默认1）

				// 事件监听
				utterance.onstart = () => {
					isSpeaking.value = true
				}

				utterance.onend = () => {
					isSpeaking.value = false
					resolve()
				}

				utterance.onerror = (event) => {
					console.error('语音合成错误:', event)
					isSpeaking.value = false
					reject(event)
				}

				// 开始朗读
				window.speechSynthesis.speak(utterance)
			} catch (error) {
				console.error('创建语音合成失败:', error)
				reject(error)
			}
		})
	}

	/**
	 * 处理队列中的语音任务
	 */
	const processQueue = async () => {
		if (speechQueue.value.length === 0 || !isEnabled.value) {
			return
		}

		const sentence = speechQueue.value.shift()

		try {
			await speakSentence(sentence)
		} catch (error) {
			console.error('朗读失败:', error)
		}

		// 继续处理队列中的下一个
		if (speechQueue.value.length > 0) {
			processQueue()
		}
	}

	/**
	 * 处理流式文本，实时提取并朗读句子
	 * @param {string} streamText - 流式接收的文本
	 * @param {boolean} isFinal - 是否是最终文本
	 */
	const handleStreamText = (streamText, isFinal = false) => {
		if (!isEnabled.value || !streamText) return

		// 累积当前片段
		currentFragment.value += streamText

		// 提取完整句子
		const sentences = extractSentences(currentFragment.value)

		if (sentences.length > 0) {
			// 如果不是最终文本，保留最后一个不完整的片段
			const sentencesToSpeak = isFinal ? sentences : sentences.slice(0, -1)
			const remaining = isFinal ? '' : sentences[sentences.length - 1] || ''

			// 将新句子加入队列（去重）
			sentencesToSpeak.forEach((sentence) => {
				const normalized = sentence.trim()
				if (normalized && !spokenTextCache.value.has(normalized)) {
					spokenTextCache.value.add(normalized)
					speechQueue.value.push(normalized)
				}
			})

			// 更新当前片段为剩余未处理的部分
			currentFragment.value = remaining

			// 如果队列有内容且当前没在朗读，开始处理
			if (speechQueue.value.length > 0 && !isSpeaking.value) {
				processQueue()
			}
		}

		// 如果是最终文本且有剩余片段，也朗读出来
		if (isFinal && currentFragment.value.trim()) {
			const lastFragment = currentFragment.value.trim()
			if (!spokenTextCache.value.has(lastFragment)) {
				spokenTextCache.value.add(lastFragment)
				speechQueue.value.push(lastFragment)
				if (!isSpeaking.value) {
					processQueue()
				}
			}
			currentFragment.value = ''
		}
	}

	/**
	 * 停止所有语音朗读
	 */
	const stop = () => {
		if (isSupported.value) {
			window.speechSynthesis.cancel()
			speechQueue.value = []
			isSpeaking.value = false
		}
	}

	/**
	 * 暂停语音朗读
	 */
	const pause = () => {
		if (isSupported.value) {
			window.speechSynthesis.pause()
		}
	}

	/**
	 * 恢复语音朗读
	 */
	const resume = () => {
		if (isSupported.value) {
			window.speechSynthesis.resume()
		}
	}

	/**
	 * 切换启用状态
	 */
	const toggle = () => {
		isEnabled.value = !isEnabled.value
		if (!isEnabled.value) {
			stop()
		}
	}

	/**
	 * 重置状态（开始新的会话时调用）
	 */
	const reset = () => {
		stop()
		spokenTextCache.value.clear()
		currentFragment.value = ''
	}

	return {
		// 状态
		isEnabled,
		isSpeaking,
		isSupported,

		// 方法
		handleStreamText,
		stop,
		pause,
		resume,
		toggle,
		reset
	}
}
