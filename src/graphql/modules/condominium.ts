import { z } from "zod";
import { ICondominiumOfManager } from "@/entities/models/condominium.interface";
import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { makeCreateCondominiumUseCase } from "@/use-cases/factory/condominium/make-create-usecase";
import { makeFindCondominiumByIdUseCase } from "@/use-cases/factory/condominium/make-find-by-id-usecase";
import { makeFindCondominiumsUseCase } from "@/use-cases/factory/condominium/make-find-usecase";
import { builder } from "../builder";
import { Condominium, Manager, Service } from "../refs";
import { orderByKeysOrError } from "../utils/order-by-keys";

const condominiumRepository = new PrismaCondominiumRepository();
const managerRepository = new PrismaManagerRepository();
const serviceRepository = new PrismaServiceRepository();

Condominium.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
    address: t.exposeString("address"),
    city: t.exposeString("city"),
    state: t.exposeString("state"),
    zip: t.exposeString("zip"),
    country: t.exposeString("country"),
    managers: t.loadable({
      type: [Manager],
      load: async (ids: number[]) =>
        orderByKeysOrError(ids, await managerRepository.findByIds(ids), (manager) => manager.id),
      resolve: (condominium) => condominium.manager_ids,
    }),
    services: t.loadableGroup({
      type: Service,
      load: (condominiumIds: number[]) => serviceRepository.findByCondominiumIds(condominiumIds),
      group: (service) => service.condominium_id,
      resolve: (condominium) => condominium.id,
    }),
  }),
});

builder.objectField(Manager, "condominiums", (t) =>
  t.loadableGroup({
    type: Condominium,
    load: (managerIds: number[]) => condominiumRepository.findByManagerIds(managerIds),
    // Rows come from findByManagerIds, so they carry the manager_id they were loaded for.
    group: (condominium) => (condominium as ICondominiumOfManager).manager_id,
    resolve: (manager) => manager.id,
  }),
);

const CreateCondominiumInput = builder
  .inputType("CreateCondominiumInput", {
    fields: (t) => ({
      name: t.string({ required: true }),
      address: t.string({ required: true }),
      city: t.string({ required: true }),
      state: t.string({ required: true }),
      zip: t.string({ required: true }),
      country: t.string({ required: true }),
      managerIds: t.intList({ required: true }),
    }),
  })
  .validate(
    z.object({
      name: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1),
      managerIds: z
        .array(z.number().int().positive())
        .min(1)
        .transform((managerIds) => [...new Set(managerIds)]),
    }),
  );

builder.mutationField("createCondominium", (t) =>
  t.field({
    type: Condominium,
    args: {
      input: t.arg({ type: CreateCondominiumInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateCondominiumUseCase().handle({
        name: input.name,
        address: input.address,
        city: input.city,
        state: input.state,
        zip: input.zip,
        country: input.country,
        manager_ids: input.managerIds,
      }),
  }),
);

builder.queryField("condominiums", (t) =>
  t.field({
    type: [Condominium],
    resolve: () => makeFindCondominiumsUseCase().handle(),
  }),
);

builder.queryField("condominium", (t) =>
  t.field({
    type: Condominium,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: (_root, { id }) => makeFindCondominiumByIdUseCase().handle(id),
  }),
);
