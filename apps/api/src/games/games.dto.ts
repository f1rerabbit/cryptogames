import { IsString, Length, Matches } from "class-validator";
export class WagerDto {
  @IsString() @Matches(/^[1-9][0-9]*$/) stake!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}
export class SettlementDto {
  @IsString() @Length(8, 128) idempotencyKey!: string;
}
export class IdDto {
  @Matches(/^[0-9a-f-]{36}$/i) id!: string;
}
export class SlugDto {
  @Matches(/^[a-z0-9-]{2,64}$/) slug!: string;
}
