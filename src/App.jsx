import { useEffect, useState } from "react";
import "./index.css";
import { typeChart } from "./typeChart";

const pokemonTypes = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

function App() {
  const [pokemonName, setPokemonName] = useState("");
  const [pokemonData, setPokemonData] = useState(null);
  const [error, setError] = useState("");
  const [pokemonList, setPokemonList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [team, setTeam] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [typePokemon, setTypePokemon] = useState([]);
  const [typeLoading, setTypeLoading] = useState(false);
  const [typeError, setTypeError] = useState("");

    useEffect(() => {
      async function fetchPokemonList() {
        const response = await fetch(
          "https://pokeapi.co/api/v2/pokemon?limit=1000"
        );

        const data = await response.json();
        const pokemonWithSprites = data.results.map((pokemon, index) => {
          const pokemonId = index + 1;

          return {
            ...pokemon,
            id: pokemonId,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
          };
        });

        setPokemonList(pokemonWithSprites);
      }

      fetchPokemonList();
    }, []);

    async function searchPokemon(nameToSearch = pokemonName) {
      try {
        setError("");
        setPokemonData(null);
        setSuggestions([]);

        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${nameToSearch.toLowerCase()}`
        );

        if (!response.ok) {
          throw new Error("Pokémon not found");
        }

        const data = await response.json();

        setPokemonData(data);
      } catch (error) {
        setError("Pokémon not found. Check the spelling and try again.");
      }
    }

    async function searchByType(type) {
      try {
        setTypeLoading(true);
        setTypeError("");
        setTypePokemon([]);

        let updatedTypes;

        if (selectedTypes.includes(type)) {
          updatedTypes = selectedTypes.filter((selected) => selected !== type);
        } else if (selectedTypes.length < 2) {
          updatedTypes = [...selectedTypes, type];
        } else {
          updatedTypes = [selectedTypes[1], type];
        }

        setSelectedTypes(updatedTypes);

        if (updatedTypes.length === 0) {
          setTypeLoading(false);
          return;
        }

        const typeResponses = await Promise.all(
          updatedTypes.map((selectedType) =>
            fetch(`https://pokeapi.co/api/v2/type/${selectedType}`)
          )
        );

        const typeData = await Promise.all(
          typeResponses.map((response) => response.json())
        );

        const pokemonLists = typeData.map((data) =>
          data.pokemon.map((entry) => entry.pokemon)
        );

        let filteredPokemon;

        if (pokemonLists.length === 1) {
          filteredPokemon = pokemonLists[0];
        } else {
          const firstTypePokemon = pokemonLists[0];

          filteredPokemon = firstTypePokemon.filter((pokemon) =>
            pokemonLists[1].some(
              (secondTypePokemon) => secondTypePokemon.name === pokemon.name
            )
          );
        }

        setTypePokemon(filteredPokemon);
      } catch (error) {
        setTypeError("Could not load Pokémon for that type combination.");
      } finally {
        setTypeLoading(false);
      }
    }

          function addToTeam() {
            if (!pokemonData) return;

            if (team.length >= 6) {
              setError("Your team already has 6 Pokémon.");
              return;
            }

            const alreadyOnTeam = team.some(
              (pokemon) => pokemon.id === pokemonData.id
            );

            if (alreadyOnTeam) {
              setError(`${pokemonData.name} is already on your team.`);
              return;
            }

            setTeam([...team, pokemonData]);
            setError("");
        }

        function removeFromTeam(pokemonId) {
          setTeam(team.filter((pokemon) => pokemon.id !== pokemonId));
        }

        function analyzeTeam() {
          const weaknesses = {};
          const resistances = {};
          const immunities = {};
          const strongAgainst = {};

          team.forEach((pokemon) => {
            pokemon.types.forEach((typeInfo) => {
              const typeName = typeInfo.type.name;

              const typeData = typeChart[typeName];

              if (!typeData) return;

              typeData.weakTo.forEach((weakness) => {
                weaknesses[weakness] = (weaknesses[weakness] || 0) + 1;
              });

              typeData.resists.forEach((resistance) => {
                resistances[resistance] =
                  (resistances[resistance] || 0) + 1;
              });

              typeData.immuneTo.forEach((immunity) => {
                immunities[immunity] =
                  (immunities[immunity] || 0) + 1;
              });

              typeData.strongAgainst?.forEach((strongType) => {
                strongAgainst[strongType] = 
                  (strongAgainst[strongType] || 0) + 1;
              });
            });
          });

          return {
            weaknesses,
            resistances,
            immunities,
            strongAgainst,
          };
        }

        function analyzePokemon(pokemon) {
          const weaknesses = {};
          const resistances = {};
          const immunities = {};
          const strongAgainst = {};

          if (!pokemon) {
            return {
              weaknesses,
              resistances,
              immunities,
              strongAgainst,
            };
          }

          pokemon.types.forEach((typeInfo) => {
            const typeName = typeInfo.type.name;
            const typeData = typeChart[typeName];

            if (!typeData) return;

            typeData.weakTo.forEach((weakness) => {
              weaknesses[weakness] = (weaknesses[weakness] || 0) + 1;
            });

            typeData.resists.forEach((resistance) => {
              resistances[resistance] = (resistances[resistance] || 0) + 1;
            });

            typeData.immuneTo.forEach((immunity) => {
              immunities[immunity] = (immunities[immunity] || 0) + 1;
            });

            typeData.strongAgainst?.forEach((strongType) => {
              strongAgainst[strongType] = (strongAgainst[strongType] || 0) + 1;
            });
          });

          return {
            weaknesses,
            resistances,
            immunities,
            strongAgainst,
          };
        }

        const analysis = analyzeTeam();
        const pokemonAnalysis = analyzePokemon(pokemonData);

    return (
      <div className="app">
        <div className="card">
          <h1 className="title">PokéTeam Analyzer</h1>

          <div className="main-layout">

            {/* LEFT PANEL */}
            <div className="left-panel">

              <div className="search-container">
                <input
                  className="search-input"
                  type="search"
                  name="poketeam-pokemon-name-search-field"
                  id="poketeam-pokemon-name-search-field"
                  placeholder="Enter Pokémon name"
                  value={pokemonName}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPokemonName(value);

                    if (value.length > 0) {
                      const filteredSuggestions = pokemonList
                        .filter((pokemon) =>
                          pokemon.name.startsWith(value.toLowerCase())
                        )
                        .slice(0, 5);

                      setSuggestions(filteredSuggestions);
                    } else {
                      setSuggestions([]);
                    }
                  }}
                />

                <button
                  className="search-button"
                  onClick={() => searchPokemon()}
                >
                  Search
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="suggestions">
                  {suggestions.map((pokemon) => (
                    <button
                      key={pokemon.name}
                      className="suggestion-item"
                      onClick={() => {
                        setPokemonName(pokemon.name);
                        setSuggestions([]);
                        searchPokemon(pokemon.name);
                      }}
                    >
                      <img
                        className="suggestion-sprite"
                        src={pokemon.sprite}
                        alt={pokemon.name}
                      />

                      <span>{pokemon.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="type-browser">
                <h2>Browse by Type</h2>

                <div className="type-buttons">
                  {pokemonTypes.map((type) => (
                    <button
                      key={type}
                      className={`type-button ${
                        selectedTypes.includes(type)
                          ? "active-type"
                          : ""
                      }`}
                      onClick={() => searchByType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {selectedTypes.length > 0 && (
                  <p className="selected-types-text">
                    Filtering by: {selectedTypes.join(" + ")}
                  </p>
                )}

                {typeLoading && <p>Loading Pokémon...</p>}

                {typeError && (
                  <p className="error">
                    {typeError}
                  </p>
                )}

                {typePokemon.length > 0 && (
                  <div className="type-grid">
                    {typePokemon.map((pokemon) => (
                      <button
                        key={pokemon.name}
                        className="type-pokemon-card"
                        onClick={() => searchPokemon(pokemon.name)}
                      >
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.url
                            .split("/")
                            .filter(Boolean)
                            .pop()}.png`}
                          alt={pokemon.name}
                        />

                        <span>{pokemon.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

            </div>

            {/* MIDDLE PANEL */}
            <div className="middle-panel">

              <div className="team-section">
                <h2>Your Team</h2>

                <div className="team-grid">
                  {team.map((pokemon) => (
                    <div
                      key={pokemon.id}
                      className="team-slot filled"
                      onClick={() => setPokemonData(pokemon)}
                    >
                      <img
                        src={pokemon.sprites.front_default}
                        alt={pokemon.name}
                      />

                      <p>{pokemon.name}</p>

                      <button
                        className="remove-team-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFromTeam(pokemon.id);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {Array.from({
                    length: 6 - team.length,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="team-slot empty"
                    >
                      Empty
                    </div>
                  ))}
                </div>
              </div>

              {team.length > 0 && (
                <div className="team-analysis">
                  <h2>Team Analysis</h2>

                  <div className="analysis-grid">
                    <div className="analysis-section">
                      <h3>Strong Against</h3>

                      {Object.entries(analysis.strongAgainst)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <span
                            key={type}
                            className={`type-badge ${type}`}
                          >
                            {type.toUpperCase()}
                          </span>
                        ))}
                    </div>

                    <div className="analysis-section">
                      <h3>Weaknesses</h3>

                      {Object.entries(analysis.weaknesses)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <span
                            key={type}
                            className={`type-badge ${type}`}
                          >
                            {type.toUpperCase()}
                          </span>
                        ))}
                    </div>

                    <div className="analysis-section">
                      <h3>Resistances</h3>

                      {Object.entries(analysis.resistances)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <span
                            key={type}
                            className={`type-badge ${type}`}
                          >
                            {type.toUpperCase()}
                          </span>
                        ))}
                    </div>

                    <div className="analysis-section">
                      <h3>Immunities</h3>

                      {Object.entries(analysis.immunities)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <span
                            key={type}
                            className={`type-badge ${type}`}
                          >
                            {type.toUpperCase()}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANEL */}
            <div className="right-panel">

              {pokemonData ? (
                <div className="pokemon-info">
                  <h2>
                    {pokemonData.name.toUpperCase()}
                  </h2>

                  <img
                    className="pokemon-image"
                    src={pokemonData.sprites.front_default}
                    alt={pokemonData.name}
                  />

                  <div className="type-container">
                    {pokemonData.types.map((typeInfo) => (
                      <span
                        key={typeInfo.type.name}
                        className={`type-badge ${typeInfo.type.name}`}
                      >
                        {typeInfo.type.name.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  <button
                    className="add-team-button"
                    onClick={addToTeam}
                  >
                    Add to Team
                  </button>

                  <div className="stats-container">
                    <h3>Base Stats</h3>

                    {pokemonData.stats.map((statInfo) => (
                      <p
                        key={statInfo.stat.name}
                        className="stat"
                      >
                        {statInfo.stat.name.toUpperCase()}:{" "}
                        {statInfo.base_stat}
                      </p>
                    ))}
                  </div>

                  <div className="pokemon-analysis">
                    <h3>Analysis</h3>

                    <div className="pokemon-analysis-grid">
                      <div className="mini-analysis-section">
                        <h4>Strong Against</h4>

                        {Object.entries(pokemonAnalysis.strongAgainst).length > 0 ? (
                          <div className="analysis-badges">
                            {Object.entries(pokemonAnalysis.strongAgainst)
                              .sort((a, b) => b[1] - a[1])
                              .map(([type]) => (
                                <span key={type} className={`type-badge ${type}`}>
                                  {type.toUpperCase()}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <p className="analysis-row">None</p>
                        )}
                      </div>

                      <div className="mini-analysis-section">
                        <h4>Weaknesses</h4>

                        {Object.entries(pokemonAnalysis.weaknesses).length > 0 ? (
                          <div className="analysis-badges">
                            {Object.entries(pokemonAnalysis.weaknesses)
                              .sort((a, b) => b[1] - a[1])
                              .map(([type]) => (
                                <span key={type} className={`type-badge ${type}`}>
                                  {type.toUpperCase()}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <p className="analysis-row">None</p>
                        )}
                      </div>

                      <div className="mini-analysis-section">
                        <h4>Resistances</h4>

                        {Object.entries(pokemonAnalysis.resistances).length > 0 ? (
                          <div className="analysis-badges">
                            {Object.entries(pokemonAnalysis.resistances)
                              .sort((a, b) => b[1] - a[1])
                              .map(([type]) => (
                                <span key={type} className={`type-badge ${type}`}>
                                  {type.toUpperCase()}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <p className="analysis-row">None</p>
                        )}
                      </div>

                      <div className="mini-analysis-section">
                        <h4>Immunities</h4>

                        {Object.entries(pokemonAnalysis.immunities).length > 0 ? (
                          <div className="analysis-badges">
                            {Object.entries(pokemonAnalysis.immunities)
                              .sort((a, b) => b[1] - a[1])
                              .map(([type]) => (
                                <span key={type} className={`type-badge ${type}`}>
                                  {type.toUpperCase()}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <p className="analysis-row">None</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pokemon-info empty-details">
                  <h2>No Pokémon Selected</h2>

                  <p>
                    Search for a Pokémon or click one
                    from the type browser.
                  </p>
                </div>
              )}

            </div>

          </div>
        </div>
      </div>
    );
}

export default App;