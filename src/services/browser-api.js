function createDevelopmentApi() {
  const localState = {};
  const profile = {
    name: "Sam Rivera",
    headline: "Engineering Lead at Example Labs",
    fullText: "Sam builds reliable distributed systems for climate data.",
    extractedCharacters: 56,
  };

  return {
    storage: {
      local: {
        async get(key) {
          if (Array.isArray(key)) {
            return Object.fromEntries(
              key.map((item) => [item, localState[item]]),
            );
          }
          return { [key]: localState[key] };
        },
        async set(value) {
          Object.assign(localState, value);
        },
        async remove(keys) {
          for (const key of keys) delete localState[key];
        },
      },
    },
    tabs: {
      async query() {
        return [{ id: 1, url: "https://www.linkedin.com/in/sam-rivera/" }];
      },
      async sendMessage() {
        return { success: true, data: profile };
      },
    },
    scripting: {
      async executeScript() {},
    },
  };
}

export function getBrowserApi(globalObject = globalThis) {
  if (globalObject.chrome?.storage?.local && globalObject.chrome?.tabs) {
    return globalObject.chrome;
  }
  if (
    import.meta.env.DEV &&
    (globalObject.location?.hostname === "127.0.0.1" ||
      globalObject.location?.hostname === "localhost")
  ) {
    return createDevelopmentApi();
  }
  throw new Error(
    "Chrome extension APIs are unavailable. Load the production build as an unpacked extension.",
  );
}
