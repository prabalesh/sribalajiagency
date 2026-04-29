import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HomeSlideDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  linkText?: string;

}

export class SocialLinkDto {
  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  icon: string;
}

export class UpdateHeroDto {
  @IsEnum(['classic', 'carousel', 'split', 'overlay', 'classic-carousel'])
  heroType: 'classic' | 'carousel' | 'split' | 'overlay' | 'classic-carousel';


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
}

export class UpdateAboutDto {
  @IsOptional()
  @IsString()
  aboutTitle?: string;

  @IsOptional()
  @IsString()
  aboutContent?: string;

  @IsOptional()
  @IsString()
  aboutImage?: string;
}

export class UpdateSocialLinksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks: SocialLinkDto[];
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateVisibilityDto {
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
}

export class UpdateHomeCmsDto {
  @IsOptional()
  @IsEnum(['classic', 'carousel', 'split', 'overlay', 'classic-carousel'])
  heroType?: 'classic' | 'carousel' | 'split' | 'overlay' | 'classic-carousel';

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

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
