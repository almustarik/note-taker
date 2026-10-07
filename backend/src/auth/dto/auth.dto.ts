import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { toInterests, toLower } from '../../common/transforms.js';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Transform(toLower)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @Transform(toInterests)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests?: string[];
}

export class LoginDto {
  @Transform(toLower)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(toInterests)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests?: string[];
}
