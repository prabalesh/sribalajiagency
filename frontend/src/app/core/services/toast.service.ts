import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSignal = signal<Toast[]>([]);
    readonly toasts = this.toastsSignal.asReadonly();
    private nextId = 0;

    show(message: string, type: Toast['type'] = 'info', duration: number = 4000) {
        const id = this.nextId++;
        const toast: Toast = { id, message, type, duration };

        this.toastsSignal.update(toasts => [...toasts, toast]);

        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
    }

    success(message: string, duration?: number) {
        this.show(message, 'success', duration);
    }

    error(message: string, duration?: number) {
        this.show(message, 'error', duration);
    }

    warning(message: string, duration?: number) {
        this.show(message, 'warning', duration);
    }

    info(message: string, duration?: number) {
        this.show(message, 'info', duration);
    }

    remove(id: number) {
        this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
    }
}
