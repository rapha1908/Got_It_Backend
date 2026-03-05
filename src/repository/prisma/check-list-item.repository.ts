import { ICheckListItem } from "@/entities/models/check-list-item.interface";
import { prisma } from "@/lib/prisma/db";
import { ICheckListItemRepository } from "../check-list-item.repository.interface";

export class PrismaCheckListItemRepository implements ICheckListItemRepository {
  async create(checkListItem: ICheckListItem): Promise<ICheckListItem> {
    const createdCheckListItem = await prisma.checkListItem.create({
      data: {
        check_list_id: checkListItem.check_list_id,
        description: checkListItem.description,
        completed: checkListItem.completed,
      },
    });

    return createdCheckListItem;
  }
}
