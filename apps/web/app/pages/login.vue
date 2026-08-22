<template>
	<section class="h-screen relative overflow-hidden py-16 sm:py-20">
		<!-- 以下为纯 UI 美化部分 -->
		<div
			class="pointer-events-none absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800"
		></div>
		<div class="absolute inset-0 pointer-events-none">
			<div class="sci-fi-layer">
				<span class="orb orb-1"></span>
				<span class="orb orb-2"></span>
				<span class="orb orb-3"></span>

				<span class="beam beam-1"></span>
				<span class="beam beam-2"></span>

				<span class="bubble bubble-1"></span>
				<span class="bubble bubble-2"></span>
				<span class="bubble bubble-3"></span>
				<span class="bubble bubble-4"></span>
			</div>
		</div>
		<div class="absolute inset-x-0 top-24 flex justify-center blur-3xl">
			<div class="h-64 w-[480px] rounded-full bg-primary/20"></div>
		</div>
		<!-- 以上为纯 UI 美化部分 -->
		<div class="relative">
			<div class="container">
				<div class="mb-12 flex items-center justify-between text-white/80">
					<NuxtLink
						to="/"
						class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
					>
						<UIcon name="i-heroicons-arrow-left" />
						返回面试汪
					</NuxtLink>
					<div
						class="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs md:flex"
					>
						<UIcon name="i-heroicons-shield-check" class="text-emerald-300" />
						<span>微信官方授权 · 安全登录</span>
					</div>
				</div>
				<div
					class="grid items-start gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
				>
					<div class="flex flex-col gap-8">
						<LoginPitch />
						<LoginFlowCard />
					</div>
					<div class="relative">
						<div
							class="absolute -top-6 -left-8 hidden h-24 w-24 rounded-full border border-white/10 lg:block"
						></div>
						<div
							class="absolute -bottom-6 -right-6 hidden h-20 w-20 rounded-full border border-white/10 lg:block"
						></div>

						<LoginWeChatPanel @refresh-qr="handleQrRefresh" />
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useHead, useSeoMeta, useToast } from '#imports'
import LoginPitch from '../components/login/LoginPitch.vue'
import LoginWeChatPanel from '../components/login/LoginWeChatPanel.vue'
import LoginFlowCard from '../components/login/LoginFlowCard.vue'

definePageMeta({
	layout: 'auth'
})

useHead({
	title: '登录面试汪 - AI 面试平台',
	bodyAttrs: {
		class: 'bg-neutral-900'
	}
})

useSeoMeta({
	title: '登录面试汪 - AI 面试平台',
	description:
		'通过微信扫码或微信快速登录面试汪，继续你的 AI 模拟面试训练，获取针对岗位的实时反馈与结构化评估。'
})

const toast = useToast()

const handleQrRefresh = () => {
	toast.add({
		title: '二维码已更新',
		description: '请使用微信「扫一扫」再次尝试登录。',
		color: 'primary'
	})
}
</script>

<style scoped>
.sci-fi-layer {
	position: absolute;
	inset: 0;
	overflow: hidden;
}

.orb {
	position: absolute;
	border-radius: 9999px;
	filter: blur(40px);
	mix-blend-mode: screen;
	background: radial-gradient(
		circle at 30% 30%,
		rgba(92, 187, 255, 0.3),
		rgba(15, 23, 42, 0)
	);
	animation: orbPulse 12s ease-in-out infinite alternate;
}

.orb-1 {
	width: 44rem;
	height: 44rem;
	top: -12rem;
	right: -10rem;
	background: radial-gradient(
		circle at 30% 30%,
		rgba(136, 108, 255, 0.5),
		rgba(15, 23, 42, 0)
	);
	animation-delay: -3s;
}

.orb-2 {
	width: 32rem;
	height: 32rem;
	bottom: -14rem;
	left: -10rem;
	background: radial-gradient(
		circle at 40% 40%,
		rgba(78, 225, 255, 0.45),
		rgba(15, 23, 42, 0)
	);
	animation-delay: -6s;
}

.orb-3 {
	width: 28rem;
	height: 28rem;
	top: 30%;
	left: 30%;
	background: radial-gradient(
		circle at 70% 70%,
		rgba(244, 114, 182, 0.3),
		rgba(15, 23, 42, 0)
	);
	animation-delay: -1s;
}

.beam {
	position: absolute;
	inset: -20%;
	background: radial-gradient(
		circle at center,
		rgba(125, 211, 252, 0.08),
		rgba(15, 23, 42, 0)
	);
	filter: blur(60px);
	mix-blend-mode: screen;
	animation: beamSweep 18s ease-in-out infinite;
}

.beam-1 {
	transform: rotate(12deg);
	animation-delay: -4s;
}

.beam-2 {
	transform: rotate(-18deg);
	animation-delay: -10s;
}

.bubble {
	position: absolute;
	border-radius: 9999px;
	border: 1px solid rgba(148, 163, 184, 0.18);
	background: linear-gradient(
			120deg,
			rgba(226, 232, 240, 0.08),
			rgba(148, 163, 184, 0.02),
			rgba(248, 250, 252, 0.08)
		),
		radial-gradient(
			circle at top left,
			rgba(148, 163, 184, 0.2),
			rgba(15, 23, 42, 0.02)
		);
	box-shadow: 0 0 35px rgba(56, 189, 248, 0.12),
		inset 0 0 25px rgba(59, 130, 246, 0.06);
	backdrop-filter: blur(10px);
	animation: bubbleFloat 16s ease-in-out infinite,
		bubbleDrift 22s linear infinite;
}

.bubble::after {
	content: '';
	position: absolute;
	inset: 18%;
	border-radius: 9999px;
	background: radial-gradient(
		circle at top,
		rgba(255, 255, 255, 0.35),
		rgba(148, 163, 184, 0)
	);
	filter: blur(8px);
	opacity: 0.6;
}

.bubble-1 {
	width: 12rem;
	height: 12rem;
	top: 12%;
	left: 12%;
	animation-delay: -12s;
}

.bubble-2 {
	width: 9rem;
	height: 9rem;
	top: 42%;
	right: 10%;
	animation-delay: -6s;
}

.bubble-3 {
	width: 7rem;
	height: 7rem;
	bottom: 18%;
	left: 20%;
	animation-delay: -18s;
}

.bubble-4 {
	width: 6rem;
	height: 6rem;
	bottom: 15%;
	right: 28%;
	animation-delay: -9s;
}

@keyframes orbPulse {
	0% {
		transform: scale(0.92) translate3d(0, 0, 0);
		opacity: 0.65;
	}
	50% {
		transform: scale(1.05) translate3d(2%, -2%, 0);
		opacity: 0.9;
	}
	100% {
		transform: scale(0.96) translate3d(-2%, 2%, 0);
		opacity: 0.7;
	}
}

@keyframes beamSweep {
	0%,
	100% {
		transform: rotate(8deg) translate3d(-6%, -4%, 0);
		opacity: 0.35;
	}
	50% {
		transform: rotate(-6deg) translate3d(6%, 4%, 0);
		opacity: 0.55;
	}
}

@keyframes bubbleFloat {
	0%,
	100% {
		transform: translate3d(0, 0, 0) scale(1);
	}
	50% {
		transform: translate3d(0, -18px, 0) scale(1.02);
	}
}

@keyframes bubbleDrift {
	0% {
		transform: rotate(0deg) translateX(0);
		opacity: 0.65;
	}
	50% {
		transform: rotate(1deg) translateX(12px);
		opacity: 0.85;
	}
	100% {
		transform: rotate(0deg) translateX(0);
		opacity: 0.65;
	}
}
</style>
