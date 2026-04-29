import { Component, Input, OnInit, OnDestroy, HostListener, inject, PLATFORM_ID, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, NgOptimizedImage],
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit, OnDestroy, OnChanges {
    @Input() cms: any;

    ngOnChanges(changes: SimpleChanges) {
        if (changes['cms'] && isPlatformBrowser(this.platformId)) {
            this.initAutoPlay();
        }
    }

    readonly ChevronLeft = ChevronLeft;
    readonly ChevronRight = ChevronRight;

    currentSlideIndex = 0;
    private slideInterval: any = null;
    private touchStartX = 0;
    private isAutoPlayEnabled = true;
    private platformId = inject(PLATFORM_ID);

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.initAutoPlay();
        }
    }

    private initAutoPlay() {
        if (this.shouldAutoPlay()) {
            this.stopAutoPlay();
            this.startAutoPlay();
        }
    }

    ngOnDestroy() {
        this.stopAutoPlay();
    }

    private shouldAutoPlay(): boolean {
        return (
            (this.cms?.heroType === 'carousel' || this.cms?.heroType === 'classic-carousel') &&
            this.cms?.heroSlides?.length > 1
        );
    }

    private startAutoPlay() {
        if (!this.isAutoPlayEnabled || this.slideInterval) return;
        
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }

    private stopAutoPlay() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }

    nextSlide() {
        if (this.cms?.heroSlides?.length > 0) {
            this.currentSlideIndex = (this.currentSlideIndex + 1) % this.cms.heroSlides.length;
        }
    }

    prevSlide() {
        if (this.cms?.heroSlides?.length > 0) {
            this.currentSlideIndex = (this.currentSlideIndex - 1 + this.cms.heroSlides.length) % this.cms.heroSlides.length;
        }
    }

    goToSlide(index: number) {
        this.currentSlideIndex = index;
        // Restart auto-play after manual navigation
        this.stopAutoPlay();
        if (this.isAutoPlayEnabled) {
            this.startAutoPlay();
        }
    }

    getAlignment(alignment: string): string {
        const map: Record<string, string> = {
            'top-left': 'flex-start',
            'top-center': 'center',
            'top-right': 'flex-end',
            'center-left': 'flex-start',
            'center': 'center',
            'center-right': 'flex-end',
            'bottom-left': 'flex-start',
            'bottom-center': 'center',
            'bottom-right': 'flex-end'
        };
        return map[alignment] || 'center';
    }

    onTouchStart(event: TouchEvent) {
        this.touchStartX = event.changedTouches[0].screenX;
        this.stopAutoPlay();
    }

    onTouchEnd(event: TouchEvent) {
        const diff = this.touchStartX - event.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? this.nextSlide() : this.prevSlide();
        }
        // Restart auto-play after swipe
        if (this.isAutoPlayEnabled) {
            this.startAutoPlay();
        }
    }

    @HostListener('mouseenter')
    onMouseEnter() {
        // Pause on hover (desktop only)
        this.isAutoPlayEnabled = false;
        this.stopAutoPlay();
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        // Resume on mouse leave
        this.isAutoPlayEnabled = true;
        if (this.shouldAutoPlay()) {
            this.startAutoPlay();
        }
    }
}
