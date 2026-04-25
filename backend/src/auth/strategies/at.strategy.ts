import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../../database/drizzle/schema';
import { DRIZZLE_DB } from '../../database/drizzle/drizzle.module';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.access_token;
        },
      ]),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') || 'defaultSecret',
    });
  }

  async validate(payload: any) {
    // Fetch user with roles and permissions to enable PermissionsGuard
    return await this.db.query.users.findFirst({
      where: eq(schema.users.id, payload.sub),
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
  }
}
