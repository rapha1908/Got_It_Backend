import { describe, expect, it } from "vitest";
import { orderByKeys, orderByKeysOrError } from "@/graphql/utils/order-by-keys";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";

const rows = [{ id: 3 }, { id: 1 }];

describe("orderByKeys", () => {
  it("returns rows in key order with null for missing keys", () => {
    expect(orderByKeys([1, 2, 3], rows, (row) => row.id)).toEqual([{ id: 1 }, null, { id: 3 }]);
  });

  it("orderByKeysOrError returns ResourceNotFoundError for missing keys", () => {
    const result = orderByKeysOrError([1, 2], rows, (row) => row.id);
    expect(result[0]).toEqual({ id: 1 });
    expect(result[1]).toBeInstanceOf(ResourceNotFoundError);
  });
});
