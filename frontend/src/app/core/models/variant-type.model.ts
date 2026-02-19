export interface VariantType {
    id: string;
    name: string;
    displayName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateVariantTypeDto {
    name: string;
    displayName?: string;
}

export interface UpdateVariantTypeDto extends Partial<CreateVariantTypeDto> { }
