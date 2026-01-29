import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="not-found-container">
      <h1>404</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <a routerLink="/" class="home-link">Go back home</a>
    </div>
  `,
    styles: [`
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 70vh;
      text-align: center;
      color: var(--text-color, #333);
    }
    h1 {
      font-size: 6rem;
      margin-bottom: 1rem;
      color: var(--primary-color, #007bff);
    }
    p {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }
    .home-link {
      padding: 0.75rem 1.5rem;
      background-color: var(--primary-color, #007bff);
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .home-link:hover {
      background-color: var(--secondary-color, #0056b3);
    }
  `]
})
export class NotFoundComponent { }
