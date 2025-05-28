import dotenv from 'dotenv';
import PayOS from '@payos/node';
import { createHmac } from 'crypto';
dotenv.config();

const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY,
);

const createPayOSOrder = async (userInfo, order, tickets) => {
    const YOUR_DOMAIN = process.env.FONTEND_URL;

    const body = {
        orderCode: parseInt(order.orderCode),
        buyerName: userInfo.name,
        buyerEmail: userInfo.email,
        buyerPhone: userInfo.phone,
        amount: order.totalPrice,
        items: tickets,
        description: 'Melody Meet',
        expiredAt: Math.floor(new Date(order.expiredAt).getTime() / 1000),
        returnUrl: `${YOUR_DOMAIN}/orders/payment-success`,
        cancelUrl: `${YOUR_DOMAIN}/orders/payment-cancel`,
    };

    try {
        const paymentLinkResponse = await payOS.createPaymentLink(body);

        return paymentLinkResponse.checkoutUrl;
    } catch (error) {
        console.error(error);
        return { success: false, message: error.message };
    }
};

const getInfoPayOSOrder = async (orderCode) => {
    try {
        const order = await payOS.getPaymentLinkInformation(orderCode);
        if (!order) {
            return {
                success: false,
                message: 'Không tìm thấy đơn hàng!',
            };
        }

        return {
            success: true,
            data: order,
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
        const calculatedSignature = createHmac('sha256', checksumKey)
            .update(dataQueryStr)
            .digest('hex');

        return calculatedSignature === signature;
    } catch (error) {
        console.error('Verify webhook signature error:', error);
        return false;
    }
};

export default {
    createPayOSOrder,
    getInfoPayOSOrder,
    verifyWebhookSignature,
};
