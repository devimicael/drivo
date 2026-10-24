import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { SessionUser } from '../../common/auth/session-user.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { VehicleCreateInput } from './schemas/vehicle-create.schema.js';
import { vehicleCreateSchema } from './schemas/vehicle-create.schema.js';
import type { VehicleQuery } from './schemas/vehicle-query.schema.js';
import { vehicleQuerySchema } from './schemas/vehicle-query.schema.js';
import type { VehicleUpdateInput } from './schemas/vehicle-update.schema.js';
import { vehicleUpdateSchema } from './schemas/vehicle-update.schema.js';
import { VehiclesService } from './vehicles.service.js';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  list(
    @CurrentUser() user: SessionUser,
    @Query({ schema: vehicleQuerySchema, pipes: [ZodValidationPipe] }) query: VehicleQuery,
  ) {
    return this.vehicles.list(user.id, query.search);
  }

  @Post()
  create(
    @CurrentUser() user: SessionUser,
    @Body({ schema: vehicleCreateSchema, pipes: [ZodValidationPipe] })
    body: VehicleCreateInput,
  ) {
    return this.vehicles.create(user.id, body);
  }

  @Get(':id')
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.vehicles.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body({ schema: vehicleUpdateSchema, pipes: [ZodValidationPipe] })
    body: VehicleUpdateInput,
  ) {
    return this.vehicles.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: SessionUser, @Param('id') id: string): Promise<void> {
    await this.vehicles.remove(user.id, id);
  }
}
