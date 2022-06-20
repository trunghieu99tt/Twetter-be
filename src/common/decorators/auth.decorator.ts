import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { MyTokenAuthGuard } from '../guards/token.guard';

export const Authorization = () =>
  applyDecorators(UseGuards(MyTokenAuthGuard, ApiBearerAuth()));
