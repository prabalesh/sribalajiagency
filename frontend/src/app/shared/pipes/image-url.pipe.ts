import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
    name: 'imageUrl',
    standalone: true
})
export class ImageUrlPipe implements PipeTransform {
    transform(url: string | undefined, fallback: string = 'https://placehold.co/400x400?text=No+Image'): string {
        if (!url) return fallback;
        if (url.startsWith('http')) return url;

        const baseUrl = environment.apiUrl;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanUrl}`;
    }
}
