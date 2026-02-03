import { Injectable, ApplicationRef, createComponent, EnvironmentInjector, Type, ComponentRef } from '@angular/core';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
    providedIn: 'root'
})
export class DialogService {
    constructor(
        private appRef: ApplicationRef,
        private injector: EnvironmentInjector
    ) { }

    async confirm(options: {
        title?: string,
        message: string,
        confirmText?: string,
        cancelText?: string
    }): Promise<boolean> {
        return new Promise((resolve) => {
            const componentRef = createComponent(ConfirmDialogComponent, {
                environmentInjector: this.injector
            });

            // Set inputs
            componentRef.instance.isOpen = true;
            componentRef.instance.message = options.message;
            if (options.title) componentRef.instance.title = options.title;
            if (options.confirmText) componentRef.instance.confirmText = options.confirmText;
            if (options.cancelText) componentRef.instance.cancelText = options.cancelText;

            // Handle outputs
            componentRef.instance.confirm.subscribe(() => {
                this.cleanup(componentRef);
                resolve(true);
            });

            componentRef.instance.cancel.subscribe(() => {
                this.cleanup(componentRef);
                resolve(false);
            });

            // Append to body
            document.body.appendChild(componentRef.location.nativeElement);
            this.appRef.attachView(componentRef.hostView);
        });
    }

    private cleanup(componentRef: ComponentRef<any>) {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
    }
}
