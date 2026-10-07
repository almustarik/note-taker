import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/pagination.js';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class NotesQueryDto extends PaginationDto {
  // admin only: scope=all lists everyone's notes
  @IsOptional()
  @IsIn(['mine', 'all'])
  scope?: 'mine' | 'all';
}
