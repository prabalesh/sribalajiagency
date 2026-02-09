import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { LocationRestriction } from './entities/location-restriction.entity';
import { CreateLocationRestrictionDto } from './dto/create-location-restriction.dto';
import { UpdateLocationRestrictionDto } from './dto/update-location-restriction.dto';

/**
 * Service for managing delivery location restrictions.
 * 
 * Implements hierarchical location-based delivery restrictions:
 * - State-level: Allow/block entire states
 * - City-level: Allow/block specific cities within states
 * - Zipcode-level: Allow/block specific zipcodes within cities
 * 
 * Validates location data against Indian Postal API for consistency.
 * 
 * @remarks
 * - Uses hierarchical matching (zipcode > city > state)
 * - Validates Indian zipcodes (6-digit format)
 * - Cross-references with postal API for accuracy
 * - Supports partial location specifications
 * 
 * @example
 * ```typescript
 * // Check if delivery is allowed
 * const allowed = await locationsService.isLocationAllowed(
 *   'Tamil Nadu',
 *   'Chennai',
 *   '600001'
 * );
 * 
 * // Add restriction
 * await locationsService.create({
 *   state: 'Tamil Nadu',
 *   city: 'Chennai',
 *   zipcode: '600001',
 *   isAllowed: true
 * });
 * ```
 * 
 * TODO: Add caching layer for location checks (Redis)
 * TODO: Add bulk import/export functionality
 * TODO: Add location hierarchy tree view
 * TODO: Add delivery charge calculation based on location
 * TODO: Add serviceable area visualization on map
 * TODO: Add location analytics (most requested blocked areas)
 * TODO: Add automatic location expansion suggestions
 * TODO: Add integration with logistics partners for serviceability
 */
@Injectable()
export class LocationsService {
    /** Logger instance for service-level logging */
    private readonly logger = new Logger(LocationsService.name);

    /**
     * Initializes the locations service with required dependencies
     * 
     * @param locationRepo - Repository for LocationRestriction entity
     */
    constructor(
        @InjectRepository(LocationRestriction)
        private locationRepo: Repository<LocationRestriction>,
    ) { }

    /**
     * Retrieves all location restrictions.
     * 
     * Returns complete list of location restrictions without pagination.
     * 
     * @returns Promise resolving to array of LocationRestriction entities
     * 
     * @example
     * ```typescript
     * const restrictions = await locationsService.findAll();
     * ```
     * 
     * FIXME: No pagination - can return huge dataset
     * FIXME: No filtering or sorting options
     * 
     * TODO: Add pagination support
     * TODO: Add filtering by state/city/zipcode
     * TODO: Add filtering by isAllowed status
     * TODO: Add sorting options
     * TODO: Add grouping by state/city for hierarchical view
     * TODO: Add search functionality
     * TODO: Cache results
     * TODO: Add count by state for analytics
     */
    findAll() {
        this.logger.log('Finding all location restrictions');

        // FIXME: No pagination can cause performance issues
        // TODO: Add pagination, filtering, and sorting
        return this.locationRepo.find();
    }

    /**
     * Retrieves a single location restriction by ID.
     * 
     * @param id - LocationRestriction ID
     * @returns Promise resolving to LocationRestriction entity
     * 
     * @throws {NotFoundException} If location restriction doesn't exist
     * 
     * @example
     * ```typescript
     * const location = await locationsService.findOne('loc_123');
     * ```
     * 
     * TODO: Add caching for frequently accessed restrictions
     * TODO: Add validation for UUID format
     */
    async findOne(id: string) {
        this.logger.log(`Finding location restriction by ID: ${id}`);

        const location = await this.locationRepo.findOneBy({ id });
        if (!location) {
            this.logger.warn(`Location restriction ${id} not found`);
            throw new NotFoundException('Location restriction not found');
        }
        
        return location;
    }

    /**
     * Validates location data consistency using Indian Postal API.
     * 
     * Validates:
     * - Zipcode format (6-digit Indian format)
     * - Zipcode existence via postal API
     * - State matches zipcode's actual state (strict)
     * - City matches zipcode's district (loose warning only)
     * 
     * @param data - Location data to validate (state, city, zipcode)
     * 
     * @throws {BadRequestException} If zipcode format is invalid
     * @throws {BadRequestException} If zipcode doesn't exist
     * @throws {BadRequestException} If state doesn't match zipcode
     * 
     * @example
     * ```typescript
     * await locationsService.validateConsistency({
     *   state: 'Tamil Nadu',
     *   city: 'Chennai',
     *   zipcode: '600001'
     * });
     * ```
     * 
     * FIXME: Hardcoded external API URL - should be in config
     * FIXME: No rate limiting for API calls - can get blocked
     * FIXME: No timeout for API calls - can hang indefinitely
     * FIXME: No retry mechanism for failed API calls
     * FIXME: Silently allows if API is down - inconsistent behavior
     * FIXME: City mismatch only logs warning but doesn't enforce
     * FIXME: API response structure not type-safe
     * FIXME: No validation for multiple post offices in same zipcode
     * 
     * TODO: Move API URL to ConfigService
     * TODO: Add rate limiting/throttling for API calls
     * TODO: Add request timeout (e.g., 5 seconds)
     * TODO: Add retry mechanism with exponential backoff
     * TODO: Cache API responses to reduce external calls
     * TODO: Add circuit breaker pattern for API failures
     * TODO: Make city validation strict (not just warning)
     * TODO: Add TypeScript types for API response
     * TODO: Add support for multiple post offices per zipcode
     * TODO: Add validation for state name variations (e.g., "TN" vs "Tamil Nadu")
     * TODO: Add offline fallback data for common zipcodes
     * TODO: Add monitoring/alerting for API availability
     * TODO: Consider alternative postal APIs for redundancy
     */
    async validateConsistency(data: any) {
        // Skip validation if no zipcode provided
        if (!data.zipcode) {
            this.logger.debug('Skipping consistency validation - no zipcode provided');
            return;
        }

        const zip = data.zipcode;
        
        // Validate zipcode format (6-digit Indian format)
        // FIXME: Regex doesn't validate actual zipcode ranges
        if (!/^[1-9][0-9]{5}$/.test(zip)) {
            this.logger.warn(`Invalid zipcode format: ${zip}`);
            throw new BadRequestException('Invalid 6-digit Indian Zipcode');
        }

        this.logger.debug(`Validating consistency for zipcode: ${zip}`);

        // FIXME: No error handling for network failures, timeouts
        // FIXME: API URL hardcoded - should be in config
        try {
            // TODO: Add timeout to prevent hanging
            // TODO: Add retry mechanism
            const response = await fetch(`https://api.postalpincode.in/pincode/${zip}`);
            const results = await response.json();

            // FIXME: Response structure not type-safe
            // TODO: Add type definitions for API response
            if (!results || !results[0] || results[0].Status !== 'Success') {
                this.logger.warn(`Invalid or non-existent zipcode: ${zip}`);
                throw new BadRequestException('Invalid or non-existent Zipcode');
            }

            // FIXME: Assumes single post office, but zipcode can have multiple
            const postOffice = results[0].PostOffice[0];
            const apiState = postOffice.State.toLowerCase();
            const inputState = data.state.toLowerCase();

            // Strict State Check
            if (apiState !== inputState) {
                this.logger.warn(
                    `State mismatch: zipcode ${zip} belongs to ${postOffice.State}, not ${data.state}`
                );
                throw new BadRequestException(
                    `Zipcode ${zip} belongs to ${postOffice.State}, not ${data.state}`
                );
            }

            this.logger.debug(`State validation passed for zipcode ${zip}`);

            // Loose City Check
            // FIXME: Only logs warning but doesn't block - inconsistent with state validation
            if (data.city) {
                const apiDistrict = postOffice.District.toLowerCase();
                const inputCity = data.city.toLowerCase();
                
                // TODO: Make this validation strict or document why it's loose
                if (!apiDistrict.includes(inputCity) && !inputCity.includes(apiDistrict)) {
                    // FIXME: Using console.warn instead of logger
                    console.warn(`City mismatch: Input ${data.city} vs Zipcode District ${postOffice.District}`);
                    this.logger.warn(`City mismatch: Input ${data.city} vs API District ${postOffice.District}`);
                    
                    // TODO: Decide whether to throw error or just warn
                }
            }

        } catch (error) {
            // Re-throw BadRequestException for validation failures
            if (error instanceof BadRequestException) throw error;
            
            // FIXME: Silently allows if API is down - should have better fallback strategy
            // FIXME: Using console.error instead of logger
            console.error('Consistency validation failed:', error);
            this.logger.error(`Consistency validation failed: ${error.message}`, error.stack);
            
            // TODO: Add circuit breaker - fail closed after N failures
            // TODO: Use cached/offline data as fallback
            // Allow if API is down, but log it
        }
    }

    /**
     * Creates a new location restriction.
     * 
     * @param data - Location restriction data
     * @returns Promise resolving to created LocationRestriction entity
     * 
     * @example
     * ```typescript
     * const restriction = await locationsService.create({
     *   state: 'Tamil Nadu',
     *   city: 'Chennai',
     *   zipcode: '600001',
     *   isAllowed: true
     * });
     * ```
     * 
     * FIXME: No validation for duplicate entries
     * FIXME: Empty string handling mentioned in comments but not implemented
     * FIXME: No consistency validation called (commented out)
     * FIXME: No authorization check
     * 
     * TODO: Add duplicate check (same state/city/zipcode combination)
     * TODO: Uncomment and enable consistency validation
     * TODO: Add authorization check (admin only)
     * TODO: Add bulk create functionality
     * TODO: Emit LocationRestrictionCreatedEvent
     * TODO: Clear location cache after creation
     * TODO: Add validation for isAllowed field
     * TODO: Add conflict resolution (what if overlapping restrictions exist?)
     * TODO: Add audit logging
     */
    async create(data: CreateLocationRestrictionDto) {
        this.logger.log(`Creating location restriction for ${data.state}`);

        // FIXME: Consistency validation is commented out - should be enabled
        // TODO: Uncomment and enable validation
        // await this.validateConsistency(data);
        
        // FIXME: Empty string to null conversion commented out
        // TODO: Implement in DTO transformation or add here
        // if (data.city === '') data.city = null;
        // if (data.zipcode === '') data.zipcode = null;

        // TODO: Check for duplicate entries
        // TODO: Add authorization check

        const restriction = this.locationRepo.create(data);
        const saved = await this.locationRepo.save(restriction);
        
        this.logger.log(`Location restriction created with ID: ${saved.id}`);

        // TODO: Emit LocationRestrictionCreatedEvent
        // TODO: Clear cache

        return saved;
    }

    /**
     * Updates an existing location restriction.
     * 
     * @param id - LocationRestriction ID
     * @param data - Partial update data
     * @returns Promise resolving to updated LocationRestriction entity
     * 
     * @example
     * ```typescript
     * const updated = await locationsService.update('loc_123', {
     *   isAllowed: false
     * });
     * ```
     * 
     * FIXME: No validation that location exists before update
     * FIXME: No consistency validation called (commented out)
     * FIXME: Empty string handling commented out
     * FIXME: No authorization check
     * FIXME: No validation for duplicate after update
     * 
     * TODO: Validate location exists before update
     * TODO: Uncomment and enable consistency validation
     * TODO: Add authorization check (admin only)
     * TODO: Add change tracking/audit logging
     * TODO: Emit LocationRestrictionUpdatedEvent
     * TODO: Clear location cache after update
     * TODO: Add validation that update doesn't create duplicate
     * TODO: Add optimistic locking to prevent concurrent updates
     */
    async update(id: string, data: UpdateLocationRestrictionDto) {
        this.logger.log(`Updating location restriction ${id}`);

        // TODO: Validate location exists first
        
        // FIXME: Consistency validation commented out
        // await this.validateConsistency(data);
        
        // FIXME: Empty string to null conversion commented out
        // if (data.city === '') data.city = null;
        // if (data.zipcode === '') data.zipcode = null;

        // TODO: Add duplicate check after update
        // TODO: Add authorization check

        await this.locationRepo.update(id, data);
        
        this.logger.log(`Location restriction ${id} updated successfully`);

        // TODO: Emit LocationRestrictionUpdatedEvent
        // TODO: Clear cache

        return this.findOne(id);
    }

    /**
     * Deletes a location restriction.
     * 
     * @param id - LocationRestriction ID
     * @returns Promise resolving to deletion result
     * 
     * @example
     * ```typescript
     * await locationsService.delete('loc_123');
     * ```
     * 
     * FIXME: No validation that location exists
     * FIXME: No authorization check
     * FIXME: Hard delete - no audit trail
     * 
     * TODO: Validate location exists before deletion
     * TODO: Add authorization check (admin only)
     * TODO: Implement soft delete instead
     * TODO: Add cascade handling if referenced elsewhere
     * TODO: Emit LocationRestrictionDeletedEvent
     * TODO: Clear location cache after deletion
     * TODO: Add audit logging
     * TODO: Add confirmation for critical deletions (e.g., state-level)
     */
    delete(id: string) {
        this.logger.log(`Deleting location restriction ${id}`);

        // TODO: Validate location exists
        // TODO: Add authorization check
        // TODO: Use soft delete

        const result = this.locationRepo.delete(id);

        // TODO: Emit LocationRestrictionDeletedEvent
        // TODO: Clear cache

        return result;
    }

    /**
     * Checks if delivery is allowed to a specific location.
     * 
     * Implements hierarchical matching:
     * 1. Check specific zipcode (highest priority)
     * 2. Check city-level restriction
     * 3. Check state-level restriction (lowest priority)
     * 
     * @param state - State name (required)
     * @param city - City name (optional)
     * @param zipcode - Zipcode (optional)
     * @returns Promise resolving to boolean (true if allowed, false if not)
     * 
     * @example
     * ```typescript
     * // Check specific zipcode
     * const allowed1 = await locationsService.isLocationAllowed(
     *   'Tamil Nadu',
     *   'Chennai',
     *   '600001'
     * );
     * 
     * // Check city-level
     * const allowed2 = await locationsService.isLocationAllowed(
     *   'Tamil Nadu',
     *   'Chennai'
     * );
     * 
     * // Check state-level
     * const allowed3 = await locationsService.isLocationAllowed('Tamil Nadu');
     * ```
     * 
     * FIXME: Multiple queries instead of single optimized query
     * FIXME: Inconsistent empty string vs null handling (checking both '', null, IsNull())
     * FIXME: No caching - repeated checks for same location hit database
     * FIXME: No input normalization (case-sensitive, whitespace variations)
     * FIXME: Logic is complex and error-prone with multiple where clauses
     * FIXME: Returns false for database errors - should throw
     * FIXME: No validation that state is provided and valid
     * 
     * TODO: Optimize to single query with proper precedence
     * TODO: Add caching layer (Redis) with TTL
     * TODO: Normalize inputs (lowercase, trim, handle variations)
     * TODO: Simplify query logic - decide on null vs empty string standard
     * TODO: Add error handling and logging
     * TODO: Add validation for required parameters
     * TODO: Add metrics/analytics for blocked locations
     * TODO: Consider returning reason for blocking (which rule matched)
     * TODO: Add support for temporary blocks (date-based restrictions)
     * TODO: Add support for time-based restrictions (e.g., no delivery on Sundays)
     * TODO: Add delivery slot checking
     * TODO: Return more details (estimated delivery time, charges)
     */
    async isLocationAllowed(state: string, city?: string, zipcode?: string): Promise<boolean> {
        this.logger.debug(`Checking if location is allowed: state=${state}, city=${city}, zipcode=${zipcode}`);

        // FIXME: Inconsistent empty string vs null handling
        // TODO: Standardize on either null or empty string, not both
        // Normalize empty strings to null for consistent handling
        const sCity = (!city || city.trim() === '') ? null : city.trim();
        const sZip = (!zipcode || zipcode.trim() === '') ? null : zipcode.trim();

        // TODO: Normalize state as well (lowercase, trim)
        // TODO: Validate state is provided

        // FIXME: Multiple database queries - should be single optimized query
        // TODO: Combine into single query with CASE/WHEN for precedence

        try {
            // 1. Check for specific zipcode (highest priority)
            if (sZip) {
                // FIXME: Checking both null and empty string is redundant and error-prone
                const allowedZip = await this.locationRepo.findOne({
                    where: [
                        { state, city: sCity || IsNull(), zipcode: sZip, isAllowed: true },
                        { state, city: sCity || '', zipcode: sZip, isAllowed: true }
                    ]
                });
                if (allowedZip) {
                    this.logger.debug(`Location allowed by zipcode rule: ${allowedZip.id}`);
                    return true;
                }
            }

            // 2. Check for city-level restriction
            if (sCity) {
                const allowedCity = await this.locationRepo.findOne({
                    where: [
                        { state, city: sCity, zipcode: IsNull(), isAllowed: true },
                        { state, city: sCity, zipcode: '', isAllowed: true }
                    ]
                });
                if (allowedCity) {
                    this.logger.debug(`Location allowed by city rule: ${allowedCity.id}`);
                    return true;
                }
            }

            // 3. Check for state-level restriction (lowest priority)
            // FIXME: Too many where clause variations - should be simplified
            const allowedState = await this.locationRepo.findOne({
                where: [
                    { state, city: IsNull(), zipcode: IsNull(), isAllowed: true },
                    { state, city: '', zipcode: '', isAllowed: true },
                    { state, city: IsNull(), zipcode: '', isAllowed: true },
                    { state, city: '', zipcode: IsNull(), isAllowed: true }
                ]
            });
            
            const result = !!allowedState;
            
            if (result) {
                this.logger.debug(`Location allowed by state rule: ${allowedState.id}`);
            } else {
                this.logger.debug(`Location not allowed - no matching rules`);
            }

            return result;
        } catch (error) {
            // FIXME: Returns false on error - should throw or handle differently
            this.logger.error(`Error checking location allowance: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to check location allowance');
        }
    }
}
