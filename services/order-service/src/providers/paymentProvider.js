import dotenv from 'dotenv';
import PayOS from '@payos/node';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import moment from 'moment';
import qs from 'qs';
import { VNPay, ignoreLogger } from 'vnpay';

dotenv.config();

const YOUR_DOMAIN = process.env.FONTEND_URL;

const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY,
);

const ZaloPay = {
    app_id: '2554',
    key1: 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn',
    key2: 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf',
    endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
    callback_url: 'link webhook',
};

const vnpay = new VNPay({
    // ⚡ Cấu hình bắt buộc
    tmnCode: 'GSSH88UZ',
    secureSecret: 'K707ZDJQ3HTKIR9FJFZF6SNQYINMT66F',
    vnpayHost: 'https://sandbox.vnpayment.vn',

    // 🔧 Cấu hình tùy chọn
    testMode: true, // Chế độ test
    hashAlgorithm: 'SHA512', // Thuật toán mã hóa
    enableLog: true, // Bật/tắt log
    loggerFn: ignoreLogger, // Custom logger

    // 🔧 Custom endpoints
    endpoints: {
        paymentEndpoint: 'paymentv2/vpcpay.html',
        queryDrRefundEndpoint: 'merchant_webapi/api/transaction',
        getBankListEndpoint: 'qrpayauth/api/merchant/get_bank_list',
    },
});

// Sắp xếp object theo key
const sortObjDataByKey = (object) => {
    const orderedObject = Object.keys(object)
        .sort()
        .reduce((obj, key) => {
            obj[key] = object[key];
            return obj;
        }, {});
    return orderedObject;
};

// Chuyển object thành chuỗi query
const convertObjToQueryStr = (object) => {
    return Object.keys(object)
        .filter((key) => object[key] !== undefined)
        .map((key) => {
            let value = object[key];
            // Sắp xếp mảng
            if (value && Array.isArray(value)) {
                value = JSON.stringify(
                    value.map((val) => sortObjDataByKey(val)),
                );
            }
            // Set empty string nếu null
            if ([null, undefined, 'undefined', 'null'].includes(value)) {
                value = '';
            }

            return `${key}=${value}`;
        })
        .join('&');
};

const randomTransId = (method = 'payos') => {
    const time = moment().format('YYMMDD');
    const random = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');
    if (method == 'payos') {
        return `${time}${random}`;
    }
    if (method == 'zalopay') {
        return `${time}_${random}`;
    }
};

// 1. Payos
const createPayOSOrder = async (order) => {
    const orderCode = parseInt(randomTransId('payos'));
    const payload = {
        orderCode,
        buyerName: order.buyerInfo.name,
        buyerEmail: order.buyerInfo.email,
        buyerPhone: order.buyerInfo.phone,
        amount: order.totalPrice,
        items: order.tickets,
        description: 'Melody Meet',
        expiredAt: Math.floor(new Date(order.expiredAt).getTime() / 1000),
        returnUrl: `${YOUR_DOMAIN}/event/${order.eventId}/bookings/${order._id}/payment-success`,
        cancelUrl: `${YOUR_DOMAIN}/event/${order.eventId}/bookings/${order._id}/payment-info`,
    };

    try {
        const paymentLinkResponse = await payOS.createPaymentLink(payload);

        return {
            // redirectUrl: paymentLinkResponse.checkoutUrl,
            transactionId: orderCode,
            paymentPayosLinkResponse: paymentLinkResponse,
        };
    } catch (error) {
        console.error(error);
        return { success: false, message: error.message };
    }
};

const verifyWebhookSignature = (data, checksumKey) => {
    try {
        const { signature, data: webhookData } = data;
        const sortedDataByKey = sortObjDataByKey(webhookData);
        const dataQueryStr = convertObjToQueryStr(sortedDataByKey);

        const calculatedSignature = CryptoJS.HmacSHA256(
            dataQueryStr,
            checksumKey,
        ).toString(CryptoJS.enc.Hex);

        return calculatedSignature === signature;
    } catch (error) {
        console.error('Verify webhook signature error:', error);
        return false;
    }
};

// 2. ZaloPay
const createZaloPayOrder = async (order) => {
    const app_id = ZaloPay.app_id;
    const key1 = ZaloPay.key1;
    const endpoint = ZaloPay.endpoint;
    const callback_url = ZaloPay.callback_url;

    const timestamp = Date.now();

    const app_trans_id = randomTransId('zalopay');

    const items = JSON.stringify(
        order.tickets.map((ticket) => ({
            itemid: ticket.ticketId,
            itemname: ticket.name,
            itemprice: ticket.price,
            itemquantity: ticket.quantity,
        })),
    );

    const embed_data = JSON.stringify({
        redirecturl: `${YOUR_DOMAIN}/event/${order.eventId}/bookings/${order._id}/payment-verify`,
    });

    const dataToSign = [
        app_id,
        app_trans_id,
        order.userId || 'guest',
        order.totalPrice,
        timestamp,
        embed_data,
        items,
    ].join('|');

    const payload = {
        app_id,
        app_trans_id,
        app_user: order.userId || 'guest',
        app_time: timestamp,
        expire_duration_seconds: Math.floor(
            (new Date(order.expiredAt).getTime() - timestamp) / 1000,
        ),
        item: items,
        embed_data,
        amount: order.totalPrice,
        callback_url,
        description: `Melody Meet - Thanh toán đơn hàng #${order.orderCode}`,
        bank_code: '',
        mac: CryptoJS.HmacSHA256(dataToSign, key1).toString(),
        title: 'Thanh toán Melody Meet',
        phone: order.buyerInfo.phone,
        email: order.buyerInfo.email,
    };

    try {
        const res = await axios.post(endpoint, null, { params: payload });

        if (res.data.return_code === 1) {
            return {
                redirectUrl: res.data.order_url,
                transactionId: app_trans_id,
            };
        } else {
            throw new Error(res.data.sub_return_message || 'ZaloPay failed');
        }
    } catch (error) {
        console.error('[ZaloPay ERROR]', error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};

// 3. VNPay
const createVNPayOrder = async (order, req) => {
    const transactionId = randomTransId();
    const paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: order.totalPrice,
        vnp_IpAddr:
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.ip,
        vnp_TxnRef: transactionId,
        vnp_OrderInfo: `Thanh toan Melody Meet #${order.orderCode}`,
        vnp_OrderType: 190003,
        vnp_ReturnUrl: `${YOUR_DOMAIN}/event/${order.eventId}/bookings/${order._id}/payment-verify`,
        vnp_Locale: 'vn', // 'vn' hoặc 'en'
        vnp_CreateDate: moment(order.createdAt).format('YYYYMMDDHHmmss'),
        vnp_ExpireDate: moment(order.expiredAt).format('YYYYMMDDHHmmss'),
    });

    return {
        redirectUrl: paymentUrl,
        transactionId: transactionId,
    };
    // try {
    //     const res = await axios.post(endpoint, null, { params: payload });

    //     if (res.data.return_code === 1) {

    //     } else {
    //         throw new Error(res.data.sub_return_message || 'ZaloPay failed');
    //     }
    // } catch (error) {
    //     console.error('[ZaloPay ERROR]', error.response?.data || error.message);
    //     return { success: false, message: error.message };
    // }
};

const verifyVNPayReturnUrl = async (query) => {
    let verify;
    try {
        verify = vnpay.verifyReturnUrl(query);
        if (!verify.isVerified) {
            return {
                success: false,
                message: 'Xác thực tính toàn vẹn dữ liệu thất bại',
            };
        }
        if (!verify.isSuccess) {
            return {
                success: false,
                message: 'Đơn hàng thanh toán thất bại',
            };
        }
    } catch (error) {
        return {
            success: false,
            message: 'Dữ liệu không hợp lệ',
        };
    }

    return {
        success: true,
        message: 'Xác thực URL trả về thành công',
    };
};

const verifyZaloPayReturnUrl = async (query) => {
    const app_trans_id = query.apptransid;

    let postData = {
        app_id: ZaloPay.app_id,
        app_trans_id,
    };

    let data =
        postData.app_id + '|' + postData.app_trans_id + '|' + ZaloPay.key1; // appid|app_trans_id|key1
    postData.mac = CryptoJS.HmacSHA256(data, ZaloPay.key1).toString();

    try {
        const res = await axios.post(
            'https://sb-openapi.zalopay.vn/v2/query',
            qs.stringify(postData),
        );

        if (res.data.return_code === 1) {
            return {
                success: true,
                message: 'Đơn hàng đã được thanh toán!',
            };
        } else if (res.data.return_code === 2) {
            return {
                success: false,
                message: 'Giao dịch hết hạn thanh toán!',
            };
        }
        if (res.data.return_code === 3) {
            return {
                success: false,
                message: 'Đơn hàng chưa thanh toán hoặc giao dịch đang xử lý!',
            };
        }
    } catch (error) {
        console.error('[ZaloPay ERROR]', error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};

export default {
    createPayOSOrder,
    verifyWebhookSignature,
    createZaloPayOrder,
    verifyZaloPayReturnUrl,
    createVNPayOrder,
    verifyVNPayReturnUrl,
};
