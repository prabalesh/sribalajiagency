import { Injectable } from '@angular/core';
import { QuotationRequest, Message } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {

  private requests: QuotationRequest[] = [
    {
      id: 'q1',
      customerName: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '1234567890',
      message: 'I need a bulk quote for 50 Bosch drills.',
      status: 'Open',
      messages: [
        { sender: 'user', content: 'I need a bulk quote for 50 Bosch drills.', timestamp: new Date('2025-01-14T10:00:00') },
        { sender: 'admin', content: 'Sure, Alice. Which specific model?', timestamp: new Date('2025-01-14T10:30:00') }
      ],
      createdAt: new Date('2025-01-14T10:00:00')
    },
    {
      id: 'q2',
      customerName: 'Bob Smith',
      email: 'bob@example.com',
      phone: '0987654321',
      message: 'Can I get a discount on Asian Paints?',
      status: 'Closed',
      messages: [
        { sender: 'user', content: 'Can I get a discount on Asian Paints?', timestamp: new Date('2025-01-13T09:00:00') },
        { sender: 'admin', content: 'We offer 10% on orders above 10k.', timestamp: new Date('2025-01-13T09:15:00') },
        { sender: 'user', content: 'Okay thanks.', timestamp: new Date('2025-01-13T09:20:00') }
      ],
      createdAt: new Date('2025-01-13T09:00:00')
    }
  ];

  constructor() { }

  getRequests(): QuotationRequest[] {
    return this.requests;
  }

  getRequestById(id: string): QuotationRequest | undefined {
    return this.requests.find(r => r.id === id);
  }

  addMessage(requestId: string, message: Message) {
    const request = this.getRequestById(requestId);
    if (request) {
      request.messages.push(message);
    }
  }

  // Admin closes the request
  closeRequest(requestId: string) {
    const request = this.getRequestById(requestId);
    if (request) {
      request.status = 'Closed';
    }
  }

  // Create new request
  createRequest(request: QuotationRequest) {
    this.requests.unshift(request);
  }
}
