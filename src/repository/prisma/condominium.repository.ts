import { Prisma } from "@prisma/client";
import { ICondominium, ICondominiumOfManager } from "@/entities/models/condominium.interface";
import { prisma } from "@/lib/prisma/db";
import { ICondominiumRepository } from "../condominium.repository.interface";

const withManagerIds = {
  managers: {
    select: {
      manager_id: true,
    },
  },
} satisfies Prisma.CondominiumInclude;

type CondominiumRow = Prisma.CondominiumGetPayload<{ include: typeof withManagerIds }>;

function toCondominium(condominium: CondominiumRow): ICondominium {
  return {
    id: condominium.id,
    name: condominium.name,
    address: condominium.address,
    city: condominium.city,
    state: condominium.state,
    zip: condominium.zip,
    country: condominium.country,
    manager_ids: condominium.managers.map((manager) => manager.manager_id),
  };
}

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
      include: withManagerIds,
    });

    return toCondominium(createdCondominium);
  }

  async findAll(): Promise<ICondominium[]> {
    const condominiums = await prisma.condominium.findMany({ include: withManagerIds });
    return condominiums.map(toCondominium);
  }

  async findById(id: number): Promise<ICondominium | null> {
    const condominium = await prisma.condominium.findUnique({ where: { id }, include: withManagerIds });
    return condominium ? toCondominium(condominium) : null;
  }

  async findByIds(ids: number[]): Promise<ICondominium[]> {
    const condominiums = await prisma.condominium.findMany({
      where: { id: { in: ids } },
      include: withManagerIds,
    });
    return condominiums.map(toCondominium);
  }

  async findByManagerIds(manager_ids: number[]): Promise<ICondominiumOfManager[]> {
    const relations = await prisma.condominiumManager.findMany({
      where: { manager_id: { in: manager_ids } },
      include: { condominium: { include: withManagerIds } },
    });

    return relations.map((relation) => ({
      ...toCondominium(relation.condominium),
      manager_id: relation.manager_id,
    }));
  }
}
