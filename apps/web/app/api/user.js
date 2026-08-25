/**
 * 更新用户信息
 * @returns {Promise}
 */
export const updateUserInfoAPI = ($api, body) => {
	return $api('/user/profile', {
		method: 'PUT',
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
export const getPaymentRecordsAPI = ($api, query = {}) => {
	return $api('/user/transactions', {
		method: 'GET',
		query
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

export const claimShareRewardAPI = ($api) => {
	return $api('/user/share-reward', {
		method: 'POST',
		body: { source: 'profile_share' }
	})
}
