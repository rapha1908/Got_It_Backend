import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { CreateCondominiumUseCase } from "@/use-cases/create-condominium";

export function makeCreateCondominiumUseCase() {
  const condominiumRepository = new PrismaCondominiumRepository();
  const createCondominiumUseCase = new CreateCondominiumUseCase(condominiumRepository);
  return createCondominiumUseCase;
}
