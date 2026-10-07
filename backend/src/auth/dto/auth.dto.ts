import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { toInterests, toLower } from '../../common/transforms.js';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(toLower)
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @Transform(toInterests)
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}

export class LoginDto {
  @Transform(toLower)
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @Transform(toInterests)
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
