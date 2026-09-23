import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { FindCondominiumsUseCase } from "@/use-cases/find-condominiums";

export function makeFindCondominiumsUseCase() {
  const condominiumRepository = new PrismaCondominiumRepository();
  const findCondominiumsUseCase = new FindCondominiumsUseCase(condominiumRepository);
  return findCondominiumsUseCase;
}
