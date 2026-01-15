export interface Brand {
    id: string;
    name: string;
    logoUrl?: string;
    description?: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string; // URL friendly name e.g. 'ceiling-fans'
    parentId?: string; // For nested categories
    description?: string;
    imageUrl?: string;
}

export interface Model {
    id: string;
    name: string;
    brandId: string;
    specs?: Record<string, any>;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    brandId: string;
    modelId?: string;
    categoryId: string; // Link to Category
    price?: number;
    imageUrls: string[];
    isAvailable: boolean;
}

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
    productIds?: string[];
    messages: Message[];
    status: 'Open' | 'Closed';
    createdAt: Date;
}

export interface Feedback {
    id: string;
    userName: string;
    email?: string;
    rating: number;
    comment: string;
    isApproved: boolean; // For moderation
    createdAt: Date;
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // In real app, don't store plain text
    role: 'admin' | 'user';
    createdAt: Date;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'Delivered' | 'Processing' | 'Cancelled';
    date: Date;
}
