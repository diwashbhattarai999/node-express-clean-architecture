import type { ListSessionsDto } from "@/modules/auth/application/dto/list-sessions.dto";
import type {
  AuthSessionSummary,
  IAuthAccountRepository,
} from "@/modules/auth/application/ports/auth-account.repository";
import type { PaginatedResult } from "@/shared/kernel/pagination/paginated-result";

export type ListSessionsInput = {
  userId: string;
  currentSessionId: string;
  query: ListSessionsDto;
};

export class ListSessionsUseCase {
  public constructor(private readonly authAccountRepository: IAuthAccountRepository) {}

  public async execute(input: ListSessionsInput): Promise<PaginatedResult<AuthSessionSummary>> {
    return this.authAccountRepository.listSessionsForUser({
      userId: input.userId,
      currentSessionId: input.currentSessionId,
      includeRevoked: input.query.includeRevoked,
      page: input.query.page,
      limit: input.query.limit,
    });
  }
}
