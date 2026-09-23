import { UserEntity } from "@/entities/user.entity";
import { IUserRepository } from "@/repository/user.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new ResourceNotFoundError();
    }

    return user;
  }
}
