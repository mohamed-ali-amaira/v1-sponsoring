import { SupabaseClient } from "@supabase/supabase-js";

import { User } from "../types";

export const findUser = async (
  client: SupabaseClient,
  code_1: string
): Promise<User | null> => {
  try {
    const { data: users, error } = await client
      .from("access-accounts-sponsoring")
      .select("*")
      .eq("code_1", code_1);

    // if error, throw error returning null & disabeling authentication for the users
    if (error) throw error;
    // if a number of users with the same code_1 exists return the same
    if (users && users.length > 0) {
      return users[0];
    }
    return null;
  } catch (error) {
    return null;
  }
};
