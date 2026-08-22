# useGlobalModal 使用说明

`useGlobalModal` 是一个命令式调用 `UModal` 的工具，只在浏览器环境运行。它会在调用处动态创建一个 Nuxt 兼容的 Vue 实例，用来渲染弹窗。

## 快速上手

```vue
<script setup>
import { useGlobalModal } from '@/composables/useGlobalModal'

const { showModal } = useGlobalModal()

const handleClick = () => {
	showModal({
		title: '确认提交',
		description: '提交后将生成专属题库，无法撤销。',
		content: '是否继续？',
		buttons: [
			{
				label: '取消',
				color: 'gray',
				variant: 'ghost',
				onClick: () => console.log('cancel')
			},
			{
				label: '确认',
				color: 'primary',
				onClick: async () => {
					await doSubmit()
				}
			}
		],
		onClose: (reason) => console.log('modal closed:', reason)
	})
}
</script>
```

## API

### `showModal(options)`

返回一个控制对象 `{ close(reason?: string) }`，可手动关闭弹窗。

`options` 可选项：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | UModal 标题 |
| `description` | `string` | UModal 描述 |
| `content` | `string` | 文本内容，支持换行 |
| `contentComponent` | `Component` | 自定义组件内容，优先级高于 `content` |
| `contentProps` | `Record<string, any>` | 传给 `contentComponent` 的 props |
| `buttons` | `ButtonOption[]` | 自定义按钮列表（见下方说明） |
| `ui` | `Record<string, any>` | 透传给 `UModal` 的 `ui` 配置 |
| `centered` | `boolean` | 是否居中展示文字内容，默认 `false` |
| `preventClose` | `boolean` | 禁止点击遮罩关闭 |
| `onClose(reason)` | `Function` | 弹窗关闭回调，`reason` 可能是 `action` / `dismiss` / `programmatic` 等 |

### ButtonOption

```ts
type ButtonOption = {
	label: string
	icon?: string
	color?: string        // 默认 primary
	variant?: string      // 默认 solid
	size?: string         // 默认 md
	block?: boolean       // 默认 false
	class?: string        // 额外 class
	closeOnClick?: boolean // 默认 true
	disabled?: boolean
	onClick?: () => void | false | Promise<void | false>
	reason?: string       // 点击关闭时透传给 onClose
}
```

如果未传 `buttons`，会根据 `onCancel` / `onConfirm` 等旧参数自动创建“取消 / 确认”按钮。

### 控制器

```js
const modal = showModal({ ... })
modal.close('manual') // 手动关闭并触发 onClose('manual')
```

## 注意事项

- 只在浏览器环境运行；在 SSR 阶段调用会被忽略。
- 默认按钮在移动端纵向、桌面端右对齐横向排列。
- 支持异步按钮：`onClick` 返回 Promise 且返回 `false` 可阻止自动关闭。***

