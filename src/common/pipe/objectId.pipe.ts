import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ObjectIdPipeTransform implements PipeTransform {
  constructor() {}
  async transform(value: any) {
    if (value === null || value === undefined) {
      return null;
    }

    if (Types.ObjectId.isValid(value)) return value;

    throw new BadRequestException(
      ObjectIdPipeTransform.name,
      'Id is not objectId',
    );
  }
}
