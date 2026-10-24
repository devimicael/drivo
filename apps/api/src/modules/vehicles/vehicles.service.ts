// Regra de aplicação da garagem — RF16: toda query filtra por `userId`.
// Chassi/opcionais pendentes de Figma estão isolados em `schemas/vehicle-fields.ts`.
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { isUniqueConstraintError } from '../../common/prisma/is-unique-constraint-error.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { VehicleCreateInput } from './schemas/vehicle-create.schema.js';
import { normalizePlaca } from './schemas/vehicle-fields.js';
import type { VehicleUpdateInput } from './schemas/vehicle-update.schema.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, search?: string) {
    const term = search?.trim() ?? '';
    const where: Prisma.VehicleWhereInput = { userId };

    if (term) {
      const placaTerm = normalizePlaca(term);
      const or: Prisma.VehicleWhereInput[] = [
        { marca: { contains: term, mode: 'insensitive' } },
        { modelo: { contains: term, mode: 'insensitive' } },
      ];

      if (placaTerm) {
        or.push({ placa: { contains: placaTerm, mode: 'insensitive' } });
      }

      // Ano só entra na busca quando o termo é exatamente 4 dígitos (AC-06.3).
      if (/^\d{4}$/.test(term)) {
        or.push({ ano: Number(term) });
      }

      where.OR = or;
    }

    const data = await this.prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { data, meta: { total: data.length, search: term || null } };
  }

  async create(userId: string, input: VehicleCreateInput) {
    try {
      return await this.prisma.vehicle.create({ data: { ...input, userId } });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw plateAlreadyExists();
      }
      throw error;
    }
  }

  async findOne(userId: string, id: string) {
    const vehicle = await this.findOwned(userId, id);

    if (!vehicle) {
      throw vehicleNotFound();
    }

    return vehicle;
  }

  async update(userId: string, id: string, input: VehicleUpdateInput) {
    const vehicle = await this.findOwned(userId, id);

    if (!vehicle) {
      throw vehicleNotFound();
    }

    try {
      return await this.prisma.vehicle.update({ where: { id: vehicle.id }, data: input });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw plateAlreadyExists();
      }
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    const vehicle = await this.findOwned(userId, id);

    if (!vehicle) {
      throw vehicleNotFound();
    }

    await this.prisma.vehicle.delete({ where: { id: vehicle.id } });
  }

  /**
   * Id malformado, inexistente ou de outro usuário devolvem a mesma coisa (null),
   * para que o controller responda um único 404 (AC-05.3, AC-08.2, AC-09.4).
   * O teste de formato evita mandar lixo para uma coluna UUID no Postgres.
   */
  private findOwned(userId: string, id: string) {
    if (!UUID_PATTERN.test(id)) {
      return Promise.resolve(null);
    }

    return this.prisma.vehicle.findFirst({ where: { id, userId } });
  }
}

function vehicleNotFound(): NotFoundException {
  return new NotFoundException({
    code: 'NOT_FOUND',
    message: 'Veículo não encontrado.',
  });
}

function plateAlreadyExists(): ConflictException {
  return new ConflictException({
    code: 'PLATE_ALREADY_EXISTS',
    message: 'Já existe um veículo com esta placa.',
  });
}
