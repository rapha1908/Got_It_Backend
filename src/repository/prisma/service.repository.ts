import { randomUUID } from "node:crypto";
import { Prisma, Service as ServiceRow } from "@prisma/client";
import { IService } from "@/entities/models/service.interface";
import { prisma } from "@/lib/prisma/db";
import { IServiceRepository } from "../service.repository.interface";

function toService(service: ServiceRow): IService {
  return {
    id: service.id,
    condominium_id: service.condominium_id,
    staff_id: service.staff_id,
    description: service.description,
    start_date: service.start_date.toISOString().slice(0, 10),
    end_date: service.end_date.toISOString().slice(0, 10),
    status: service.status,
    price: Number(service.price),
  };
}

export class PrismaServiceRepository implements IServiceRepository {
  async create(service: IService): Promise<IService> {
    const createdService = await prisma.service.create({
      data: {
        id: randomUUID(),
        condominium_id: service.condominium_id,
        staff_id: service.staff_id,
        description: service.description,
        start_date: new Date(service.start_date),
        end_date: new Date(service.end_date),
        status: service.status,
        price: new Prisma.Decimal(service.price),
      },
    });

    return toService(createdService);
  }

  async findById(id: string): Promise<IService | null> {
    const service = await prisma.service.findUnique({ where: { id } });
    return service ? toService(service) : null;
  }

  async findByCondominiumIds(condominium_ids: number[]): Promise<IService[]> {
    const services = await prisma.service.findMany({ where: { condominium_id: { in: condominium_ids } } });
    return services.map(toService);
  }

  async findByStaffIds(staff_ids: number[]): Promise<IService[]> {
    const services = await prisma.service.findMany({ where: { staff_id: { in: staff_ids } } });
    return services.map(toService);
  }
}
