import { TestBed } from '@angular/core/testing';
import { LocationService } from './location.service';
import { ApiService } from '../api/api.service';

describe('LocationService', () => {
    let service: LocationService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
        TestBed.configureTestingModule({
            providers: [
                LocationService,
                { provide: ApiService, useValue: spy }
            ]
        });
        service = TestBed.inject(LocationService);
        apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it('should check location availability', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: true } as any));
        const res = await service.checkLocation('TAMIL NADU', 'CHENNAI');
        expect(res).toBeTrue();
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/locations/check', { state: 'TAMIL NADU', city: 'CHENNAI' });
    });
});
