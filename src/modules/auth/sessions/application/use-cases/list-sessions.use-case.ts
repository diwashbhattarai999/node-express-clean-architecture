import type { ListSessionsDto } from "@/modules/auth/sessions/application/dto/list-sessions.dto";
import type {
  AuthSessionSummary,
  ISessionRepository,
} from "@/modules/auth/sessions/application/ports/session.repository";
import type { PaginatedResult } from "@/shared/kernel/pagination/paginated-result";

export type ListSessionsInput = {
  userId: string;
  currentSessionId: string;
  query: ListSessionsDto;
};

export class ListSessionsUseCase {
  public constructor(private readonly sessionRepository: ISessionRepository) {}

  public async execute(input: ListSessionsInput): Promise<PaginatedResult<AuthSessionSummary>> {
    return this.sessionRepository.listSessionsForUser({
      userId: input.userId,
      currentSessionId: input.currentSessionId,
      includeRevoked: input.query.includeRevoked,
      page: input.query.page,
      limit: input.query.limit,
    });
  }
}
