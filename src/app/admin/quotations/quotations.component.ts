import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationRequest, Message } from '../../core/models/models';
import { QuotationService } from '../../core/services/quotation.service';

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

  ngOnInit() {
    this.requests = this.quoteService.getRequests();
  }

  selectRequest(request: QuotationRequest) {
    this.selectedRequest = request;
  }

  sendMessage() {
    if (this.selectedRequest && this.newMessage.trim()) {
      const message: Message = {
        sender: 'admin',
        content: this.newMessage,
        timestamp: new Date()
      };
      this.quoteService.addMessage(this.selectedRequest.id, message);
      this.newMessage = '';
    }
  }

  closeRequest() {
    if (this.selectedRequest) {
      this.quoteService.closeRequest(this.selectedRequest.id);
    }
  }
}
