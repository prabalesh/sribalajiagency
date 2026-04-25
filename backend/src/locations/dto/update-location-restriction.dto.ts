import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationRestrictionDto } from './create-location-restriction.dto';

export class UpdateLocationRestrictionDto extends PartialType(
  CreateLocationRestrictionDto,
) {}
