import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = (options?: any) => {
    const providers = [
        ...(config.providers || []),
        ...(options?.providers || []),
    ];
    // @ts-ignore: passing context as 3rd argument to solve NG0401
    return bootstrapApplication(AppComponent, { ...config, providers }, options);
};

export default bootstrap;
