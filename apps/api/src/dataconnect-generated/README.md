# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyProfile*](#getmyprofile)
  - [*GetChatMessages*](#getchatmessages)
- [**Mutations**](#mutations)
  - [*CreateUserAccount*](#createuseraccount)
  - [*SendChatMessage*](#sendchatmessage)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyProfile
You can execute the `GetMyProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyProfile(options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;

interface GetMyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProfileData, undefined>;
}
export const getMyProfileRef: GetMyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;

interface GetMyProfileRef {
  ...
  (dc: DataConnect): QueryRef<GetMyProfileData, undefined>;
}
export const getMyProfileRef: GetMyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyProfileRef:
```typescript
const name = getMyProfileRef.operationName;
console.log(name);
```

### Variables
The `GetMyProfile` query has no variables.
### Return Type
Recall that executing the `GetMyProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetMyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyProfile } from '@dataconnect/generated';


// Call the `getMyProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyProfile();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyProfile(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getMyProfile().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetMyProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyProfileRef } from '@dataconnect/generated';


// Call the `getMyProfileRef()` function to get a reference to the query.
const ref = getMyProfileRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyProfileRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## GetChatMessages
You can execute the `GetChatMessages` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getChatMessages(vars: GetChatMessagesVariables, options?: ExecuteQueryOptions): QueryPromise<GetChatMessagesData, GetChatMessagesVariables>;

interface GetChatMessagesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetChatMessagesVariables): QueryRef<GetChatMessagesData, GetChatMessagesVariables>;
}
export const getChatMessagesRef: GetChatMessagesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getChatMessages(dc: DataConnect, vars: GetChatMessagesVariables, options?: ExecuteQueryOptions): QueryPromise<GetChatMessagesData, GetChatMessagesVariables>;

interface GetChatMessagesRef {
  ...
  (dc: DataConnect, vars: GetChatMessagesVariables): QueryRef<GetChatMessagesData, GetChatMessagesVariables>;
}
export const getChatMessagesRef: GetChatMessagesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getChatMessagesRef:
```typescript
const name = getChatMessagesRef.operationName;
console.log(name);
```

### Variables
The `GetChatMessages` query requires an argument of type `GetChatMessagesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetChatMessagesVariables {
  chatId: UUIDString;
}
```
### Return Type
Recall that executing the `GetChatMessages` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetChatMessagesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetChatMessages`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getChatMessages, GetChatMessagesVariables } from '@dataconnect/generated';

// The `GetChatMessages` query requires an argument of type `GetChatMessagesVariables`:
const getChatMessagesVars: GetChatMessagesVariables = {
  chatId: ..., 
};

// Call the `getChatMessages()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getChatMessages(getChatMessagesVars);
// Variables can be defined inline as well.
const { data } = await getChatMessages({ chatId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getChatMessages(dataConnect, getChatMessagesVars);

console.log(data.messages);

// Or, you can use the `Promise` API.
getChatMessages(getChatMessagesVars).then((response) => {
  const data = response.data;
  console.log(data.messages);
});
```

### Using `GetChatMessages`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getChatMessagesRef, GetChatMessagesVariables } from '@dataconnect/generated';

// The `GetChatMessages` query requires an argument of type `GetChatMessagesVariables`:
const getChatMessagesVars: GetChatMessagesVariables = {
  chatId: ..., 
};

// Call the `getChatMessagesRef()` function to get a reference to the query.
const ref = getChatMessagesRef(getChatMessagesVars);
// Variables can be defined inline as well.
const ref = getChatMessagesRef({ chatId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getChatMessagesRef(dataConnect, getChatMessagesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.messages);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.messages);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUserAccount
You can execute the `CreateUserAccount` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUserAccount(vars: CreateUserAccountVariables): MutationPromise<CreateUserAccountData, CreateUserAccountVariables>;

interface CreateUserAccountRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserAccountVariables): MutationRef<CreateUserAccountData, CreateUserAccountVariables>;
}
export const createUserAccountRef: CreateUserAccountRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUserAccount(dc: DataConnect, vars: CreateUserAccountVariables): MutationPromise<CreateUserAccountData, CreateUserAccountVariables>;

interface CreateUserAccountRef {
  ...
  (dc: DataConnect, vars: CreateUserAccountVariables): MutationRef<CreateUserAccountData, CreateUserAccountVariables>;
}
export const createUserAccountRef: CreateUserAccountRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserAccountRef:
```typescript
const name = createUserAccountRef.operationName;
console.log(name);
```

### Variables
The `CreateUserAccount` mutation requires an argument of type `CreateUserAccountVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateUserAccountVariables {
  username: string;
  phoneNumber: string;
  displayName?: string | null;
  profilePictureUrl?: string | null;
  pushNotificationToken?: string | null;
}
```
### Return Type
Recall that executing the `CreateUserAccount` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserAccountData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserAccountData {
  user_insert: User_Key;
}
```
### Using `CreateUserAccount`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUserAccount, CreateUserAccountVariables } from '@dataconnect/generated';

// The `CreateUserAccount` mutation requires an argument of type `CreateUserAccountVariables`:
const createUserAccountVars: CreateUserAccountVariables = {
  username: ..., 
  phoneNumber: ..., 
  displayName: ..., // optional
  profilePictureUrl: ..., // optional
  pushNotificationToken: ..., // optional
};

// Call the `createUserAccount()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUserAccount(createUserAccountVars);
// Variables can be defined inline as well.
const { data } = await createUserAccount({ username: ..., phoneNumber: ..., displayName: ..., profilePictureUrl: ..., pushNotificationToken: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUserAccount(dataConnect, createUserAccountVars);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUserAccount(createUserAccountVars).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUserAccount`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserAccountRef, CreateUserAccountVariables } from '@dataconnect/generated';

// The `CreateUserAccount` mutation requires an argument of type `CreateUserAccountVariables`:
const createUserAccountVars: CreateUserAccountVariables = {
  username: ..., 
  phoneNumber: ..., 
  displayName: ..., // optional
  profilePictureUrl: ..., // optional
  pushNotificationToken: ..., // optional
};

// Call the `createUserAccountRef()` function to get a reference to the mutation.
const ref = createUserAccountRef(createUserAccountVars);
// Variables can be defined inline as well.
const ref = createUserAccountRef({ username: ..., phoneNumber: ..., displayName: ..., profilePictureUrl: ..., pushNotificationToken: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserAccountRef(dataConnect, createUserAccountVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## SendChatMessage
You can execute the `SendChatMessage` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
sendChatMessage(vars: SendChatMessageVariables): MutationPromise<SendChatMessageData, SendChatMessageVariables>;

interface SendChatMessageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SendChatMessageVariables): MutationRef<SendChatMessageData, SendChatMessageVariables>;
}
export const sendChatMessageRef: SendChatMessageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
sendChatMessage(dc: DataConnect, vars: SendChatMessageVariables): MutationPromise<SendChatMessageData, SendChatMessageVariables>;

interface SendChatMessageRef {
  ...
  (dc: DataConnect, vars: SendChatMessageVariables): MutationRef<SendChatMessageData, SendChatMessageVariables>;
}
export const sendChatMessageRef: SendChatMessageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the sendChatMessageRef:
```typescript
const name = sendChatMessageRef.operationName;
console.log(name);
```

### Variables
The `SendChatMessage` mutation requires an argument of type `SendChatMessageVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SendChatMessageVariables {
  chatId: UUIDString;
  content: string;
  type: string;
  mediaUrl?: string | null;
}
```
### Return Type
Recall that executing the `SendChatMessage` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SendChatMessageData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SendChatMessageData {
  message_insert: Message_Key;
}
```
### Using `SendChatMessage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, sendChatMessage, SendChatMessageVariables } from '@dataconnect/generated';

// The `SendChatMessage` mutation requires an argument of type `SendChatMessageVariables`:
const sendChatMessageVars: SendChatMessageVariables = {
  chatId: ..., 
  content: ..., 
  type: ..., 
  mediaUrl: ..., // optional
};

// Call the `sendChatMessage()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await sendChatMessage(sendChatMessageVars);
// Variables can be defined inline as well.
const { data } = await sendChatMessage({ chatId: ..., content: ..., type: ..., mediaUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await sendChatMessage(dataConnect, sendChatMessageVars);

console.log(data.message_insert);

// Or, you can use the `Promise` API.
sendChatMessage(sendChatMessageVars).then((response) => {
  const data = response.data;
  console.log(data.message_insert);
});
```

### Using `SendChatMessage`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, sendChatMessageRef, SendChatMessageVariables } from '@dataconnect/generated';

// The `SendChatMessage` mutation requires an argument of type `SendChatMessageVariables`:
const sendChatMessageVars: SendChatMessageVariables = {
  chatId: ..., 
  content: ..., 
  type: ..., 
  mediaUrl: ..., // optional
};

// Call the `sendChatMessageRef()` function to get a reference to the mutation.
const ref = sendChatMessageRef(sendChatMessageVars);
// Variables can be defined inline as well.
const ref = sendChatMessageRef({ chatId: ..., content: ..., type: ..., mediaUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = sendChatMessageRef(dataConnect, sendChatMessageVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.message_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.message_insert);
});
```

