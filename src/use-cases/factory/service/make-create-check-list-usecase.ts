import { PrismaCheckListRepository } from "@/repository/prisma/check-list.repository";
import { CreateCheckListUseCase } from "@/use-cases/create-check-list";

export function makeCreateCheckListUseCase() {
  const checkListRepository = new PrismaCheckListRepository();
  const createCheckListUseCase = new CreateCheckListUseCase(checkListRepository);
  return createCheckListUseCase;
}
