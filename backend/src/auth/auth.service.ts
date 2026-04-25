import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { AuthSignupDto, AuthLoginDto } from './dto/auth.dto';

/**
 * Service for authentication and user/role/permission management using Drizzle ORM.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Hashes data using bcrypt.
   */
  async hashData(data: string) {
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    return bcrypt.hash(data, saltRounds);
  }

  /**
   * Generates access and refresh tokens for a user.
   */
  async getTokens(userId: string, email: string) {
    const accessTokenExpiration = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION',
      '15m',
    );
    const refreshTokenExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: accessTokenExpiration as any,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshTokenExpiration as any,
        },
      ),
    ]);

    return { access_token: at, refresh_token: rt };
  }

  /**
   * Helper to flatten Drizzle's nested relation structure for the frontend.
   */
  private flattenUser(user: any) {
    if (!user) return null;

    const { password, refreshToken, roles, ...userData } = user;

    // Flatten roles and permissions
    const flattenedRoles =
      roles?.map((ur: any) => {
        const role = ur.role;
        if (!role) return null;

        const flattenedPermissions =
          role.permissions?.map((rp: any) => rp.permission).filter(Boolean) ||
          [];

        return {
          ...role,
          permissions: flattenedPermissions,
        };
      }).filter(Boolean) || [];

    return {
      ...userData,
      roles: flattenedRoles,
    };
  }

  /**
   * Registers a new user account.
   */
  async signup(dto: AuthSignupDto) {
    this.logger.log(`User signup attempt: ${dto.email}`);
    const email = dto.email.toLowerCase().trim();

    return await this.db.transaction(async (tx) => {
      const existingUser = await tx.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      if (existingUser) {
        this.logger.warn(`Signup failed - email already exists: ${email}`);
        throw new ConflictException('Email already exists');
      }

      const passwordHash = await this.hashData(dto.password);

      const [newUser] = await tx
        .insert(schema.users)
        .values({
          name: dto.name,
          email,
          password: passwordHash,
        })
        .returning();

      const tokens = await this.getTokens(newUser.id, newUser.email);
      const refreshTokenHash = await this.hashData(tokens.refresh_token);

      await tx
        .update(schema.users)
        .set({ refreshToken: refreshTokenHash })
        .where(eq(schema.users.id, newUser.id));

      this.logger.log(`User registered successfully: ${email}`);
      return { user: this.flattenUser(newUser), ...tokens };
    });
  }

  /**
   * Authenticates a user with email and password.
   */
  async login(dto: AuthLoginDto) {
    this.logger.log(`Login attempt: ${dto.email}`);
    const email = dto.email.toLowerCase().trim();

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
      with: {
        roles: {
          with: {
            role: {
              with: {
                permissions: {
                  with: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Timing attack prevention
    const passwordHash =
      user?.password || '$2b$10$fakehashtopreventtimingattack';
    const passwordMatches = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !passwordMatches) {
      this.logger.warn(`Login failed for email: ${email}`);
      throw new ForbiddenException('Access Denied');
    }

    return await this.db.transaction(async (tx) => {
      const tokens = await this.getTokens(user.id, user.email);
      const refreshTokenHash = await this.hashData(tokens.refresh_token);

      await tx
        .update(schema.users)
        .set({ refreshToken: refreshTokenHash })
        .where(eq(schema.users.id, user.id));

      this.logger.log(`Login successful: ${email}`);
      return { user: this.flattenUser(user), ...tokens };
    });
  }

  /**
   * Retrieves user by ID with roles and permissions.
   */
  async getUserById(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: {
        roles: {
          with: {
            role: {
              with: {
                permissions: {
                  with: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        addresses: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.flattenUser(user);
  }

  /**
   * Refreshes access and refresh tokens.
   */
  async refreshTokens(userId: string, rt: string) {
    this.logger.log(`Refreshing tokens for user ${userId}`);

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: {
        roles: {
          with: {
            role: {
              with: {
                permissions: {
                  with: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.refreshToken) {
      this.logger.warn(
        `Refresh failed - user not found or no token: ${userId}`,
      );
      throw new ForbiddenException('Access Denied');
    }

    const rtMatches = await bcrypt.compare(rt, user.refreshToken);
    if (!rtMatches) {
      this.logger.warn(`Refresh failed - invalid token for user: ${userId}`);
      throw new ForbiddenException('Access Denied');
    }

    return await this.db.transaction(async (tx) => {
      const tokens = await this.getTokens(user.id, user.email);
      const refreshTokenHash = await this.hashData(tokens.refresh_token);

      await tx
        .update(schema.users)
        .set({ refreshToken: refreshTokenHash })
        .where(eq(schema.users.id, user.id));

      this.logger.log(`Tokens refreshed successfully for user ${userId}`);
      return { user: this.flattenUser(user), ...tokens };
    });
  }

  /**
   * Retrieves paginated list of all users.
   */
  async findAllUsers(page: number = 1, limit: number = 20) {
    this.logger.log(`Finding all users: page=${page}, limit=${limit}`);

    if (limit > 50) limit = 50;
    const offset = (page - 1) * limit;

    const usersList = await this.db.query.users.findMany({
      limit,
      offset,
      with: {
        roles: {
          with: {
            role: true,
          },
        },
      },
    });

    // Get total count
    const totalResult = await this.db.execute(sql`SELECT count(*) FROM users`);
    const total = parseInt((totalResult.rows[0] as any).count);

    return {
      items: usersList.map((u) => this.flattenUser(u)),
      total,
      page,
      limit,
    };
  }

  /**
   * Updates user details.
   */
  async updateUser(id: string, data: any) {
    this.logger.log(`Updating user ${id}`);
    const { roleIds, ...userData } = data;

    return await this.db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(schema.users.id, id),
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (userData.password) {
        userData.password = await this.hashData(userData.password);
      }

      if (userData.email) {
        userData.email = userData.email.toLowerCase().trim();
      }

      await tx
        .update(schema.users)
        .set(userData)
        .where(eq(schema.users.id, id));

      if (roleIds) {
        // Remove old roles
        await tx
          .delete(schema.userRoles)
          .where(eq(schema.userRoles.userId, id));

        // Add new roles
        if (roleIds.length > 0) {
          await tx
            .insert(schema.userRoles)
            .values(roleIds.map((roleId: string) => ({ userId: id, roleId })));
        }
      }

      const updatedUser = await tx.query.users.findFirst({
        where: eq(schema.users.id, id),
        with: {
          roles: {
            with: {
              role: true,
            },
          },
        },
      });

      return this.flattenUser(updatedUser);
    });
  }

  /**
   * Deletes a user account.
   */
  async deleteUser(id: string) {
    this.logger.log(`Deleting user: ${id}`);
    const result = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('User not found');
    }

    return { success: true };
  }

  /**
   * Retrieves all roles with their permissions.
   */
  async findAllRoles() {
    this.logger.log('Finding all roles');
    return await this.db.query.roles.findMany({
      with: {
        permissions: {
          with: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Creates a new role with permissions.
   */
  async createRole(data: any) {
    this.logger.log(`Creating role: ${data.name}`);
    const { permissionIds, ...roleData } = data;

    return await this.db.transaction(async (tx) => {
      const [newRole] = await tx
        .insert(schema.roles)
        .values(roleData)
        .returning();

      if (permissionIds && permissionIds.length > 0) {
        await tx.insert(schema.rolePermissions).values(
          permissionIds.map((permissionId: string) => ({
            roleId: newRole.id,
            permissionId,
          })),
        );
      }

      return await tx.query.roles.findFirst({
        where: eq(schema.roles.id, newRole.id),
        with: {
          permissions: {
            with: {
              permission: true,
            },
          },
        },
      });
    });
  }

  /**
   * Updates a role and its permissions.
   */
  async updateRole(id: string, data: any) {
    this.logger.log(`Updating role: ${id}`);
    const { permissionIds, ...roleData } = data;

    return await this.db.transaction(async (tx) => {
      const [updatedRole] = await tx
        .update(schema.roles)
        .set(roleData)
        .where(eq(schema.roles.id, id))
        .returning();

      if (!updatedRole) {
        throw new NotFoundException('Role not found');
      }

      if (permissionIds) {
        // Remove old permissions
        await tx
          .delete(schema.rolePermissions)
          .where(eq(schema.rolePermissions.roleId, id));

        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.insert(schema.rolePermissions).values(
            permissionIds.map((permissionId: string) => ({
              roleId: id,
              permissionId,
            })),
          );
        }
      }

      return await tx.query.roles.findFirst({
        where: eq(schema.roles.id, id),
        with: {
          permissions: {
            with: {
              permission: true,
            },
          },
        },
      });
    });
  }

  /**
   * Deletes a role.
   */
  async deleteRole(id: string) {
    this.logger.log(`Deleting role: ${id}`);
    const result = await this.db
      .delete(schema.roles)
      .where(eq(schema.roles.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Role not found');
    }

    return { success: true };
  }

  /**
   * Retrieves all available permissions.
   */
  async findAllPermissions() {
    this.logger.log('Finding all permissions');
    return await this.db.query.permissions.findMany();
  }
}
