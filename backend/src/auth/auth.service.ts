import { Injectable, UnauthorizedException, ForbiddenException, ConflictException, BadRequestException, Logger, HttpException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Role, Permission } from './entities/role.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthSignupDto, AuthLoginDto } from './dto/auth.dto';


/**
 * Service for authentication and user/role/permission management.
 * 
 * Handles:
 * - User authentication (signup, login, token refresh)
 * - JWT token generation and management
 * - Password hashing and verification
 * - User CRUD operations
 * - Role-based access control (RBAC)
 * - Permission management
 * 
 * @remarks
 * - Uses JWT with access tokens (15m) and refresh tokens (7d)
 * - Implements timing attack prevention in login
 * - Stores hashed refresh tokens in database
 * - Supports role-permission hierarchy
 * 
 * @example
 * ```typescript
 * const { user, access_token, refresh_token } = await authService.signup(dto);
 * const loginResult = await authService.login(loginDto);
 * const refreshed = await authService.refreshTokens(userId, refreshToken);
 * ```
 * 
 * FIXME: God Service anti-pattern - combines Auth, Users, Roles, Permissions (violates SRP at class level)
 * FIXME: No rate limiting infrastructure
 * FIXME: No email verification system
 * FIXME: No password reset functionality
 * FIXME: No audit logging system
 * FIXME: No token blacklist/revocation mechanism
 * FIXME: No session management
 * FIXME: No device tracking
 * FIXME: Inconsistent error handling patterns across methods
 * FIXME: Inconsistent transaction usage across methods
 * FIXME: No caching strategy for frequently accessed data (roles, permissions)
 * FIXME: Class documentation outdated (doesn't mention God Service issue)
 * 
 * TODO: Split into AuthService, UsersService, RolesService, PermissionsService
 * TODO: Create shared TransactionService or use decorators for transaction management
 * TODO: Create ErrorHandlerService for consistent error handling
 * TODO: Add rate limiting decorator/guard for auth endpoints
 * TODO: Add email verification flow with token generation
 * TODO: Add password reset flow with secure token
 * TODO: Add two-factor authentication (2FA) support
 * TODO: Add account lockout mechanism after N failed attempts
 * TODO: Add session management with Redis
 * TODO: Add device fingerprinting and tracking
 * TODO: Add comprehensive audit logging (who, what, when, where)
 * TODO: Add OAuth2/social login support (Google, GitHub, etc.)
 * TODO: Add token blacklist with Redis for logout/revocation
 * TODO: Add IP-based security (tracking, blocking, whitelist)
 * TODO: Add security headers and CSRF protection
 * TODO: Add API versioning support
 * TODO: Add health check endpoint
 * TODO: Implement CQRS pattern for better separation
 * TODO: Add event sourcing for audit trail
 * TODO: Add monitoring and alerting for suspicious activities
 */
@Injectable()
export class AuthService {
    /** Logger instance for service-level logging */
    private readonly logger = new Logger(AuthService.name);


    /**
     * Initializes the auth service with required dependencies
     * 
     * @param userRepository - Repository for User entity
     * @param roleRepository - Repository for Role entity
     * @param permissionRepository - Repository for Permission entity
     * @param jwtService - JWT service for token operations
     * @param configService - Config service for environment variables
     * @param dataSource - TypeORM DataSource for transaction management
     * 
     * FIXME: Too many dependencies (sign of God Service)
     * 
     * TODO: Refactor into separate services to reduce dependencies
     * TODO: Consider dependency injection of Redis client for caching/rate limiting
     * TODO: Consider injecting EventEmitter for domain events
     * TODO: Consider injecting MailService for email operations
     */
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        @InjectRepository(Permission)
        private permissionRepository: Repository<Permission>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private dataSource: DataSource,
    ) { }


    /**
     * Hashes data using bcrypt with 10 rounds.
     * 
     * @param data - Data to hash (password or refresh token)
     * @returns Promise resolving to hashed string
     * 
     * FIXME: Hardcoded salt rounds (10) - should be 12-14 for better security
     * FIXME: No error handling
     * FIXME: No input validation (empty string, null)
     * FIXME: No logging
     * 
     * TODO: Move salt rounds to configuration (BCRYPT_ROUNDS env var)
     * TODO: Increase salt rounds to 12-14 for production
     * TODO: Add try-catch error handling
     * TODO: Validate input is non-empty string
     * TODO: Add performance monitoring (bcrypt is CPU intensive)
     * TODO: Consider using argon2 instead of bcrypt (more secure)
     */
    async hashData(data: string) {
        const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
        return bcrypt.hash(data, saltRounds);
    }


    /**
     * Generates access and refresh tokens for a user.
     * 
     * Access token: 15 minutes lifetime
     * Refresh token: 7 days lifetime
     * 
     * @param userId - User ID to encode in token
     * @param email - User email to encode in token
     * @returns Promise resolving to access and refresh tokens
     * 
     * @example
     * ```typescript
     * const tokens = await authService.getTokens('user_123', 'user@example.com');
     * // Returns: { access_token: '...', refresh_token: '...' }
     * ```
     * 
     * FIXME: Hardcoded expiration times ('15m', '7d')
     * FIXME: No token versioning for revocation support
     * FIXME: Token payload too minimal (missing roles, permissions, metadata)
     * FIXME: No jti (JWT ID) for tracking
     * FIXME: No iat (issued at) explicit claim
     * FIXME: No iss (issuer) claim
     * FIXME: No aud (audience) claim
     * FIXME: No error handling for signAsync failures
     * FIXME: No input validation
     * 
     * TODO: Move expiration times to configuration (JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY)
     * TODO: Add token versioning field for revocation (version number in payload)
     * TODO: Include user roles array in token payload for authorization
     * TODO: Include user permissions array or role names
     * TODO: Add jti (JWT ID) with UUID for token tracking/blacklisting
     * TODO: Add explicit iat (issued at) timestamp
     * TODO: Add iss (issuer) claim with application name
     * TODO: Add aud (audience) claim for token scope
     * TODO: Add device/IP information to payload for security
     * TODO: Add token type field ('access' vs 'refresh')
     * TODO: Add session ID for multi-device session management
     * TODO: Add error handling with specific error messages
     * TODO: Validate userId is valid UUID format
     * TODO: Validate email format
     * TODO: Add token signing algorithm to config (RS256 vs HS256)
     * TODO: Consider asymmetric keys (RS256) for better security
     * TODO: Add token blacklist check before issuing
     * TODO: Add rate limiting for token generation per user
     */
    async getTokens(userId: string, email: string) {
        const accessTokenExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
        const refreshTokenExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');

        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                },
                {
                    secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                    expiresIn: accessTokenExpiration as any,
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                },
                {
                    secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                    expiresIn: refreshTokenExpiration as any,
                },
            ),
        ]);

        return { access_token: at, refresh_token: rt };
    }


    /**
     * Registers a new user account.
     * 
     * Creates user with hashed password, generates tokens,
     * and stores hashed refresh token in a transaction.
     * 
     * @param dto - Signup data (name, email, password)
     * @returns Promise resolving to user and tokens
     * 
     * @example
     * ```typescript
     * const result = await authService.signup({
     *   name: 'John Doe',
     *   email: 'john@example.com',
     *   password: 'SecurePass123!'
     * });
     * // Returns: { user, access_token, refresh_token }
     * ```
     * 
     * FIXME: Violates SRP - handles validation, hashing, persistence, token generation
     * FIXME: No email verification (security risk)
     * FIXME: No default role assignment
     * FIXME: Error handling swallows specific HttpExceptions
     * FIXME: No rate limiting (signup spam vulnerability)
     * FIXME: Returns sensitive user data (should exclude internal fields)
     * FIXME: No CAPTCHA verification
     * FIXME: Email normalization not applied (john@example.com vs JOHN@example.com)
     * FIXME: No username validation (if username field exists)
     * FIXME: Password already validated in DTO but comment suggests otherwise
     * 
     * TODO: Extract user creation to UserService.createUser()
     * TODO: Extract token operations to TokenService.generateAndStore()
     * TODO: Add email verification flow (send verification email, check before login)
     * TODO: Assign default 'Customer' or 'User' role automatically
     * TODO: Fix error handling - re-throw HttpExceptions
     * TODO: Add rate limiting per IP (max N signups per hour)
     * TODO: Normalize email to lowercase before checking/saving
     * TODO: Send welcome email after successful signup
     * TODO: Emit UserCreatedEvent for async processing (analytics, welcome email)
     * TODO: Add CAPTCHA verification token validation
     * TODO: Add referral code support in DTO
     * TODO: Add analytics tracking (signup source, UTM params)
     * TODO: Add terms of service acceptance timestamp
     * TODO: Add privacy policy acceptance timestamp
     * TODO: Hash email for privacy (for analytics) or use UUID
     * TODO: Add username uniqueness check if username field exists
     * TODO: Add phone number verification if phone field exists
     * TODO: Create user profile automatically (separate table)
     * TODO: Add signup source tracking (web, mobile app, API)
     * TODO: Add A/B test variant tracking
     * TODO: Exclude internal fields from response (refreshToken, password hash)
     * TODO: Add correlation ID for request tracing
     * TODO: Add idempotency key support to prevent duplicate signups
     */
    async signup(dto: AuthSignupDto) {
        this.logger.log(`User signup attempt`);
        dto.email = dto.email.toLowerCase().trim();

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const existingUser: User | null = await queryRunner.manager.findOneBy(User, { email: dto.email });
            if (existingUser) {
                this.logger.warn(`Signup failed - email already exists: ${dto.email}`);
                throw new ConflictException('Email already exists');
            }

            const password = await this.hashData(dto.password);

            const newUser: User = queryRunner.manager.create(User, {
                name: dto.name,
                email: dto.email,
                password,
            });

            const user = await queryRunner.manager.save(newUser);

            const tokens = await this.getTokens(user.id, user.email);

            const refreshTokenHash = await this.hashRefreshToken(user.id, tokens.refresh_token);
            await queryRunner.manager.update(User, user.id, { refreshToken: refreshTokenHash });

            await queryRunner.commitTransaction();

            this.logger.log(`User registered successfully: ${user.email}`);

            return { user, ...tokens };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Signup failed for email ${dto.email}: ${error.message}`, error.stack);

            if (error instanceof HttpException) {
                throw error;
            }
            throw new BadRequestException('Signup failed. Please try again.');
        } finally {
            await queryRunner.release();
        }
    }


    /**
     * Authenticates a user with email and password.
     * 
     * Implements timing attack prevention by always comparing hash
     * even if user doesn't exist.
     * 
     * @param dto - Login credentials (email, password)
     * @returns Promise resolving to user (without password) and tokens
     * 
     * @throws {ForbiddenException} If credentials are invalid
     * 
     * @example
     * ```typescript
     * const result = await authService.login({
     *   email: 'john@example.com',
     *   password: 'SecurePass123!'
     * });
     * ```
     * 
     * FIXME: No rate limiting (brute force vulnerability)
     * FIXME: No account lockout after N failed attempts
     * FIXME: No logging of failed attempts with IP/device info
     * FIXME: Generic error message doesn't distinguish user not found vs wrong password (good for security, but log should)
     * FIXME: No check if user email is verified
     * FIXME: No check if user account is active
     * FIXME: No check if user is banned
     * FIXME: No check if user is deleted (soft delete)
     * FIXME: Transaction used but could fail after token generation
     * FIXME: Error handling swallows all errors generically
     * FIXME: Email not normalized (case sensitivity issue)
     * FIXME: No device fingerprinting
     * FIXME: No suspicious activity detection
     * FIXME: lastLoginAt not updated
     * 
     * TODO: Add rate limiting per email (5 attempts per 15 min)
     * TODO: Add rate limiting per IP (20 attempts per 15 min)
     * TODO: Add account lockout after 5 failed attempts (30 min lockout)
     * TODO: Log all login attempts with timestamp, IP, device, success/failure
     * TODO: Check user.emailVerified === true before allowing login
     * TODO: Check user.isActive === true
     * TODO: Check user.isBanned === false
     * TODO: Check user.deletedAt === null (if soft delete implemented)
     * TODO: Increment failedLoginAttempts counter on failure
     * TODO: Reset failedLoginAttempts to 0 on success
     * TODO: Send login notification email (especially from new device/location)
     * TODO: Update user.lastLoginAt timestamp
     * TODO: Update user.lastLoginIp
     * TODO: Track login device/browser (User-Agent)
     * TODO: Add suspicious activity detection (impossible travel, new device, etc.)
     * TODO: Emit LoginSuccessEvent and LoginFailureEvent
     * TODO: Add CAPTCHA requirement after 3 failed attempts
     * TODO: Create session record in sessions table
     * TODO: Support remember me functionality (longer refresh token)
     * TODO: Add multi-factor authentication check if enabled
     * TODO: Normalize email to lowercase before lookup
     * TODO: Add correlation ID for request tracing
     * TODO: Improve error handling (re-throw HttpExceptions)
     * TODO: Add device fingerprint to token payload
     */
    async login(dto: AuthLoginDto) {
        this.logger.log(`Login attempt`);
        dto.email = dto.email.toLowerCase().trim();

        const user = await this.userRepository.findOne({
            where: { email: dto.email },
            relations: ['roles', 'roles.permissions'],
            select: ['id', 'email', 'password', 'name'],
        });

        // Timing attack prevention - always compare even if user not found
        const passwordHash = user?.password || '$2b$10$fakehashtopreventtimingattack';
        const passwordMatches = await bcrypt.compare(dto.password, passwordHash);


        if (!user || !passwordMatches) {
            this.logger.warn(`Login failed for email: ${dto.email}`);
            throw new ForbiddenException('Access Denied');
        }


        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();


        try {
            const tokens = await this.getTokens(user.id, user.email);

            const refreshTokenHash = await this.hashRefreshToken(user.id, tokens.refresh_token);
            await queryRunner.manager.update(User, user.id, {
                refreshToken: refreshTokenHash,
            });

            await queryRunner.commitTransaction();

            const { password: _, ...userWithoutPassword } = user;

            this.logger.log(`Login successful: ${user.email}`);

            return { user: userWithoutPassword, ...tokens };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error during login token generation for user ${user.id}: ${error.message}`, error.stack);

            if (error instanceof HttpException) {
                throw error;
            }
            throw new BadRequestException('Login failed. Please try again.');
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get user by ID with roles and permissions
     * Used by /auth/me endpoint to fetch current user data
     */
    async getUserById(userId: string) {
        // console.log(userId)
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles', 'roles.permissions']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Remove sensitive data
        const { password, refreshToken, ...userWithoutSensitiveData } = user;

        return userWithoutSensitiveData;
    }


    /**
     * Generates hashed refresh token for storage.
     * 
     * @param userId - User ID (for logging only)
     * @param refreshToken - Refresh token to hash
     * @returns Promise resolving to hashed token
     * 
     * FIXME: userId parameter only used for logging (misleading)
     * FIXME: Error handling doesn't actually handle errors (just throws different error)
     * FIXME: Initializes hash to empty string unnecessarily
     * FIXME: Method name suggests it updates database but only returns hash
     * 
     * TODO: Remove userId parameter or make it optional (not used for hashing)
     * TODO: Simplify error handling or remove try-catch
     * TODO: Rename to just 'hashRefreshToken' (more accurate)
     * TODO: Add input validation (non-empty token)
     * TODO: Consider making this a private utility method
     */
    async hashRefreshToken(userId: string, refreshToken: string) {
        this.logger.debug(`Hashing refresh token for user ${userId}`);
        try {
            return await this.hashData(refreshToken);
        } catch (error) {
            this.logger.error(`Error hashing refresh token for user ${userId}: ${error.message}`);
            throw new BadRequestException('Failed to hash refresh token');
        }
    }


    /**
     * Refreshes access and refresh tokens using valid refresh token.
     * 
     * Validates refresh token and issues new token pair.
     * Old refresh token is replaced (not revoked/blacklisted).
     * 
     * @param userId - User ID from token payload
     * @param rt - Refresh token to validate
     * @returns Promise resolving to user and new tokens
     * 
     * @throws {ForbiddenException} If refresh token is invalid or user not found
     * 
     * @example
     * ```typescript
     * const result = await authService.refreshTokens('user_123', oldRefreshToken);
     * ```
     * 
     * FIXME: No rate limiting (token refresh spam vulnerability)
     * FIXME: No token rotation tracking (can't detect reuse attacks)
     * FIXME: Old refresh token not explicitly invalidated (just replaced)
     * FIXME: No check if user is active/verified/not banned
     * FIXME: Token reuse not detected (security breach indicator)
     * FIXME: Error handling swallows all errors generically
     * FIXME: Unnecessary check for tokens.refresh_token (will always exist)
     * FIXME: Transaction overkill for single update (unless coordinating with session table)
     * FIXME: No check if refresh token is expired (JWT middleware should handle, but defense in depth)
     * FIXME: No check if refresh token is blacklisted
     * 
     * TODO: Add rate limiting per user (max 10 refreshes per hour)
     * TODO: Implement refresh token families for rotation tracking
     * TODO: Detect token reuse (if old revoked token used, revoke entire family)
     * TODO: Add refresh token to blacklist before issuing new one
     * TODO: Check user.isActive, user.emailVerified, user.isBanned, user.deletedAt
     * TODO: Check if session still valid (if session management implemented)
     * TODO: Emit TokenRefreshedEvent for audit logging
     * TODO: Log refresh events with user ID, IP, device
     * TODO: Update session.lastActivityAt timestamp
     * TODO: Verify refresh token hasn't been used before (one-time use)
     * TODO: Add refresh token jti tracking in database
     * TODO: Remove unnecessary tokens.refresh_token check (always defined)
     * TODO: Consider removing transaction if only updating single field
     * TODO: Add correlation ID for request tracing
     * TODO: Improve error handling (re-throw HttpExceptions)
     * TODO: Add suspicious activity detection (too many refreshes)
     * TODO: Rotate refresh token secret periodically
     * TODO: Add maximum refresh token lifetime (can't refresh forever)
     * TODO: Check if device/IP matches original token issuance
     */
    async refreshTokens(userId: string, rt: string) {
        this.logger.log(`Refreshing tokens for user ${userId}`);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles', 'roles.permissions'],
            select: ['id', 'email', 'refreshToken'],
        });


        if (!user || !user.refreshToken) {
            this.logger.warn(`Refresh failed - user not found or no token: ${userId}`);
            throw new ForbiddenException('Access Denied');
        }


        const rtMatches = await bcrypt.compare(rt, user.refreshToken);
        if (!rtMatches) {
            this.logger.warn(`Refresh failed - invalid token for user: ${userId}`);
            throw new ForbiddenException('Access Denied');
        }


        const tokens = await this.getTokens(user.id, user.email);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();


        try {
            const refreshTokenHash = await this.hashRefreshToken(user.id, tokens.refresh_token);
            await queryRunner.manager.update(User, user.id, {
                refreshToken: refreshTokenHash,
            });

            await queryRunner.commitTransaction();

            this.logger.log(`Tokens refreshed successfully for user ${userId}`);

            return { user, ...tokens };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error during token refresh for user ${userId}: ${error.message}`, error.stack);

            if (error instanceof HttpException) {
                throw error;
            }
            throw new BadRequestException('Failed to refresh tokens. Please try again.');
        } finally {
            await queryRunner.release();
        }
    }


    /**
     * Retrieves paginated list of all users.
     * 
     * @param page - Page number (default: 1)
     * @param limit - Items per page (default: 20, max: 50)
     * @returns Promise resolving to paginated user list
     * 
     * FIXME: Violates SRP - auth service shouldn't handle user management
     * FIXME: No filtering capabilities (by role, status, date range)
     * FIXME: No search functionality (by name, email)
     * FIXME: No sorting options
     * FIXME: Returns sensitive data (refreshToken, password hash in select)
     * FIXME: No authorization check (anyone can list users)
     * FIXME: Hardcoded max limit (50)
     * FIXME: No input validation (negative page, zero limit)
     * FIXME: N+1 query problem with relations
     * FIXME: No caching
     * FIXME: No field selection (returns all fields)
     * 
     * TODO: Move to dedicated UsersService
     * TODO: Add filtering options (role, isActive, emailVerified, createdAfter, createdBefore)
     * TODO: Add search by name or email (LIKE query or full-text search)
     * TODO: Add sorting options (createdAt, name, email) with direction (ASC/DESC)
     * TODO: Exclude sensitive fields from response (password, refreshToken)
     * TODO: Add authorization guard (only admins can list users)
     * TODO: Move max limit to configuration
     * TODO: Validate page >= 1 and limit > 0
     * TODO: Add query builder to avoid N+1 with relations
     * TODO: Add Redis caching with short TTL (1-5 minutes)
     * TODO: Allow client to specify fields to return (sparse fieldsets)
     * TODO: Add total pages to response metadata
     * TODO: Add hasNextPage, hasPreviousPage flags
     * TODO: Add cursor-based pagination option for better performance
     * TODO: Add user count by role in response metadata
     * TODO: Add date range filtering (registered between dates)
     * TODO: Add status filtering (active, inactive, banned, deleted)
     * TODO: Return UserListDto instead of raw entities
     * TODO: Add query performance monitoring
     * TODO: Add request logging with requester info
     */
    async findAllUsers(page: number = 1, limit: number = 20) {
        this.logger.log(`Finding all users: page=${page}, limit=${limit}`);
        // TODO: Log requester user ID


        // FIXME: Hardcoded max limit
        // TODO: Move to config: this.configService.get('MAX_PAGE_LIMIT', 50)
        if (limit > 50) {
            this.logger.warn(`Limit ${limit} exceeds maximum, capping to 50`);
            limit = 50;
        }

        // FIXME: No validation for page < 1 or limit <= 0
        // TODO: Validate: if (page < 1) page = 1; if (limit < 1) limit = 20;

        const skip = (page - 1) * limit;


        // FIXME: Returns sensitive data (password, refreshToken)
        // FIXME: N+1 query with relations
        // TODO: Use QueryBuilder with leftJoinAndSelect for better control
        // TODO: Add select to exclude password, refreshToken explicitly
        const [items, total] = await this.userRepository.findAndCount({
            relations: ['roles', 'roles.permissions'],
            take: limit,
            skip: skip,
            // TODO: Add order: { createdAt: 'DESC' }
            // TODO: Add select: ['id', 'name', 'email', 'createdAt', 'updatedAt', 'emailVerified', 'isActive']
            // TODO: Add where: { deletedAt: IsNull() } if soft delete implemented
        });


        this.logger.debug(`Found ${total} total users, returning ${items.length} items`);

        // TODO: Transform to UserListDto to exclude sensitive fields
        // TODO: Add totalPages: Math.ceil(total / limit)
        // TODO: Add hasNextPage: page * limit < total
        // TODO: Add hasPreviousPage: page > 1
        return { items, total, page, limit };
    }


    /**
     * Updates user details including roles.
     * 
     * @param id - User ID to update
     * @param data - Update data (any type - no validation)
     * @returns Promise resolving to updated user
     * 
     * @throws {UnauthorizedException} If user not found
     * 
     * FIXME: Violates SRP - should be in UsersService
     * FIXME: No DTO validation (data: any)
     * FIXME: No authorization check (anyone can update any user)
     * FIXME: Can escalate own privileges (assign admin role to self)
     * FIXME: No audit logging of changes
     * FIXME: No transaction wrapping
     * FIXME: Password hashing happens before validation
     * FIXME: No check if roleIds array contains valid UUIDs
     * FIXME: No check if roles actually exist before assigning
     * FIXME: No validation of field changes (e.g., email format)
     * FIXME: Can change critical fields without verification (email)
     * FIXME: Wrong exception type (UnauthorizedException should be NotFoundException)
     * FIXME: No check if user is trying to modify themselves
     * FIXME: No previous values logged (can't audit what changed)
     * FIXME: Returns user with sensitive fields
     * 
     * TODO: Move to UsersService
     * TODO: Create UpdateUserDto with proper validation
     * TODO: Add authorization check (admins only, or user updating self with restrictions)
     * TODO: Prevent privilege escalation (can't assign higher role than own role)
     * TODO: Prevent self-role-modification (can't change own roles)
     * TODO: Add comprehensive audit logging (who, what, when, old values, new values)
     * TODO: Wrap in transaction for atomicity
     * TODO: Validate password strength if password is being changed
     * TODO: Validate roleIds are valid UUIDs
     * TODO: Check all roleIds exist before assigning (findByIds with length check)
     * TODO: Validate email format if email is being changed
     * TODO: Require email verification if email is changed
     * TODO: Send notification email if critical fields changed (email, password, roles)
     * TODO: Change exception to NotFoundException instead of UnauthorizedException
     * TODO: Get current user from context to log who made the change
     * TODO: Load old user values before update for audit log
     * TODO: Emit UserUpdatedEvent with old and new values
     * TODO: Validate user isn't trying to deactivate themselves
     * TODO: Validate user isn't trying to delete their own admin role
     * TODO: Use UpdateUserDto to sanitize allowed fields (whitelist approach)
     * TODO: Return UserResponseDto to exclude sensitive fields
     * TODO: Add rate limiting (prevent update spam)
     * TODO: Add optimistic locking with version field
     * TODO: Validate business rules (e.g., can't have both Customer and Admin roles)
     */
    async updateUser(id: string, data: any) {
        this.logger.log(`Updating user ${id}`);
        // TODO: Log who is making the update (current user ID from context)


        // FIXME: No DTO validation
        // TODO: Use UpdateUserDto and validate
        const { roleIds, ...userData } = data;

        // TODO: Load user with old values for audit log
        const user = await this.userRepository.findOne({ where: { id }, relations: ['roles'] });

        if (!user) {
            this.logger.warn(`User not found for update: ${id}`);
            // FIXME: Wrong exception type
            // TODO: Change to NotFoundException
            throw new NotFoundException('User not found');
        }


        // TODO: Add authorization check
        // TODO: Prevent privilege escalation
        // TODO: Prevent self-role-modification
        // TODO: Check if requester has permission to update users


        if (userData.password) {
            // FIXME: No password strength validation (should be in DTO)
            // TODO: Require current password for password change
            // TODO: Check password isn't in breach database (HIBP API)
            userData.password = await this.hashData(userData.password);
            // TODO: Invalidate all sessions/tokens after password change
            // TODO: Send password changed notification email
        }


        // TODO: If email is changing, require email verification
        if (userData.email && userData.email !== user.email) {
            // TODO: Send verification email to new address
            // TODO: Set emailVerified: false
            // TODO: Keep old email until verified
        }


        // TODO: Start transaction
        Object.assign(user, userData);


        if (roleIds) {
            // FIXME: No validation that roles exist
            // TODO: Validate roleIds are UUIDs
            const roles = await this.roleRepository.find({
                where: { id: In(roleIds) }
            });

            // TODO: Check if found roles count matches roleIds count
            // TODO: Validate requester can assign these roles
            // TODO: Log role changes specifically
            user.roles = roles;
        }


        // TODO: Commit transaction
        const saved = await this.userRepository.save(user);
        this.logger.log(`User ${id} updated successfully`);

        // TODO: Emit UserUpdatedEvent with old and new values
        // TODO: Add comprehensive audit logging
        // TODO: Send notification email if critical fields changed
        // TODO: Return UserResponseDto instead of raw entity
        return saved;
    }


    /**
     * Deletes a user account.
     * 
     * @param id - User ID to delete
     * @returns Promise resolving to deletion result
     * 
     * FIXME: Violates SRP - should be in UsersService
     * FIXME: No validation that user exists (silent failure)
     * FIXME: No authorization check (anyone can delete anyone)
     * FIXME: No audit logging
     * FIXME: Hard delete - no soft delete (data loss)
     * FIXME: No check for user dependencies (orphaned data)
     * FIXME: No check if user is trying to delete themselves
     * FIXME: No confirmation requirement
     * FIXME: No transaction wrapping
     * FIXME: Foreign key constraints might prevent deletion (no error handling)
     * FIXME: User's tokens not invalidated/blacklisted
     * FIXME: No anonymization option (GDPR compliance)
     * 
     * TODO: Move to UsersService
     * TODO: Validate user exists first (return NotFoundException if not)
     * TODO: Add authorization check (super admin only)
     * TODO: Implement soft delete instead (set deletedAt timestamp)
     * TODO: Check for dependencies (orders, reviews, posts, etc.)
     * TODO: Prevent self-deletion
     * TODO: Require confirmation token or reason for deletion
     * TODO: Wrap in transaction with dependency handling
     * TODO: Blacklist all user's tokens on deletion
     * TODO: Add comprehensive audit logging (who deleted whom, when, why)
     * TODO: Emit UserDeletedEvent
     * TODO: Send account deletion confirmation email
     * TODO: Add data export option before deletion (GDPR right to data portability)
     * TODO: Add option to anonymize instead of delete (GDPR right to be forgotten)
     * TODO: Schedule hard delete after soft delete retention period (e.g., 30 days)
     * TODO: Handle foreign key constraint errors gracefully
     * TODO: Add cascade delete or set null for user relationships
     * TODO: Archive user data to separate table before deletion
     * TODO: Remove user from all active sessions
     * TODO: Delete user's uploaded files (S3, etc.)
     * TODO: Remove user from mailing lists
     * TODO: Cancel user's subscriptions if applicable
     * TODO: Add rate limiting (prevent bulk deletion attacks)
     */
    deleteUser(id: string) {
        this.logger.log(`Deleting user ${id}`);
        // TODO: Log who is deleting (current user ID from context)

        // FIXME: No validation, authorization, or logging
        // TODO: Add all safety checks before deletion
        // TODO: Validate user exists
        // TODO: Check authorization
        // TODO: Prevent self-deletion
        // TODO: Check dependencies
        // TODO: Use soft delete: update({ id }, { deletedAt: new Date() })
        // TODO: Blacklist all tokens
        // TODO: Audit log the deletion
        // TODO: Emit event
        return this.userRepository.delete(id);
    }


    /**
     * Retrieves all roles with permissions.
     * 
     * @returns Promise resolving to array of Role entities
     * 
     * FIXME: No pagination (scalability issue)
     * FIXME: Should be in separate RolesService (SRP violation)
     * FIXME: No authorization check
     * FIXME: No caching (roles rarely change)
     * FIXME: No filtering options
     * FIXME: No sorting options
     * 
     * TODO: Move to RolesService
     * TODO: Add pagination support (page, limit)
     * TODO: Add authorization guard (only admins)
     * TODO: Add Redis caching with long TTL (roles rarely change)
     * TODO: Add filtering options (by name, isSystemRole)
     * TODO: Add sorting options (by name, createdAt)
     * TODO: Add option to include/exclude permissions
     * TODO: Add user count per role in response
     * TODO: Return RoleListDto instead of raw entities
     * TODO: Add search functionality
     */
    findAllRoles() {
        this.logger.log('Finding all roles');
        // FIXME: No pagination
        // TODO: Add pagination, caching, authorization
        return this.roleRepository.find({ relations: ['permissions'] });
    }


    /**
     * Creates a new role with permissions.
     * 
     * @param data - Role data (any type - no validation)
     * @returns Promise resolving to created Role entity
     * 
     * FIXME: Should be in RolesService (SRP violation)
     * FIXME: No DTO validation (data: any)
     * FIXME: No authorization check (anyone can create roles)
     * FIXME: No duplicate name check
     * FIXME: Type assertion is unsafe (as object) as Role
     * FIXME: No transaction wrapping
     * FIXME: No validation that permission IDs are valid UUIDs
     * FIXME: No check if permissions exist (silent failure if some don't exist)
     * FIXME: No audit logging
     * FIXME: No validation of role name format
     * FIXME: Can create duplicate roles with same name
     * 
     * TODO: Move to RolesService
     * TODO: Create CreateRoleDto with validation
     * TODO: Add authorization check (super admin only)
     * TODO: Check for duplicate role names (unique constraint + check)
     * TODO: Remove unsafe type casting
     * TODO: Wrap in transaction
     * TODO: Validate permissionIds are valid UUIDs
     * TODO: Validate all permissionIds exist (count check)
     * TODO: Add comprehensive audit logging (who created, when)
     * TODO: Emit RoleCreatedEvent
     * TODO: Validate role name format (alphanumeric, underscores only)
     * TODO: Add description field to role
     * TODO: Add isSystemRole flag (prevent deletion of system roles)
     * TODO: Validate role name isn't reserved (Admin, SuperAdmin, etc.)
     * TODO: Add role hierarchy validation
     * TODO: Return RoleResponseDto
     * TODO: Clear role cache after creation
     */
    async createRole(data: any) {
        this.logger.log(`Creating role: ${data.name}`);
        // TODO: Log who is creating (current user ID)


        // FIXME: No DTO validation, no authorization
        // TODO: Validate with CreateRoleDto
        // TODO: Check authorization
        // TODO: Check for duplicate name
        const { permissionIds, ...roleData } = data;

        // FIXME: Unsafe cast
        // TODO: Use proper typing
        const role = this.roleRepository.create(roleData as object) as Role;

        if (permissionIds && permissionIds.length > 0) {
            // FIXME: No validation that permissions exist
            // TODO: Validate all permission IDs exist
            const permissions = await this.permissionRepository.find({
                where: { id: In(permissionIds) }
            });

            // TODO: Check permissions.length === permissionIds.length
            role.permissions = permissions;
        }


        // TODO: Start transaction
        const saved = await this.roleRepository.save(role);
        this.logger.log(`Role created: ${saved.id}`);

        // TODO: Emit RoleCreatedEvent
        // TODO: Audit log
        // TODO: Clear role cache
        return saved;
    }


    /**
     * Updates an existing role.
     * 
     * @param id - Role ID to update
     * @param data - Update data (any type - no validation)
     * @returns Promise resolving to updated Role entity
     * 
     * @throws {UnauthorizedException} If role not found
     * 
     * FIXME: Should be in RolesService (SRP violation)
     * FIXME: No DTO validation (data: any)
     * FIXME: No authorization check
     * FIXME: No check if role is system role (can break system by modifying critical roles)
     * FIXME: Can modify system roles like Admin, SuperAdmin
     * FIXME: No transaction wrapping
     * FIXME: No validation that permissions exist
     * FIXME: No audit logging
     * FIXME: Wrong exception type (should be NotFoundException)
     * FIXME: Can rename to duplicate name
     * 
     * TODO: Move to RolesService
     * TODO: Create UpdateRoleDto with validation
     * TODO: Add authorization check (super admin only)
     * TODO: Prevent modification of system roles (check isSystemRole flag)
     * TODO: Add system role protection (Admin, SuperAdmin, Customer, etc.)
     * TODO: Wrap in transaction
     * TODO: Validate permissionIds exist (count check)
     * TODO: Add comprehensive audit logging (old values, new values)
     * TODO: Change to NotFoundException if role not found
     * TODO: Check for duplicate name if name is changing
     * TODO: Emit RoleUpdatedEvent with old and new values
     * TODO: Clear role cache after update
     * TODO: Notify users with this role if permissions change significantly
     * TODO: Validate role hierarchy constraints
     * TODO: Return RoleResponseDto
     */
    async updateRole(id: string, data: any) {
        this.logger.log(`Updating role ${id}`);
        // TODO: Log who is updating


        const { permissionIds, ...roleData } = data;
        const role = await this.roleRepository.findOne({ where: { id }, relations: ['permissions'] });

        if (!role) {
            this.logger.warn(`Role not found for update: ${id}`);
            // FIXME: Wrong exception type
            throw new NotFoundException('Role not found');
        }


        // TODO: Check if system role (prevent modification)
        // TODO: Add authorization check
        // TODO: Check for duplicate name if changing


        Object.assign(role, roleData);


        if (permissionIds) {
            // TODO: Validate permissions exist
            const permissions = await this.permissionRepository.find({
                where: { id: In(permissionIds) }
            });

            // TODO: Check count matches
            role.permissions = permissions;
        }


        // TODO: Start transaction
        const saved = await this.roleRepository.save(role);
        this.logger.log(`Role ${id} updated successfully`);

        // TODO: Emit RoleUpdatedEvent
        // TODO: Audit log
        // TODO: Clear role cache
        return saved;
    }


    /**
     * Deletes a role.
     * 
     * @param id - Role ID to delete
     * @returns Promise resolving to deletion result
     * 
     * FIXME: Should be in RolesService (SRP violation)
     * FIXME: No validation that role exists (silent failure)
     * FIXME: No check if role is in use (assigned to users)
     * FIXME: No check if system role (can break system)
     * FIXME: No authorization check
     * FIXME: Hard delete (no soft delete)
     * FIXME: No audit logging
     * FIXME: Foreign key constraints might prevent deletion (no error handling)
     * 
     * TODO: Move to RolesService
     * TODO: Validate role exists
     * TODO: Check if role is assigned to any users (prevent deletion or reassign)
     * TODO: Prevent deletion of system roles (Admin, Customer, etc.)
     * TODO: Add authorization check (super admin only)
     * TODO: Implement soft delete with deletedAt
     * TODO: Add comprehensive audit logging
     * TODO: Emit RoleDeletedEvent
     * TODO: Handle foreign key constraint errors
     * TODO: Require confirmation for deletion
     * TODO: Clear role cache after deletion
     * TODO: Option to reassign users to different role before deletion
     * TODO: Add transaction wrapping
     */
    deleteRole(id: string) {
        this.logger.log(`Deleting role ${id}`);
        // TODO: Log who is deleting

        // FIXME: No validation or safety checks
        // TODO: Add all validations
        // TODO: Check if system role
        // TODO: Check if in use
        // TODO: Use soft delete
        return this.roleRepository.delete(id);
    }


    /**
     * Retrieves all permissions.
     * 
     * @returns Promise resolving to array of Permission entities
     * 
     * FIXME: Should be in PermissionsService (SRP violation)
     * FIXME: No pagination (scalability issue)
     * FIXME: No authorization check
     * FIXME: No caching (permissions rarely change)
     * FIXME: No grouping by module/resource
     * FIXME: No filtering or sorting
     * 
     * TODO: Move to PermissionsService
     * TODO: Add pagination support
     * TODO: Add authorization guard (admins only)
     * TODO: Add Redis caching with long TTL
     * TODO: Add grouping by module/resource type
     * TODO: Add filtering options (by module, action type)
     * TODO: Add sorting options
     * TODO: Return PermissionListDto with grouping
     * TODO: Add usage count per permission (how many roles have it)
     * TODO: Add search functionality
     * TODO: Add hierarchical permission structure support
     */
    findAllPermissions() {
        this.logger.log('Finding all permissions');
        // FIXME: No pagination, caching, authorization
        // TODO: Add all improvements
        return this.permissionRepository.find();
    }
}
