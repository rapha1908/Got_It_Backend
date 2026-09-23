import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaCheckListRepository } from "@/repository/prisma/check-list.repository";
import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { PrismaPhotoServiceRepository } from "@/repository/prisma/photo-service.repository";
import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import * as seed from "../helpers/factories";
import { execute, tokenFor } from "../helpers/graphql";
import { resetDb } from "../helpers/reset-db";

const TREE = /* GraphQL */ `
  {
    condominiums {
      id
      name
      managers { name }
      services {
        description
        startDate
        price
        staff { name }
        photos { photoUrl createdAt }
        checkLists { description createdAt items { description completed } }
      }
    }
  }
`;

async function seedTree() {
  const manager = await seed.seedManager(undefined, { name: "Ana" });
  const [s1, s2] = [await seed.seedStaff(undefined, { name: "Bruno" }), await seed.seedStaff(undefined, { name: "Carla" })];

  for (const name of ["Alpha", "Beta"]) {
    const condo = await seed.seedCondominium([manager.id], { name });
    for (const staff of [s1, s2]) {
      const service = await seed.seedService(condo.id, staff.id);
      await seed.seedPhoto(service.id);
      const list = await seed.seedCheckList(service.id);
      await seed.seedCheckListItem(list.id, { completed: true });
      await seed.seedCheckListItem(list.id);
    }
  }

  return { manager, staff: [s1, s2] };
}

describe("condominiums and services", () => {
  let token: string;

  beforeEach(async () => {
    await resetDb();
    token = tokenFor(await seed.seedUser());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves the full condominium → service → photos/checkLists tree", async () => {
    await seedTree();

    const result = await execute(TREE, {}, token);

    expect(result.errors).toBeUndefined();
    const condominiums = result.data?.condominiums;
    expect(condominiums.map((c: { name: string }) => c.name).sort()).toEqual(["Alpha", "Beta"]);

    for (const condo of condominiums) {
      expect(condo.managers).toEqual([{ name: "Ana" }]);
      expect(condo.services).toHaveLength(2);
      expect(condo.services.map((s: { staff: { name: string } }) => s.staff.name).sort()).toEqual(["Bruno", "Carla"]);

      for (const service of condo.services) {
        expect(service.startDate).toBe("2026-01-10");
        expect(service.price).toBe(100);
        expect(service.photos).toHaveLength(1);
        expect(new Date(service.photos[0].createdAt).toString()).not.toBe("Invalid Date");
        expect(service.checkLists).toHaveLength(1);
        expect(service.checkLists[0].items.map((i: { completed: boolean }) => i.completed).sort()).toEqual([false, true]);
      }
    }
  });

  it("batches every relation level into a single repository call (no N+1)", async () => {
    await seedTree();
    const spies = [
      vi.spyOn(PrismaManagerRepository.prototype, "findByIds"),
      vi.spyOn(PrismaServiceRepository.prototype, "findByCondominiumIds"),
      vi.spyOn(PrismaStaffRepository.prototype, "findByIds"),
      vi.spyOn(PrismaPhotoServiceRepository.prototype, "findByServiceIds"),
      vi.spyOn(PrismaCheckListRepository.prototype, "findByServiceIds"),
    ];

    const result = await execute(TREE, {}, token);

    expect(result.errors).toBeUndefined();
    for (const spy of spies) {
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });

  it("returns [] for a condominium without services", async () => {
    const manager = await seed.seedManager();
    const condo = await seed.seedCondominium([manager.id]);

    const result = await execute(`query ($id: Int!) { condominium(id: $id) { services { id } } }`, { id: condo.id }, token);

    expect(result.errors).toBeUndefined();
    expect(result.data?.condominium.services).toEqual([]);
  });

  it("condominium and service lookups return NOT_FOUND / BAD_USER_INPUT", async () => {
    const missingCondo = await execute(`{ condominium(id: 999) { id } }`, {}, token);
    expect(missingCondo.errors?.[0].extensions?.code).toBe("NOT_FOUND");

    const missingService = await execute(`query ($id: ID!) { service(id: $id) { id } }`, { id: randomUUID() }, token);
    expect(missingService.errors?.[0].extensions?.code).toBe("NOT_FOUND");

    const badId = await execute(`{ service(id: "not-a-uuid") { id } }`, {}, token);
    expect(badId.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("createCondominium deduplicates managerIds and exposes Manager.condominiums", async () => {
    const manager = await seed.seedManager();
    const input = {
      name: "Gamma", address: "Rua B, 2", city: "Porto", state: "Porto", zip: "4000-001", country: "PT",
      managerIds: [manager.id, manager.id],
    };

    const created = await execute(
      `mutation ($input: CreateCondominiumInput!) { createCondominium(input: $input) { id name managers { id } } }`,
      { input },
      token,
    );
    expect(created.errors).toBeUndefined();
    expect(created.data?.createCondominium).toEqual({ id: expect.any(Number), name: "Gamma", managers: [{ id: manager.id }] });

    const viaManager = await execute(
      `query ($userId: Int!) { manager(userId: $userId) { condominiums { name } } }`,
      { userId: manager.user_id },
      token,
    );
    expect(viaManager.data?.manager.condominiums).toEqual([{ name: "Gamma" }]);
  });

  it("createCondominium with an unknown manager returns BAD_USER_INPUT 'Related resource not found'", async () => {
    const result = await execute(
      `mutation ($input: CreateCondominiumInput!) { createCondominium(input: $input) { id } }`,
      { input: { name: "X", address: "a", city: "b", state: "c", zip: "d", country: "e", managerIds: [999] } },
      token,
    );
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Related resource not found", extensions: expect.objectContaining({ code: "BAD_USER_INPUT" }) }),
    );
  });

  it("createCondominium without managers returns BAD_USER_INPUT", async () => {
    const result = await execute(
      `mutation ($input: CreateCondominiumInput!) { createCondominium(input: $input) { id } }`,
      { input: { name: "X", address: "a", city: "b", state: "c", zip: "d", country: "e", managerIds: [] } },
      token,
    );
    expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("service mutations round-trip dates, price, photos and check list items", async () => {
    const manager = await seed.seedManager();
    const condo = await seed.seedCondominium([manager.id]);
    const staff = await seed.seedStaff();

    const service = await execute(
      `mutation ($input: CreateServiceInput!) {
        createService(input: $input) { id startDate endDate price status condominium { id } staff { id } }
      }`,
      {
        input: {
          condominiumId: condo.id, staffId: staff.id, description: "Fix roof",
          startDate: "2026-01-31", endDate: "2026-02-01", status: "pending", price: 10.5,
        },
      },
      token,
    );
    expect(service.errors).toBeUndefined();
    expect(service.data?.createService).toEqual({
      id: expect.any(String), startDate: "2026-01-31", endDate: "2026-02-01", price: 10.5, status: "pending",
      condominium: { id: condo.id }, staff: { id: staff.id },
    });
    const serviceId = service.data?.createService.id;

    const photo = await execute(
      `mutation ($input: CreatePhotoServiceInput!) { createPhotoService(input: $input) { id photoUrl } }`,
      { input: { serviceId, photoUrl: "https://img.test/roof.jpg" } },
      token,
    );
    expect(photo.errors).toBeUndefined();

    const list = await execute(
      `mutation ($input: CreateCheckListInput!) { createCheckList(input: $input) { id description items { id } } }`,
      { input: { serviceId, description: "Roof" } },
      token,
    );
    expect(list.errors).toBeUndefined();
    expect(list.data?.createCheckList.items).toEqual([]);

    const item = await execute(
      `mutation ($input: CreateCheckListItemInput!) { createCheckListItem(input: $input) { description completed } }`,
      { input: { checkListId: list.data?.createCheckList.id, description: "Replace tiles" } },
      token,
    );
    expect(item.data?.createCheckListItem).toEqual({ description: "Replace tiles", completed: false });

    const fetched = await execute(
      `query ($id: ID!) { service(id: $id) { photos { photoUrl } checkLists { items { description } } } }`,
      { id: serviceId },
      token,
    );
    expect(fetched.data?.service).toEqual({
      photos: [{ photoUrl: "https://img.test/roof.jpg" }],
      checkLists: [{ items: [{ description: "Replace tiles" }] }],
    });

    const viaStaff = await execute(
      `query ($userId: Int!) { staff(userId: $userId) { services { id } } }`,
      { userId: staff.user_id },
      token,
    );
    expect(viaStaff.data?.staff.services).toEqual([{ id: serviceId }]);
  });

  it("createService rejects invalid dates and negative prices", async () => {
    const mutation = `mutation ($input: CreateServiceInput!) { createService(input: $input) { id } }`;
    const base = { condominiumId: 1, staffId: 1, description: "x", startDate: "2026-01-31", endDate: "2026-02-01", status: "pending", price: 1 };

    for (const input of [{ ...base, startDate: "31/01/2026" }, { ...base, price: -1 }]) {
      const result = await execute(mutation, { input }, token);
      expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
    }
  });

  it("rejects queries deeper than the maximum depth", async () => {
    const deep = `{ condominiums { services { staff { services { staff { services { staff { services { staff { id } } } } } } } } } }`;

    const result = await execute(deep, {}, token);

    expect(result.errors?.[0].message).toMatch(/exceeds maximum operation depth/);
  });
});
