import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from "class-validator";
export class AdjustmentDto {
  @IsString() @Matches(/^[1-9][0-9]*$/) amount!: string;
  @IsString() @Length(3, 200) reason!: string;
  @IsString() @Length(3, 100) ticket!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}
export class AdminIdDto {
  @Matches(/^[0-9a-f-]{36}$/i) id!: string;
}
export class GamePatchDto {
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() @Matches(/^[1-9][0-9]*$/) minBet?: string;
  @IsOptional() @IsString() @Matches(/^[1-9][0-9]*$/) maxBet?: string;
  @IsOptional() @IsInt() @Min(0) @Max(10000) sortOrder?: number;
}
