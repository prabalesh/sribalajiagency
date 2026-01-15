import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotations.component.html',
  styleUrl: './quotations.component.scss'
})
export class QuotationsComponent implements OnInit {
  quoteForm = {
    name: '',
    email: '',
    phone: '',
    productName: '',
    message: ''
  };

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      // Logic to pre-fill based on ID if we had a real service
      const productId = params.get('productId');
      if (productId) {
        this.quoteForm.productName = `Product ID: ${productId}`; // Placeholder
        this.quoteForm.message = 'I am interested in getting a quote for this product.';
      }
    });
  }

  onSubmit() {
    console.log('Quote Request Submitted', this.quoteForm);
    alert('Quote Request Sent! We will contact you shortly.');
    this.quoteForm = { name: '', email: '', phone: '', productName: '', message: '' };
  }
}
