import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import axios, { AxiosInstance } from 'axios';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private axiosInstance: AxiosInstance;
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.axiosInstance = axios.create({
            baseURL: 'http://localhost:3000', // Update this as per environment
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
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
                        await axios.post('http://localhost:3000/auth/refresh', {}, {
                            withCredentials: true
                        });

                        return this.axiosInstance(originalRequest);
                    } catch (refreshError) {
                        // Logout user or redirect to login
                        if (this.isBrowser) {
                            localStorage.clear();
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
