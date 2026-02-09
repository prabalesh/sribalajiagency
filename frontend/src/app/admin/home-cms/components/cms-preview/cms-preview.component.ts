import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HomeCMS } from '../../../../core/services/api/cms.service';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-cms-preview',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule],
    template: `
    <div class="preview-container">
      <div class="preview-header">
        <span>Live Hero Preview</span>
        <div class="preview-badge">{{ cms.heroType | uppercase }}</div>
      </div>
      
      <div class="hero-render" [ngClass]="[cms.heroType, 'align-' + (cms.heroContentAlignment || 'center')]">
        @if (cms.heroType === 'carousel' && cms.heroSlides && cms.heroSlides.length > 0) {
          <!-- Simplified Carousel Preview -->
          <div class="hero-carousel">
            @for (slide of cms.heroSlides; track $index) {
              @if ($index === currentSlideIndex) {
                <div class="carousel-slide active" [ngClass]="'align-' + (slide.alignment || cms.heroContentAlignment)">
                  <div class="hero-content">
                    <div class="hero-badge">{{ slide.badge }}</div>
                    <h1 class="hero-title">{{ slide.title }}</h1>
                    <p class="hero-subtitle">{{ slide.subtitle }}</p>
                    <div class="hero-actions">
                      <button class="btn btn-primary">{{ slide.linkText || 'Action' }}</button>
                    </div>
                  </div>
                  <div class="hero-image">
                    <img [src]="getImageUrl(slide.image)" alt="Slide">
                  </div>
                </div>
              }
            }
          </div>
        } @else if (cms.heroType === 'split') {
          <div class="hero-split">
            <div class="split-content hero-content">
              <span class="hero-badge">{{ cms.heroBadge }}</span>
              <h1 class="hero-title">{{ cms.heroTitle }}</h1>
              <p class="hero-subtitle">{{ cms.heroSubtitle }}</p>
              <div class="hero-actions">
                <button class="btn btn-primary">{{ cms.heroLinkText }}</button>
              </div>
            </div>
            <div class="split-image">
              <img [src]="getImageUrl(cms.heroImage)" alt="Hero">
            </div>
          </div>
        } @else if (cms.heroType === 'overlay') {
          <div class="hero-overlay">
            <div class="overlay-bg">
              <img [src]="getImageUrl(cms.heroImage)" alt="Hero">
            </div>
            <div class="overlay-content hero-content">
              <span class="hero-badge">{{ cms.heroBadge }}</span>
              <h1 class="hero-title" style="color: white">{{ cms.heroTitle }}</h1>
              <p class="hero-subtitle" style="color: white">{{ cms.heroSubtitle }}</p>
              <div class="hero-actions">
                <button class="btn btn-primary">{{ cms.heroLinkText }}</button>
              </div>
            </div>
          </div>
        } @else {
          <div class="hero-showcase">
            <div class="hero-content">
              <span class="hero-badge">{{ cms.heroBadge }}</span>
              <h1 class="hero-title">{{ cms.heroTitle }}</h1>
              <p class="hero-subtitle">{{ cms.heroSubtitle }}</p>
              <div class="hero-actions">
                <button class="btn btn-primary">{{ cms.heroLinkText }}</button>
              </div>
            </div>
            <div class="hero-image-wrapper">
              <img [src]="getImageUrl(cms.heroImage)" alt="Hero">
            </div>
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .preview-container {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 2rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .preview-header {
      padding: 0.75rem 1rem;
      background: #2a2a2a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #eee;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .preview-badge {
      background: var(--primary-color);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
    }
    .hero-render {
      height: 400px;
      position: relative;
      background: #f8f9fa;
      overflow: hidden;
      display: flex;
    }
    .hero-content {
      padding: 2rem;
      z-index: 2;
      max-width: 50%;
    }
    .hero-badge { color: var(--primary-color); font-weight: bold; font-size: 0.7rem; margin-bottom: 0.5rem; }
    .hero-title { font-size: 1.5rem; margin: 0.5rem 0; font-weight: 800; line-height: 1.2; }
    .hero-subtitle { font-size: 0.8rem; color: #666; margin-bottom: 1rem; }
    .btn-primary { 
      background: var(--primary-color); color: white; border: none; 
      padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.8rem; cursor: default;
    }
    
    img { width: 100%; height: 100%; object-fit: cover; }
    .hero-image-wrapper, .hero-image { flex: 1; }
    
    .hero-overlay {
      width: 100%; display: flex; align-items: center; justify-content: center;
      .overlay-bg { position: absolute; inset: 0; filter: brightness(0.6); }
      .overlay-content { text-align: center; }
    }
    .hero-split { display: grid; grid-template-columns: 1fr 1fr; width: 100%; height: 100%; }
    .hero-showcase { display: grid; grid-template-columns: 1fr 1fr; width: 100%; height: 100%; align-items: center; }

    /* Alignment Classes Logic for Preview */
    .align-top-left { align-items: flex-start; justify-content: flex-start; text-align: left; }
    .align-top-center { align-items: flex-start; justify-content: center; text-align: center; }
    .align-top-right { align-items: flex-start; justify-content: flex-end; text-align: right; }
    .align-center-left { align-items: center; justify-content: flex-start; text-align: left; }
    .align-center { align-items: center; justify-content: center; text-align: center; }
    .align-center-right { align-items: center; justify-content: flex-end; text-align: right; }
    .align-bottom-left { align-items: flex-end; justify-content: flex-start; text-align: left; }
    .align-bottom-center { align-items: flex-end; justify-content: center; text-align: center; }
    .align-bottom-right { align-items: flex-end; justify-content: flex-end; text-align: right; }

    .hero-render[class*="align-"] .hero-content {
        display: flex;
        flex-direction: column;
    }
    .align-top-left .hero-content { align-items: flex-start; }
    .align-top-center .hero-content { align-items: center; }
    .align-top-right .hero-content { align-items: flex-end; }
    .align-center-left .hero-content { align-items: flex-start; }
    .align-center .hero-content { align-items: center; }
    .align-center-right .hero-content { align-items: flex-end; }
    .align-bottom-left .hero-content { align-items: flex-start; }
    .align-bottom-center .hero-content { align-items: center; }
    .align-bottom-right .hero-content { align-items: flex-end; }
  `]
})
export class CmsPreviewComponent {
    @Input() cms!: HomeCMS;
    @Input() currentSlideIndex = 0;

    getImageUrl(url: string | undefined): string {
        if (!url) return 'https://via.placeholder.com/800x600?text=No+Image';
        if (url.startsWith('http')) return url;
        return `http://localhost:3000${url}`;
    }
}
