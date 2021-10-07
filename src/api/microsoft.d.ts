import {
  PageIteratorCallback,
  PageIterator
} from "@microsoft/microsoft-graph-client";

export const getUser: (id?: string) => Promise<any>;

export const refreshPresences: (ids: string[]) => Promise<any>;

export const getTeam: (teamId: string) => Promise<any>;

export const searchTeamsByName: (teamNameRegExp: RegExp) => Promise<any>;

export const getChannel: (teamId: string, channelId: string) => Promise<any>;

export const searchTeamChannelsByName: (
  teamNameRegExp: RegExp,
  channelNameRegExp: RegExp
) => Promise<any>;

export const listChannelMembers: (
  teamId: string,
  channelId: string
) => Promise<any>;

export const listChannelMessagesIterator: (
  teamId: string,
  channelId: string,
  callback: PageIteratorCallback
) => Promise<PageIterator>;

export const listChannelMessages: (
  teamId: string,
  channelId: string,
  top?: number
) => Promise<any>;

export const getMessage: (
  teamId: string,
  channelId: string,
  messageId: string
) => Promise<any>;

export const listMessageReplies: (
  teamId: string,
  channelId: string,
  messageId: string
) => Promise<any>;

export const getHostedContent: (uri: string) => Promise<any>;

export const sendMessage: (
  teamId: string,
  channelId: string,
  message: string
) => Promise<any>;

export const replyToMessage: (
  teamId: string,
  channelId: string,
  messageId: string,
  message: string
) => Promise<any>;

export const getEvent: (id: string) => Promise<any>;

export const createEvent: (payload: any) => Promise<any>;

export const updateEvent: (id: string, payload: any) => Promise<any>;

export const cancelEvent: (
  id: string,
  payload: { comment: string }
) => Promise<any>;

export const getOnlineMeetingByUrl: (url: string) => Promise<any>;

export const updateOnlineMeeting: (id: string, payload: any) => Promise<any>;
