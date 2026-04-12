const crypto = require('crypto');
const db = require('../config/db');


function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = obj[str[key]];
    }
    return sorted;
}

class PaymentController {
    /**
     * POST /api/payment/create-url
     */
    async createPaymentUrl(req, res) {
        try {
            const userId = req.user.id;
            const { amount, planId } = req.body; // planId: 'plus' or 'pro'

            if (!amount || !planId) {
                return res.status(400).json({ error: 'Missing amount or planId' });
            }

            process.env.TZ = 'Asia/Ho_Chi_MinH';
            let date = new Date();
            let createDate = date.getFullYear() + 
                ("0" + (date.getMonth() + 1)).slice(-2) + 
                ("0" + date.getDate()).slice(-2) + 
                ("0" + date.getHours()).slice(-2) + 
                ("0" + date.getMinutes()).slice(-2) + 
                ("0" + date.getSeconds()).slice(-2);

            let ipAddr = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;
            
            // Fix for localhost IPv6 and internal IPs that VNPay Sandbox might reject
            if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
                ipAddr = '127.0.0.1';
            }

            let tmnCode = (process.env.VNP_TMN_CODE || "").trim();
            let secretKey = (process.env.VNP_HASH_SECRET || "").trim();
            let vnpUrl = (process.env.VNP_URL || "").trim();
            let returnUrl = (process.env.VNP_RETURN_URL || "").trim();

            let orderId = userId + "_" + Date.now();
            let bankCode = '';
            
            let locale = 'vn';
            let currCode = 'VND';
            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = tmnCode;
            vnp_Params['vnp_Locale'] = locale;
            vnp_Params['vnp_CurrCode'] = currCode;
            vnp_Params['vnp_TxnRef'] = orderId;
            vnp_Params['vnp_OrderInfo'] = `Thanh toan nang cap tai khoan ${planId} cho user ${userId}`;
            vnp_Params['vnp_OrderType'] = '190000'; // Code for Software/Digital Services
            vnp_Params['vnp_Amount'] = amount * 100; // VNPay requires amount * 100
            vnp_Params['vnp_ReturnUrl'] = returnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['vnp_CreateDate'] = createDate;
            if(bankCode !== null && bankCode !== ''){
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            vnp_Params = sortObject(vnp_Params);
            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex").toUpperCase(); 
            vnp_Params['vnp_SecureHash'] = signed;
            let finalUrl = vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: true });

            console.log('--- VNPAY DEBUG ---');
            console.log('TMN_CODE:', tmnCode);
            console.log('Sign Data:', signData);
            console.log('Hash:', signed);
            console.log('Final URL:', finalUrl);
            console.log('-------------------');

            res.status(200).json({ paymentUrl: finalUrl });
        } catch (error) {
            console.error('Create Payment URL Error:', error);
            res.status(500).json({ error: 'Failed to create payment URL' });
        }
    }

    /**
     * GET /api/payment/vnpay-return
     */
    async vnpayReturn(req, res) {
        try {
            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            let secretKey = (process.env.VNP_HASH_SECRET || "").trim();
            vnp_Params = sortObject(vnp_Params);
            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex").toUpperCase();

            if (secureHash === signed) {
                // Return success or failure based on vnp_ResponseCode
                const responseCode = vnp_Params['vnp_ResponseCode'];
                const txnRef = vnp_Params['vnp_TxnRef'];
                const userId = txnRef.split('_')[0];
                const orderInfo = vnp_Params['vnp_OrderInfo'];

                if (responseCode === "00") {
                    // Success! Update user quota
                    let newQuota = 5 * 1024 * 1024 * 1024;
                    let newPlan = 'free';

                    if (orderInfo.includes('plus')) {
                        newQuota = 15 * 1024 * 1024 * 1024;
                        newPlan = 'plus';
                    } else if (orderInfo.includes('pro')) {
                        newQuota = 50 * 1024 * 1024 * 1024;
                        newPlan = 'pro';
                    }

                    await db.query(
                        'UPDATE users SET plan = $1, storage_quota = $2 WHERE id = $3',
                        [newPlan, newQuota, userId]
                    );

                    return res.status(200).json({ success: true, message: 'Thành toán thành công', code: responseCode });
                } else {
                    return res.status(200).json({ success: false, message: 'Thanh toán thất bại', code: responseCode });
                }
            } else {
                return res.status(200).json({ success: false, message: 'Sai chữ ký bảo mật', code: '97' });
            }
        } catch (error) {
            console.error('VNPay Return Error:', error);
            res.status(500).json({ error: 'Internal Server Error during payment callback' });
        }
    }
}

module.exports = new PaymentController();
