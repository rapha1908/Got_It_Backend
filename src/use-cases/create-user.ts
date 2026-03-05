import { UserEntity } from "@/entities/user.entity";
import { IUserRepository } from "@/repository/user.repository.interface";

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}
  async handle(
    name: string,
    email: string,
    password: string,
    type: string,
  ): Promise<UserEntity | undefined> {
    const user = await this.userRepository.create({ name, email, password, type });
    return user;
  }
}
