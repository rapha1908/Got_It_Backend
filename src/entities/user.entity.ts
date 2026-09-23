import { IUser } from "./models/user.interface";

export class UserEntity implements IUser {
  id?: number;
  name: string;
  email: string;
  password: string;
  type: string;

  constructor(name: string, email: string, password: string, type: string) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.type = type;
  }
}
