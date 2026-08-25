<template>
	<section class="relative overflow-hidden bg-white">
		<div class="absolute inset-0 pointer-events-none overflow-hidden">
			<div
				class="absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary-400/20 to-purple-400/20 blur-3xl opacity-60"
			></div>
			<div
				class="absolute top-[20%] -left-[10%] h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-emerald-400/20 to-sky-400/20 blur-3xl opacity-60"
			></div>
		</div>
		<div class="container px-4 py-10 md:pb-22 relative">
			<!-- 实时面试人数展示卡片 -->
			<div class="w-full max-w-sm">
				<LiveInterviewCount />
			</div>
			<div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
				<div class="max-w-2xl">
					<div
						class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-medium text-primary-700 mb-6"
					>
						<span class="relative flex h-2 w-2">
							<span
								class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"
							></span>
							<span
								class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"
							></span>
						</span>
						{{ $t('home.hero.badge') }}
					</div>

					<!-- 新用户福利提示 -->
					<div
						class="mb-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all"
					>
						<UIcon name="i-heroicons-gift" class="w-5 h-5" />
						<span>{{ $t('home.hero.gift') }}</span>
					</div>
					<h1
						class="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.15]"
					>
						{{ $t('home.hero.title') }}<br />
						<span class="text-primary-700">{{
							$t('home.hero.titleAccent')
						}}</span>
					</h1>
					<p class="mt-6 text-lg text-neutral-600 leading-relaxed">
						{{ $t('home.hero.description') }}
					</p>
					<div class="mt-8 flex flex-col sm:flex-row gap-4">
						<UButton
							size="xl"
							color="primary"
							to="/interview/start"
							class="px-8 font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all"
							>{{ $t('home.hero.primaryCta') }}</UButton
						>
						<UButton
							size="xl"
							color="gray"
							variant="ghost"
							to="/#features"
							class="px-8 font-medium hover:bg-neutral-100"
							>{{ $t('home.hero.secondaryCta') }}</UButton
						>
					</div>
					<div
						class="mt-10 pt-8 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm"
					>
						<div class="flex items-center gap-2">
							<div class="p-1 rounded bg-blue-100/50 text-blue-600">
								<UIcon name="i-heroicons-document-text" class="w-4 h-4" />
							</div>
							<div>
								<p class="font-semibold text-neutral-700">
									{{ $t('home.hero.quizName') }}
								</p>
								<p class="text-xs text-neutral-500">
									{{ $t('home.hero.quizShort') }}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<div class="p-1 rounded bg-emerald-100/50 text-emerald-600">
								<UIcon name="i-heroicons-bolt" class="w-4 h-4" />
							</div>
							<div>
								<p class="font-semibold text-neutral-700">
									{{ $t('home.hero.specialName') }}
								</p>
								<p class="text-xs text-neutral-500">
									{{ $t('home.hero.specialShort') }}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<div class="p-1 rounded bg-purple-100/50 text-purple-600">
								<UIcon
									name="i-heroicons-chat-bubble-left-right"
									class="w-4 h-4"
								/>
							</div>
							<div>
								<p class="font-semibold text-neutral-700">
									{{ $t('home.hero.behaviorName') }}
								</p>
								<p class="text-xs text-neutral-500">
									{{ $t('home.hero.behaviorShort') }}
								</p>
							</div>
						</div>
					</div>
				</div>
				<div
					class="relative lg:h-[600px] flex flex-col items-center justify-center gap-6"
				>
					<!-- Decorative background elements -->
					<div
						class="absolute inset-0 bg-gradient-to-tr from-gray-50 to-white rounded-[2rem] transform rotate-3 scale-95 border border-gray-100"
					></div>

					<div
						class="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-neutral-200/50 overflow-hidden ring-1 ring-neutral-900/5"
					>
						<div
							class="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white/50"
						>
							<div class="flex items-center gap-2">
								<div class="h-3 w-3 rounded-full bg-red-400"></div>
								<div class="h-3 w-3 rounded-full bg-amber-400"></div>
								<div class="h-3 w-3 rounded-full bg-emerald-400"></div>
							</div>
							<span class="text-xs font-medium text-neutral-400">{{
								$t('home.hero.demo')
							}}</span>
						</div>
						<div class="p-6 space-y-6">
							<!-- Interviewer Message -->
							<div class="flex items-start gap-4">
								<div
									class="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-600 ring-2 ring-white shadow-sm"
								>
									<UIcon name="i-heroicons-user" class="w-5 h-5" />
								</div>
								<div class="flex-1 space-y-1">
									<div class="flex items-center gap-2">
										<span class="text-sm font-semibold text-neutral-900">{{
											$t('home.hero.interviewer')
										}}</span>
										<span class="text-xs text-neutral-400">{{
											$t('home.hero.justNow')
										}}</span>
									</div>
									<div
										class="p-4 rounded-2xl rounded-tl-none bg-white border border-neutral-100 shadow-sm text-neutral-700 text-sm leading-relaxed"
									>
										{{ $t('home.hero.demoQuestion') }}
									</div>
								</div>
							</div>

							<!-- AI Analysis Message -->
							<div class="flex items-start gap-4">
								<div
									class="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-emerald-600 ring-2 ring-white shadow-sm"
								>
									<UIcon name="i-heroicons-sparkles" class="w-5 h-5" />
								</div>
								<div class="flex-1 space-y-1">
									<div class="flex items-center gap-2">
										<span class="text-sm font-semibold text-neutral-900">{{
											$t('home.hero.assistant')
										}}</span>
										<span
											class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700"
											>{{ $t('home.hero.score') }}</span
										>
									</div>
									<div
										class="p-4 rounded-2xl rounded-tl-none bg-emerald-50/50 border border-emerald-100/50 text-emerald-950 text-sm leading-relaxed"
									>
										<p>
											<span class="font-medium text-emerald-800">{{
												$t('home.hero.feedbackLabel')
											}}</span>
											{{ $t('home.hero.feedback') }}
										</p>
										<div class="mt-3 flex gap-2">
											<span
												class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white text-emerald-600 border border-emerald-100"
												>{{ $t('home.hero.addData') }}</span
											>
											<span
												class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white text-emerald-600 border border-emerald-100"
												>{{ $t('home.hero.addComparison') }}</span
											>
										</div>
									</div>
								</div>
							</div>
						</div>
						<!-- Input placeholder -->
						<div class="p-4 border-t border-neutral-50 bg-neutral-50/50">
							<div
								class="h-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center px-4 text-sm text-neutral-400"
							>
								{{ $t('home.hero.answerPlaceholder') }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import LiveInterviewCount from './LiveInterviewCount.vue'
</script>

<style scoped></style>
