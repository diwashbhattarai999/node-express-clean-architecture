export interface UploadFileDto {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}
