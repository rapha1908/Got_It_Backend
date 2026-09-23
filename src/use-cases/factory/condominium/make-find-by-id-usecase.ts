import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { FindCondominiumByIdUseCase } from "@/use-cases/find-condominium-by-id";

export function makeFindCondominiumByIdUseCase() {
  const condominiumRepository = new PrismaCondominiumRepository();
  const findCondominiumByIdUseCase = new FindCondominiumByIdUseCase(condominiumRepository);
  return findCondominiumByIdUseCase;
}
