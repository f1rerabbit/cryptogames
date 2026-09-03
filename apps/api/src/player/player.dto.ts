import { IsOptional, IsString, Length, Matches } from "class-validator";
export class ProfileDto {
  @IsOptional() @IsString() @Length(1, 48) displayName?: string;
}
export class CursorDto {
  @IsOptional() @Matches(/^[0-9a-f-]{36}$/i) cursor?: string;
}
export class IdempotencyDto {
  @IsString() @Length(8, 128) idempotencyKey!: string;
}
