import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    public theme = signal<'light' | 'dark'>('light');
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);

        if (this.isBrowser) {
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
            if (savedTheme) {
                this.setTheme(savedTheme);
            } else {
                this.setTheme('light');
            }
        }
    }

    get currentTheme() {
        return this.theme.asReadonly();
    }

    toggleTheme() {
        this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
    }

    private setTheme(theme: 'light' | 'dark') {
        this.theme.set(theme);
        if (this.isBrowser) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        }
    }
}
