import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/pagination.js';
import { IsStrongPassword } from '../../common/password.js';
import { Role } from '../../common/role.enum.js';
import { toInterests, toLower } from '../../common/transforms.js';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Transform(toLower)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @Transform(toInterests)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests?: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(toLower)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsStrongPassword()
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @Transform(toInterests)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests?: string[];
}

export class InterestsQueryDto extends PaginationDto {
  // ?interest=chess,reading
  @IsOptional()
  @Transform(({ value }) =>
    String(value)
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
  )
  @IsArray()
  @ArrayMaxSize(20)
  interest?: string[];
}
