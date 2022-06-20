import { applyDecorators, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiProperty,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { QueryGetPipe } from '../pipe/query-get.pipe';

export const ApiPropertyFile = () =>
  ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  });

export const ApiQueryCond = () =>
  ApiQuery({
    name: 'cond',
    required: false,
    description: 'Điều kiện tìm kiếm theo MongoDB',
  });

export const ApiQueryPagination = () =>
  applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      examples: {
        Empty: {},
        Default: { value: 1 },
      },
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      examples: {
        Empty: {},
        Default: { value: 20 },
      },
    }),
  );

export const ApiQuerySort = () =>
  applyDecorators(
    ApiQuery({
      name: 'sort',
      required: false,
      examples: {
        Empty: {},
        'Example 1': { value: '_id createdAt updatedAt' },
        Default: { value: 'updatedAt' },
      },
    }),
    ApiQuery({
      name: 'order',
      required: false,
      examples: {
        Empty: {},
        'Example 1': { value: '-1 1 -1' },
        Default: { value: '-1' },
      },
    }),
  );

export const ApiQueryGetMany = () =>
  applyDecorators(ApiQuerySort(), ApiQueryPagination());

export const ApiQueryGetManyNoCond = () =>
  applyDecorators(ApiQuerySort(), ApiQueryPagination());

export const QueryGet = () => Query(QueryGetPipe);

export const ApiCommonErrors = () =>
  applyDecorators(
    ApiUnauthorizedResponse({
      description: `Thông tin xác thực không chính xác (thông tin đăng nhập hoặc JWT). <a href=/error-example/unauthorized target=_blank style="text-decoration:none"> Ví dụ</a>`,
    }),
    ApiForbiddenResponse({
      description: `Người dùng không được cấp quyền truy cập nguồn nội dung. <a href=/error-example/forbidden target=_blank style="text-decoration:none"> Ví dụ</a>`,
    }),
    ApiInternalServerErrorResponse({
      description: `Lỗi hệ thống. <a href=/error-example/internal-server-error target=_blank style="text-decoration:none"> Ví dụ</a>`,
    }),
  );
