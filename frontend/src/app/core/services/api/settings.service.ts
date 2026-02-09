import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { SiteSettings } from '../../models/settings.model';
import { UpdateSettingsDto } from '../../models/settings.dto';

/**
 * Service for managing site-wide settings.
 * 
 * Handles retrieval and updates of application settings from the backend.
 * Provides type-safe operations with proper error handling and logging.
 * Uses Axios for HTTP requests through the ApiService wrapper.
 * 
 * @remarks
 * - Type-safe operations matching backend DTOs and entities
 * - Implements proper Axios error handling for both client and server errors
 * - Logs operations for debugging purposes
 * - Transforms date strings to Date objects for proper handling
 * 
 * @example
 * ```typescript
 * // In a component
 * try {
 *   const settings = await this.settingsService.getStoreSettings();
 *   console.log(settings);
 * } catch (error) {
 *   console.error(error);
 * }
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private readonly api = inject(ApiService);
    private readonly SETTINGS_ENDPOINT = '/settings';

    /**
     * Retrieves current site settings from the backend.
     * 
     * Public endpoint that returns all site settings including payment methods
     * and configuration flags. No authentication required.
     * 
     * @returns Promise resolving to SiteSettings object
     * @throws Error with user-friendly message if request fails
     * 
     * @example
     * ```typescript
     * try {
     *   const settings = await this.settingsService.getStoreSettings();
     *   console.log('COD allowed:', settings.allowCod);
     * } catch (error) {
     *   this.showError(error.message);
     * }
     * ```
     * 
     * TODO: Add caching mechanism to reduce API calls
     * TODO: Consider using signals for reactive state management
     * TODO: Add retry logic for failed requests
     */
    async getStoreSettings(): Promise<SiteSettings> {
        try {
            console.log('[SettingsService] Fetching settings...');
            
            const response = await this.api.get<{ data: SiteSettings }>(this.SETTINGS_ENDPOINT);
            const settings = this.transformSettingsResponse(response.data);
            
            console.log('[SettingsService] Settings retrieved:', settings);
            return settings;
        } catch (error) {
            throw this.handleError(error, 'Failed to load settings');
        }
    }

    /**
     * Updates site settings with provided data.
     * 
     * Protected endpoint requiring JWT authentication and UPDATE_SETTINGS permission.
     * Only updates fields provided in the request (partial update supported).
     * 
     * @param data - Partial settings data to update
     * @returns Promise resolving to updated SiteSettings object
     * @throws Error with user-friendly message if update fails
     * 
     * @example
     * ```typescript
     * const updates: UpdateSettingsDto = {
     *   allowCod: false,
     *   enabledPaymentMethods: ['online']
     * };
     * 
     * try {
     *   const updated = await this.settingsService.updateStoreSettings(updates);
     *   this.showSuccess('Settings updated successfully');
     * } catch (error) {
     *   this.showError(error.message);
     * }
     * ```
     * 
     * TODO: Add optimistic updates for better UX
     * TODO: Emit event/signal when settings change for reactive updates
     * TODO: Add client-side validation before sending request
     * TODO: Add confirmation dialog for critical setting changes
     */
    async updateStoreSettings(data: UpdateSettingsDto): Promise<SiteSettings> {
        try {
            console.log('[SettingsService] Updating settings with:', data);
            
            const response = await this.api.put<{ data: SiteSettings }>(
                this.SETTINGS_ENDPOINT, 
                data
            );
            const settings = this.transformSettingsResponse(response.data);
            
            console.log('[SettingsService] Settings updated:', settings);
            return settings;
        } catch (error) {
            throw this.handleError(error, 'Failed to update settings');
        }
    }

    /**
     * Transforms the API response to ensure proper typing.
     * Converts ISO date strings to Date objects for proper handling.
     * 
     * @param data - Raw settings data from API response
     * @returns Properly typed SiteSettings object
     * @private
     */
    private transformSettingsResponse(data: any): SiteSettings {
        return {
            ...data,
            updatedAt: new Date(data.updatedAt) // Convert ISO string to Date object
        };
    }

    /**
     * Centralized error handling for Axios requests.
     * 
     * Distinguishes between different types of Axios errors:
     * - Request errors (network issues, timeouts)
     * - Response errors (4xx, 5xx status codes)
     * - Other errors (setup issues, canceled requests)
     * 
     * Logs detailed error information and returns user-friendly messages.
     * 
     * @param error - Axios error object
     * @param userMessage - User-friendly error message
     * @returns Error object with user-friendly message
     * @private
     * 
     * @remarks
     * Axios error structure:
     * - error.response: Server responded with error status (4xx, 5xx)
     * - error.request: Request was made but no response received (network issue)
     * - Otherwise: Error setting up the request
     */
    private handleError(error: any, userMessage: string): Error {
        let errorMessage: string;

        if (error.response) {
            // Server responded with error status (4xx, 5xx)
            const status = error.response.status;
            const serverMessage = error.response.data?.message || error.message || 'Unknown error';
            
            errorMessage = `Server Error (${status}): ${serverMessage}`;
            console.error('[SettingsService]', errorMessage, {
                status,
                data: error.response.data,
                headers: error.response.headers
            });

            // Handle specific status codes
            if (status === 401) {
                // Unauthorized - possibly redirect to login
                console.warn('[SettingsService] Unauthorized access - JWT may be invalid');
            } else if (status === 403) {
                // Forbidden - user lacks permissions
                userMessage = 'You do not have permission to perform this action';
            } else if (status === 404) {
                userMessage = 'Settings endpoint not found';
            } else if (status >= 500) {
                userMessage = 'Server error. Please try again later';
            }
        } else if (error.request) {
            // Request was made but no response received (network issue)
            errorMessage = 'Network Error: No response from server';
            console.error('[SettingsService]', errorMessage, error.request);
            userMessage = 'Network error. Please check your connection';
        } else {
            // Error setting up the request
            errorMessage = `Request Setup Error: ${error.message}`;
            console.error('[SettingsService]', errorMessage);
        }

        // Return user-friendly error
        return new Error(userMessage);
    }
}
