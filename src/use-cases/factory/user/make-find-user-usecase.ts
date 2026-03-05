import { UserRepository } from "@/repository/pg/user.repository";
import { FindUserUseCase } from "@/use-cases/find-user";

export function makeFindUserUseCase() {
  const userRepository = new UserRepository();
  const findUserUseCase = new FindUserUseCase(userRepository);
  return findUserUseCase;
}
