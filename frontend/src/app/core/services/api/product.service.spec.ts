import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';
import { ApiService } from '../api/api.service';
import { Product, Category, Brand } from '../models/models';

describe('ProductService', () => {
    let service: ProductService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'patch', 'delete']);

        TestBed.configureTestingModule({
            providers: [
                ProductService,
                { provide: ApiService, useValue: spy }
            ]
        });

        service = TestBed.inject(ProductService);
        apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch products', async () => {
        const mockProducts: Product[] = [{ id: '1', name: 'P1' } as any];
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockProducts } as any));

        const result = await service.getProducts();
        expect(result).toEqual(mockProducts);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products', undefined);
    });

    it('should add a product', async () => {
        const product = { name: 'New' } as any;
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { id: '2', ...product } } as any));

        const result = await service.addProduct(product);
        expect(result.id).toBe('2');
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/products', product);
    });

    it('should update a product', async () => {
        const product = { id: '1', name: 'Updated' } as any;
        apiServiceSpy.put.and.returnValue(Promise.resolve({ data: product } as any));

        const result = await service.updateProduct(product);
        expect(result.name).toBe('Updated');
    });

    it('should delete a product', async () => {
        apiServiceSpy.delete.and.returnValue(Promise.resolve());
        await service.deleteProduct('1');
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('/products/1');
    });

    it('should fetch categories', async () => {
        const mockCats: Category[] = [{ id: 'c1', name: 'C1' } as any];
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockCats } as any));

        const result = await service.getCategories();
        expect(result.length).toBe(1);
    });

    it('should add a category', async () => {
        const cat = { name: 'New Cat' } as any;
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: cat } as any));
        await service.addCategory(cat);
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/categories', cat);
    });

    it('should update a category', async () => {
        const cat = { id: 'c1', name: 'Updated' } as any;
        apiServiceSpy.put.and.returnValue(Promise.resolve({ data: cat } as any));
        await service.updateCategory(cat);
        expect(apiServiceSpy.put).toHaveBeenCalledWith('/categories/c1', cat);
    });

    it('should delete a category', async () => {
        apiServiceSpy.delete.and.returnValue(Promise.resolve());
        await service.deleteCategory('c1');
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('/categories/c1');
    });

    it('should fetch brands', async () => {
        const mockBrands: Brand[] = [{ id: 'b1', name: 'B1' } as any];
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockBrands } as any));
        const res = await service.getBrands();
        expect(res.length).toBe(1);
    });

    it('should add a brand', async () => {
        const brand = { name: 'B' } as any;
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: brand } as any));
        await service.addBrand(brand);
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/brands', brand);
    });

    it('should upload brand image', async () => {
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { id: 'b1', image: 'url' } } as any));
        await service.uploadBrandImage('b1', new File([], 'f.png'));
        expect(apiServiceSpy.post).toHaveBeenCalled();
    });

    it('should fetch and update CMS', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: {} } as any));
        await service.getHomeCMS();
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/cms/home');

        apiServiceSpy.put.and.returnValue(Promise.resolve({ data: {} } as any));
        await service.updateHomeCMS({});
        expect(apiServiceSpy.put).toHaveBeenCalledWith('/cms/home', {});
    });

    it('should search products', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: [] } as any));
        await service.searchProducts('query');
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products/search', { q: 'query' });
    });
});
