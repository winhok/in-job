<template>
	<section id="steps" class="py-10 md:py-22 overflow-hidden">
		<div class="container px-4">
			<div class="mx-auto max-w-2xl text-center mb-16">
				<h2
					class="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight"
				>
					{{ $t('home.steps.title') }}
				</h2>
				<p class="mt-4 text-lg text-neutral-600">
					{{ $t('home.steps.description') }}
				</p>
			</div>
			<div class="relative mt-12">
				<!-- Connecting line for desktop -->
				<div
					class="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-neutral-100 -translate-y-1/2 z-0"
				></div>

				<div class="grid md:grid-cols-3 gap-8 relative z-10">
					<div
						class="group bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg transition-all duration-300"
					>
						<div
							class="w-12 h-12 rounded-full bg-primary-50 text-primary-600 font-bold text-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ring-4 ring-white"
						>
							1
						</div>
						<h3 class="text-xl font-semibold text-neutral-900 mb-3">
							{{ $t('home.steps.oneTitle') }}
						</h3>
						<p class="text-neutral-600 leading-relaxed">
							{{ $t('home.steps.oneDesc') }}
						</p>
					</div>
					<div
						class="group bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg transition-all duration-300"
					>
						<div
							class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 font-bold text-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ring-4 ring-white"
						>
							2
						</div>
						<h3 class="text-xl font-semibold text-neutral-900 mb-3">
							{{ $t('home.steps.twoTitle') }}
						</h3>
						<p class="text-neutral-600 leading-relaxed">
							{{ $t('home.steps.twoDesc') }}
						</p>
					</div>
					<div
						class="group bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg transition-all duration-300"
					>
						<div
							class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 font-bold text-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ring-4 ring-white"
						>
							3
						</div>
						<h3 class="text-xl font-semibold text-neutral-900 mb-3">
							{{ $t('home.steps.threeTitle') }}
						</h3>
						<p class="text-neutral-600 leading-relaxed">
							{{ $t('home.steps.threeDesc') }}
						</p>
					</div>
				</div>
			</div>
			<div class="mt-16 text-center">
				<UButton
					color="primary"
					size="xl"
					to="/interview/start"
					class="px-8 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all font-semibold"
					>{{ $t('home.steps.cta') }}</UButton
				>
			</div>
		</div>
	</section>
</template>

<script setup></script>

<style scoped></style>
