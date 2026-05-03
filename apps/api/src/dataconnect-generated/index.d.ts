import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Chat_Key {
  id: UUIDString;
  __typename?: 'Chat_Key';
}

export interface CreateUserAccountData {
  user_insert: User_Key;
}

export interface CreateUserAccountVariables {
  username: string;
  phoneNumber: string;
  displayName?: string | null;
  profilePictureUrl?: string | null;
  pushNotificationToken?: string | null;
}

export interface GetChatMessagesData {
  messages: ({
    id: UUIDString;
    content: string;
    type: string;
    mediaUrl?: string | null;
    sentAt: TimestampString;
    sender: {
      id: UUIDString;
      displayName?: string | null;
      username: string;
      profilePictureUrl?: string | null;
    } & User_Key;
  } & Message_Key)[];
}

export interface GetChatMessagesVariables {
  chatId: UUIDString;
}

export interface GetMyProfileData {
  user?: {
    id: UUIDString;
    username: string;
    displayName?: string | null;
    profilePictureUrl?: string | null;
    phoneNumber: string;
    createdAt: TimestampString;
    lastOnlineAt: TimestampString;
    pushNotificationToken?: string | null;
  } & User_Key;
}

export interface Membership_Key {
  userId: UUIDString;
  chatId: UUIDString;
  __typename?: 'Membership_Key';
}

export interface MessageStatus_Key {
  messageId: UUIDString;
  recipientId: UUIDString;
  __typename?: 'MessageStatus_Key';
}

export interface Message_Key {
  id: UUIDString;
  __typename?: 'Message_Key';
}

export interface SendChatMessageData {
  message_insert: Message_Key;
}

export interface SendChatMessageVariables {
  chatId: UUIDString;
  content: string;
  type: string;
  mediaUrl?: string | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserAccountRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserAccountVariables): MutationRef<CreateUserAccountData, CreateUserAccountVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserAccountVariables): MutationRef<CreateUserAccountData, CreateUserAccountVariables>;
  operationName: string;
}
export const createUserAccountRef: CreateUserAccountRef;

export function createUserAccount(vars: CreateUserAccountVariables): MutationPromise<CreateUserAccountData, CreateUserAccountVariables>;
export function createUserAccount(dc: DataConnect, vars: CreateUserAccountVariables): MutationPromise<CreateUserAccountData, CreateUserAccountVariables>;

interface GetMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProfileData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyProfileData, undefined>;
  operationName: string;
}
export const getMyProfileRef: GetMyProfileRef;

export function getMyProfile(options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;
export function getMyProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;

interface SendChatMessageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SendChatMessageVariables): MutationRef<SendChatMessageData, SendChatMessageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SendChatMessageVariables): MutationRef<SendChatMessageData, SendChatMessageVariables>;
  operationName: string;
}
export const sendChatMessageRef: SendChatMessageRef;

export function sendChatMessage(vars: SendChatMessageVariables): MutationPromise<SendChatMessageData, SendChatMessageVariables>;
export function sendChatMessage(dc: DataConnect, vars: SendChatMessageVariables): MutationPromise<SendChatMessageData, SendChatMessageVariables>;

interface GetChatMessagesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetChatMessagesVariables): QueryRef<GetChatMessagesData, GetChatMessagesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetChatMessagesVariables): QueryRef<GetChatMessagesData, GetChatMessagesVariables>;
  operationName: string;
}
export const getChatMessagesRef: GetChatMessagesRef;

export function getChatMessages(vars: GetChatMessagesVariables, options?: ExecuteQueryOptions): QueryPromise<GetChatMessagesData, GetChatMessagesVariables>;
export function getChatMessages(dc: DataConnect, vars: GetChatMessagesVariables, options?: ExecuteQueryOptions): QueryPromise<GetChatMessagesData, GetChatMessagesVariables>;

