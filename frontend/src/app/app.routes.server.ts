import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'products/:category',
    renderMode: RenderMode.Server
  },
  {
    path: 'products/:category/:subcategory',
    renderMode: RenderMode.Server
  },
  {
    path: 'products/detail/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'order-confirmation/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'account/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'dashboard/**',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
