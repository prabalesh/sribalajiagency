export interface Address {
    id: string;
    name: string;
    type: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phonePrimary?: string;
    phoneSecondary?: string;
    lat?: number;
    lng?: number;
    isDefault: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
