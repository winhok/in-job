<template>
	<Transition name="fade">
		<button
			v-if="visible"
			type="button"
			class="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 transition hover:translate-y-[-2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
			@click="scrollToTop"
			aria-label="返回顶部"
		>
			<UIcon name="i-heroicons-arrow-up" class="h-5 w-5" />
		</button>
	</Transition>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

const visible = ref(false)

const onScroll = () => {
	visible.value = window.scrollY > 240
}

const scrollToTop = () => {
	window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
	onScroll()
	window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
	window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translateY(8px);
}
</style>
