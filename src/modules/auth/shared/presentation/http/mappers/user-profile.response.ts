import type { AuthUserProfile } from "@/modules/auth/shared/application/types/auth.types";

export type UserProfileResponse = {
  firstName: string | null;
  lastName: string | null;
  locale: string | null;
  timezone: string | null;
  bio: string | null;
};

export const toUserProfileResponse = (profile: AuthUserProfile): UserProfileResponse => ({
  firstName: profile.firstName,
  lastName: profile.lastName,
  locale: profile.locale,
  timezone: profile.timezone,
  bio: profile.bio,
});
