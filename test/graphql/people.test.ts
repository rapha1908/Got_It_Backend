import { beforeEach, describe, expect, it } from "vitest";
import * as seed from "../helpers/factories";
import { execute, tokenFor } from "../helpers/graphql";
import { resetDb } from "../helpers/reset-db";

describe("managers, staff and skills", () => {
  let token: string;

  beforeEach(async () => {
    await resetDb();
    token = tokenFor(await seed.seedUser());
  });

  it("createManager and manager(userId) with nested user", async () => {
    const user = await seed.seedUser({ email: "ana@test.com" });

    const created = await execute(
      `mutation ($input: CreateManagerInput!) { createManager(input: $input) { id userId name phone nif } }`,
      { input: { userId: user.id, name: "Ana Manager", phone: "910000000", nif: "123456789" } },
      token,
    );
    expect(created.errors).toBeUndefined();
    expect(created.data?.createManager).toEqual({
      id: expect.any(Number), userId: user.id, name: "Ana Manager", phone: "910000000", nif: "123456789",
    });

    const found = await execute(
      `query ($userId: Int!) { manager(userId: $userId) { name user { email manager { name } staff { id } } } }`,
      { userId: user.id },
      token,
    );
    expect(found.errors).toBeUndefined();
    expect(found.data?.manager).toEqual({
      name: "Ana Manager",
      user: { email: "ana@test.com", manager: { name: "Ana Manager" }, staff: null },
    });
  });

  it("manager(userId) for an unknown user returns NOT_FOUND", async () => {
    const result = await execute(`{ manager(userId: 999) { id } }`, {}, token);
    expect(result.errors?.[0].extensions?.code).toBe("NOT_FOUND");
  });

  it("createManager rejects empty fields with BAD_USER_INPUT", async () => {
    const user = await seed.seedUser();
    const result = await execute(
      `mutation ($input: CreateManagerInput!) { createManager(input: $input) { id } }`,
      { input: { userId: user.id, name: "", phone: "1", nif: "1" } },
      token,
    );
    expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("createStaff, createSkill and addSkillToStaff return the staff with its skills", async () => {
    const user = await seed.seedUser({ type: "Staff" });

    const staff = await execute(
      `mutation ($input: CreateStaffInput!) { createStaff(input: $input) { id name skills { id } } }`,
      { input: { userId: user.id, name: "Bruno", phone: "920000000", nif: "987654321" } },
      token,
    );
    expect(staff.errors).toBeUndefined();
    expect(staff.data?.createStaff.skills).toEqual([]);
    const staffId = staff.data?.createStaff.id;

    const skill = await execute(
      `mutation ($input: CreateSkillInput!) { createSkill(input: $input) { id name } }`,
      { input: { name: "Plumbing" } },
      token,
    );
    expect(skill.data?.createSkill).toEqual({ id: expect.any(Number), name: "Plumbing" });

    const added = await execute(
      `mutation ($input: AddSkillToStaffInput!) { addSkillToStaff(input: $input) { id skills { name } user { id } } }`,
      { input: { staffId, skillId: skill.data?.createSkill.id } },
      token,
    );
    expect(added.errors).toBeUndefined();
    expect(added.data?.addSkillToStaff).toEqual({ id: staffId, skills: [{ name: "Plumbing" }], user: { id: user.id } });
  });

  it("staff(userId) returns [] skills when the staff has none", async () => {
    const staff = await seed.seedStaff();
    const result = await execute(
      `query ($userId: Int!) { staff(userId: $userId) { id skills { id } } }`,
      { userId: staff.user_id },
      token,
    );
    expect(result.errors).toBeUndefined();
    expect(result.data?.staff).toEqual({ id: staff.id, skills: [] });
  });

  it("addSkillToStaff twice returns BAD_USER_INPUT 'Resource already exists'", async () => {
    const staff = await seed.seedStaff();
    const skill = await seed.seedSkill();
    const mutation = `mutation ($input: AddSkillToStaffInput!) { addSkillToStaff(input: $input) { id } }`;
    const input = { staffId: staff.id, skillId: skill.id };

    await execute(mutation, { input }, token);
    const result = await execute(mutation, { input }, token);

    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Resource already exists", extensions: expect.objectContaining({ code: "BAD_USER_INPUT" }) }),
    );
  });

  it("addSkillToStaff with an unknown skill returns BAD_USER_INPUT 'Related resource not found'", async () => {
    const staff = await seed.seedStaff();
    const result = await execute(
      `mutation ($input: AddSkillToStaffInput!) { addSkillToStaff(input: $input) { id } }`,
      { input: { staffId: staff.id, skillId: 999 } },
      token,
    );
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Related resource not found", extensions: expect.objectContaining({ code: "BAD_USER_INPUT" }) }),
    );
  });

  it.each([
    [`{ manager(userId: 1) { id } }`],
    [`{ staff(userId: 1) { id } }`],
    [`mutation { createSkill(input: { name: "X" }) { id } }`],
    [`mutation { createManager(input: { userId: 1, name: "a", phone: "b", nif: "c" }) { id } }`],
    [`mutation { createStaff(input: { userId: 1, name: "a", phone: "b", nif: "c" }) { id } }`],
    [`mutation { addSkillToStaff(input: { staffId: 1, skillId: 1 }) { id } }`],
  ])("%s without a token returns UNAUTHENTICATED", async (operation) => {
    const result = await execute(operation);
    expect(result.errors?.[0].extensions?.code).toBe("UNAUTHENTICATED");
  });
});
