const crypto = require('crypto');
const https = require('https');

class TencentHunyuan {
    constructor(secretId, secretKey) {
        this.secretId = secretId;
        this.secretKey = secretKey;
        this.host = 'hunyuan.tencentcloudapi.com';
        this.region = 'ap-beijing';
        this.service = 'hunyuan';
        this.version = '2023-09-01';
    }

    async chat(messages, model = 'hunyuan-lite') {
        const action = 'ChatCompletions';
        const timestamp = Math.floor(Date.now() / 1000);
        const date = this._getDate(timestamp);

        const payload = JSON.stringify({
            Model: model,
            Messages: messages,
            Stream: false
        });

        const authorization = this._sign(action, date, timestamp, payload);

        const options = {
            hostname: this.host,
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TC-Action': action,
                'X-TC-Timestamp': timestamp.toString(),
                'X-TC-Version': this.version,
                'X-TC-Region': this.region,
                'Authorization': authorization
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.Response && result.Response.Choices) {
                            resolve(result.Response.Choices[0].Message.Content);
                        } else {
                            reject(new Error(result.Response?.Error?.Message || 'Unknown error'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.write(payload);
            req.end();
        });
    }

    _getDate(timestamp) {
        const date = new Date(timestamp * 1000);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    _sign(action, date, timestamp, payload) {
        const algorithm = 'TC3-HMAC-SHA256';
        const credentialScope = `${date}/${this.service}/tc3_request`;

        const canonicalRequest = this._getCanonicalRequest(action, payload);
        const stringToSign = this._getStringToSign(algorithm, timestamp, credentialScope, canonicalRequest);
        const signature = this._getSignature(date, stringToSign);

        return `${algorithm} Credential=${this.secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;
    }

    _getCanonicalRequest(action, payload) {
        const canonicalUri = '/';
        const canonicalQueryString = '';
        const canonicalHeaders = `content-type:application/json\nhost:${this.host}\n`;
        const signedHeaders = 'content-type;host';
        const hashedRequestPayload = crypto.createHash('sha256').update(payload).digest('hex');

        return `POST\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;
    }

    _getStringToSign(algorithm, timestamp, credentialScope, canonicalRequest) {
        const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
        return `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
    }

    _getSignature(date, stringToSign) {
        const kDate = crypto.createHmac('sha256', 'TC3' + this.secretKey).update(date).digest();
        const kService = crypto.createHmac('sha256', kDate).update(this.service).digest();
        const kRequest = crypto.createHmac('sha256', kService).update('tc3_request').digest();
        return crypto.createHmac('sha256', kRequest).update(stringToSign).digest('hex');
    }
}

module.exports = TencentHunyuan;
