import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RestaurantStatus } from '@prisma/client';

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
