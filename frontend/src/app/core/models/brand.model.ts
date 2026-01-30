export interface Brand {
    id: string;
    name: string;
    slug: string;
    image?: string;
    logoUrl?: string;
    description?: string;
}

export interface Model {
    id: string;
    name: string;
    brandId: string;
    specs?: Record<string, any>;
}
