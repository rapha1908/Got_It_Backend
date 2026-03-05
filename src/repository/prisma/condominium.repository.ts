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
        manager_id: condominium.manager_id,
      },
    });

    return createdCondominium;
  }
}
