import { APIConfig } from "../config";

export const getTodos = () => {
  return fetch(`${APIConfig.API.endpoints[0].endpoint}todos`)
    .then((res) => res.json())
    .then((json) => {
      return  json ;
    });
};

export const getToken = () => {
  return fetch(`${APIConfig.API.endpoints[1].endpoint}auth/signin`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: "userA", password: "passwA!1" }),
  })
    .then((res) => res.json())
    .then((json) => {
      return json;
    });
};

export const getMovies = () => {
  return fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${
      import.meta.env.VITE_TMDB_KEY
    }&language=en-US&include_adult=false&page=1`
  )
    .then((res) => res.json())
    .then((json) => json.results);
};
export const getUpcomingMovies = () => {
  return fetch(
    `https://api.themoviedb.org/3/movie/upcoming?api_key=${
      import.meta.env.VITE_TMDB_KEY
    }&&language=en-US&page=1`
  )
    .then((res) => res.json())
    .then((json) => json.results);
};


// .... Other TMDB endpoint fetch methods ......