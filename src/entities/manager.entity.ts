export class ManagerEntity {
  id?: number;
  name: string;
  phone: string;
  nif: string;
  user_id?: number;

  constructor(name: string, phone: string, nif: string) {
    this.name = name;
    this.phone = phone;
    this.nif = nif;
  }
}
