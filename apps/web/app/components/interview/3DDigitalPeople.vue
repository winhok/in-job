<template>
	<div
		class="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-0 overflow-hidden"
	>
		<div class="p-5 border-b border-gray-100 flex items-center justify-between">
			<div>
				<h3 class="font-bold text-neutral-900 flex items-end">AI 面试官</h3>
				<p class="text-xs text-neutral-500 mt-0.5">
					{{ interviewStore.selectedPosition?.positionName || '通用岗位' }}（{{
						serviceType === 'special' ? '专项面试' : '行测 + HR面试'
					}}）
				</p>
			</div>
			<div class="flex flex-col justify-around h-full">
				<div class="flex items-center gap-1 justify-end">
					<span class="relative flex h-2.5 w-2.5">
						<span
							v-if="isOnline"
							class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
						></span>
						<span
							class="relative inline-flex rounded-full h-2.5 w-2.5"
							:class="isOnline ? 'bg-green-500' : 'bg-gray-300'"
						></span>
					</span>
					<span
						class="text-xs font-medium"
						:class="isOnline ? 'text-green-600' : 'text-neutral-400'"
					>
						{{ isOnline ? '在线' : '离线' }}
					</span>
				</div>

				<div class="text-xs text-neutral-500">
					{{ isOnline ? '面试中' : '已暂停' }}：{{
						interviewStore.interviewDuration || '00:00:00'
					}}
				</div>
			</div>
		</div>

		<!-- 面试官容器 -->
		<div
			class="flex-1 flex flex-col items-center justify-center bg-linear-to-b from-indigo-50/30 to-white relative overflow-hidden p-8"
		>
			<!-- 背景装饰圆圈 -->
			<div
				class="absolute top-10 right-10 w-32 h-32 bg-indigo-100/40 rounded-full blur-3xl"
			></div>
			<div
				class="absolute bottom-10 left-10 w-40 h-40 bg-purple-100/40 rounded-full blur-3xl"
			></div>

			<!-- 卡通面试官 -->
			<div class="relative z-10 flex flex-col items-center">
				<!-- 头像容器 -->
				<div class="relative mb-4">
					<!-- 光晕效果 -->
					<div
						v-if="isSpeaking"
						class="absolute inset-0 bg-linear-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse"
					></div>

					<!-- SVG 面试官头像：1 -->
					<!-- TODO：不可删除 -->
					<!-- <svg
						class="w-48 h-48 relative transition-transform duration-300"
						:class="{ 'scale-105': isSpeaking }"
						viewBox="0 0 200 200"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle cx="100" cy="100" r="95" fill="#f5f5f2" />

						<path
							d="M 60 160 Q 80 150 100 150 Q 120 150 140 160 L 140 200 L 60 200 Z"
							fill="#1a2332"
						/>
						<path
							d="M 100 150 L 100 200 M 80 153 L 100 180 L 120 153"
							stroke="#0f172a"
							stroke-width="1.5"
							fill="none"
							opacity="0.5"
						/>

						<path
							d="M 70 155 Q 85 148 100 148 Q 115 148 130 155 L 130 200 L 70 200 Z"
							fill="#ffffff"
						/>

						<path d="M 100 148 L 94 170 L 100 192 L 106 170 Z" fill="#7c1e2a" />

						<ellipse cx="100" cy="90" rx="45" ry="50" fill="#ffd7b5" />

						<g opacity="0.4">
							<path
								d="M 88 105 Q 82 112 84 120"
								stroke="#d4847d"
								stroke-width="1.5"
								fill="none"
							/>
							<path
								d="M 112 105 Q 118 112 116 120"
								stroke="#d4847d"
								stroke-width="1.5"
								fill="none"
							/>
						</g>

						<ellipse cx="58" cy="90" rx="8" ry="12" fill="#ffc9a0" />
						<ellipse cx="142" cy="90" rx="8" ry="12" fill="#ffc9a0" />

						<g>
							<path
								d="M 55 70 Q 60 42 100 40 Q 140 42 145 70 Q 145 55 100 50 Q 55 55 55 70"
								fill="#2c2416"
							/>
							<path
								d="M 55 65 Q 53 75 58 82 L 62 80 Q 58 70 60 62 Z"
								fill="#5c5446"
								opacity="0.8"
							/>
							<path
								d="M 145 65 Q 147 75 142 82 L 138 80 Q 142 70 140 62 Z"
								fill="#5c5446"
								opacity="0.8"
							/>
						</g>

						<g>
							<ellipse
								cx="80"
								cy="85"
								rx="12"
								ry="10"
								fill="none"
								stroke="#333"
								stroke-width="2"
							/>
							<ellipse
								cx="120"
								cy="85"
								rx="12"
								ry="10"
								fill="none"
								stroke="#333"
								stroke-width="2"
							/>
							<line
								x1="92"
								y1="85"
								x2="108"
								y2="85"
								stroke="#333"
								stroke-width="2"
							/>
							<line
								x1="68"
								y1="85"
								x2="58"
								y2="88"
								stroke="#333"
								stroke-width="2"
							/>
							<line
								x1="132"
								y1="85"
								x2="142"
								y2="88"
								stroke="#333"
								stroke-width="2"
							/>
							<path
								d="M 70 95 Q 80 98 90 95 M 110 95 Q 120 98 130 95"
								stroke="#d4847d"
								stroke-width="1"
								opacity="0.3"
								fill="none"
							/>
						</g>

						<g :class="{ 'opacity-0': isBlinking }">
							<circle cx="80" cy="85" r="4" fill="#2c3e50" />
							<circle cx="82" cy="83" r="1.5" fill="#ffffff" />
							<circle cx="120" cy="85" r="4" fill="#2c3e50" />
							<circle cx="122" cy="83" r="1.5" fill="#ffffff" />
						</g>

						<g
							class="transition-transform duration-200"
							:style="{ transform: `translateY(${eyebrowOffset + 4}px)` }"
						>
							<path
								d="M 66 76 Q 78 74 88 76"
								stroke="#2c2416"
								stroke-width="3"
								fill="none"
								stroke-linecap="round"
							/>
							<path
								d="M 112 76 Q 122 74 134 76"
								stroke="#2c2416"
								stroke-width="3"
								fill="none"
								stroke-linecap="round"
							/>
						</g>

						<path d="M 100 95 L 98 108 Q 100 110 102 108 Z" fill="#ffc9a0" />

						<g class="transition-all duration-100">
							<ellipse
								v-if="isSpeaking"
								cx="100"
								cy="118"
								:rx="12 + mouthOpen * 3"
								:ry="6 + mouthOpen * 8"
								fill="#8b4513"
							/>
							<path
								v-else
								d="M 88 120 Q 100 119 112 120"
								stroke="#c4746d"
								stroke-width="2"
								fill="none"
								stroke-linecap="round"
							/>
						</g>

						<g v-if="isSpeaking">
							<circle
								cx="40"
								cy="100"
								:r="3 + soundWave * 2"
								fill="#6366f1"
								opacity="0.6"
							/>
							<circle
								cx="160"
								cy="100"
								:r="3 + soundWave * 2"
								fill="#6366f1"
								opacity="0.6"
							/>
							<circle
								cx="35"
								cy="110"
								:r="2 + soundWave * 1.5"
								fill="#8b5cf6"
								opacity="0.5"
							/>
							<circle
								cx="165"
								cy="110"
								:r="2 + soundWave * 1.5"
								fill="#8b5cf6"
								opacity="0.5"
							/>
						</g>
					</svg> -->

					<!-- SVG 面试官头像：@ -->
					<svg
						class="w-48 h-48 relative transition-transform duration-300"
						:class="{ 'scale-105': isSpeaking }"
						viewBox="0 0 200 200"
						xmlns="http://www.w3.org/2000/svg"
					>
						<defs>
							<linearGradient
								id="bgGradient"
								x1="0%"
								y1="0%"
								x2="100%"
								y2="100%"
							>
								<stop
									offset="0%"
									style="stop-color: #e2e8f0; stop-opacity: 1"
								/>
								<stop
									offset="100%"
									style="stop-color: #cbd5e1; stop-opacity: 1"
								/>
							</linearGradient>
						</defs>
						<circle cx="100" cy="100" r="95" fill="url(#bgGradient)" />
						<path
							d="M 30 100 L 170 100 M 100 30 L 100 170"
							stroke="#94a3b8"
							stroke-width="1"
							opacity="0.3"
						/>
						<rect
							x="40"
							y="50"
							width="20"
							height="30"
							fill="#64748b"
							opacity="0.1"
						/>
						<rect
							x="140"
							y="60"
							width="15"
							height="40"
							fill="#64748b"
							opacity="0.1"
						/>

						<g>
							<path
								d="M 55 160 Q 80 145 100 145 Q 120 145 145 160 L 145 200 L 55 200 Z"
								fill="#333333"
							/>
							<path
								d="M 65 165 L 65 200 M 135 165 L 135 200 M 80 155 L 80 200 M 120 155 L 120 200"
								stroke="#444444"
								stroke-width="0.5"
							/>
							<path
								d="M 100 145 L 100 200 M 80 150 L 100 185 L 120 150"
								stroke="#222222"
								stroke-width="1.5"
								fill="none"
							/>
						</g>

						<path
							d="M 75 155 Q 87 142 100 142 Q 113 142 125 155 L 125 200 L 75 200 Z"
							fill="#f8fafc"
						/>

						<path d="M 100 142 L 92 165 L 100 195 L 108 165 Z" fill="#7c1e2a" />
						<path
							d="M 98 160 L 102 160 M 99 175 L 101 175 M 100 185 L 100 185"
							stroke="#9b2c3a"
							stroke-width="2"
							stroke-linecap="round"
						/>

						<ellipse
							cx="100"
							cy="105"
							rx="40"
							ry="45"
							fill="#000000"
							opacity="0.15"
						/>

						<ellipse cx="100" cy="90" rx="42" ry="48" fill="#eac0a0" />

						<g stroke="#c69c7e" stroke-width="1" fill="none" opacity="0.7">
							<path d="M 85 60 Q 100 58 115 60" />
							<path d="M 90 65 Q 100 63 110 65" opacity="0.5" />
							<path d="M 65 82 L 58 80 M 65 85 L 58 85 M 65 88 L 58 90" />
							<path d="M 135 82 L 142 80 M 135 85 L 142 85 M 135 88 L 142 90" />
							<path d="M 88 102 Q 80 115 82 125" stroke-width="1.5" />
							<path d="M 112 102 Q 120 115 118 125" stroke-width="1.5" />
						</g>

						<ellipse cx="56" cy="90" rx="7" ry="11" fill="#e0b090" />
						<ellipse cx="144" cy="90" rx="7" ry="11" fill="#e0b090" />

						<g>
							<path
								d="M 55 65 Q 60 35 100 32 Q 140 35 145 65 Q 145 55 100 48 Q 55 55 55 65 Z"
								fill="#3c342f"
							/>
							<path
								d="M 56 55 Q 54 70 60 78 L 65 75 Q 60 65 62 52 Z"
								fill="#9ca3af"
								opacity="0.9"
							/>
							<path
								d="M 144 55 Q 146 70 140 78 L 135 75 Q 140 65 138 52 Z"
								fill="#9ca3af"
								opacity="0.9"
							/>
							<path
								d="M 80 40 Q 90 35 100 38 M 110 38 Q 120 34 130 39"
								stroke="#9ca3af"
								stroke-width="1.5"
								fill="none"
								opacity="0.6"
							/>
						</g>

						<g>
							<path
								d="M 68 80 Q 80 75 92 80 L 92 85 Q 80 90 68 85 Z"
								fill="#4a4a4a"
							/>
							<path
								d="M 108 80 Q 120 75 132 80 L 132 85 Q 120 90 108 85 Z"
								fill="#4a4a4a"
							/>
							<ellipse
								cx="80"
								cy="85"
								rx="12"
								ry="9"
								fill="none"
								stroke="#666"
								stroke-width="1"
							/>
							<ellipse
								cx="120"
								cy="85"
								rx="12"
								ry="9"
								fill="none"
								stroke="#666"
								stroke-width="1"
							/>
							<line
								x1="92"
								y1="82"
								x2="108"
								y2="82"
								stroke="#4a4a4a"
								stroke-width="2.5"
							/>
							<line
								x1="68"
								y1="82"
								x2="55"
								y2="85"
								stroke="#4a4a4a"
								stroke-width="2"
							/>
							<line
								x1="132"
								y1="82"
								x2="145"
								y2="85"
								stroke="#4a4a4a"
								stroke-width="2"
							/>
						</g>

						<g :class="{ 'opacity-0': isBlinking }">
							<ellipse cx="80" cy="85" rx="10" ry="6" fill="#fff" />
							<ellipse cx="120" cy="85" rx="10" ry="6" fill="#fff" />
							<circle cx="80" cy="85" r="4.5" fill="#2c3e50" />
							<circle cx="81.5" cy="83.5" r="1.5" fill="#ffffff" />
							<circle cx="120" cy="85" r="4.5" fill="#2c3e50" />
							<circle cx="121.5" cy="83.5" r="1.5" fill="#ffffff" />
							<path
								d="M 70 80 Q 80 78 90 80"
								stroke="#c69c7e"
								stroke-width="2"
								fill="none"
							/>
							<path
								d="M 110 80 Q 120 78 130 80"
								stroke="#c69c7e"
								stroke-width="2"
								fill="none"
							/>
						</g>

						<g
							class="transition-transform duration-200"
							:style="{ transform: `translateY(${eyebrowOffset + 6}px)` }"
						>
							<path
								d="M 65 75 Q 75 78 88 74"
								stroke="#3c342f"
								stroke-width="3.5"
								fill="none"
								stroke-linecap="round"
							/>
							<path
								d="M 112 74 Q 125 78 135 75"
								stroke="#3c342f"
								stroke-width="3.5"
								fill="none"
								stroke-linecap="round"
							/>
							<path
								d="M 98 70 L 98 78 M 102 70 L 102 78"
								stroke="#c69c7e"
								stroke-width="1.5"
								opacity="0.6"
							/>
						</g>

						<path d="M 100 92 L 97 108 Q 100 112 103 108 Z" fill="#dcb090" />
						<path
							d="M 98 108 Q 100 110 102 108"
							stroke="#c69c7e"
							stroke-width="1.5"
							fill="none"
						/>

						<g class="transition-all duration-100">
							<ellipse
								v-if="isSpeaking"
								cx="100"
								cy="120"
								:rx="12 + mouthOpen * 3"
								:ry="5 + mouthOpen * 8"
								fill="#6b3e2e"
							/>
							<g v-else>
								<path
									d="M 86 122 Q 100 120 114 122"
									stroke="#a86b63"
									stroke-width="2.5"
									fill="none"
									stroke-linecap="round"
								/>
								<path
									d="M 92 125 Q 100 127 108 125"
									stroke="#c69c7e"
									stroke-width="1.5"
									opacity="0.5"
									fill="none"
									stroke-linecap="round"
								/>
							</g>
						</g>

						<g v-if="isSpeaking">
							<circle
								cx="40"
								cy="100"
								:r="3 + soundWave * 2"
								fill="#1e40af"
								opacity="0.5"
							/>
							<circle
								cx="160"
								cy="100"
								:r="3 + soundWave * 2"
								fill="#1e40af"
								opacity="0.5"
							/>
							<circle
								cx="35"
								cy="110"
								:r="2 + soundWave * 1.5"
								fill="#3b82f6"
								opacity="0.4"
							/>
							<circle
								cx="165"
								cy="110"
								:r="2 + soundWave * 1.5"
								fill="#3b82f6"
								opacity="0.4"
							/>
						</g>
					</svg>
				</div>

				<!-- 名称和状态 -->
				<div class="text-center">
					<h4 class="text-lg font-semibold text-neutral-800 mb-1">
						{{ interviewStore.interviewerName || '正在分配面试官...' }}
					</h4>
					<p class="text-sm text-neutral-500 mb-2">资深技术面试官</p>
					<div
						class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300"
						:class="statusClass"
					>
						<span class="relative flex h-2 w-2">
							<span
								v-if="isSpeaking"
								class="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"
							></span>
							<span
								class="relative inline-flex rounded-full h-2 w-2 bg-current"
							></span>
						</span>
						{{ statusText }}
					</div>
				</div>
			</div>
		</div>

		<!-- 底部提示 -->
		<InterviewTip :range-time="60" />
	</div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import InterviewTip from '@/components/interview/interviewTip.vue'
import { useInterviewStore } from '@/stores/interview'

defineProps({
	serviceType: {
		type: String,
		required: true
	}
})

const interviewStore = useInterviewStore()

// 面试官信息

// 动画状态
const isBlinking = ref(false)
const mouthOpen = ref(0)
const soundWave = ref(0)
const eyebrowOffset = ref(0)

// 面试时长（秒）
const elapsedSeconds = ref(0)

// 定时器
let blinkInterval = null
let mouthAnimationInterval = null
let soundWaveInterval = null
let eyebrowInterval = null
let durationInterval = null

/**
 * 面试是否正在进行
 */
const isOnline = computed(() => {
	return (
		interviewStore.interviewStatus === 'in_progress' ||
		interviewStore.interviewStatus === 'starting'
	)
})

// 已面试时长（格式化为 HH:mm:ss）
const formattedDuration = computed(() => {
	const total = elapsedSeconds.value
	const hours = Math.floor(total / 3600)
	const minutes = Math.floor((total % 3600) / 60)
	const seconds = total % 60

	const pad = (n) => String(n).padStart(2, '0')
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
})

// 监听 formattedDuration，同步到全局 store，方便其他组件使用
watch(
	formattedDuration,
	(value) => {
		interviewStore.interviewDuration = value
	},
	{ immediate: true }
)

/**
 * 面试官是否正在说话
 */
const isSpeaking = computed(() => {
	return interviewStore.interviewEventType === 'question'
})

const statusText = computed(() => {
	if (isSpeaking.value) return '面试官正在说话...'
	if (isOnline.value) return '正在倾听...'
	return '准备就绪'
})

const statusClass = computed(() => {
	if (isSpeaking.value) {
		return 'bg-indigo-100 text-indigo-700'
	}
	if (isOnline.value) {
		return 'bg-green-100 text-green-700'
	}
	return 'bg-gray-100 text-gray-600'
})

// 眨眼动画
const startBlinking = () => {
	const blink = () => {
		isBlinking.value = true
		setTimeout(() => {
			isBlinking.value = false
		}, 150)
	}

	// 随机眨眼
	blinkInterval = setInterval(() => {
		if (Math.random() > 0.7) {
			blink()
		}
	}, 3000)
}

// 启动/停止计时器
const startDurationTimer = () => {
	// 避免重复开启
	if (durationInterval) return

	durationInterval = setInterval(() => {
		if (!isOnline.value) return
		elapsedSeconds.value += 1
	}, 1000)
}

const stopDurationTimer = () => {
	if (durationInterval) {
		clearInterval(durationInterval)
		durationInterval = null
	}
}

// 嘴巴动画
const animateMouth = (text) => {
	if (!text) {
		mouthOpen.value = 0
		return
	}

	let index = 0
	const chars = text.split('')

	if (mouthAnimationInterval) {
		clearInterval(mouthAnimationInterval)
	}

	mouthAnimationInterval = setInterval(() => {
		if (index >= chars.length) {
			mouthOpen.value = 0
			clearInterval(mouthAnimationInterval)
			return
		}

		const char = chars[index]

		// 根据字符类型设置嘴型
		if (/[aeiouAEIOU啊阿呀哦喔额]/.test(char)) {
			mouthOpen.value = 0.8 + Math.random() * 0.2
		} else if (/[，。！？,.!?\s]/.test(char)) {
			mouthOpen.value = 0
		} else if (/[bpmfBPMF波不么]/.test(char)) {
			mouthOpen.value = 0.2
		} else {
			mouthOpen.value = 0.4 + Math.random() * 0.2
		}

		index++
	}, 50)
}

// 声波动画
const animateSoundWave = () => {
	let direction = 1
	soundWaveInterval = setInterval(() => {
		soundWave.value += 0.1 * direction
		if (soundWave.value >= 1 || soundWave.value <= 0) {
			direction *= -1
		}
	}, 100)
}

// 眉毛表情
const animateEyebrow = () => {
	eyebrowInterval = setInterval(() => {
		if (Math.random() > 0.95) {
			// 偶尔挑眉（表示思考或强调）
			eyebrowOffset.value = -2
			setTimeout(() => {
				eyebrowOffset.value = 0
			}, 300)
		}
	}, 2000)
}

// 监听流式输出
watch(
	() => interviewStore.interviewEventType,
	(interviewEventType) => {
		if (interviewEventType === 'question') {
			animateSoundWave()
			const lastMessage =
				interviewStore.messages[interviewStore.messages.length - 1]
			if (lastMessage && lastMessage.role === 'interviewer') {
				animateMouth(lastMessage.content)
			}
		} else {
			if (soundWaveInterval) {
				clearInterval(soundWaveInterval)
				soundWave.value = 0
			}
			if (mouthAnimationInterval) {
				clearInterval(mouthAnimationInterval)
				mouthOpen.value = 0
			}
		}
	}
)

// 监听消息变化
watch(
	() => interviewStore.messages,
	(messages) => {
		if (messages.length > 0) {
			const lastMessage = messages[messages.length - 1]
			if (
				lastMessage.role === 'interviewer' &&
				interviewStore.interviewEventType === 'question'
			) {
				animateMouth(lastMessage.content)
			}
		}
	},
	{ deep: true }
)

onMounted(() => {
	startBlinking()
	animateEyebrow()

	// 根据当前状态决定是否需要启动计时器
	if (isOnline.value) {
		startDurationTimer()
	}

	// 监听面试状态变化，控制计时器
	watch(
		() => interviewStore.interviewStatus,
		(status) => {
			if (status === 'in_progress') {
				// 重新开始面试时从 0 开始计时
				elapsedSeconds.value = 0
				startDurationTimer()
			} else if (status === 'ended' || status === 'idle') {
				stopDurationTimer()
			}
		},
		{ immediate: false }
	)
})

onUnmounted(() => {
	if (blinkInterval) clearInterval(blinkInterval)
	if (mouthAnimationInterval) clearInterval(mouthAnimationInterval)
	if (soundWaveInterval) clearInterval(soundWaveInterval)
	if (eyebrowInterval) clearInterval(eyebrowInterval)
	if (durationInterval) clearInterval(durationInterval)
})
</script>

<style scoped>
@keyframes sound-wave {
	0%,
	100% {
		opacity: 0.3;
		transform: scale(1);
	}
	50% {
		opacity: 0.8;
		transform: scale(1.2);
	}
}

.animate-sound-wave {
	animation: sound-wave 1s ease-in-out infinite;
}
</style>
