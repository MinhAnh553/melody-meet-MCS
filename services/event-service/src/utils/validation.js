import Joi from 'joi';

export const validateCreateEvent = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Tên sự kiện không được để trống',
        'any.required': 'Tên sự kiện là bắt buộc',
    }),
    background: Joi.string().required().messages({
        'string.empty': 'Hình nền không được để trống',
        'any.required': 'Hình nền là bắt buộc',
    }),
    location: Joi.object({
        venueName: Joi.string().required().messages({
            'string.empty': 'Tên địa điểm không được để trống',
            'any.required': 'Tên địa điểm là bắt buộc',
        }),
        province: Joi.string().required().messages({
            'string.empty': 'Tỉnh/Thành phố không được để trống',
            'any.required': 'Tỉnh/Thành phố là bắt buộc',
        }),
        district: Joi.string().required().messages({
            'string.empty': 'Quận/Huyện không được để trống',
            'any.required': 'Quận/Huyện là bắt buộc',
        }),
        ward: Joi.string().required().messages({
            'string.empty': 'Phường/Xã không được để trống',
            'any.required': 'Phường/Xã là bắt buộc',
        }),
        address: Joi.string().required().messages({
            'string.empty': 'Địa chỉ không được để trống',
            'any.required': 'Địa chỉ là bắt buộc',
        }),
    }),
    description: Joi.string().required().messages({
        'string.empty': 'Mô tả không được để trống',
        'any.required': 'Mô tả là bắt buộc',
    }),
    organizer: Joi.object({
        logo: Joi.string().required().messages({
            'string.empty': 'Logo ban tổ chức không được để trống',
            'any.required': 'Logo ban tổ chức là bắt buộc',
        }),
        name: Joi.string().required().messages({
            'string.empty': 'Tên tổ chức không được để trống',
            'any.required': 'Tên tổ chức là bắt buộc',
        }),
        info: Joi.string().required().messages({
            'string.empty': 'Thông tin tổ chức không được để trống',
            'any.required': 'Thông tin tổ chức là bắt buộc',
        }),
    }),
    ticketTypes: Joi.array().items(
        Joi.object({
            name: Joi.string().required().messages({
                'string.empty': 'Tên vé không được để trống',
                'any.required': 'Tên vé là bắt buộc',
            }),
            price: Joi.number().required().messages({
                'number.base': 'Giá vé phải là số',
                'any.required': 'Giá vé là bắt buộc',
            }),
            totalQuantity: Joi.number().required().messages({
                'number.base': 'Tổng số lượng vé phải là số',
                'any.required': 'Tổng số lượng vé là bắt buộc',
            }),
            maxPerUser: Joi.number().required().messages({
                'number.base': 'Số lượng vé tối đa mỗi người phải là số',
                'any.required': 'Số lượng vé tối đa mỗi người là bắt buộc',
            }),
            description: Joi.string().required().messages({
                'string.empty': 'Thông tin vé không được để trống',
                'any.required': 'Thông tin vé là bắt buộc',
            }),
        }),
    ),
    endTime: Joi.date().required().messages({
        'date.base': 'Ngày kết thúc phải là ngày',
        'any.required': 'Ngày kết thúc là bắt buộc',
    }),
});
