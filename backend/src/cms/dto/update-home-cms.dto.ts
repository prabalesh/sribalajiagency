import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

class HomeSlideDto {
    @IsString()
    title: string;

    @IsString()
    subtitle: string;

    @IsString()
    badge: string;

    @IsString()
    image: string;

    @IsString()
    @IsUrl()
    link: string;

    @IsString()
    linkText: string;
}

class SocialLinkDto {
    @IsString()
    platform: string;

    @IsUrl()
    url: string;

    @IsString()
    icon: string;
}

export class UpdateHomeCmsDto {
    @IsOptional()
    @IsEnum(['standard', 'carousel'])
    heroType?: 'standard' | 'carousel';

    @IsOptional()
    @IsString()
    heroBadge?: string;

    @IsOptional()
    @IsString()
    heroTitle?: string;

    @IsOptional()
    @IsString()
    heroSubtitle?: string;

    @IsOptional()
    @IsString()
    heroImage?: string;

    @IsOptional()
    @IsString()
    heroLink?: string;

    @IsOptional()
    @IsString()
    heroLinkText?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HomeSlideDto)
    heroSlides?: HomeSlideDto[];

    @IsOptional()
    @IsBoolean()
    showCategories?: boolean;

    @IsOptional()
    @IsBoolean()
    showFeatured?: boolean;

    @IsOptional()
    @IsBoolean()
    showBrands?: boolean;

    @IsOptional()
    @IsBoolean()
    showTrustMarkers?: boolean;

    @IsOptional()
    @IsString()
    aboutTitle?: string;

    @IsOptional()
    @IsString()
    aboutContent?: string;

    @IsOptional()
    @IsString()
    aboutImage?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SocialLinkDto)
    socialLinks?: SocialLinkDto[];
}
