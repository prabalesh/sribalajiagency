import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateLocationRestrictionDto {
    @IsString()
    @IsNotEmpty()
    state: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    zipcode?: string;

    @IsBoolean()
    @IsOptional()
    isAllowed?: boolean;
}
