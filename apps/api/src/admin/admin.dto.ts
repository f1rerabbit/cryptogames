import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  IsEnum,
} from "class-validator";
import { RoleName } from "@cg/db";
export class AdjustmentDto {
  @IsString() @Matches(/^[1-9][0-9]*$/) amount!: string;
  @IsString() @Length(3, 200) reason!: string;
  @IsString() @Length(3, 100) ticket!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}
export class GrantExecuteDto {
  @IsString() @Length(64, 64) previewHash!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}
export class CorrectionDto {
  @Matches(/^[0-9a-f-]{36}$/i) originalTransactionId!: string;
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
export class RoleDto {
  @IsEnum(RoleName) role!: RoleName;
}
