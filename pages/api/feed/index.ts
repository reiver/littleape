const request = require('request');

export default function handler(req, res) {
	const {url} = req.query
	return request({ url, method: req.method }).pipe(res);
}
