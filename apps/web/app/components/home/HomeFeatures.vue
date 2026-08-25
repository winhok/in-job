<template>
	<section class="py-10 md:py-22 bg-neutral-50/50">
		<div class="container px-4">
			<div class="mx-auto max-w-3xl text-center mb-16">
				<h2
					class="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight"
				>
					{{ $t('home.services.coverageTitle') }}
				</h2>
				<p class="mt-4 text-lg text-neutral-600">
					{{ $t('home.services.coverageDesc') }}
				</p>
			</div>
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
				<!-- 服务 1: 面试押题 -->
				<div
					class="group p-8 bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border-2 border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
				>
					<div
						class="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-200"
					>
						<UIcon name="i-heroicons-document-text" class="w-6 h-6" />
					</div>
					<div class="flex items-center gap-2 mb-2">
						<h3 class="text-xl font-bold text-neutral-900">
							{{ $t('home.services.quiz') }}
						</h3>
						<span
							class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold"
							>{{ $t('home.services.core') }}</span
						>
					</div>
					<p class="mt-3 text-neutral-600 leading-relaxed">
						{{ $t('home.services.quizFeatureDesc') }}
					</p>
				</div>

				<!-- 服务 2: 专项面试 -->
				<div
					class="group p-8 bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl border-2 border-emerald-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
				>
					<div
						class="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-200"
					>
						<UIcon name="i-heroicons-bolt" class="w-6 h-6" />
					</div>
					<div class="flex items-center gap-2 mb-2">
						<h3 class="text-xl font-bold text-neutral-900">
							{{ $t('home.services.special') }}
						</h3>
						<span
							class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold"
							>{{ $t('home.services.core') }}</span
						>
					</div>
					<p class="mt-3 text-neutral-600 leading-relaxed">
						{{ $t('home.services.specialFeatureDesc') }}
					</p>
				</div>

				<!-- 服务 3: 行测 + HR 面试 -->
				<div
					class="group p-8 bg-gradient-to-br from-purple-50/50 to-white rounded-2xl border-2 border-purple-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
				>
					<div
						class="h-12 w-12 rounded-xl bg-purple-500 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-200"
					>
						<UIcon name="i-heroicons-chat-bubble-left-right" class="w-6 h-6" />
					</div>
					<div class="flex items-center gap-2 mb-2">
						<h3 class="text-xl font-bold text-neutral-900">
							{{ $t('home.services.behavior') }}
						</h3>
						<span
							class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold"
							>{{ $t('home.services.core') }}</span
						>
					</div>
					<p class="mt-3 text-neutral-600 leading-relaxed">
						{{ $t('home.services.behaviorFeatureDesc') }}
					</p>
				</div>

				<!-- 补充特性 -->
				<div
					class="group p-8 bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
				>
					<div
						class="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
					>
						<UIcon name="i-heroicons-chart-pie" class="w-6 h-6" />
					</div>
					<h3 class="text-xl font-semibold text-neutral-900">
						{{ $t('home.services.structuredReport') }}
					</h3>
					<p class="mt-3 text-neutral-600 leading-relaxed">
						{{ $t('home.services.structuredReportDesc') }}
					</p>
				</div>

				<div
					class="group p-8 bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
				>
					<div
						class="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
					>
						<UIcon name="i-heroicons-sparkles" class="w-6 h-6" />
					</div>
					<h3 class="text-xl font-semibold text-neutral-900">
						{{ $t('home.services.realisticStyle') }}
					</h3>
					<p class="mt-3 text-neutral-600 leading-relaxed">
						{{ $t('home.services.realisticStyleDesc') }}
					</p>
				</div>

				<div
					class="group p-8 bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
				>
					<div
						class="h-12 w-12 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
					>
						<UIcon name="i-heroicons-shield-check" class="w-6 h-6" />
					</div>
					<h3 class="text-xl font-semibold text-neutral-900">
						{{ $t('home.services.privacy') }}
					</h3>
					<p class="mt-3 text-neutral-600 leading-relaxed">
						{{ $t('home.services.privacyDesc') }}
					</p>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts"></script>

<style scoped></style>
