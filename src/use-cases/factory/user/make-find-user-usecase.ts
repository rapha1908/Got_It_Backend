import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { FindUserUseCase } from "@/use-cases/find-user";

export function makeFindUserUseCase() {
  const userRepository = new PrismaUserRepository();
  const findUserUseCase = new FindUserUseCase(userRepository);
  return findUserUseCase;
}
