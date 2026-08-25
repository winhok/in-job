/**
 * 获取 OSS 上传凭证
 */
export const getSts = ($api) => {
	return $api('/sts/getStsToken')
}
