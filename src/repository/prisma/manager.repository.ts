import { IManager } from "@/entities/models/manager.interface";
import { UserEntity } from "@/entities/user.entity";
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

  async findWithManager(user_id: number): Promise<(UserEntity & IManager) | undefined> {
    const manager = await prisma.manager.findFirst({
      where: { user_id },
      include: { user: true },
    });

    if (!manager) {
      return undefined;
    }

    const userWithManager = {
      ...manager.user,
      ...manager,
    };

    return userWithManager as unknown as UserEntity & IManager;
  }
}
