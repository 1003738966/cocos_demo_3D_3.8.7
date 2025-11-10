/**
 * 工具类
 */
export class Utils {

    /**
	 * base64字符串转为uint8array
	 */
	base64ToUint8Array(base64String) {
		let padding = '='.repeat((4 - base64String.length % 4) % 4);
		let base64 = (base64String + padding)
			.replace(/\-/g, '+')
			.replace(/_/g, '/');
		let rawData = window.atob(base64);
		let outputArray = new Uint8Array(rawData.length);
		for (var i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

    /**
	 * uint8array转为base64字符串
	 */
	uint8arrayToBase64(u8Arr) {
		let CHUNK_SIZE = 0x8000;
		let index = 0;
		let length = u8Arr.length;
		let result = '';
		let slice;
		while (index < length) {
			slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
			result += String.fromCharCode.apply(null, slice);
			index += CHUNK_SIZE;
		}
		return btoa(result);
	}

	/**
	 * 禁用console
	 */
	rewirteLog() {
		['log', 'warn', 'error', 'info'].forEach((item) => {
		console[item] = (function (func) {
			const res = localStorage.getItem('debug');
			if (res === 'GMV_desk') {
			return func;
			}
			return function () {};
		})(console[item]);
		});
    }
}


