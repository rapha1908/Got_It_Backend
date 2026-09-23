import { UserEntity } from "@/entities/user.entity";
import { prisma } from "@/lib/prisma/db";
import { IUserRepository } from "../user.repository.interface";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: number): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<UserEntity[]> {
    return prisma.user.findMany({ where: { id: { in: ids } } });
  }

  async create({ name, email, password, type }: UserEntity): Promise<UserEntity> {
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        type,
      },
    });

    return createdUser as unknown as UserEntity;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return user as unknown as UserEntity;
  }
}
