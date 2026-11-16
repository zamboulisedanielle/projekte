import { IsInt, Max, Min } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  offerId!: number;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number = 1;
}

export class UpdateCartDto {
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}
