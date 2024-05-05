const config = await fetch("./config.json").then((response) => response.json());

export const APIConfig = {
  API: {
    endpoints: [
      {
        name: "appApi",
        endpoint: config.apiUrl,
      },
      {
        name: "authApi",
        endpoint: config.authUrl,
      },
    ],
  },
};
