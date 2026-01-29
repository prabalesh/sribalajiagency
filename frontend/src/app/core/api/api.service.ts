import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../../environments/environment.development';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private axiosInstance: AxiosInstance;
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.axiosInstance = axios.create({
            baseURL: environment.apiUrl,
            withCredentials: true
        });

        // Response interceptor to handle token refresh
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        // Refresh token is now in HttpOnly cookie, so we just call the refresh endpoint
                        await axios.post(`${environment.apiUrl}/auth/refresh`, {}, {
                            withCredentials: true
                        });

                        return this.axiosInstance(originalRequest);
                    } catch (refreshError) {
                        // Logout user or redirect to login
                        if (this.isBrowser) {
                            const theme = localStorage.getItem('theme');
                            localStorage.clear();
                            if (theme) localStorage.setItem('theme', theme);
                            this.redirect('/login');
                        }
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );
    }


    get<T>(url: string, params?: any) {
        return this.axiosInstance.get<T>(url, { params });
    }

    post<T>(url: string, data: any) {
        return this.axiosInstance.post<T>(url, data);
    }

    put<T>(url: string, data: any) {
        return this.axiosInstance.put<T>(url, data);
    }

    patch<T>(url: string, data: any) {
        return this.axiosInstance.patch<T>(url, data);
    }

    delete<T>(url: string) {
        return this.axiosInstance.delete<T>(url);
    }

    private redirect(url: string) {
        if (this.isBrowser) {
            window.location.assign(url);
        }
    }
}
