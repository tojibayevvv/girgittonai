import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class AiMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  text: string;
}

export class AiCartItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class AiChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiMessageDto)
  messages: AiMessageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiCartItemDto)
  cart: AiCartItemDto[];
}
