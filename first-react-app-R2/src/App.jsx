import MovieCard from "./Components/MovieCard.jsx";
import Search from "./Components/Search.jsx";
import Spinner from "./Components/spinner.jsx";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite.js";
import "./App.css";

const API_BASE_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY


const API_OPTIONS = {
  method: "GET",
  headers: {
  accept: "application/json",
  Authorization: `Bearer ${API_KEY}`
  },
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useDebounce(
    () => setDebouncedSearchTerm(searchTerm),
    500,
    [searchTerm]
  );

  const fetchMovies = async (query) => {
  setIsLoading(true);
  setErrorMessage("");

  try {
    const url = query
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
      : `${API_BASE_URL}/movie/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`;

    const res = await fetch(url, API_OPTIONS);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TMDB HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    const results = data.results || [];

    setMovieList(results);

    if(query && data.results.length > 0) {
      await updateSearchCount(query, data.results[0]);
    }


  } catch (err) {
    console.error(err);
    setMovieList([]);
    setErrorMessage(err.message || "Failed to fetch");
  } finally {
    setIsLoading(false);
  }
};

  const loadTrendingMovies = async () => {
    try{

      const movies = await getTrendingMovies();
      setTrendingMovies(movies);

    } catch(error) {
      console.error(`error fetching trending movies: ${error}`);
    }
  }


  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
  loadTrendingMovies();
}, []); 

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header style={{ color: "white" }}>
          <img src="./hero-img.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> you'll Enjoy Without The Hassle
          </h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
  <section className="trending">
    <h2>Trending Movies</h2>

    <ul>
      {trendingMovies.map((movie, index) => (
        <li key={movie.$id || index}>
          <p>{index + 1}</p>
          <img src={movie.poster_url} alt={movie.title}/>
        </li>
      ))}
    </ul>
  </section>
)}


        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
