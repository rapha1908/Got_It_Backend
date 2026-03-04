export class ManagerEntity {
  id: number;
  name: string;
  phone: string;
  nif: string;
  user_id: number;

  constructor(id: number, name: string, phone: string, nif: string, user_id: number) {
    this.id = id;
    this.name = name;
    this.phone = phone;
    this.nif = nif;
    this.user_id = user_id;
  }
}
