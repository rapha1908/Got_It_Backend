import { PrismaCheckListRepository } from "@/repository/prisma/check-list.repository";
import { FindCheckListsByServiceUseCase } from "@/use-cases/find-check-lists-by-service";

export function makeFindCheckListsByServiceUseCase() {
  const checkListRepository = new PrismaCheckListRepository();
  const findCheckListsByServiceUseCase = new FindCheckListsByServiceUseCase(checkListRepository);
  return findCheckListsByServiceUseCase;
}
