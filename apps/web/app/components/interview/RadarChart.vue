<template>
	<div class="radar-chart relative w-full h-full flex items-center justify-center">
		<!-- SVG 图表 -->
		<svg
			:width="size"
			:height="size"
			viewBox="-100 -100 200 200"
			class="overflow-visible"
		>
			<!-- 网格背景 (多边形) -->
			<g class="grid-layer">
				<polygon
					v-for="level in levels"
					:key="level"
					:points="getPolygonPoints(level)"
					fill="none"
					stroke="#e5e7eb"
					stroke-width="1"
					class="transition-all duration-300"
				/>
				<!-- 轴线 -->
				<line
					v-for="(point, index) in axisPoints"
					:key="`axis-${index}`"
					x1="0"
					y1="0"
					:x2="point.x"
					:y2="point.y"
					stroke="#e5e7eb"
					stroke-width="1"
				/>
			</g>

			<!-- 数据区域 -->
			<g class="data-layer">
				<!-- 数据多边形填充 -->
				<polygon
					:points="dataPointsString"
					fill="rgba(79, 70, 229, 0.2)"
					stroke="#4f46e5"
					stroke-width="2"
					class="drop-shadow-sm transition-all duration-500 ease-out"
				/>
				<!-- 数据点 -->
				<circle
					v-for="(point, index) in dataPoints"
					:key="`point-${index}`"
					:cx="point.x"
					:cy="point.y"
					r="3"
					fill="#4f46e5"
					stroke="white"
					stroke-width="2"
					class="cursor-pointer transition-all duration-300 hover:r-5"
				>
					<title>
						{{ data[index].dimension }}: {{ data[index].score }}
					</title>
				</circle>
			</g>

			<!-- 标签文字 -->
			<g class="labels-layer">
				<text
					v-for="(label, index) in labelPoints"
					:key="`label-${index}`"
					:x="label.x"
					:y="label.y"
					text-anchor="middle"
					dominant-baseline="middle"
					class="text-[10px] fill-gray-600 font-medium"
					:style="{ fontSize: '10px' }"
				>
					{{ data[index].dimension }}
				</text>
				<!-- 分数 -->
				<text
					v-for="(label, index) in labelPoints"
					:key="`score-${index}`"
					:x="label.x"
					:y="label.y + 12"
					text-anchor="middle"
					dominant-baseline="middle"
					class="text-[10px] fill-primary-600 font-bold"
					:style="{ fontSize: '10px' }"
				>
					{{ data[index].score }}
				</text>
			</g>
		</svg>
	</div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	data: {
		type: Array,
		required: true,
		default: () => []
		// 格式: [{ dimension: '技术能力', score: 80 }, ...]
	},
	size: {
		type: Number,
		default: 300
	}
})

// 雷达图层级（网格圈数）
const levels = 4
const radius = 80 // 半径

// 计算角度
const angleSlice = computed(() => (Math.PI * 2) / props.data.length)

// 获取多边形顶点坐标 (用于绘制网格)
const getPolygonPoints = (level) => {
	const levelRadius = (radius / levels) * level
	return props.data
		.map((_, i) => {
			const angle = i * angleSlice.value - Math.PI / 2 // -PI/2 为了从正上方开始
			return `${levelRadius * Math.cos(angle)},${
				levelRadius * Math.sin(angle)
			}`
		})
		.join(' ')
}

// 轴线终点坐标
const axisPoints = computed(() => {
	return props.data.map((_, i) => {
		const angle = i * angleSlice.value - Math.PI / 2
		return {
			x: radius * Math.cos(angle),
			y: radius * Math.sin(angle)
		}
	})
})

// 数据点坐标
const dataPoints = computed(() => {
	return props.data.map((item, i) => {
		const angle = i * angleSlice.value - Math.PI / 2
		// 假设分数是 0-100
		const scoreRadius = (item.score / 100) * radius
		return {
			x: scoreRadius * Math.cos(angle),
			y: scoreRadius * Math.sin(angle)
		}
	})
})

// 数据多边形路径字符串
const dataPointsString = computed(() => {
	return dataPoints.value.map((p) => `${p.x},${p.y}`).join(' ')
})

// 标签坐标
const labelPoints = computed(() => {
	const labelRadius = radius + 20 // 标签距离圆心的距离
	return props.data.map((_, i) => {
		const angle = i * angleSlice.value - Math.PI / 2
		return {
			x: labelRadius * Math.cos(angle),
			y: labelRadius * Math.sin(angle)
		}
	})
})
</script>

<style scoped>
.radar-chart {
	font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
		'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>

