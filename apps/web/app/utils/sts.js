import OSS from 'ali-oss'
import { getSts } from '@/api/sys'

export const getOSSClient = async ($api) => {
	const { AccessKeyId, AccessKeySecret, SecurityToken } = await getSts($api)
	return new OSS({
		// yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
		region: 'oss-cn-beijing',
		// 从STS服务获取的临时访问密钥（AccessKey ID和AccessKey Secret）。
		accessKeyId: AccessKeyId,
		accessKeySecret: AccessKeySecret,
		// 从STS服务获取的安全令牌（SecurityToken）。
		stsToken: SecurityToken,
		// 填写Bucket名称。
		bucket: 'ww-zhi-dao'
		// // 刷新 token，在 token 过期后自动调用（但是并不生效，可能会在后续的版本中修复）
		// refreshSTSToken: async () => {
		// 	// 向您搭建的STS服务获取临时访问凭证。
		// 	const res = await getSts()
		// 	return {
		// 		accessKeyId: AccessKeyId,
		// 		accessKeySecret: AccessKeySecret,
		// 		stsToken: SecurityToken
		// 	}
		// },
		// // 刷新临时访问凭证的时间间隔，单位为毫秒。
		// refreshSTSTokenInterval: 5 * 1000
	})
}
