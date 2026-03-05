import { UserEntity } from "@/entities/user.entity";
import { IUserRepository } from "@/repository/user.repository.interface";

export class FindUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}
  async handle(email: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findByEmail(email);
    return user;
  }
}
