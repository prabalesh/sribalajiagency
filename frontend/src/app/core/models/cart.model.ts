// Stored in localStorage and sent to backend (minimal data)
export interface CartItem {
    productId: string;
    variantId?: string;
    quantity: number;
}

// Received from validation endpoint (full data for display)
export interface ValidatedCartItem extends CartItem {
    productName: string;
    variantName?: string;
    price: number;
    stockAvailable: number;
    available: boolean;
    quantityAdjusted: boolean;
    originalQuantity: number;
    imageUrl?: string;
}
