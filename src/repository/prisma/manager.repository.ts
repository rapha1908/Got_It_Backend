import { IManager } from "@/entities/models/manager.interface";
import { prisma } from "@/lib/prisma/db";
import { IManagerRepository } from "../manager.repository.interface";

export class PrismaManagerRepository implements IManagerRepository {
  async create(manager: IManager): Promise<IManager> {
    const createdManager = await prisma.manager.create({
      data: {
        name: manager.name,
        phone: manager.phone,
        nif: manager.nif,
        user_id: manager.user_id!,
      },
    });

    return createdManager;
  }

  async findWithManager(user_id: number): Promise<IManager | undefined> {
    const manager = await prisma.manager.findFirst({ where: { user_id } });
    return manager ?? undefined;
  }

  async findByIds(ids: number[]): Promise<IManager[]> {
    return prisma.manager.findMany({ where: { id: { in: ids } } });
  }

  async findByUserIds(user_ids: number[]): Promise<IManager[]> {
    return prisma.manager.findMany({ where: { user_id: { in: user_ids } } });
  }
}
