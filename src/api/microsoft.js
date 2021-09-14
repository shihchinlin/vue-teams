import { PageIterator } from "@microsoft/microsoft-graph-client";

import { client } from "../msal-services";

export const getUser = async (id = null) => {
  if (id) return await client.api(`/users/${id}`).get();
  else return await client.api("/me").get();
};

export const refreshPresences = async ids => {
  return await client
    .api("/communications/getPresencesByUserId")
    .version("beta")
    .post({ ids });
};

export const getTeam = async teamId => {
  return await client.api(`/teams/${teamId}`).get();
};

export const searchTeamsByName = async teamNameRegExp => {
  const teams = await client
    .api(`/me/joinedTeams`)
    .get()
    .then(res => res.value);
  return teams.filter(e => teamNameRegExp.test(e.displayName));
};

export const getChannel = async (teamId, channelId) => {
  return await client.api(`/teams/${teamId}/channels/${channelId}`).get();
};

export const searchTeamChannelsByName = async (
  teamNameRegExp,
  channelNameRegExp
) => {
  const foundTeams = await searchTeamsByName(teamNameRegExp);
  if (foundTeams.length) {
    var foundTeamChannels = [];
    for (var foundTeam of foundTeams) {
      const channels = await client
        .api(`/teams/${foundTeam.id}/channels`)
        .get()
        .then(res => res.value);
      const foundChannels = channels.filter(e =>
        channelNameRegExp.test(e.displayName)
      );
      foundChannels.forEach(foundChannel => {
        foundTeamChannels.push({ team: foundTeam, channel: foundChannel });
      });
    }
    return foundTeamChannels;
  } else return [];
};

export const listChannelMembers = async (teamId, channelId) => {
  return await client
    .api(`/teams/${teamId}/channels/${channelId}/members`)
    .version("beta")
    .get()
    .then(res => res.value);
};

export const listChannelMessagesIterator = async (
  teamId,
  channelId,
  callback
) => {
  let res = await client
    .api(`/teams/${teamId}/channels/${channelId}/messages`)
    .version("beta")
    .get();
  let pageIterator = new PageIterator(client, res, callback);
  pageIterator.iterate();
  return pageIterator;
};

export const listChannelMessages = async (teamId, channelId, top = null) => {
  return await client
    .api(
      `/teams/${teamId}/channels/${channelId}/messages` +
        (top ? `?$top=${top}` : "")
    )
    .version("beta")
    .get()
    .then(res => res.value);
};

export const getMessage = async (teamId, channelId, messageId) => {
  return await client
    .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}`)
    .version("beta")
    .get();
};

export const listMessageReplies = async (teamId, channelId, messageId) => {
  return await client
    .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`)
    .version("beta")
    .get()
    .then(res => res.value);
};

export const getHostedContent = async uri => {
  const endpoint = uri.replace("https://graph.microsoft.com/beta", "");
  return await client
    .api(endpoint)
    .version("beta")
    .get();
};

export const sendMessage = async (teamId, channelId, message) => {
  return await client
    .api(`/teams/${teamId}/channels/${channelId}/messages`)
    .post(message);
};

export const replyToMessage = async (teamId, channelId, messageId, message) => {
  return await client
    .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`)
    .post(message);
};

export const getEvent = async id => {
  return await client.api(`/me/events/${id}`).get();
};

export const createEvent = async payload => {
  return await client.api("/me/events").post(payload);
};

export const updateEvent = async (id, payload) => {
  return await client.api(`/me/events/${id}`).patch(payload);
};

export const cancelEvent = async (id, payload = {}) => {
  return await client.api(`/me/events/${id}/cancel`).post(payload);
};
