import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(6)
  public username: string;

  @IsString()
  @Length(6)
  public password: string;
}

export class RegisterDto {
  @IsString()
  @Length(2)
  public firstName: string;

  @IsString()
  @Length(2)
  public lastName: string;

  @IsEmail()
  public email: string;

  @IsString()
  @Length(6)
  public username: string;

  @Length(6)
  public password: string;
}
