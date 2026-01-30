import { Directive, Output, EventEmitter, ElementRef, OnInit, OnDestroy, Input, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
    selector: '[appInfiniteScroll]',
    standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
    @Input() threshold: number = 0.5; // Trigger when 50% of the target is visible
    @Output() scrolled = new EventEmitter<void>();

    private observer: IntersectionObserver | undefined;

    constructor(
        private element: ElementRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            const options = {
                root: null, // Use default viewport
                rootMargin: '0px',
                threshold: this.threshold,
            };

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.scrolled.emit();
                    }
                });
            }, options);

            this.observer.observe(this.element.nativeElement);
        }
    }

    ngOnDestroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}
