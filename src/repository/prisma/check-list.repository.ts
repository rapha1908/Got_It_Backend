import { ICheckList, ICheckListWithItems } from "@/entities/models/check-list.interface";
import { prisma } from "@/lib/prisma/db";
import { ICheckListRepository } from "../check-list.repository.interface";

export class PrismaCheckListRepository implements ICheckListRepository {
  async create(checkList: ICheckList): Promise<ICheckList> {
    const createdCheckList = await prisma.checkList.create({
      data: {
        service_id: checkList.service_id,
        description: checkList.description,
      },
    });

    return createdCheckList;
  }

  async findByServiceIds(service_ids: string[]): Promise<ICheckListWithItems[]> {
    return prisma.checkList.findMany({
      where: { service_id: { in: service_ids } },
      include: { items: true },
    });
  }
}
