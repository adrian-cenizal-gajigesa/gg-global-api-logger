import type knex from "knex";

export async function saveNetworkLog(knexClient: knex.Knex, payload: unknown) {
  await knexClient("gg_be_core_external_calls")
    .insert(payload)
    .then(() => console.log({ "External Call logged: ": payload }))
    .catch((error) =>
      console.error(`External Call log failed. ${JSON.stringify(error)}`)
    );
}
