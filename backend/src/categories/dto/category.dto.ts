import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty({ message: 'Category name is required' })
    name: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}

export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Category name cannot be empty' })
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}
