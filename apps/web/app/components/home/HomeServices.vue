<template>
	<section id="features" class="py-10 md:py-22 bg-white">
		<div class="container px-4">
			<!-- 标题 -->
			<div class="mx-auto max-w-3xl text-center mb-16">
				<div
					class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-medium text-primary-700 mb-6"
				>
					<UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
					{{ $t('home.services.label') }}
				</div>
				<h2
					class="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight"
				>
					{{ $t('home.services.title') }}
				</h2>
				<p class="mt-4 text-lg text-neutral-600">
					{{ $t('home.services.description') }}
				</p>
			</div>

			<!-- 三大服务卡片 -->
			<div class="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
				<!-- 服务 1: 面试押题 -->
				<div
					class="cursor-pointer relative group bg-gradient-to-br from-blue-50 via-white to-blue-50/30 rounded-3xl border-2 border-blue-100 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
					@click="navigateTo('/interview/start')"
				>
					<!-- 角标 -->
					<div
						class="absolute -top-3 -right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
					>
						{{ $t('home.services.prep') }}
					</div>

					<div class="mb-6">
						<div
							class="w-16 h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xl shadow-blue-200"
						>
							<UIcon name="i-heroicons-document-text" class="w-8 h-8" />
						</div>
						<h3 class="text-2xl font-bold text-neutral-900 mb-2">
							{{ $t('home.services.quiz') }}
						</h3>
						<p class="text-sm text-blue-600 font-semibold mb-4">
							{{ $t('home.services.quizMeta') }}
						</p>
					</div>

					<p class="text-neutral-600 leading-relaxed mb-6">
						{{ $t('home.services.quizDesc') }}
					</p>

					<ul class="space-y-3 mb-6">
						<li class="flex items-start gap-2 text-sm">
							<UIcon
								name="i-heroicons-check-circle"
								class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
							/>
							<span>{{ $t('home.services.quizPoint1') }}</span>
						</li>
						<li class="flex items-start gap-2 text-sm">
							<UIcon
								name="i-heroicons-check-circle"
								class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
							/>
							<span>{{ $t('home.services.quizPoint2') }}</span>
						</li>
						<li class="flex items-start gap-2 text-sm">
							<UIcon
								name="i-heroicons-check-circle"
								class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
							/>
							<span>{{ $t('home.services.quizPoint3') }}</span>
						</li>
					</ul>

					<div
						class="pt-4 border-t border-blue-100 flex items-center justify-between text-sm"
					>
						<span class="text-neutral-500">{{
							$t('home.services.bestFor')
						}}</span>
						<span class="font-semibold text-neutral-900">{{
							$t('home.services.quizBestFor')
						}}</span>
					</div>
				</div>

				<!-- 服务 2: 专项面试 -->
				<div
					class="cursor-pointer relative group bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 rounded-3xl border-2 border-emerald-100 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ring-4 ring-emerald-100/50"
					@click="navigateTo('/interview/start')"
				>
					<!-- 推荐角标 -->
					<div
						class="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse"
					>
						{{ $t('home.services.popular') }}
					</div>

					<div class="mb-6">
						<div
							class="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xl shadow-emerald-200"
						>
							<UIcon name="i-heroicons-bolt" class="w-8 h-8" />
						</div>
						<h3 class="text-2xl font-bold text-neutral-900 mb-2">
							{{ $t('home.services.special') }}
						</h3>
						<p class="text-sm text-emerald-600 font-semibold mb-4">
							{{ $t('home.services.specialMeta') }}
						</p>
					</div>

					<p class="text-neutral-600 leading-relaxed mb-6">
						{{ $t('home.services.specialDesc') }}
					</p>

					<ul class="space-y-3 mb-6">
						<li class="flex items-start gap-2 text-sm">
							<UIcon
								name="i-heroicons-check-circle"
								class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
							/>
							<span>{{ $t('home.services.specialPoint1') }}</span>
						</li>
						<li class="flex items-start gap-2 text-sm">
							<UIcon
								name="i-heroicons-check-circle"
								class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
							/>
							<span>{{ $t('home.services.specialPoint2') }}</span>
						</li>
						<li class="flex items-start gap-2 text-sm">
							<UIcon
								name="i-heroicons-check-circle"
								class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
							/>
							<span>{{ $t('home.services.specialPoint3') }}</span>
						</li>
					</ul>

					<div
						class="pt-4 border-t border-emerald-100 flex items-center justify-between text-sm"
					>
						<span class="text-neutral-500">{{
							$t('home.services.bestFor')
						}}</span>
						<span class="font-semibold text-neutral-900">{{
							$t('home.services.specialBestFor')
						}}</span>
					</div>
				</div>

				<!-- 服务 3: 行测 + HR 面试 -->
				<div
					class="cursor-pointer relative group bg-white rounded-3xl border-2 border-purple-100 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
					@click="navigateTo('/interview/start')"
				>
					<!-- 角标 -->
					<div
						class="absolute -top-3 -right-3 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
					>
						{{ $t('home.services.assessment') }}
					</div>

					<div class="mb-6">
						<div
							class="w-16 h-16 rounded-2xl bg-purple-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xl shadow-purple-200"
						>
							<UIcon
								name="i-heroicons-chat-bubble-left-right"
								class="w-8 h-8"
							/>
						</div>
						<h3 class="text-2xl font-bold text-neutral-900 mb-2">
							{{ $t('home.services.behavior') }}
						</h3>
						<p class="text-sm text-purple-600 font-semibold mb-4">
							{{ $t('home.services.behaviorMeta') }}
						</p>
					</div>

					<p class="text-neutral-600 leading-relaxed mb-6">
						{{ $t('home.services.behaviorDesc') }}
					</p>

					<ul class="space-y-3 mb-6">
						<li class="flex items-start gap-2 text-sm">
							<UIcon
								name="i-heroicons-check-circle"
								class="w-5 h-5 text-purple-500 shrink-0 mt-0.5"
							/>
							<span>{{ $t('home.services.behaviorPoint1') }}</span>
						</li>
						<li class="flex items-start gap-2 text-sm">
							<UIcon
								name="i-heroicons-check-circle"
								class="w-5 h-5 text-purple-500 shrink-0 mt-0.5"
							/>
							<span>{{ $t('home.services.behaviorPoint2') }}</span>
						</li>
						<li class="flex items-start gap-2 text-sm">
							<UIcon
								name="i-heroicons-check-circle"
								class="w-5 h-5 text-purple-500 shrink-0 mt-0.5"
							/>
							<span>{{ $t('home.services.behaviorPoint3') }}</span>
						</li>
					</ul>

					<div
						class="pt-4 border-t border-purple-100 flex items-center justify-between text-sm"
					>
						<span class="text-neutral-500">{{
							$t('home.services.bestFor')
						}}</span>
						<span class="font-semibold text-neutral-900">{{
							$t('home.services.behaviorBestFor')
						}}</span>
					</div>
				</div>
			</div>

			<!-- 底部差异化说明 -->
			<div
				class="mt-16 max-w-4xl mx-auto bg-gradient-to-r from-primary-50 to-emerald-50 rounded-2xl p-8 border border-primary-100"
			>
				<div class="flex items-start gap-4">
					<div
						class="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center shrink-0"
					>
						<UIcon name="i-heroicons-light-bulb" class="w-6 h-6" />
					</div>
					<div>
						<h3 class="text-xl font-bold text-neutral-900 mb-3">
							{{ $t('home.services.why') }}
						</h3>
						<div class="grid sm:grid-cols-2 gap-4 text-sm text-neutral-700">
							<div class="flex items-start gap-2">
								<UIcon
									name="i-heroicons-check-badge"
									class="w-5 h-5 text-primary-600 shrink-0 mt-0.5"
								/>
								<div>
									<p class="font-semibold mb-1">
										{{ $t('home.services.fullCoverage') }}
									</p>
									<p class="text-neutral-600">
										{{ $t('home.services.fullCoverageDesc') }}
									</p>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<UIcon
									name="i-heroicons-check-badge"
									class="w-5 h-5 text-primary-600 shrink-0 mt-0.5"
								/>
								<div>
									<p class="font-semibold mb-1">
										{{ $t('home.services.threeInOne') }}
									</p>
									<p class="text-neutral-600">
										{{ $t('home.services.threeInOneDesc') }}
									</p>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<UIcon
									name="i-heroicons-check-badge"
									class="w-5 h-5 text-primary-600 shrink-0 mt-0.5"
								/>
								<div>
									<p class="font-semibold mb-1">
										{{ $t('home.services.fast') }}
									</p>
									<p class="text-neutral-600">
										{{ $t('home.services.fastDesc') }}
									</p>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<UIcon
									name="i-heroicons-check-badge"
									class="w-5 h-5 text-primary-600 shrink-0 mt-0.5"
								/>
								<div>
									<p class="font-semibold mb-1">
										{{ $t('home.services.dataDriven') }}
									</p>
									<p class="text-neutral-600">
										{{ $t('home.services.dataDrivenDesc') }}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup></script>

<style scoped></style>
