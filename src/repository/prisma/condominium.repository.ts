import { ICondominium } from "@/entities/models/condominium.interface";
import { prisma } from "@/lib/prisma/db";
import { ICondominiumRepository } from "../condominium.repository.interface";

export class PrismaCondominiumRepository implements ICondominiumRepository {
  async create(condominium: ICondominium): Promise<ICondominium> {
    const createdCondominium = await prisma.condominium.create({
      data: {
        name: condominium.name,
        address: condominium.address,
        city: condominium.city,
        state: condominium.state,
        zip: condominium.zip,
        country: condominium.country,
        managers: {
          create: condominium.manager_ids.map((managerId) => ({
            manager_id: managerId,
          })),
        },
      },
      include: {
        managers: {
          select: {
            manager_id: true,
          },
        },
      },
    });

    return {
      id: createdCondominium.id,
      name: createdCondominium.name,
      address: createdCondominium.address,
      city: createdCondominium.city,
      state: createdCondominium.state,
      zip: createdCondominium.zip,
      country: createdCondominium.country,
      manager_ids: createdCondominium.managers.map((manager) => manager.manager_id),
    };
  }
}
