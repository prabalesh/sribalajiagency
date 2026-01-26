import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationService } from '../../core/services/api/quotation.service';
import { Message, QuotationRequest } from '../../core/models/quotation.model';

@Component({
  selector: 'app-admin-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotations.component.html',
  styleUrl: './quotations.component.scss'
})
export class QuotationsComponent implements OnInit {
  requests: QuotationRequest[] = [];
  selectedRequest: QuotationRequest | null = null;
  newMessage = '';

  constructor(private quoteService: QuotationService) { }

  async ngOnInit() {
    this.requests = await this.quoteService.getRequests();
  }

  selectRequest(request: QuotationRequest) {
    this.selectedRequest = request;
  }

  async sendMessage() {
    if (this.selectedRequest && this.newMessage.trim()) {
      const message: Message = {
        sender: 'admin',
        content: this.newMessage,
        timestamp: new Date()
      };
      await this.quoteService.addMessage(this.selectedRequest.id, message);
      this.newMessage = '';
      // Refresh or local update
    }
  }

  async closeRequest() {
    if (this.selectedRequest) {
      await this.quoteService.updateStatus(this.selectedRequest.id, 'Closed');
      this.selectedRequest.status = 'Closed';
    }
  }
}
