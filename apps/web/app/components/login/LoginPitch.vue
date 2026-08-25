<template>
	<div class="space-y-8">
		<div class="space-y-3">
			<h1 class="text-white text-3xl md:text-4xl font-semibold">
				{{ $t('login.welcome') }}<br />
				{{ $t('login.pitch') }}
			</h1>
			<p class="text-sm md:text-base text-white/80 max-w-xl">
				{{ $t('login.pitchDesc') }}
			</p>
		</div>

		<!-- <ul class="grid gap-4 sm:grid-cols-2 text-sm text-white/80">
			<li class="flex items-start gap-3">
				<div
					class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
				>
					<UIcon name="i-heroicons-chart-bar" />
				</div>
				<div>
					<p class="font-medium text-white">沉浸式面试反馈</p>
					<p class="text-white/70">追踪进步曲线与能力维度雷达图。</p>
				</div>
			</li>
			<li class="flex items-start gap-3">
				<div
					class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
				>
					<UIcon name="i-heroicons-queue-list" />
				</div>
				<div>
					<p class="font-medium text-white">岗位级知识库</p>
					<p class="text-white/70">实时更新热门公司与岗位考点。</p>
				</div>
			</li>
			<li class="flex items-start gap-3">
				<div
					class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
				>
					<UIcon name="i-heroicons-shield-check" />
				</div>
				<div>
					<p class="font-medium text-white">企业级安全保障</p>
					<p class="text-white/70">多层加密，隐私与数据安全可控。</p>
				</div>
			</li>
			<li class="flex items-start gap-3">
				<div
					class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
				>
					<UIcon name="i-heroicons-bolt" />
				</div>
				<div>
					<p class="font-medium text-white">极速启动体验</p>
					<p class="text-white/70">微信扫码即可登录，秒级同步。</p>
				</div>
			</li>
		</ul> -->
	</div>
</template>

<script setup></script>

<style scoped></style>
