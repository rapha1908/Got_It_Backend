import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma/db";

let sequence = 0;
const next = () => ++sequence;

export const DEFAULT_PASSWORD = "password123";

type UserType = "Manager" | "Staff";

export async function seedUser(
  data: Partial<{ name: string; email: string; password: string; type: UserType }> = {},
) {
  const n = next();
  return prisma.user.create({
    data: {
      name: data.name ?? `User ${n}`,
      email: data.email ?? `user${n}@test.com`,
      password: await hash(data.password ?? DEFAULT_PASSWORD, 4),
      type: data.type ?? "Manager",
    },
  });
}

export async function seedManager(user_id?: number, data: Partial<{ name: string }> = {}) {
  const userId = user_id ?? (await seedUser({ type: "Manager" })).id;
  return prisma.manager.create({
    data: { user_id: userId, name: data.name ?? `Manager ${next()}`, phone: "910000000", nif: "123456789" },
  });
}

export async function seedStaff(user_id?: number, data: Partial<{ name: string }> = {}) {
  const userId = user_id ?? (await seedUser({ type: "Staff" })).id;
  return prisma.staff.create({
    data: { user_id: userId, name: data.name ?? `Staff ${next()}`, phone: "920000000", nif: "987654321" },
  });
}

export async function seedSkill(name?: string) {
  return prisma.skill.create({ data: { name: name ?? `Skill ${next()}` } });
}

export async function seedStaffSkill(staff_id: number, skill_id: number) {
  return prisma.staffSkill.create({ data: { staff_id, skill_id } });
}

export async function seedCondominium(manager_ids: number[], data: Partial<{ name: string }> = {}) {
  return prisma.condominium.create({
    data: {
      name: data.name ?? `Condominium ${next()}`,
      address: "Rua A, 1",
      city: "Lisboa",
      state: "Lisboa",
      zip: "1000-001",
      country: "PT",
      managers: { create: manager_ids.map((manager_id) => ({ manager_id })) },
    },
  });
}

export async function seedService(
  condominium_id: number,
  staff_id: number,
  data: Partial<{ description: string; start_date: string; end_date: string; price: number }> = {},
) {
  return prisma.service.create({
    data: {
      id: randomUUID(),
      condominium_id,
      staff_id,
      description: data.description ?? `Service ${next()}`,
      start_date: new Date(data.start_date ?? "2026-01-10"),
      end_date: new Date(data.end_date ?? "2026-01-20"),
      status: "pending",
      price: new Prisma.Decimal(data.price ?? 100),
    },
  });
}

export async function seedPhoto(service_id: string, photo_url?: string) {
  return prisma.photoService.create({
    data: { service_id, photo_url: photo_url ?? `https://img.test/${next()}.jpg` },
  });
}

export async function seedCheckList(service_id: string, description?: string) {
  return prisma.checkList.create({
    data: { service_id, description: description ?? `Check list ${next()}` },
  });
}

export async function seedCheckListItem(
  check_list_id: number,
  data: Partial<{ description: string; completed: boolean }> = {},
) {
  return prisma.checkListItem.create({
    data: {
      check_list_id,
      description: data.description ?? `Item ${next()}`,
      completed: data.completed ?? false,
    },
  });
}
