import knex from "knex";

export async function saveNetworkLog(
  dbClient: string,
  dbUrl: string,
  payload: unknown
) {
  const knexClient = knex({ client: dbClient, connection: dbUrl });
  await knexClient("gg_be_core_external_calls")
    .insert(payload)
    .then(() => console.log("External Call logged."))
    .catch((error) =>
      console.error(`External Call log failed. ${JSON.stringify(error)}`)
    );
}
