declare module "icy" {
  import { ServerResponse } from "http";
  export interface IcyResponse extends ServerResponse {}
  export function get(url: string, cb: (res: IcyResponse) => void): void;
  export function parse(
    metadata: Buffer | string
  ): { StreamTitle: string | undefined; StreamUrl: string | undefined };
}
