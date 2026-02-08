import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-route-loading',
    standalone: true,
    imports: [CommonModule],
    template: `
  <div class="route-loading-overlay">
    <div class="loading-content glass-card">
      <div class="shopping-loader">
        <div class="bag">
          <div class="bag-handle"></div>
          <div class="bag-body">
            <div class="product-item" *ngFor="let item of [1,2,3]"></div>
          </div>
        </div>
      </div>
      <h3 class="loading-text">Preparing your shop</h3>
    </div>
  </div>
`,
    styles: [`
  .route-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: var(--glass-effect);
    -webkit-backdrop-filter: var(--glass-effect);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: overlayFadeIn 0.3s var(--transition-curve);
  }

  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .loading-content {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    padding: 3rem 4rem;
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-lg);
    text-align: center;
    animation: contentSlideUp 0.4s var(--transition-curve);
  }

  @keyframes contentSlideUp {
    from {
      transform: translateY(30px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  .shopping-loader {
    width: 120px;
    height: 120px;
    margin: 0 auto 2rem;
    position: relative;
  }

  .bag {
    width: 80px;
    height: 90px;
    margin: 15px auto 0;
    position: relative;
  }

  .bag-handle {
    width: 50px;
    height: 30px;
    border: 4px solid var(--primary-color);
    border-bottom: none;
    border-radius: 30px 30px 0 0;
    margin: 0 auto;
    position: relative;
    animation: handleSwing 1.5s ease-in-out infinite;
  }

  @keyframes handleSwing {
    0%, 100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(-5deg);
    }
    75% {
      transform: rotate(5deg);
    }
  }

  .bag-body {
    width: 80px;
    height: 70px;
    background: var(--surface-color-secondary);
    border: 3px solid var(--primary-color);
    border-radius: 0 0 8px 8px;
    position: relative;
    overflow: hidden;
  }

  .product-item {
    width: 60px;
    height: 8px;
    background: var(--primary-color);
    margin: 8px auto;
    border-radius: 4px;
    opacity: 0;
    transform: translateY(-30px);
    animation: itemDrop 2s ease-in-out infinite;
  }

  .product-item:nth-child(1) {
    animation-delay: 0s;
  }

  .product-item:nth-child(2) {
    animation-delay: 0.4s;
    background: var(--accent-color);
  }

  .product-item:nth-child(3) {
    animation-delay: 0.8s;
  }

  @keyframes itemDrop {
    0% {
      opacity: 0;
      transform: translateY(-30px);
    }
    20% {
      opacity: 1;
    }
    40%, 100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .loading-text {
    color: var(--text-color);
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.5px;
  }

  @media (max-width: 600px) {
    .loading-content {
      padding: 2rem 2.5rem;
    }
  }
`]






})
export class RouteLoadingComponent { }
