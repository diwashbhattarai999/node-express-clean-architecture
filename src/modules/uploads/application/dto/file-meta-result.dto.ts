export interface FileMetaResultDto {
  key: string;
  exists: boolean;
  publicUrl: string | null;
  signedUrl: string | null;
}
