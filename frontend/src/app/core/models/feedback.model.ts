export interface Feedback {
    id: string;
    userName: string;
    email?: string;
    rating: number;
    comment: string;
    isApproved: boolean; // For moderation
    createdAt: Date;
}
