import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  Min,
} from 'class-validator';
import { RestaurantStatus } from '@prisma/client';

// Super admin tomonidan yangi restoran (+ uning admini) yaratish
export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  restaurantName: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(RestaurantStatus)
  status?: RestaurantStatus;

  @IsOptional()
  @IsString()
  planId?: string;
}

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @IsInt()
  @Min(0)
  maxTables: number;

  @IsInt()
  @Min(0)
  maxProducts: number;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxTables?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxProducts?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRestaurantStatusDto {
  @IsEnum(RestaurantStatus)
  status: RestaurantStatus;
}
