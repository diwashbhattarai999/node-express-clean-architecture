export interface UploadFileResultDto {
  key: string;
  contentType: string;
  size: number;
  publicUrl: string | null;
  signedUrl: string | null;
}
