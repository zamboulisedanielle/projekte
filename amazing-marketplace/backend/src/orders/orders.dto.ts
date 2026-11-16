import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty({ message: 'Bitte gib den Namen des Empfängers ein.' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Bitte gib Straße und Hausnummer ein.' })
  street!: string;

  @Matches(/^\d{4,5}$/, { message: 'Die Postleitzahl hat 4 oder 5 Ziffern.' })
  zip!: string;

  @IsString()
  @IsNotEmpty({ message: 'Bitte gib den Ort ein.' })
  city!: string;

  @IsOptional()
  @IsString()
  country?: string;
}
