import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string) {
    if (!isValidObjectId(value) || !/^[a-f\d]{24}$/i.test(value)) {
      throw new BadRequestException('Invalid id');
    }
    return new Types.ObjectId(value);
  }
}
