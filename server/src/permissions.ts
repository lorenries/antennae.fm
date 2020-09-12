import { rule, shield } from "graphql-shield";
import { getUserId, isAdmin } from "./utils";

const rules = {
  isAuthenticatedUser: rule()((parent, args, context) => {
    const userId = getUserId(context);
    return Boolean(userId);
  }),
  isAdmin: rule()((parent, args, context) => {
    return isAdmin(context);
  }),
};

const permissions = shield({
  Query: {
    streams: rules.isAuthenticatedUser,
    stats: rules.isAdmin,
  },
  Mutation: {
    addStream: rules.isAuthenticatedUser,
  },
});

export default permissions;
