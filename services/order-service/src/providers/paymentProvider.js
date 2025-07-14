import dotenv from 'dotenv';
import PayOS from '@payos/node';
import CryptoJS from 'crypto-js';
dotenv.config();

const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY,
);

const createPayOSOrder = async (order) => {
    const YOUR_DOMAIN = process.env.FONTEND_URL;
    const timestamp = Date.now(); // ví dụ: 1720855374685
    const random2 = Math.floor(10 + Math.random() * 90); // 2 số: 10–99
    const orderCode = `${timestamp}${random2}`; // ví dụ: '172085537468552'

    const body = {
        orderCode: parseInt(orderCode),
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
        const paymentLinkResponse = await payOS.createPaymentLink(body);

        return {
            redirectUrl: paymentLinkResponse.checkoutUrl,
            transactionId: orderCode,
        };
    } catch (error) {
        console.error(error);
        return { success: false, message: error.message };
    }
};

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

export default {
    createPayOSOrder,
    verifyWebhookSignature,
};
