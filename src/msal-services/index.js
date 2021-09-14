export * from "./authConfig";
export * from "./authProvider";
/**
 * @type import("@microsoft/microsoft-graph-client").Client
 */
export let client;
export const setClient = _client => (client = _client);
