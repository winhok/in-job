/**
 * 更新用户信息
 * @returns {Promise}
 */
export const updateUserInfoAPI = ($api, body) => {
	return $api('/user/update', {
		method: 'POST',
		body
	})
}

/**
 * 获取用户信息
 */
export const getUserInfoAPI = ($api) => {
	return $api('/user/info', {
		method: 'GET'
	})
}

/**
 * 获取支付记录
 */
export const getPaymentRecordsAPI = ($api, body) => {
	return $api('/user/transactions', {
		method: 'GET',
		body
	})
}

/**
 * 获取消费记录
 */
export const getConsumptionRecordsAPI = ($api) => {
	return $api('/user/consumption-records', {
		method: 'GET'
	})
}
