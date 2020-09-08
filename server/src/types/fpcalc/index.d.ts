import { Stream } from "stream";

declare module "fpcalc" {
  export default function (
    file: string | Stream,
    options: { length?: number; raw?: boolean; command?: string },
    callback: (data: any) => void
  ): void;
}
