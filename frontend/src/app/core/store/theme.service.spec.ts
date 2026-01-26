import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';

describe('ThemeService', () => {
    let service: ThemeService;

    beforeEach(() => {
        // Mock localStorage
        const store: { [key: string]: string } = {};
        spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
        spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => store[key] = value);

        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jasmine.createSpy().and.returnValue({
                matches: false,
                addEventListener: jasmine.createSpy(),
                removeEventListener: jasmine.createSpy()
            })
        });

        TestBed.configureTestingModule({
            providers: [
                ThemeService,
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        });
        service = TestBed.inject(ThemeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.theme()).toBe('light');
    });

    it('should toggle theme', () => {
        service.toggleTheme();
        expect(service.theme()).toBe('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

        service.toggleTheme();
        expect(service.theme()).toBe('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should load theme from localStorage on init', () => {
        (localStorage.getItem as jasmine.Spy).and.returnValue('dark');
        const newService = new ThemeService('browser' as any);
        expect(newService.theme()).toBe('dark');
    });

    it('should use system preference if no saved theme', () => {
        (localStorage.getItem as jasmine.Spy).and.returnValue(null);
        (window.matchMedia as jasmine.Spy).and.returnValue({ matches: true }); // Prefer dark

        const newService = new ThemeService('browser' as any);
        expect(newService.theme()).toBe('dark');
    });
});
