import { beforeEach, describe, expect, it } from "vitest";
import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { PrismaStaffSkillRepository } from "@/repository/prisma/staff-skill.repository";
import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { FindStaffByIdUseCase } from "@/use-cases/find-staff-by-id";
import { FindUserByIdUseCase } from "@/use-cases/find-user-by-id";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";
import * as seed from "../helpers/factories";
import { resetDb } from "../helpers/reset-db";

const ids = <T extends { id?: number }>(rows: T[]) => rows.map((row) => row.id).sort();

describe("identity repositories", () => {
  beforeEach(resetDb);

  describe("PrismaUserRepository", () => {
    const repository = new PrismaUserRepository();

    it("findByIds returns only the requested users", async () => {
      const [a, b] = [await seed.seedUser(), await seed.seedUser()];
      await seed.seedUser();
      expect(ids(await repository.findByIds([a.id, b.id]))).toEqual([a.id, b.id].sort());
    });

    it("findByIds returns [] for unknown ids", async () => {
      expect(await repository.findByIds([999])).toEqual([]);
    });

    it("findById returns the user or null", async () => {
      const user = await seed.seedUser({ email: "ana@test.com" });
      expect(await repository.findById(user.id)).toEqual(expect.objectContaining({ email: "ana@test.com" }));
      expect(await repository.findById(999)).toBeNull();
    });
  });

  describe("PrismaManagerRepository", () => {
    const repository = new PrismaManagerRepository();

    it("findWithManager returns the manager record without merging the user", async () => {
      const user = await seed.seedUser({ name: "Ana" });
      const manager = await seed.seedManager(user.id, { name: "Ana Manager" });

      const found = await repository.findWithManager(user.id);

      expect(found).toEqual(expect.objectContaining({ id: manager.id, user_id: user.id, name: "Ana Manager" }));
      expect(found).not.toHaveProperty("email");
      expect(found).not.toHaveProperty("password");
    });

    it("findByIds and findByUserIds batch-load managers", async () => {
      const [a, b] = [await seed.seedManager(), await seed.seedManager()];
      expect(ids(await repository.findByIds([a.id, b.id, 999]))).toEqual([a.id, b.id].sort());
      expect(ids(await repository.findByUserIds([a.user_id, 999]))).toEqual([a.id]);
    });
  });

  describe("PrismaStaffRepository", () => {
    const repository = new PrismaStaffRepository();

    it("findWithStaff returns the staff record without merging the user", async () => {
      const user = await seed.seedUser({ type: "Staff" });
      const staff = await seed.seedStaff(user.id, { name: "Bruno" });

      const found = await repository.findWithStaff(user.id);

      expect(found).toEqual(expect.objectContaining({ id: staff.id, user_id: user.id, name: "Bruno" }));
      expect(found).not.toHaveProperty("email");
    });

    it("findById, findByIds and findByUserIds", async () => {
      const [a, b] = [await seed.seedStaff(), await seed.seedStaff()];
      expect(await repository.findById(a.id)).toEqual(expect.objectContaining({ id: a.id }));
      expect(await repository.findById(999)).toBeNull();
      expect(ids(await repository.findByIds([a.id, b.id]))).toEqual([a.id, b.id].sort());
      expect(ids(await repository.findByUserIds([b.user_id]))).toEqual([b.id]);
    });
  });

  describe("PrismaStaffSkillRepository", () => {
    const repository = new PrismaStaffSkillRepository();

    it("findSkillsByStaffIds returns skills tagged with their staff_id", async () => {
      const [s1, s2] = [await seed.seedStaff(), await seed.seedStaff()];
      const [k1, k2] = [await seed.seedSkill("Plumbing"), await seed.seedSkill("Painting")];
      await seed.seedStaffSkill(s1.id, k1.id);
      await seed.seedStaffSkill(s1.id, k2.id);
      await seed.seedStaffSkill(s2.id, k2.id);

      const skills = await repository.findSkillsByStaffIds([s1.id, s2.id]);

      expect(skills).toHaveLength(3);
      expect(skills).toEqual(
        expect.arrayContaining([
          { id: k1.id, name: "Plumbing", staff_id: s1.id },
          { id: k2.id, name: "Painting", staff_id: s1.id },
          { id: k2.id, name: "Painting", staff_id: s2.id },
        ]),
      );
      expect(await repository.findSkillsByStaffIds([999])).toEqual([]);
    });
  });

  describe("find-by-id use cases", () => {
    it("FindUserByIdUseCase throws ResourceNotFoundError for unknown ids", async () => {
      const useCase = new FindUserByIdUseCase(new PrismaUserRepository());
      await expect(useCase.handle(999)).rejects.toBeInstanceOf(ResourceNotFoundError);
    });

    it("FindStaffByIdUseCase returns the staff or throws", async () => {
      const staff = await seed.seedStaff();
      const useCase = new FindStaffByIdUseCase(new PrismaStaffRepository());
      await expect(useCase.handle(staff.id)).resolves.toEqual(expect.objectContaining({ id: staff.id }));
      await expect(useCase.handle(999)).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });
});
