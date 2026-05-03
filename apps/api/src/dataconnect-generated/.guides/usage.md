# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUserAccount, getMyProfile, sendChatMessage, getChatMessages } from '@dataconnect/generated';


// Operation CreateUserAccount:  For variables, look at type CreateUserAccountVars in ../index.d.ts
const { data } = await CreateUserAccount(dataConnect, createUserAccountVars);

// Operation GetMyProfile: 
const { data } = await GetMyProfile(dataConnect);

// Operation SendChatMessage:  For variables, look at type SendChatMessageVars in ../index.d.ts
const { data } = await SendChatMessage(dataConnect, sendChatMessageVars);

// Operation GetChatMessages:  For variables, look at type GetChatMessagesVars in ../index.d.ts
const { data } = await GetChatMessages(dataConnect, getChatMessagesVars);


```