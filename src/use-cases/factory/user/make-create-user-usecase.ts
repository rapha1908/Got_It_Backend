import { CreateUserUseCase } from "../../create-user";
import { UserRepository } from "@/repository/pg/user.repository";

export function makeCreateUserUseCase() {
  const userRepository = new UserRepository();
  const createUserUseCase = new CreateUserUseCase(userRepository);
  return createUserUseCase;
}
