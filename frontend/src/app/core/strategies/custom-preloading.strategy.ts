import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
    preload(route: Route, load: () => Observable<any>): Observable<any> {
        // Preload routes that have data.preload set to true
        if (route.data && route.data['preload']) {
            console.log('Preloading: ' + route.path);
            return load();
        }
        return of(null);
    }
}
