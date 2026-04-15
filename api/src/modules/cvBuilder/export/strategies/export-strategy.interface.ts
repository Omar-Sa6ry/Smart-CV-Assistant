export interface ICvExportStrategy {
  export(cvData: any): Promise<Buffer | string>;
}
