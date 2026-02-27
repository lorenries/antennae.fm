declare module "icy" {
  type IcyResponse = NodeJS.ReadableStream & {
    on(event: "metadata", listener: (data: Buffer) => void): IcyResponse;
    on(event: "data", listener: (data: Buffer) => void): IcyResponse;
    on(event: "error" | "end" | "close", listener: () => void): IcyResponse;
  };

  function get(url: string, callback: (res: IcyResponse) => void): void;

  function parse(data: Buffer): {
    StreamTitle?: string;
    [key: string]: string | undefined;
  };

  const icy: {
    get: typeof get;
    parse: typeof parse;
  };

  export { get, parse, IcyResponse };
  export default icy;
}
