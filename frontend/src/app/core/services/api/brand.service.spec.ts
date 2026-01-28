import { TestBed } from '@angular/core/testing';
import { BrandService } from './brand.service';
import { ApiService } from '../../api/api.service';
import { Brand } from '../../models/brand.model';

describe('BrandService', () => {
  let service: BrandService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        BrandService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(BrandService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch brands', async () => {
    const mockBrands: Brand[] = [{ id: 'b1', name: 'B1' } as any];
    apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockBrands } as any));

    const result = await service.getBrands();
    expect(result).toEqual(mockBrands);
    expect(apiServiceSpy.get).toHaveBeenCalledWith('/products/brands');
  });

  it('should get brand by id', async () => {
    const mockBrand = { id: 'b1' } as any;
    apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockBrand } as any));
    const res = await service.getBrandById('b1');
    expect(res).toEqual(mockBrand);
  });

  it('should add a brand', async () => {
    const brand = { name: 'B' } as any;
    apiServiceSpy.post.and.returnValue(Promise.resolve({ data: brand } as any));
    await service.addBrand(brand);
    expect(apiServiceSpy.post).toHaveBeenCalledWith('/products/brands', brand);
  });

  it('should upload brand image', async () => {
    apiServiceSpy.post.and.returnValue(Promise.resolve({ data: {} } as any));
    await service.uploadBrandImage('b1', new File([], 'f.png'));
    expect(apiServiceSpy.post).toHaveBeenCalled();
  });

  it('should delete brand', async () => {
    apiServiceSpy.delete.and.returnValue(Promise.resolve({} as any));
    await service.deleteBrand('b1');
    expect(apiServiceSpy.delete).toHaveBeenCalledWith('/products/brands/b1');
  });
});
