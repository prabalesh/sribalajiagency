export interface LocationRestriction {
    id: string;
    state: string;
    city?: string;
    zipcode?: string;
    isAllowed: boolean;
}
