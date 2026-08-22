<template>
	<div class="feedback-button-container">
		<button
			@click="handleFeedback"
			class="feedback-button"
			:class="{ 'feedback-button--expanded': isHovered }"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<svg aria-hidden="true" class="feedback-icon">
				<use xlink:href="#icon-message" />
			</svg>
			<span class="feedback-text">反馈</span>
		</button>
	</div>
</template>

<script setup>
import { ref } from 'vue'

const isHovered = ref(false)

const handleFeedback = () => {
	window.open('https://txc.qq.com/products/771442', '_blank')
}
</script>

<style scoped>
.feedback-button-container {
	position: fixed;
	right: 0;
	bottom: 100px;
	z-index: 1000;
}

.feedback-button {
	display: flex;
	align-items: center;
	gap: 8px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	border-radius: 50px 0 0 50px;
	padding: 12px 20px 12px 16px;
	cursor: pointer;
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	transform: translateX(calc(100% - 48px));
	font-weight: 500;
	font-size: 14px;
}

.feedback-button:hover {
	transform: translateX(0);
	box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.feedback-button--expanded {
	transform: translateX(0);
}

.feedback-icon {
	width: 20px;
	height: 20px;
	flex-shrink: 0;
	fill: currentColor;
}

.feedback-text {
	white-space: nowrap;
	opacity: 0;
	transition: opacity 0.3s ease;
}

.feedback-button--expanded .feedback-text {
	opacity: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.feedback-button {
		padding: 10px 16px 10px 12px;
		font-size: 13px;
	}

	.feedback-icon {
		width: 18px;
		height: 18px;
	}
}
</style>
