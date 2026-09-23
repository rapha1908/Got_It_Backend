import { ApolloServerPlugin } from "@apollo/server";
import { FragmentDefinitionNode, GraphQLError, Kind, SelectionSetNode } from "graphql";
import { Context } from "./context";

// Root fields that set `skipTypeScopes: true`; keep both in sync.
export const PUBLIC_ROOT_FIELDS = new Set(["login", "createUser"]);

function rootFieldNames(
  selectionSet: SelectionSetNode,
  fragments: Record<string, FragmentDefinitionNode>,
): string[] {
  return selectionSet.selections.flatMap((selection) => {
    if (selection.kind === Kind.FIELD) return [selection.name.value];
    if (selection.kind === Kind.INLINE_FRAGMENT) return rootFieldNames(selection.selectionSet, fragments);
    const fragment = fragments[selection.name.value];
    return fragment ? rootFieldNames(fragment.selectionSet, fragments) : [];
  });
}

// Pothos runs argument validation before scope-auth, so anonymous callers would otherwise get
// BAD_USER_INPUT from protected fields. Rejecting the operation up front keeps auth first.
export const authGuardPlugin: ApolloServerPlugin<Context> = {
  async requestDidStart() {
    return {
      async didResolveOperation({ contextValue, operation, document }) {
        if (contextValue.userId !== null) {
          return;
        }

        const fragments = Object.fromEntries(
          document.definitions
            .filter((definition): definition is FragmentDefinitionNode => definition.kind === Kind.FRAGMENT_DEFINITION)
            .map((fragment) => [fragment.name.value, fragment]),
        );

        const isProtected = rootFieldNames(operation.selectionSet, fragments).some(
          (name) => !name.startsWith("__") && !PUBLIC_ROOT_FIELDS.has(name),
        );

        if (isProtected) {
          throw new GraphQLError("Not authenticated", { extensions: { code: "UNAUTHENTICATED" } });
        }
      },
    };
  },
};
