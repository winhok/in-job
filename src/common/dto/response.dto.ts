export class ResponseDto<T = unknown> {
  success!: boolean;
  data?: T;
  message?: string;

  constructor(partial: Partial<ResponseDto<T>>) {
    Object.assign(this, partial);
  }
}
