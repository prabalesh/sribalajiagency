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
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
