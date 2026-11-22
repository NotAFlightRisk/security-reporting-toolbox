declare global {
  namespace App {
    interface Error {
      /** the page's code never arrived, usually because the connection dropped */
      unloaded?: boolean;
    }
  }
}

export {};
