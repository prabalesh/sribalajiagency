export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    roles: Role[];
    createdAt: Date;
}

export interface Permission {
    id: string;
    name: string;
    description?: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: Permission[];
}
