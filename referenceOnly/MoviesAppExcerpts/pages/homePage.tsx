import React, { useState, useEffect } from "react";
import PageTemplate from "../components/templateMovieListPage";
import { getMovies } from "../api/tmdb-api";
import useFiltering from "../hooks/useFiltering";
import MovieFilterUI, {
  titleFilter,
  genreFilter,
} from "../components/movieFilterUI";
import { ListedMovie } from "../types/interfaces";
import { getTodos, getToken} from '../api/tmdb-api'  // NEW
 
const titleFiltering = {
  name: "title",
  value: "",
  condition: titleFilter,
};
const genreFiltering = {
  name: "genre",
  value: "0",
  condition: genreFilter,
};

  const HomePage: React.FC= () => {
    const [movies, setMovies] = useState<ListedMovie[]>([]);
    const favourites = movies.filter(m => m.favourite)
    const { filterValues, setFilterValues, filterFunction } = useFiltering(
      [],
      [titleFiltering, genreFiltering]
    );

    // Access AWS-hosted backend
    useEffect(() => {
      getTodos().then( (res: any) => {
        console.log('Response from App Backend', res)
      });
    }, []);

    useEffect(() => {
      getToken().then( (res: any) => {
        console.log('Response from Auth Backend', res)

      });
    }, []);
    
    localStorage.setItem('favourites', JSON.stringify(favourites))
    // New function
  const addToFavourites = (movieId: number) => {
    const updatedMovies = movies.map((m: ListedMovie) =>
      m.id === movieId ? { ...m, favourite: true } : m
    );
    setMovies(updatedMovies);
  };
  
  const changeFilterValues = (type: string, value: string) => {
    const changedFilter = { name: type, value: value };
    const updatedFilterSet =
      type === "title"
        ? [changedFilter, filterValues[1]]
        : [filterValues[0], changedFilter];
    setFilterValues(updatedFilterSet);
  };

  useEffect(() => {
    getMovies().then(movies => {
      setMovies(movies);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const displayedMovies = filterFunction(movies);
    return (
      <>
      <PageTemplate
        title="Discover Movies"
        movies={displayedMovies}
        selectFavourite={addToFavourites}
      />
      <MovieFilterUI
        onFilterValuesChange={changeFilterValues}
        titleFilter={filterValues[0].value}
        genreFilter={filterValues[1].value}
      />
    </>
  );
};
export default HomePage;