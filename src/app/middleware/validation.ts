/**
 * Re-export HTTP validation helpers from shared.
 * Prefer importing from `@/shared/http/validation` in new module code.
 */
export {
  asHandler,
  asRequestHandler,
  type HttpController,
  type PlainHttpController,
  type ValidatedRequest,
  type ValidatedRequestHandler,
  validate,
} from "@/shared/http/validation";
