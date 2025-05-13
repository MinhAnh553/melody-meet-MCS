import Joi from 'joi';

export const validateRegister = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ.',
        'any.required': 'Email là bắt buộc.',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự.',
        'any.required': 'Mật khẩu là bắt buộc.',
    }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Xác nhận mật khẩu không khớp.',
            'any.required': 'Xác nhận mật khẩu là bắt buộc.',
        }),
});

export const validateVerify = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ.',
        'any.required': 'Email là bắt buộc.',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự.',
        'any.required': 'Mật khẩu là bắt buộc.',
    }),
    code: Joi.string().length(4).required().messages({
        'string.length': 'Mã xác minh phải có 4 ký tự.',
        'any.required': 'Mã xác minh là bắt buộc.',
    }),
});
