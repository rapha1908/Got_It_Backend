import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { PrismaCheckListRepository } from "@/repository/prisma/check-list.repository";
import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { PrismaPhotoServiceRepository } from "@/repository/prisma/photo-service.repository";
import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";
import { FindCondominiumByIdUseCase } from "@/use-cases/find-condominium-by-id";
import { FindServiceByIdUseCase } from "@/use-cases/find-service-by-id";
import * as seed from "../helpers/factories";
import { resetDb } from "../helpers/reset-db";

describe("domain repositories", () => {
  beforeEach(resetDb);

  describe("PrismaCondominiumRepository", () => {
    const repository = new PrismaCondominiumRepository();

    it("findById returns the condominium with manager_ids, or null", async () => {
      const [m1, m2] = [await seed.seedManager(), await seed.seedManager()];
      const condo = await seed.seedCondominium([m1.id, m2.id], { name: "Alpha" });

      const found = await repository.findById(condo.id);

      expect(found).toEqual(expect.objectContaining({ id: condo.id, name: "Alpha" }));
      expect(found?.manager_ids.sort()).toEqual([m1.id, m2.id].sort());
      expect(await repository.findById(999)).toBeNull();
    });

    it("findByIds batch-loads condominiums", async () => {
      const m = await seed.seedManager();
      const [c1, c2] = [await seed.seedCondominium([m.id]), await seed.seedCondominium([m.id])];
      await seed.seedCondominium([m.id]);

      const found = await repository.findByIds([c1.id, c2.id, 999]);

      expect(found.map((c) => c.id).sort()).toEqual([c1.id, c2.id].sort());
      expect(found[0].manager_ids).toEqual([m.id]);
    });

    it("findByManagerIds returns one row per (condominium, manager) pair", async () => {
      const [m1, m2] = [await seed.seedManager(), await seed.seedManager()];
      const shared = await seed.seedCondominium([m1.id, m2.id]);
      const onlyM1 = await seed.seedCondominium([m1.id]);

      const rows = await repository.findByManagerIds([m1.id, m2.id]);

      expect(rows.map((r) => [r.id, r.manager_id])).toEqual(
        expect.arrayContaining([
          [shared.id, m1.id],
          [shared.id, m2.id],
          [onlyM1.id, m1.id],
        ]),
      );
      expect(rows).toHaveLength(3);
      expect(await repository.findByManagerIds([999])).toEqual([]);
    });
  });

  describe("PrismaServiceRepository", () => {
    const repository = new PrismaServiceRepository();

    it("create keeps dates and decimal price intact", async () => {
      const m = await seed.seedManager();
      const condo = await seed.seedCondominium([m.id]);
      const staff = await seed.seedStaff();

      const created = await repository.create({
        condominium_id: condo.id,
        staff_id: staff.id,
        description: "Fix roof",
        start_date: "2026-01-31",
        end_date: "2026-02-01",
        status: "pending",
        price: 10.5,
      });

      const found = await repository.findById(created.id!);
      expect(found).toEqual(
        expect.objectContaining({ start_date: "2026-01-31", end_date: "2026-02-01", price: 10.5 }),
      );
    });

    it("findById returns null for unknown ids", async () => {
      expect(await repository.findById(randomUUID())).toBeNull();
    });

    it("findByCondominiumIds and findByStaffIds batch-load services", async () => {
      const m = await seed.seedManager();
      const [c1, c2] = [await seed.seedCondominium([m.id]), await seed.seedCondominium([m.id])];
      const [s1, s2] = [await seed.seedStaff(), await seed.seedStaff()];
      const a = await seed.seedService(c1.id, s1.id);
      const b = await seed.seedService(c2.id, s2.id);
      const c = await seed.seedService(c2.id, s1.id);

      const byCondo = await repository.findByCondominiumIds([c1.id, c2.id]);
      const byStaff = await repository.findByStaffIds([s1.id]);

      expect(byCondo.map((s) => s.id).sort()).toEqual([a.id, b.id, c.id].sort());
      expect(byStaff.map((s) => s.id).sort()).toEqual([a.id, c.id].sort());
      expect(byStaff[0]).toEqual(expect.objectContaining({ staff_id: s1.id, start_date: "2026-01-10", price: 100 }));
      expect(await repository.findByCondominiumIds([999])).toEqual([]);
    });
  });

  describe("photo and check list repositories", () => {
    it("findByServiceIds batch-loads photos and check lists with items", async () => {
      const m = await seed.seedManager();
      const condo = await seed.seedCondominium([m.id]);
      const staff = await seed.seedStaff();
      const [sv1, sv2] = [await seed.seedService(condo.id, staff.id), await seed.seedService(condo.id, staff.id)];
      await seed.seedPhoto(sv1.id);
      await seed.seedPhoto(sv2.id);
      const list = await seed.seedCheckList(sv1.id);
      await seed.seedCheckListItem(list.id, { completed: true });
      await seed.seedCheckListItem(list.id);

      const photos = await new PrismaPhotoServiceRepository().findByServiceIds([sv1.id, sv2.id]);
      const lists = await new PrismaCheckListRepository().findByServiceIds([sv1.id, sv2.id]);

      expect(photos.map((p) => p.service_id).sort()).toEqual([sv1.id, sv2.id].sort());
      expect(lists).toHaveLength(1);
      expect(lists[0]).toEqual(expect.objectContaining({ id: list.id, service_id: sv1.id }));
      expect(lists[0].created_at).toBeInstanceOf(Date);
      expect(lists[0].items.map((i) => i.completed).sort()).toEqual([false, true]);
    });
  });

  describe("find-by-id use cases", () => {
    it("throw ResourceNotFoundError for unknown ids", async () => {
      await expect(
        new FindCondominiumByIdUseCase(new PrismaCondominiumRepository()).handle(999),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
      await expect(
        new FindServiceByIdUseCase(new PrismaServiceRepository()).handle(randomUUID()),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });
});
