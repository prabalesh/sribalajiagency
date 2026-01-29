import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/api/product.service';
import { CartService } from '../../core/store/cart.service';
import { QuotationService } from '../../core/services/api/quotation.service';
import { ToastService } from '../../core/services/toast.service';


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
  private quotationService = inject(QuotationService);
  private toast = inject(ToastService);


  quoteForm = {
    name: '',
    email: '',
    phone: '',
    productName: '',
    message: ''
  };

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const productId = params.get('productId');
      if (productId) {
        const product = await this.productService.getProductById(productId);
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

  async onSubmit() {
    try {
      await this.quotationService.createRequest({
        customerName: this.quoteForm.name,
        email: this.quoteForm.email,
        phone: this.quoteForm.phone,
        productName: this.quoteForm.productName,
        message: this.quoteForm.message
      });
      this.toast.success('Your quotation request has been sent! We will reach out within 24 hours with a formal PDF quote.');

      this.cartService.clearCart();
      this.router.navigate(['/']);
    } catch (e) {
      this.toast.error('Error submitting quotation request. Please try again.');
    }
  }
}
