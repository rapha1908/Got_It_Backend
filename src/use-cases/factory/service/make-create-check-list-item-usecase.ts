import { PrismaCheckListItemRepository } from "@/repository/prisma/check-list-item.repository";
import { CreateCheckListItemUseCase } from "@/use-cases/create-check-list-item";

export function makeCreateCheckListItemUseCase() {
  const checkListItemRepository = new PrismaCheckListItemRepository();
  const createCheckListItemUseCase = new CreateCheckListItemUseCase(checkListItemRepository);
  return createCheckListItemUseCase;
}
