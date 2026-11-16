import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class ShopDto {
  @IsString()
  @IsNotEmpty({ message: 'Bitte gib einen Namen für den Shop ein.' })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export class NewBookDto {
  @IsString()
  @IsNotEmpty({ message: 'Bitte gib einen Titel ein.' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Bitte gib einen Autor ein.' })
  author!: string;

  @IsString()
  @IsNotEmpty({ message: 'Bitte gib eine ISBN ein.' })
  isbn!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  publishedYear?: number;
}

export class CreateOfferDto {
  /** Either an existing book … */
  @IsOptional()
  @IsInt()
  bookId?: number;

  /** … or a new one. */
  @IsOptional()
  @ValidateNested()
  @Type(() => NewBookDto)
  newBook?: NewBookDto;

  @IsInt()
  @Min(1, { message: 'Der Preis muss größer als 0 sein.' })
  priceCents!: number;

  @IsInt()
  @Min(0)
  @Max(100000)
  stock!: number;
}

export class UpdateOfferDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  priceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  stock?: number;
}

export class UpdateOrderStatusDto {
  @IsIn(['OPEN', 'PROCESSED'])
  status!: 'OPEN' | 'PROCESSED';
}
