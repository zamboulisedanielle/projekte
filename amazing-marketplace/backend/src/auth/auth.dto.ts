import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Das Passwort braucht mindestens 6 Zeichen.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Bitte gib deinen Namen ein.' })
  name!: string;

  @IsIn(['CUSTOMER', 'MERCHANT'])
  role!: 'CUSTOMER' | 'MERCHANT';
}

export class LoginDto {
  @IsEmail({}, { message: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
