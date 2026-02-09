export interface SiteSettings {
    id: number;
    enabledPaymentMethods: string[];
    allowCod: boolean;
    allowOnline: boolean;
    updatedAt: Date;
}