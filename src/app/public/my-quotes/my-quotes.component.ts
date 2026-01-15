import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationRequest, Message } from '../../core/models/models';
import { QuotationService } from '../../core/services/quotation.service';

@Component({
    selector: 'app-my-quotes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './my-quotes.component.html',
    styleUrl: './my-quotes.component.scss'
})
export class MyQuotesComponent implements OnInit {
    myRequests: QuotationRequest[] = [];
    selectedRequest: QuotationRequest | null = null;
    newMessage = '';

    // Mock current user
    currentUserEmail = 'alice@example.com';

    constructor(private quoteService: QuotationService) { }

    ngOnInit() {
        // Filter by email for demo
        this.myRequests = this.quoteService.getRequests().filter(r => r.email === this.currentUserEmail);
    }

    selectRequest(request: QuotationRequest) {
        this.selectedRequest = request;
    }

    sendMessage() {
        if (this.selectedRequest && this.newMessage.trim()) {
            const message: Message = {
                sender: 'user',
                content: this.newMessage,
                timestamp: new Date()
            };
            this.quoteService.addMessage(this.selectedRequest.id, message);
            this.newMessage = '';
        }
    }
}
