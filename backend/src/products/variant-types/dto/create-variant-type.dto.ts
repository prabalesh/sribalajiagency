import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVariantTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}
