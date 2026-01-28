import { signal } from '@angular/core';
import { of } from 'rxjs';

export const mockApiService = {
    get: jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: [] })),
    post: jasmine.createSpy('post').and.returnValue(Promise.resolve({ data: {} })),
    put: jasmine.createSpy('put').and.returnValue(Promise.resolve({ data: {} })),
    patch: jasmine.createSpy('patch').and.returnValue(Promise.resolve({ data: {} })),
    delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve({ data: {} }))
};

export const mockProductService = {
    getProducts: () => Promise.resolve([]),
    getProductById: () => Promise.resolve({}),
    getCategories: () => Promise.resolve([]),
    getBrands: () => Promise.resolve([]),
    getHomeCMS: () => Promise.resolve({}),
    getStoreSettings: () => Promise.resolve({}),
    getCategoriesByParentId: () => Promise.resolve([]),
    getBrandById: () => Promise.resolve({}),
    getProductsByCategory: () => Promise.resolve([]),
    getCategoryBySlug: () => Promise.resolve({}),
    searchProducts: () => Promise.resolve([])
};

export const mockAuthService = {
    user: signal(null),
    isLoggedIn: signal(false),
    isAdmin: signal(false),
    login: (email?: string, password?: string) => Promise.resolve(true),
    register: (name?: string, email?: string, password?: string) => Promise.resolve(true),
    logout: () => Promise.resolve(),
    isAuthenticated: () => false,
    updateProfile: (name: string, email: string) => Promise.resolve(),
    getUsers: () => Promise.resolve([]),
    addUser: (user: any) => Promise.resolve({}),
    updateUser: (user: any) => Promise.resolve({}),
    deleteUser: (id: string) => Promise.resolve({})
};

export const mockCartService = {
    items: signal([]),
    count: signal(0),
    total: signal(0),
    addToCart: () => { },
    removeFromCart: () => { },
    updateQuantity: () => { },
    clearCart: () => { }
};

export const mockThemeService = {
    theme: signal('light'),
    currentTheme: signal('light'),
    toggleTheme: () => { }
};

export const mockActivatedRoute = {
    params: of({}),
    queryParams: of({}),
    paramMap: of({ get: () => null }),
    snapshot: {
        paramMap: { get: () => null }
    }
};
