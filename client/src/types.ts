export type Entry = {
  name: string;
  isDir: boolean;
  size: number;
  mtime: number;
};

export type DirListing = {
  root: string; // '/'
  path: string; // '/a/b'
  entries: Entry[];
};

