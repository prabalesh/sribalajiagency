import { TestBed } from '@angular/core/testing';
import { CmsService } from './cms.service';
import { ApiService } from '../../api/api.service';

describe('CmsService', () => {
    let service: CmsService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

        TestBed.configureTestingModule({
            providers: [
                CmsService,
                { provide: ApiService, useValue: spy }
            ]
        });

        service = TestBed.inject(CmsService);
        apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch home CMS data', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: { title: 'Home' } } as any));
        const res = await service.getHomeCMS();
        expect(res.title).toBe('Home');
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/home-cms');
    });

    it('should update home CMS data', async () => {
        apiServiceSpy.put.and.returnValue(Promise.resolve({ data: {} } as any));
        await service.updateHomeCMS({ title: 'New' });
        expect(apiServiceSpy.put).toHaveBeenCalledWith('/home-cms', { title: 'New' });
    });

    it('should upload CMS file', async () => {
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { url: 'img_url' } } as any));
        const res = await service.uploadCmsFile(new File([], 'h.png'));
        expect(res.url).toBe('img_url');
        expect(apiServiceSpy.post).toHaveBeenCalled();
    });

    it('should delete CMS file', async () => {
        apiServiceSpy.post.and.returnValue(Promise.resolve({} as any));
        await service.deleteCmsFile('url1');
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/home-cms/delete-file', { url: 'url1' });
    });
});
