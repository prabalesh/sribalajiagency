import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotations.component.html',
  styleUrl: './quotations.component.scss'
})
export class QuotationsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  quoteForm = {
    name: '',
    email: '',
    phone: '',
    productName: '',
    message: ''
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const productId = params.get('productId');
      if (productId) {
        const product = this.productService.getProductById(productId);
        if (product) {
          this.quoteForm.productName = product.name;
          this.quoteForm.message = `I am interested in obtaining a formal commercial quotation for the ${product.name}.`;
        }
      } else if (this.cartService.count() > 0) {
        this.quoteForm.productName = `${this.cartService.count()} Items in Shopping Bag`;
        const itemDetails = this.cartService.items().map(i => `- ${i.product.name} (Qty: ${i.quantity})`).join('\n');
        this.quoteForm.message = `I would like to request a quotation for the following items:\n${itemDetails}\n\nTotal Estimated Amount: ₹${this.cartService.total() * 1.18}`;
      }
    });
  }

  onSubmit() {
    // In a real app, this would call a service to send the quote
    console.log('Quote Request Submitted', this.quoteForm);
    alert('Your quotation request has been sent! We will reach out within 24 hours with a formal PDF quote.');
    this.cartService.clearCart();
    this.router.navigate(['/']);
  }
}
