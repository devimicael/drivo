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
  Req,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiSecurity, ApiTags, ApiTooManyRequestsResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
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

const vehicleDocSchema = {
  type: 'object',
  required: ['id', 'userId', 'placa', 'marca', 'modelo', 'ano', 'chassi', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string', format: 'uuid' }, userId: { type: 'string', format: 'uuid' },
    placa: { type: 'string' }, marca: { type: 'string' }, modelo: { type: 'string' },
    ano: { type: 'integer' }, chassi: { type: 'string' }, renavam: { type: 'string', nullable: true },
    cor: { type: 'string', nullable: true }, combustivel: { type: 'string', nullable: true }, apelido: { type: 'string', nullable: true }, cilindrada: { type: 'integer', nullable: true },
    tipo: { type: 'string', nullable: true }, uf: { type: 'string', nullable: true },
    anoFabricacao: { type: 'integer', nullable: true },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  },
};

@Controller('vehicles')
@ApiTags('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  @ApiSecurity('cookieAuth')
  @ApiOkResponse({ description: 'Lista de veículos e metadados da pesquisa.', schema: {
    type: 'object', required: ['data', 'meta'], properties: {
      data: { type: 'array', items: vehicleDocSchema },
      meta: { type: 'object', required: ['total', 'search'], properties: { total: { type: 'integer' }, search: { type: 'string', nullable: true } } },
    },
  } })
  @ApiBadRequestResponse({ description: 'Parâmetro de busca inválido.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente, inválida ou expirada.' })
  list(
    @CurrentUser() user: SessionUser,
    @Query({ schema: vehicleQuerySchema, pipes: [ZodValidationPipe] }) query: VehicleQuery,
  ) {
    return this.vehicles.list(user.id, query.search);
  }

  @Post()
  @ApiSecurity({ cookieAuth: [], csrfToken: [] })
  @ApiHeader({ name: 'X-CSRF-Token', required: false, description: 'Token double-submit do cookie CSRF.' })
  @ApiCreatedResponse({ description: 'Veículo cadastrado.', schema: vehicleDocSchema })
  @ApiBadRequestResponse({ description: 'Payload inválido.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente, inválida ou expirada.' })
  @ApiConflictResponse({ description: 'A placa já pertence a outro veículo deste usuário.' })
  @ApiTooManyRequestsResponse({ description: 'Limite de requisições excedido.' })
  @ApiBody({ schema: {
    type: 'object', required: ['placa', 'marca', 'modelo', 'ano', 'chassi'], additionalProperties: false,
    properties: { placa: { type: 'string' }, marca: { type: 'string' }, modelo: { type: 'string' }, ano: { type: 'integer' }, chassi: { type: 'string', minLength: 17, maxLength: 17 }, renavam: { type: 'string', nullable: true }, cor: { type: 'string', nullable: true }, combustivel: { type: 'string', nullable: true }, apelido: { type: 'string', nullable: true }, cilindrada: { type: 'integer', nullable: true }, tipo: { type: 'string', nullable: true }, uf: { type: 'string', nullable: true }, anoFabricacao: { type: 'integer', nullable: true } },
  } })
  create(
    @CurrentUser() user: SessionUser,
    @Body({ schema: vehicleCreateSchema, pipes: [ZodValidationPipe] })
    body: VehicleCreateInput,
  ) {
    return this.vehicles.create(user.id, body);
  }

  @Get(':id')
  @ApiSecurity('cookieAuth')
  @ApiOkResponse({ description: 'Veículo pertencente ao usuário autenticado.', schema: vehicleDocSchema })
  @ApiBadRequestResponse({ description: 'Identificador inválido.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente, inválida ou expirada.' })
  @ApiNotFoundResponse({ description: 'Veículo inexistente ou pertencente a outra conta.' })
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.vehicles.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiSecurity({ cookieAuth: [], csrfToken: [] })
  @ApiHeader({ name: 'X-CSRF-Token', required: false, description: 'Token double-submit do cookie CSRF.' })
  @ApiBody({ schema: {
    type: 'object', minProperties: 1, additionalProperties: false,
    properties: { placa: { type: 'string' }, marca: { type: 'string' }, modelo: { type: 'string' }, ano: { type: 'integer' }, chassi: { type: 'string', minLength: 17, maxLength: 17 }, renavam: { type: 'string', nullable: true }, cor: { type: 'string', nullable: true }, combustivel: { type: 'string', nullable: true }, apelido: { type: 'string', nullable: true }, cilindrada: { type: 'integer', nullable: true }, tipo: { type: 'string', nullable: true }, uf: { type: 'string', nullable: true }, anoFabricacao: { type: 'integer', nullable: true } },
  } })
  @ApiOkResponse({ description: 'Veículo atualizado.', schema: vehicleDocSchema })
  @ApiBadRequestResponse({ description: 'Payload inválido.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente, inválida ou expirada.' })
  @ApiNotFoundResponse({ description: 'Veículo inexistente ou pertencente a outra conta.' })
  @ApiConflictResponse({ description: 'A placa já pertence a outro veículo deste usuário.' })
  update(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body({ schema: vehicleUpdateSchema, pipes: [ZodValidationPipe] })
    body: VehicleUpdateInput,
  ) {
    return this.vehicles.update(user.id, id, body);
  }

  @Delete(':id')
  @ApiSecurity({ cookieAuth: [], csrfToken: [] })
  @ApiHeader({ name: 'X-CSRF-Token', required: false, description: 'Token double-submit do cookie CSRF.' })
  @ApiHeader({ name: 'X-Confirm-Delete', required: true, description: 'Deve ser exatamente true.', schema: { type: 'string', enum: ['true'] } })
  @ApiBadRequestResponse({ description: 'Confirmação ausente ou payload inválido.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente, inválida ou expirada.' })
  @ApiNotFoundResponse({ description: 'Veículo inexistente ou pertencente a outra conta.' })
  @ApiNoContentResponse({ description: 'Veículo excluído.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.vehicles.remove(user.id, id, request.headers['x-confirm-delete'] === 'true');
  }
}
