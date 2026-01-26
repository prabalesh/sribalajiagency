export interface Message {
    sender: 'admin' | 'user';
    content: string;
    timestamp: Date;
}

export interface QuotationRequest {
    id: string;
    customerName: string;
    email: string;
    phone: string;
    message: string;
    productName?: string;
    productIds?: string[];
    messages: Message[];
    status: 'Open' | 'Closed';
    createdAt: Date;
}
