import { IsEmail, IsString, IsUUID, MinLength } from "class-validator";
export class CredentialsDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(12) password!: string;
}
export class SessionIdDto {
  @IsUUID() id!: string;
}
