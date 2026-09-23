import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { FindUserByIdUseCase } from "@/use-cases/find-user-by-id";

export function makeFindUserByIdUseCase() {
  const userRepository = new PrismaUserRepository();
  const findUserByIdUseCase = new FindUserByIdUseCase(userRepository);
  return findUserByIdUseCase;
}
