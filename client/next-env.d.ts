/// <reference types="next" />
/// <reference types="next/types/global" />

declare module "*.svg" {
  import { FunctionComponent, SVGProps } from "react";
  const ComponentName: FunctionComponent<SVGProps<HTMLOrSVGElement>>;
  export default ComponentName;
}
