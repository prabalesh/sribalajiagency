import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs'; // Import Observable and of
import { delay } from 'rxjs/operators'; // Import delay operator
import { Category, Product, Brand } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // Mock Categories
  private categories: Category[] = [
    // Main Categories
    { id: 'cat-fan', name: 'Fan', slug: 'fan', description: 'Cooling Fans' },
    { id: 'cat-light', name: 'Light', slug: 'light', description: 'Lighting Solutions' },
    { id: 'cat-paint', name: 'Paint', slug: 'paint', description: 'Paints & Finishes' },

    // Fan Subcategories
    { id: 'sub-fan-ceiling', name: 'Ceiling Fan', slug: 'ceiling-fan', parentId: 'cat-fan' },
    { id: 'sub-fan-wall', name: 'Wall Fan', slug: 'wall-fan', parentId: 'cat-fan' },
    { id: 'sub-fan-pedestal', name: 'Pedestal Fan', slug: 'pedestal-fan', parentId: 'cat-fan' },
    { id: 'sub-fan-exhaust', name: 'Exhaust Fan', slug: 'exhaust-fan', parentId: 'cat-fan' },
    { id: 'sub-fan-tower', name: 'Tower Fan', slug: 'tower-fan', parentId: 'cat-fan' },
    { id: 'sub-fan-table', name: 'Table Fan', slug: 'table-fan', parentId: 'cat-fan' },

    // Light Subcategories
    { id: 'sub-light-bulb', name: 'LED Bulb', slug: 'led-bulb', parentId: 'cat-light' },
    { id: 'sub-light-tube', name: 'LED Tube light', slug: 'led-tube-light', parentId: 'cat-light' },
    { id: 'sub-light-panel', name: 'LED Panel', slug: 'led-panel', parentId: 'cat-light' },
    { id: 'sub-light-spot', name: 'LED Spotlight', slug: 'led-spotlight', parentId: 'cat-light' },
    { id: 'sub-light-lamp', name: 'LED Lamp', slug: 'led-lamp', parentId: 'cat-light' },
    { id: 'sub-light-strip', name: 'Strip Light', slug: 'strip-light', parentId: 'cat-light' },
    { id: 'sub-light-portable', name: 'Portable Lighting', slug: 'portable-lighting', parentId: 'cat-light' },

    // Paint Subcategories
    { id: 'sub-paint-primer', name: 'Primer', slug: 'primer', parentId: 'cat-paint' },
    { id: 'sub-paint-emulsion', name: 'Emulsion', slug: 'emulsion', parentId: 'cat-paint' },
    { id: 'sub-paint-enamel', name: 'Enamel', slug: 'enamel', parentId: 'cat-paint' },
    { id: 'sub-paint-putty', name: 'Putty', slug: 'putty', parentId: 'cat-paint' },
    { id: 'sub-paint-tile', name: 'Tile fix', slug: 'tile-fix', parentId: 'cat-paint' },
    { id: 'sub-paint-water', name: 'Water proof', slug: 'water-proof', parentId: 'cat-paint' },
    { id: 'sub-paint-brush', name: 'Brush', slug: 'brush', parentId: 'cat-paint' },
  ];

  // Mock Products
  private products: Product[] = [
    { id: 'p1', name: 'Orient Electric 1200mm', description: 'High speed ceiling fan', brandId: 'orient', categoryId: 'sub-fan-ceiling', price: 2500, imageUrls: [], isAvailable: true },
    { id: 'p2', name: 'Philips 9W LED', description: 'Cool Day Light', brandId: 'philips', categoryId: 'sub-light-bulb', price: 100, imageUrls: [], isAvailable: true },
    { id: 'p3', name: 'Asian Paints Ace', description: 'Exterior Emulsion', brandId: 'asian-paints', categoryId: 'sub-paint-emulsion', price: 3000, imageUrls: [], isAvailable: true },
  ];

  // Mock Brands
  private brands: Brand[] = [
    { id: 'bosch', name: 'Bosch' },
    { id: 'makita', name: 'Makita' },
    { id: 'dewalt', name: 'DeWalt' },
    { id: 'orient', name: 'Orient' },
    { id: 'lg', name: 'LG' },
    { id: 'philips', name: 'Philips' },
    { id: 'asian-paints', name: 'Asian Paints' },
  ];

  constructor() { }

  getCategories(): Category[] {
    return this.categories;
  }

  getProducts(): Product[] {
    return this.products;
  }

  getBrands(): Brand[] {
    return this.brands;
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.find(c => c.slug === slug);
  }

  getCategoriesByParentId(parentId: string | undefined): Category[] {
    return this.categories.filter(c => c.parentId === parentId);
  }

  // Get all subcategories recursively (for checking products in sub-categories)
  getAllChildCategoryIds(categoryId: string): string[] {
    const childIds = this.categories
      .filter(c => c.parentId === categoryId)
      .map(c => c.id);

    let allIds = [...childIds];
    childIds.forEach(id => {
      allIds = [...allIds, ...this.getAllChildCategoryIds(id)];
    });
    return allIds;
  }

  getProductsByCategory(categoryId: string): Product[] {
    // Include products in this category AND all subcategories
    const allCategoryIds = [categoryId, ...this.getAllChildCategoryIds(categoryId)];
    return this.products.filter(p => allCategoryIds.includes(p.categoryId));
  }

  addCategory(category: Category) {
    this.categories.push(category);
  }

  // Mock API Search
  searchProducts(query: string): Observable<Product[]> {
    const lowerQuery = query.toLowerCase();
    const filtered = this.products.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    );
    // Simulate API delay
    return of(filtered).pipe(
      delay(500)
    );
  }
}
