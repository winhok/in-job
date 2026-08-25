/**
 * 判断 对象或数组 是否为空
 */
export const isEmpty = (value) => {
	if (!value) return true
	if (Array.isArray(value)) {
		return value.length === 0
	}
	if (typeof value === 'object') {
		return Object.keys(value).length === 0
	}
	return false
}
