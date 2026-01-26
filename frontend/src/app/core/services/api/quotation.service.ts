import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { QuotationRequest, Message } from '../../models/quotation.model';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
  private api = inject(ApiService);

  async createRequest(dto: any) {
    const res = await this.api.post<QuotationRequest>('/quotations', dto);
    return res.data;
  }

  async getRequests() {
    const res = await this.api.get<QuotationRequest[]>('/quotations');
    return res.data;
  }

  async getRequestById(id: string) {
    const res = await this.api.get<QuotationRequest>(`/quotations/${id}`);
    return res.data;
  }

  async updateStatus(id: string, status: string) {
    const res = await this.api.patch<QuotationRequest>(`/quotations/${id}/status`, { status });
    return res.data;
  }

  async addMessage(requestId: string, message: Message) {
    // For now, let's keep it simple. If we had a message API:
    // const res = await this.api.post(`/quotations/${requestId}/messages`, message);
    // return res.data;
    console.log('Sending message to quotation:', requestId, message);
  }
}
