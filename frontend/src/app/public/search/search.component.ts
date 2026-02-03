import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/api/product.service';
import { Product } from '../../core/models/product.model';
import { Observable } from 'rxjs'; // Import Observable usually not needed for type if using AsyncPipe or manual sub, but useful for type defs

import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {
  query: string = '';
  products: Product[] = [];
  total: number = 0;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.performSearch(this.query);
      }
    });
  }

  async performSearch(query: string) {
    this.isLoading = true;
    try {
      const results = await this.productService.searchProducts(query);
      this.products = results.items;
      this.total = results.total;
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }
}
