import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, NgOptimizedImage],
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit, OnDestroy {
    @Input() cms: any;

    // Lucide icons
    readonly ChevronLeft = ChevronLeft;
    readonly ChevronRight = ChevronRight;

    currentSlideIndex = 0;
    private slideInterval: any;
    private touchStartX = 0;
    private touchEndX = 0;

    ngOnInit() {
        const isCarouselType = this.cms?.heroType === 'carousel' || this.cms?.heroType === 'classic-carousel';
        if (isCarouselType && this.cms?.heroSlides?.length > 1) {
            this.startSlideShow();
        }
    }

    ngOnDestroy() {
        this.stopSlideShow();
    }

    startSlideShow() {
        this.stopSlideShow();
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }

    stopSlideShow() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }

    nextSlide() {
        if (this.cms?.heroSlides && this.cms.heroSlides.length > 0) {
            this.currentSlideIndex = (this.currentSlideIndex + 1) % this.cms.heroSlides.length;
        }
    }

    prevSlide() {
        if (this.cms?.heroSlides && this.cms.heroSlides.length > 0) {
            this.currentSlideIndex = (this.currentSlideIndex - 1 + this.cms.heroSlides.length) % this.cms.heroSlides.length;
        }
    }

    goToSlide(index: number) {
        this.currentSlideIndex = index;
        this.startSlideShow(); // Restart the timer when manually changing slides
    }

    // Get alignment CSS value from alignment string
    getAlignment(alignment: string): string {
        const alignmentMap: { [key: string]: string } = {
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
        return alignmentMap[alignment] || 'center';
    }

    // Touch handlers for swipe gestures
    onTouchStart(event: TouchEvent) {
        this.touchStartX = event.changedTouches[0].screenX;
        this.stopSlideShow();
    }

    onTouchEnd(event: TouchEvent) {
        this.touchEndX = event.changedTouches[0].screenX;
        this.handleSwipe();
        this.startSlideShow();
    }

    private handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }

    // Pause on hover (desktop only)
    @HostListener('mouseenter')
    onMouseEnter() {
        const isCarouselType = this.cms?.heroType === 'carousel' || this.cms?.heroType === 'classic-carousel';
        if (isCarouselType && this.cms?.heroSlides?.length > 1) {
            this.stopSlideShow();
        }
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        const isCarouselType = this.cms?.heroType === 'carousel' || this.cms?.heroType === 'classic-carousel';
        if (isCarouselType && this.cms?.heroSlides?.length > 1) {
            this.startSlideShow();
        }
    }
}
