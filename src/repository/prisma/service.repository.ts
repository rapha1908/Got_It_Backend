import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { IService } from "@/entities/models/service.interface";
import { prisma } from "@/lib/prisma/db";
import { IServiceRepository } from "../service.repository.interface";

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

    return {
      id: createdService.id,
      condominium_id: createdService.condominium_id,
      staff_id: createdService.staff_id,
      description: createdService.description,
      start_date: createdService.start_date.toISOString().slice(0, 10),
      end_date: createdService.end_date.toISOString().slice(0, 10),
      status: createdService.status,
      price: Number(createdService.price),
    };
  }

  async findByCondominiumId(condominium_id: number): Promise<IService[]> {
    const services = await prisma.service.findMany({
      where: { condominium_id },
    });

    return services.map((service) => ({
      id: service.id,
      condominium_id: service.condominium_id,
      staff_id: service.staff_id,
      description: service.description,
      start_date: service.start_date.toISOString().slice(0, 10),
      end_date: service.end_date.toISOString().slice(0, 10),
      status: service.status,
      price: Number(service.price),
    }));
  }
}
