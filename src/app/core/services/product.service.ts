import { Injectable } from '@angular/core';
import { Category, Product, Brand } from '../models/models';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private categories: Category[] = [
    { id: 'cat-electronics', name: 'Electronics', slug: 'electronics', description: 'Smart TVs, Laptops, and more' },
    { id: 'cat-tvs', name: 'Televisions', slug: 'tvs', parentId: 'cat-electronics' },
    { id: 'cat-laptops', name: 'Laptops', slug: 'laptops', parentId: 'cat-electronics' },

    { id: 'cat-appliances', name: 'Home Appliances', slug: 'home-appliances', description: 'Refrigerators, Washers, and ACs' },
    { id: 'cat-fridges', name: 'Refrigerators', slug: 'refrigerators', parentId: 'cat-appliances' },
    { id: 'cat-ac', name: 'Air Conditioners', slug: 'air-conditioners', parentId: 'cat-appliances' },

    { id: 'cat-kitchen', name: 'Kitchenware', slug: 'kitchenware', description: 'Mixers, Grinders, and Cooktops' },
    { id: 'cat-tools', name: 'Industrial Tools', slug: 'industrial-tools', description: 'Power tools and machinery' },
    { id: 'cat-lighting', name: 'Lighting', slug: 'lighting', description: 'Home and industrial lighting' },
  ];

  private brands: Brand[] = [
    { id: 'samsung', name: 'Samsung', description: 'Global leader in technology' },
    { id: 'lg', name: 'LG', description: 'Life\'s Good' },
    { id: 'bosch', name: 'Bosch', description: 'Engineering excellence' },
    { id: 'philips', name: 'Philips', description: 'Innovation and you' },
    { id: 'sony', name: 'Sony', description: 'Entertainment redefined' },
    { id: 'havells', name: 'Havells', description: 'Fastest growing electrical company' },
  ];

  private products: Product[] = [
    // Electronics
    {
      id: 'p-sony-bravia',
      name: 'Sony Bravia XR 65"',
      description: '4K Ultra HD Smart LED TV with Google TV. Incredible contrast and cinematic sound.',
      brandId: 'sony',
      categoryId: 'cat-electronics',
      price: 124900,
      imageUrls: ['https://placehold.co/600x400?text=Sony+Bravia'],
      isAvailable: true
    },
    {
      id: 'p-samsung-qled',
      name: 'Samsung QN90B Neo QLED',
      description: 'The pinnacle of ultra-fine light control. Mini LEDs for brilliant detail.',
      brandId: 'samsung',
      categoryId: 'cat-electronics',
      price: 154900,
      imageUrls: ['https://placehold.co/600x400?text=Samsung+QLED'],
      isAvailable: true
    },
    // Appliances
    {
      id: 'p-lg-fridge',
      name: 'LG 688L Side-by-Side',
      description: 'Inverter Linear Compressor with Door-in-Door™ and ThinQ (Wi-Fi).',
      brandId: 'lg',
      categoryId: 'cat-appliances',
      price: 98000,
      imageUrls: ['https://placehold.co/600x400?text=LG+Fridge'],
      isAvailable: true
    },
    {
      id: 'p-bosch-washer',
      name: 'Bosch 8kg Front Load',
      description: 'Fully Automatic Washing Machine with EcoSilence Drive and AllergyPlus.',
      brandId: 'bosch',
      categoryId: 'cat-appliances',
      price: 45000,
      imageUrls: ['https://placehold.co/600x400?text=Bosch+Washer'],
      isAvailable: true
    },
    // Kitchenware
    {
      id: 'p-philips-airfryer',
      name: 'Philips Essential Airfryer',
      description: 'Rapid Air technology for healthy frying. 4.1L capacity.',
      brandId: 'philips',
      categoryId: 'cat-kitchen',
      price: 8999,
      imageUrls: ['https://placehold.co/600x400?text=Philips+Airfryer'],
      isAvailable: true
    },
    // Tools
    {
      id: 'p-bosch-drill',
      name: 'Bosch Professional GSB 18V',
      description: 'Heavy duty cordless combi drill. 2-speed planetary gearbox.',
      brandId: 'bosch',
      categoryId: 'cat-tools',
      price: 15500,
      imageUrls: ['https://placehold.co/600x400?text=Bosch+Drill'],
      isAvailable: true
    }
  ];

  constructor() { }

  getCategories(): Category[] {
    return this.categories;
  }

  getProducts(): Product[] {
    return this.products;
  }

  addCategory(category: Category) {
    this.categories.push(category);
  }

  getCategoriesByParentId(parentId: string | undefined): Category[] {
    return this.categories.filter(c => c.parentId === parentId);
  }

  getBrands(): Brand[] {
    return this.brands;
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.find(c => c.slug === slug);
  }

  getProductsByCategory(categoryId: string): Product[] {
    return this.products.filter(p => p.categoryId === categoryId);
  }

  searchProducts(query: string): Observable<Product[]> {
    const lowerQuery = query.toLowerCase();
    const filtered = this.products.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    );
    return of(filtered).pipe(delay(500));
  }

  getBrandById(id: string): Brand | undefined {
    return this.brands.find(b => b.id === id);
  }
}
