import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/pagination.js';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;
}

export class NotesQueryDto extends PaginationDto {
  // admin only: scope=all lists everyone's notes
  @IsOptional()
  @IsIn(['mine', 'all'])
  scope?: 'mine' | 'all';
}
