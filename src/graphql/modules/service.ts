import { z } from "zod";
import { PrismaCheckListRepository } from "@/repository/prisma/check-list.repository";
import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { PrismaPhotoServiceRepository } from "@/repository/prisma/photo-service.repository";
import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { makeCreateCheckListItemUseCase } from "@/use-cases/factory/service/make-create-check-list-item-usecase";
import { makeCreateCheckListUseCase } from "@/use-cases/factory/service/make-create-check-list-usecase";
import { makeCreatePhotoServiceUseCase } from "@/use-cases/factory/service/make-create-photo-service-usecase";
import { makeCreateServiceUseCase } from "@/use-cases/factory/service/make-create-usecase";
import { makeFindServiceByIdUseCase } from "@/use-cases/factory/service/make-find-by-id-usecase";
import { builder } from "../builder";
import { CheckList, CheckListItem, Condominium, PhotoService, Service, Staff } from "../refs";
import { orderByKeysOrError } from "../utils/order-by-keys";

const checkListRepository = new PrismaCheckListRepository();
const condominiumRepository = new PrismaCondominiumRepository();
const photoServiceRepository = new PrismaPhotoServiceRepository();
const serviceRepository = new PrismaServiceRepository();
const staffRepository = new PrismaStaffRepository();

Service.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    description: t.exposeString("description"),
    startDate: t.exposeString("start_date"),
    endDate: t.exposeString("end_date"),
    status: t.exposeString("status"),
    price: t.exposeFloat("price"),
    condominium: t.loadable({
      type: Condominium,
      load: async (ids: number[]) =>
        orderByKeysOrError(ids, await condominiumRepository.findByIds(ids), (condominium) => condominium.id),
      resolve: (service) => service.condominium_id,
    }),
    staff: t.loadable({
      type: Staff,
      load: async (ids: number[]) => orderByKeysOrError(ids, await staffRepository.findByIds(ids), (staff) => staff.id),
      resolve: (service) => service.staff_id,
    }),
    photos: t.loadableGroup({
      type: PhotoService,
      load: (serviceIds: string[]) => photoServiceRepository.findByServiceIds(serviceIds),
      group: (photo) => photo.service_id,
      resolve: (service) => service.id,
    }),
    checkLists: t.loadableGroup({
      type: CheckList,
      load: (serviceIds: string[]) => checkListRepository.findByServiceIds(serviceIds),
      group: (checkList) => checkList.service_id,
      resolve: (service) => service.id,
    }),
  }),
});

builder.objectField(Staff, "services", (t) =>
  t.loadableGroup({
    type: Service,
    load: (staffIds: number[]) => serviceRepository.findByStaffIds(staffIds),
    group: (service) => service.staff_id,
    resolve: (staff) => staff.id,
  }),
);

PhotoService.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    photoUrl: t.exposeString("photo_url"),
    createdAt: t.string({ resolve: (photo) => photo.created_at.toISOString() }),
  }),
});

CheckList.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    description: t.exposeString("description"),
    createdAt: t.string({ resolve: (checkList) => checkList.created_at.toISOString() }),
    items: t.field({
      type: [CheckListItem],
      resolve: (checkList) => checkList.items ?? [],
    }),
  }),
});

CheckListItem.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    description: t.exposeString("description"),
    completed: t.exposeBoolean("completed"),
  }),
});

const CreateServiceInput = builder
  .inputType("CreateServiceInput", {
    fields: (t) => ({
      condominiumId: t.int({ required: true }),
      staffId: t.int({ required: true }),
      description: t.string({ required: true }),
      startDate: t.string({ required: true }),
      endDate: t.string({ required: true }),
      status: t.string({ required: true }),
      price: t.float({ required: true }),
    }),
  })
  .validate(
    z.object({
      condominiumId: z.number().int().positive(),
      staffId: z.number().int().positive(),
      description: z.string().min(1),
      startDate: z.string().date(),
      endDate: z.string().date(),
      status: z.string().min(1),
      price: z.number().nonnegative(),
    }),
  );

const CreatePhotoServiceInput = builder
  .inputType("CreatePhotoServiceInput", {
    fields: (t) => ({
      serviceId: t.id({ required: true }),
      photoUrl: t.string({ required: true }),
    }),
  })
  .validate(
    z.object({
      serviceId: z.string().uuid(),
      photoUrl: z.string().min(1),
    }),
  );

const CreateCheckListInput = builder
  .inputType("CreateCheckListInput", {
    fields: (t) => ({
      serviceId: t.id({ required: true }),
      description: t.string({ required: true }),
    }),
  })
  .validate(
    z.object({
      serviceId: z.string().uuid(),
      description: z.string().min(1),
    }),
  );

const CreateCheckListItemInput = builder
  .inputType("CreateCheckListItemInput", {
    fields: (t) => ({
      checkListId: t.int({ required: true }),
      description: t.string({ required: true }),
      completed: t.boolean(),
    }),
  })
  .validate(
    z.object({
      checkListId: z.number().int().positive(),
      description: z.string().min(1),
      completed: z
        .boolean()
        .nullish()
        .transform((completed) => completed ?? false),
    }),
  );

builder.mutationField("createService", (t) =>
  t.field({
    type: Service,
    args: {
      input: t.arg({ type: CreateServiceInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateServiceUseCase().handle({
        condominium_id: input.condominiumId,
        staff_id: input.staffId,
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        status: input.status,
        price: input.price,
      }),
  }),
);

builder.mutationField("createPhotoService", (t) =>
  t.field({
    type: PhotoService,
    args: {
      input: t.arg({ type: CreatePhotoServiceInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreatePhotoServiceUseCase().handle({ service_id: input.serviceId, photo_url: input.photoUrl }),
  }),
);

builder.mutationField("createCheckList", (t) =>
  t.field({
    type: CheckList,
    args: {
      input: t.arg({ type: CreateCheckListInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateCheckListUseCase().handle({ service_id: input.serviceId, description: input.description }),
  }),
);

builder.mutationField("createCheckListItem", (t) =>
  t.field({
    type: CheckListItem,
    args: {
      input: t.arg({ type: CreateCheckListItemInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateCheckListItemUseCase().handle({
        check_list_id: input.checkListId,
        description: input.description,
        completed: input.completed,
      }),
  }),
);

builder.queryField("service", (t) =>
  t.field({
    type: Service,
    args: {
      id: t.arg.id({ required: true, validate: z.string().uuid() }),
    },
    resolve: (_root, { id }) => makeFindServiceByIdUseCase().handle(String(id)),
  }),
);
