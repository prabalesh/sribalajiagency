import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    enabledPaymentMethods?: string[];

    @IsOptional()
    @IsBoolean()
    allowCod?: boolean;

    @IsOptional()
    @IsBoolean()
    allowOnline?: boolean;
}
