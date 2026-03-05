import { CreateUserUseCase } from "../../create-user";
import { PrismaUserRepository } from "@/repository/prisma/user.repository";

export function makeCreateUserUseCase() {
  const userRepository = new PrismaUserRepository();
  const createUserUseCase = new CreateUserUseCase(userRepository);
  return createUserUseCase;
}
