/**
 * 生成微信扫码登录二维码
 * @returns {Promise}
 */
export const generateWechatQRCodeAPI = ($api) => {
	return $api('/wechat/qrcode', {
		method: 'post'
	})
}

/**
 * 检查微信扫码状态
 * @param {string} qrCodeId 二维码ID
 * @returns {Promise}
 */
export const checkWechatQRCodeStatusAPI = ($api, qrCodeId) => {
	return $api(`/wechat/check-qr-status?id=${qrCodeId}`, {
		method: 'GET'
	})
}
