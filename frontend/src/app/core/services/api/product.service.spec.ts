import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';
import { ApiService } from '../../api/api.service';
import { Product } from '../../models/product.model';

describe('ProductService', () => {
    let service: ProductService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

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
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products');
    });

    it('should get product by id', async () => {
        const mockProduct = { id: '1', name: 'P1' } as any;
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockProduct } as any));

        const result = await service.getProductById('1');
        expect(result).toEqual(mockProduct);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products/1');
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
        expect(apiServiceSpy.put).toHaveBeenCalledWith('/products/1', product);
    });

    it('should delete a product', async () => {
        apiServiceSpy.delete.and.returnValue(Promise.resolve({} as any));
        await service.deleteProduct('1');
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('/products/1');
    });

    it('should upload image', async () => {
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: {} } as any));
        await service.uploadImage('1', new File([], 'img.png'), true);
        expect(apiServiceSpy.post).toHaveBeenCalled();
    });

    it('should delete image', async () => {
        apiServiceSpy.delete.and.returnValue(Promise.resolve({} as any));
        await service.deleteImage('img1');
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('/products/images/img1');
    });

    it('should get products by category', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: [] } as any));
        await service.getProductsByCategory('cat1');
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products', { categoryId: 'cat1' });
    });

    it('should search products', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: [] } as any));
        await service.searchProducts('query');
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products', { q: 'query' });
    });
});
