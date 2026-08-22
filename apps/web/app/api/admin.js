/**
 * 返回当前时间点进行模拟面试的人数
 */
export const getMockInterviewCountAPI = ($api) => {
	return $api('/admin/interview-count', {
		method: 'GET'
	})
}
