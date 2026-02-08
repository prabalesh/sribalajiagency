import { ImageLoaderConfig } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * Custom loader for NgOptimizedImage that prepends the API URL
 * to relative image paths.
 */
export const sbaImageLoader = (config: ImageLoaderConfig) => {
    const url = config.src;

    // If it's already an absolute URL, return as is
    if (url.startsWith('http')) {
        return url;
    }

    // Ensure the URL starts with a slash
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;

    // Append the base API URL (e.g., https://api.sribalaji.com/api/v1)
    // Note: Depending on how the backend serves images, 
    // we might need to adjust the environment variable usage.
    return `${environment.apiUrl}${cleanUrl}`;
};
