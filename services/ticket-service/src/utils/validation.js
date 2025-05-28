import Joi from 'joi';

export const validateCreateBulkTicket = Joi.object({
    tickets: Joi.array()
        .items(
            Joi.object({
                ticketCode: Joi.string().required(),
                userId: Joi.string().required(),
                eventId: Joi.string().required(),
                orderId: Joi.string().required(),
                ticketTypeId: Joi.string().required(),
                used: Joi.boolean().default(false),
                usedAt: Joi.date().allow(null),
                createdAt: Joi.date().required(),
                updatedAt: Joi.date().required(),
            }),
        )
        .required(),
});
