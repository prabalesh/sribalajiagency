import { TestBed } from '@angular/core/testing';
import { CategoryService } from './category.service';
import { ApiService } from '../../api/api.service';
import { Category } from '../../models/category.model';

describe('CategoryService', () => {
    let service: CategoryService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

        TestBed.configureTestingModule({
            providers: [
                CategoryService,
                { provide: ApiService, useValue: spy }
            ]
        });

        service = TestBed.inject(CategoryService);
        apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch categories', async () => {
        const mockCats: Category[] = [{ id: 'c1', name: 'C1' } as any];
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockCats } as any));

        const result = await service.getCategories();
        expect(result).toEqual(mockCats);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products/categories');
    });

    it('should add a category', async () => {
        const cat = { name: 'New' } as any;
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { id: 'c2', ...cat } } as any));

        const result = await service.addCategory(cat);
        expect(result.id).toBe('c2');
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/products/categories', cat);
    });

    it('should update a category', async () => {
        const cat = { id: 'c1', name: 'Updated' } as any;
        apiServiceSpy.put.and.returnValue(Promise.resolve({ data: cat } as any));

        const result = await service.updateCategory(cat);
        expect(result.name).toBe('Updated');
        expect(apiServiceSpy.put).toHaveBeenCalledWith('/products/categories/c1', cat);
    });

    it('should delete a category', async () => {
        apiServiceSpy.delete.and.returnValue(Promise.resolve({} as any));
        await service.deleteCategory('c1');
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('/products/categories/c1');
    });

    it('should get categories by parent id', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: [] } as any));
        await service.getCategoriesByParentId('p1');
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products/categories', { parentId: 'p1' });
    });

    it('should get category by slug', async () => {
        const mockCats = [{ id: 'c1', slug: 's1' }];
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockCats } as any));
        const res = await service.getCategoryBySlug('s1');
        expect(res).toEqual(mockCats[0] as any);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products/categories', { slug: 's1' });
    });
});
