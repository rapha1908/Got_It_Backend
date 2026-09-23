import { IStaff } from "@/entities/models/staff.interface";
import { prisma } from "@/lib/prisma/db";
import { IStaffRepository } from "../staff.repository.interface";

export class PrismaStaffRepository implements IStaffRepository {
  async create(staff: IStaff): Promise<IStaff> {
    const createdStaff = await prisma.staff.create({
      data: {
        name: staff.name,
        phone: staff.phone,
        nif: staff.nif,
        user_id: staff.user_id!,
      },
    });

    return createdStaff;
  }

  async findWithStaff(user_id: number): Promise<IStaff | undefined> {
    const staff = await prisma.staff.findFirst({ where: { user_id } });
    return staff ?? undefined;
  }

  async findById(id: number): Promise<IStaff | null> {
    return prisma.staff.findUnique({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<IStaff[]> {
    return prisma.staff.findMany({ where: { id: { in: ids } } });
  }

  async findByUserIds(user_ids: number[]): Promise<IStaff[]> {
    return prisma.staff.findMany({ where: { user_id: { in: user_ids } } });
  }
}
