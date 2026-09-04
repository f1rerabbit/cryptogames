import { IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";
import { ProviderEventType, SettlementResult } from "@cg/db";
export class ProviderCallbackDto {
  @IsString() @Length(8, 128) eventId!: string;
  @IsString() @Length(8, 128) providerSessionId!: string;
  @IsString() @Length(8, 128) providerRoundId!: string;
  @IsEnum(ProviderEventType) type!: ProviderEventType;
  @IsOptional() @IsEnum(SettlementResult) scenario?: SettlementResult;
}
export class ScenarioDto {
  @IsEnum(SettlementResult) scenario!: SettlementResult;
}
export class ProviderIdDto {
  @Matches(/^[0-9a-f-]{36}$/i) id!: string;
}
