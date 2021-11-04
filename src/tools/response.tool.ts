import { MSG } from "../common/config/constants";
import { ResponseDTO } from "../common/dto/response.dto";
import { HttpException } from "@nestjs/common";

export class ResponseTool {
    static RESPONSE(data: any, total?: number): ResponseDTO {
        return {
            data,
            total,
        };
    }

    static GET_OK(data: any, total?: number, message: string = MSG.RESPONSE.GET_REQUEST_OK): ResponseDTO {
        return {
            data,
            total,
            message,
            statusCode: 200,
        };
    }

    static POST_OK(data: any, total?: number, message: string = MSG.RESPONSE.POST_REQUEST_OK): ResponseDTO {
        return {
            data,
            total,
            message,
            statusCode: 200,
        };
    }

    static CREATED(data: any, message: string = MSG.RESPONSE.CREATED): ResponseDTO {
        return {
            data,
            message,
            statusCode: 201,
        };
    }

    static PUT_OK(data: any, message: string = MSG.RESPONSE.PUT_REQUEST_OK): ResponseDTO {
        return {
            data,
            message,
            statusCode: 200,
        };
    }

    static DELETE_OK(data: any, message: string = MSG.RESPONSE.DELETE_REQUEST_OK): ResponseDTO {
        return {
            data,
            message,
            statusCode: 200,
        };
    }

    static PATCH_OK(data: any, message: string = MSG.RESPONSE.PATCH_REQUEST_OK): ResponseDTO {
        return {
            data,
            message,
            statusCode: 200,
        };
    }

    static ERROR(error: HttpException, statusCode: number, message?: string): ResponseDTO {
        return {
            error,
            message,
            statusCode,
        };
    }

    static BAD_REQUEST(message: string, error: HttpException): ResponseDTO {
        return {
            error,
            message,
            statusCode: 400,
        };
    }

    static UNAUTHORIZED(message: string, error: HttpException): ResponseDTO {
        return {
            error,
            message,
            statusCode: 401,
        };
    }

    static NOT_FOUND(message: string, error: HttpException): ResponseDTO {
        return {
            error,
            message,
            statusCode: 404,
        };
    }

    static CONFLICT(message: string, error: HttpException): ResponseDTO {
        return {
            error,
            message,
            statusCode: 409,
        };
    }
}
