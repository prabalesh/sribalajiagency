import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UpdateSettingsDto } from './dto/settings.dto';

/**
 * Controller for managing site-wide settings.
 * 
 * Provides REST API endpoints for retrieving and updating application settings.
 * Update operations require JWT authentication and UPDATE_SETTINGS permission.
 * 
 * @remarks
 * - GET endpoint is public (no authentication required)
 * - PUT endpoint requires authentication and specific permissions
 * - All endpoints return raw entity data (no response wrapping)
 * 
 * Base path: `/settings`
 * 
 * TODO: Add API versioning (e.g., /v1/settings)
 * TODO: Add rate limiting to prevent abuse
 * TODO: Add Swagger/OpenAPI documentation decorators
 * TODO: Consider if GET endpoint should also require authentication
 */
@Controller('settings')
export class SettingsController {
    /**
     * Initializes the settings controller with required services
     * 
     * @param settingsService - Service handling settings business logic
     */
    constructor(private readonly settingsService: SettingsService) { }

    /**
     * Retrieves current site settings.
     * 
     * Public endpoint that returns all site settings including payment methods
     * and configuration flags. No authentication required.
     * 
     * @returns Promise resolving to SiteSettings entity
     * 
     * @example
     * GET /settings
     * Response: {
     *   "id": 1,
     *   "enabledPaymentMethods": ["online", "cod"],
     *   "allowCod": true,
     *   "allowOnline": true,
     *   "updatedAt": "2026-02-09T05:51:00.000Z"
     * }
     * 
     * TODO: Add response transformation/serialization (exclude internal fields)
     * TODO: Add caching headers (Cache-Control, ETag) for better performance
     * TODO: Consider adding query parameters for selective field retrieval
     * TODO: Add @ApiResponse() decorator for Swagger documentation
     */
    @Get()
    async getSettings() {
        return this.settingsService.getSettings();
    }

    /**
     * Updates site settings with provided data.
     * 
     * Protected endpoint requiring JWT authentication and UPDATE_SETTINGS permission.
     * Only updates fields provided in the request body (partial update).
     * 
     * @param data - Partial settings data to update (validated by UpdateSettingsDto)
     * @returns Promise resolving to updated SiteSettings entity
     * 
     * @throws {UnauthorizedException} If JWT token is invalid or missing
     * @throws {ForbiddenException} If user lacks UPDATE_SETTINGS permission
     * @throws {BadRequestException} If validation fails
     * @throws {InternalServerErrorException} If update operation fails
     * 
     * @example
     * PUT /settings
     * Headers: { "Authorization": "Bearer <jwt-token>" }
     * Body: {
     *   "allowCod": false,
     *   "enabledPaymentMethods": ["online"]
     * }
     * Response: {
     *   "id": 1,
     *   "enabledPaymentMethods": ["online"],
     *   "allowCod": false,
     *   "allowOnline": true,
     *   "updatedAt": "2026-02-09T05:51:00.000Z"
     * }
     * 
     * TODO: Add @HttpCode(HttpStatus.OK) decorator for explicit status code
     * TODO: Wrap response in standard format { success, data, message }
     * TODO: Add @ApiResponse() decorators for all possible response codes
     * TODO: Add @ApiBearerAuth() decorator for Swagger authentication
     * TODO: Log the user who performed the update (inject user from request)
     * TODO: Consider adding @Patch() endpoint for partial updates (more RESTful)
     * TODO: Add validation for business logic (e.g., at least one payment method enabled)
     * TODO: Add request throttling to prevent rapid repeated updates
     */
    @Put()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_SETTINGS')
    async updateSettings(@Body() data: UpdateSettingsDto) {
        return this.settingsService.updateSettings(data);
        
        // TODO: Emit real-time notification to connected clients (WebSocket/SSE)
        // TODO: Invalidate frontend cache after successful update
    }
}
