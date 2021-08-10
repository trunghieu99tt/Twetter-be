import { applyDecorators } from "@nestjs/common";
import { ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiUnauthorizedResponse } from "@nestjs/swagger";

export const ApiCommonDecorator = () =>
    applyDecorators(
        ApiUnauthorizedResponse({
            description: 'Unauthorized',
        }),
        ApiForbiddenResponse({
            description: 'Forbidden',
        }),
        ApiInternalServerErrorResponse({
            description: 'Internal Server Error',
        })
    )