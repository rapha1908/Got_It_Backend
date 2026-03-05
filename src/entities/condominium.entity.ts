import { ICondominium } from "./models/condominium.interface";

export class CondominiumEntity implements ICondominium {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  manager_id: number;

  constructor(
    name: string,
    address: string,
    city: string,
    state: string,
    zip: string,
    country: string,
    manager_id: number,
  ) {
    this.name = name;
    this.address = address;
    this.city = city;
    this.state = state;
    this.zip = zip;
    this.country = country;
    this.manager_id = manager_id;
  }
}
