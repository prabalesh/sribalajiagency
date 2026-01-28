import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { ApiService } from '../../api/api.service';

describe('SettingsService', () => {
    let service: SettingsService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('ApiService', ['get', 'put']);

        TestBed.configureTestingModule({
            providers: [
                SettingsService,
                { provide: ApiService, useValue: spy }
            ]
        });

        service = TestBed.inject(SettingsService);
        apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch store settings', async () => {
        const mockSettings = { brandName: 'Sri Balaji' };
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockSettings } as any));
        const res = await service.getStoreSettings();
        expect(res).toEqual(mockSettings);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/settings');
    });

    it('should update store settings', async () => {
        apiServiceSpy.put.and.returnValue(Promise.resolve({ data: {} } as any));
        await service.updateStoreSettings({ brandName: 'New' });
        expect(apiServiceSpy.put).toHaveBeenCalledWith('/settings', { brandName: 'New' });
    });
});
