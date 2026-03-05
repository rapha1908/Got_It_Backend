import { UserRepository } from "@/repository/user.repository";
import { FindWithManagerUseCase } from "@/use-cases/find-with-manager";

export function makeFindManagerUseCase() {
  const userRepository = new UserRepository();
  const findWithManager = new FindWithManagerUseCase(userRepository);
  return findWithManager;
}
