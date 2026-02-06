import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateBrandDto {
    @IsString()
    @MinLength(1, { message: 'Brand name must not be empty' })
    name: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateBrandDto {
    @IsOptional()
    @IsString()
    @MinLength(1, { message: 'Brand name must not be empty' })
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
