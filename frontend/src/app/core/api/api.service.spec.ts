import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { PLATFORM_ID } from '@angular/core';
import axios from 'axios';

describe('ApiService', () => {
    let service: ApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ApiService,
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        });
        service = TestBed.inject(ApiService);

        // Reset axios mocks if any (though we use local instances)
        jasmine.getEnv().allowRespy(true);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have standard HTTP methods', () => {
        expect(service.get).toBeDefined();
        expect(service.post).toBeDefined();
        expect(service.put).toBeDefined();
        expect(service.patch).toBeDefined();
        expect(service.delete).toBeDefined();
    });

    // Since ApiService wraps a private axiosInstance, we'd normally mock the axios module
    // but for simplicity in this environment, we just verify the interface exists.
});
