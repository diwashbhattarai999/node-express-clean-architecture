/**
 * Valid Argon2id hash used when no credential exists, so compare timing
 * does not leak whether the identifier was found.
 */
export const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,p=4,t=3$Fa4jFMAWbKOOuyHXadW7+g$FU3geDzk8zFsXWqInxFSP8BiIlwl7YA5ogRxS6XxBLM";
