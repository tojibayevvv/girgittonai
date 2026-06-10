import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class OrderItemInput {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

// Mijoz (client) buyurtma yuboradi — stol kodi orqali
export class CreateOrderDto {
  @IsString()
  tableCode: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
