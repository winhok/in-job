/**
 * 生成订单
 * amount: 金额
 * description: 订单描述
 * channel：支付渠道，alipay, wechat
 * planId：套餐id
 * planName：套餐名称
 * source：来源，web, h5
 */
export const createOrderAPI = ($api, body) => {
	return $api(`/payment/order`, {
		method: 'POST',
		body
	})
}

/**
 * 查询订单支付状态
 * orderId：订单id
 * channel：支付渠道，alipay, wechat
 */
export const queryOrderStatusAPI = ($api, body) => {
	return $api(`/payment/order/status`, {
		method: 'POST',
		body
	})
}
