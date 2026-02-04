import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../core/models/order.model';

@Component({
    selector: 'app-invoice',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="invoice-container" id="printable-invoice">
      <div class="invoice-header">
        <div class="company-info">
          <h1>SRIBALAJI AGENCY</h1>
          <p>Authorized Dealer for Electrical Goods</p>
          <p>123 Agency Street, City - 600001</p>
          <p>Phone: +91 98765 43210 | Email: sales@sribalaji.com</p>
          <p><strong>GSTIN: 33AAAAA0000A1Z5</strong></p>
        </div>
        <div class="invoice-meta">
          <h2>TAX INVOICE</h2>
          <p><strong>Invoice No:</strong> #{{ order.id.substring(0, 8).toUpperCase() }}</p>
          <p><strong>Date:</strong> {{ order.createdAt | date:'mediumDate' }}</p>
          <p><strong>Status:</strong> {{ order.status }}</p>
        </div>
      </div>

      <div class="billing-section">
        <div class="bill-to">
          <h3>Bill To:</h3>
          <p><strong>{{ order.user?.name || 'Customer' }}</strong></p>
          <p>{{ order.deliveryAddress }}</p>
          <p>Phone: {{ order.deliveryPhone }}</p>
        </div>
        <div class="payment-info">
          <h3>Payment Method:</h3>
          <p>{{ order.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery' }}</p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of order.items; let i = index">
            <td>{{ i + 1 }}</td>
            <td>
              {{ item.productName }}
              <div *ngIf="item.variantName" class="variant-text">({{ item.variantName }})</div>
            </td>
            <td>{{ item.quantity }}</td>
            <td>₹{{ item.price | number:'1.2-2' }}</td>
            <td>₹{{ item.price * item.quantity | number:'1.2-2' }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="text-right">Subtotal</td>
            <td>₹{{ getSubtotal() | number:'1.2-2' }}</td>
          </tr>
          <tr *ngIf="order.taxAmount">
            <td colspan="4" class="text-right">GST</td>
            <td>₹{{ order.taxAmount | number:'1.2-2' }}</td>
          </tr>
          <tr class="grand-total">
            <td colspan="4" class="text-right">Grand Total</td>
            <td>₹{{ order.totalAmount | number:'1.2-2' }}</td>
          </tr>
        </tfoot>
      </table>

      <div class="invoice-footer">
        <div class="terms">
          <h4>Terms & Conditions:</h4>
          <ul>
            <li>Goods once sold will not be taken back.</li>
            <li>Subject to local jurisdiction.</li>
            <li>This is a computer-generated invoice.</li>
          </ul>
        </div>
        <div class="signature">
          <div class="sig-line"></div>
          <p>Authorized Signatory</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .invoice-container {
      padding: 40px;
      background: white;
      color: #333;
      font-family: 'Inter', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #eee;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }

    .company-info h1 {
      margin: 0;
      color: #000;
      font-size: 24px;
      letter-spacing: 1px;
    }

    .company-info p {
      margin: 4px 0;
      font-size: 13px;
      color: #666;
    }

    .invoice-meta {
      text-align: right;
    }

    .invoice-meta h2 {
      margin: 0 0 10px;
      color: #333;
    }

    .invoice-meta p {
      margin: 4px 0;
      font-size: 14px;
    }

    .billing-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .billing-section h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 10px;
    }

    .billing-section p {
      margin: 4px 0;
      font-size: 15px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }

    .items-table th {
      background: #f8f9fa;
      text-align: left;
      padding: 12px;
      border-bottom: 2px solid #eee;
      font-size: 13px;
      text-transform: uppercase;
    }

    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }

    .variant-text {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    .text-right {
      text-align: right;
    }

    .items-table tfoot td {
      padding: 8px 12px;
      font-weight: 600;
    }

    .grand-total {
      font-size: 18px;
      color: #000;
    }

    .grand-total td {
      border-top: 2px solid #333;
      padding-top: 15px !important;
    }

    .invoice-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .terms h4 {
      margin: 0 0 10px;
      font-size: 14px;
    }

    .terms ul {
      margin: 0;
      padding-left: 15px;
      font-size: 12px;
      color: #777;
    }

    .signature {
      text-align: center;
      width: 200px;
    }

    .sig-line {
      border-bottom: 1px solid #333;
      margin-bottom: 10px;
      height: 40px;
    }

    @media print {
      .invoice-container {
        border: none;
        padding: 0;
      }
      body * {
        visibility: hidden;
      }
      #printable-invoice, #printable-invoice * {
        visibility: visible;
      }
      #printable-invoice {
        position: absolute;
        left: 0;
        top: 0;
      }
    }
  `]
})
export class InvoiceComponent {
    @Input({ required: true }) order!: Order;

    getSubtotal() {
        return this.order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }
}
