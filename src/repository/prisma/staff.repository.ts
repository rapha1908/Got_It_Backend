import { IStaff } from "@/entities/models/staff.interface";
import { UserEntity } from "@/entities/user.entity";
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

  async findWithStaff(user_id: number): Promise<(UserEntity & IStaff) | undefined> {
    const staff = await prisma.staff.findFirst({
      where: { user_id },
      include: { user: true },
    });

    if (!staff) {
      return undefined;
    }

    const { user, ...staffData } = staff;
    const userWithStaff = {
      ...user,
      ...staffData,
    };

    return userWithStaff as unknown as UserEntity & IStaff;
  }
}
