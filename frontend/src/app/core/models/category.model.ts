export interface Category {
    id: string;
    name: string;
    slug: string; // URL friendly name e.g. 'ceiling-fans'
    parentId?: string; // For nested categories
    parent?: Category;
    children?: Category[];
    imageUrl?: string;
}
