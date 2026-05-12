import { useEffect, useState } from "react";
import "./index.css";
import { typeChart } from "./typeChart";
import { competitiveData } from "./competitiveData";
import { gameDexes } from "./gameDexes";

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

  function InfoDropdown({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="info-dropdown">
      <button
        className="info-dropdown-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className="info-dropdown-icon">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="info-dropdown-content">
          {children}
        </div>
      )}
    </div>
  );
}

  function App() {
    const [pokemonName, setPokemonName] = useState("");
    const [pokemonData, setPokemonData] = useState(null);
    const [error, setError] = useState("");
    const [pokemonList, setPokemonList] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [team, setTeam] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedGameDex, setSelectedGameDex] = useState(() => {
      return localStorage.getItem("selectedGameDex") || "all";
    });
    const [typePokemon, setTypePokemon] = useState([]);
    const [typeLoading, setTypeLoading] = useState(false);
    const [typeError, setTypeError] = useState("");
    const [showCompetitiveBadges, setShowCompetitiveBadges] = useState(() => {
      return localStorage.getItem("showCompetitiveBadges") !== "false";
    });
    const [abilityDescriptions, setAbilityDescriptions] = useState({});
    const [teamName, setTeamName] = useState("");
    const [savedTeams, setSavedTeams] = useState(() => {
      return JSON.parse(localStorage.getItem("savedTeams")) || [];
    });
    const [importText, setImportText] = useState("");
    const [evolutionChain, setEvolutionChain] = useState([]);
    const [evolutionLoading, setEvolutionLoading] = useState(false);
    const [suggestedTeammates, setSuggestedTeammates] = useState([]);

    useEffect(() => {
      localStorage.setItem("selectedGameDex", selectedGameDex);
    }, [selectedGameDex]);

    useEffect(() => {
      localStorage.setItem("showCompetitiveBadges", showCompetitiveBadges);
    }, [showCompetitiveBadges]);

    useEffect(() => {
        const savedTeam = localStorage.getItem("savedPokemonTeam");

        if (savedTeam) {
          setTeam(JSON.parse(savedTeam));
        }
      }, []);

      useEffect(() => {
        localStorage.setItem("savedPokemonTeam", JSON.stringify(team));
      }, [team]);

      useEffect(() => {
        localStorage.setItem("savedTeams", JSON.stringify(savedTeams));
      }, [savedTeams]);

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

    useEffect(() => {
      async function fetchAbilityDescriptions() {
        if (!pokemonData) return;

        const descriptions = {};

        await Promise.all(
          pokemonData.abilities.map(async (abilityInfo) => {
            try {
              const response = await fetch(
                abilityInfo.ability.url
              );

              const data = await response.json();

              const englishEntry = data.effect_entries.find(
                (entry) => entry.language.name === "en"
              );

              descriptions[abilityInfo.ability.name] =
                englishEntry?.short_effect ||
                "No description available.";
            } catch {
              descriptions[abilityInfo.ability.name] =
                "Could not load ability description.";
            }
          })
        );

        setAbilityDescriptions(descriptions);
      }

      fetchAbilityDescriptions();
        }, [pokemonData]);

        useEffect(() => {
          async function fetchEvolutionChain() {
            if (!pokemonData) return;

            try {
              setEvolutionLoading(true);
              setEvolutionChain([]);

              const speciesResponse = await fetch(pokemonData.species.url);
              const speciesData = await speciesResponse.json();

              const evolutionResponse = await fetch(speciesData.evolution_chain.url);
              const evolutionData = await evolutionResponse.json();

              const chain = [];

              function walkEvolutionTree(node) {
                const pokemonId = Number(
                  node.species.url
                    .split("/")
                    .filter(Boolean)
                    .pop()
                );

                chain.push({
                  name: node.species.name,
                  id: pokemonId,
                  sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
                });

                node.evolves_to.forEach((nextEvolution) => {
                  walkEvolutionTree(nextEvolution);
                });
              }

              walkEvolutionTree(evolutionData.chain);
              setEvolutionChain(chain);
            } catch (error) {
              setEvolutionChain([]);
            } finally {
              setEvolutionLoading(false);
            }
          }

          fetchEvolutionChain();
        }, [pokemonData]);

        useEffect(() => {
          async function fetchSuggestedTeammates() {
            if (team.length === 0 || pokemonList.length === 0) {
              setSuggestedTeammates([]);
              return;
            }

            const currentAnalysis = analyzeTeam();

            const majorWeaknesses = Object.entries(currentAnalysis.weaknesses)
              .filter(([type, count]) => count >= 2)
              .map(([type]) => type);

            if (majorWeaknesses.length === 0) {
              setSuggestedTeammates([]);
              return;
            }

            const currentTeamIds = team.map((pokemon) => pokemon.id);

            const possiblePokemon = pokemonList
              .filter((pokemon) => {
                if (currentTeamIds.includes(pokemon.id)) return false;
                return isPokemonInSelectedGameDex(pokemon.id);
              })
              .slice(0, 200);

            const detailedPokemon = await Promise.all(
              possiblePokemon.map(async (pokemon) => {
                const response = await fetch(
                  `https://pokeapi.co/api/v2/pokemon/${pokemon.name}`
                );

                return response.json();
              })
            );

            const rankedSuggestions = detailedPokemon
              .map((pokemon) => {
                const covers = [];

                pokemon.types.forEach((typeInfo) => {
                  const typeName = typeInfo.type.name;
                  const typeData = typeChart[typeName];

                  if (!typeData) return;

                  majorWeaknesses.forEach((weakness) => {
                    if (
                      typeData.resists.includes(weakness) ||
                      typeData.immuneTo.includes(weakness)
                    ) {
                      covers.push(weakness);
                    }
                  });
                });

                return {
                  ...pokemon,
                  coverageScore: [...new Set(covers)].length,
                  covers: [...new Set(covers)],
                };
              })
              .filter((pokemon) => pokemon.coverageScore > 0)
              .sort((a, b) => b.coverageScore - a.coverageScore)
              .slice(0, 6);

            setSuggestedTeammates(rankedSuggestions);
          }

          fetchSuggestedTeammates();
        }, [team, selectedGameDex, pokemonList]);

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

        const generationFilteredPokemon = filteredPokemon.filter((pokemon) => {
          const pokemonId = Number(
            pokemon.url
              .split("/")
              .filter(Boolean)
              .pop()
          );

          return isPokemonInSelectedGameDex(pokemonId);
        });

        setTypePokemon(generationFilteredPokemon);

      } catch (error) {
        setTypeError("Could not load Pokémon for that type combination.");
      } finally {
        setTypeLoading(false);
      }
    }

    function showAllPokemonInSelectedDex() {
      setSelectedTypes([]);
      setTypeError("");
      setTypeLoading(false);

      const selectedDex = gameDexes[selectedGameDex];

      const filteredPokemon = pokemonList.filter((pokemon) => {
        if (!selectedDex || selectedDex.pokemonIds === null) {
          return true;
        }

        return selectedDex.pokemonIds.includes(pokemon.id);
      });

      setTypePokemon(filteredPokemon);
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

        function clearTeam() {
          setTeam([]);
          setPokemonData(null);
          setError("");
        }

        function saveNamedTeam() {
          if (team.length === 0) {
            setError("Add Pokémon before saving a team.");
            return;
          }

          if (!teamName.trim()) {
            setError("Give your team a name before saving.");
            return;
          }

          const newSavedTeam = {
            id: Date.now(),
            name: teamName.trim(),
            pokemon: team,
          };

          setSavedTeams([...savedTeams, newSavedTeam]);
          setTeamName("");
          setError("");
        }

        function loadSavedTeam(savedTeam) {
          setTeam(savedTeam.pokemon);
          setError("");
        }

        function deleteSavedTeam(teamId) {
          setSavedTeams(savedTeams.filter((savedTeam) => savedTeam.id !== teamId));
        }

        function exportTeam() {
        const teamNames = team.map((pokemon) => pokemon.name).join(", ");
        setImportText(teamNames);
      }

      async function importTeam() {
        try {
          setError("");

          const names = importText
            .split(",")
            .map((name) => name.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 6);

          const importedPokemon = await Promise.all(
            names.map(async (name) => {
              const response = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${name}`
              );

              if (!response.ok) {
                throw new Error(`Could not import ${name}`);
              }

              return response.json();
            })
          );

          setTeam(importedPokemon);
          setImportText("");
        } catch (error) {
          setError("Could not import team. Check names and separate them with commas.");
        }
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

        function getWeaknessOverlapScore() {
        const overlapTypes = Object.entries(analysis.weaknesses).filter(
          ([type, count]) => count >= 2
        );

        return overlapTypes.reduce((total, [type, count]) => {
          return total + count;
        }, 0);
      }

        function getWeaknessOverlapLevel(score) {
          if (score >= 8) return "High Risk";
          if (score >= 4) return "Moderate Risk";
          if (score >= 1) return "Low Risk";
          return "Balanced";
        }

        const analysis = analyzeTeam();
        const pokemonAnalysis = analyzePokemon(pokemonData);
        const weaknessOverlapScore = getWeaknessOverlapScore();
        const weaknessOverlapLevel = getWeaknessOverlapLevel(weaknessOverlapScore);

        const competitiveInfo = pokemonData
          ? getCompetitiveInfo(pokemonData.name)
          : null;

          const pokemonRole = pokemonData ? getPokemonRole(pokemonData) : null;
          const natureRecommendations = pokemonData
            ? getNatureRecommendations(pokemonData)
            : [];

      function isPokemonInSelectedGameDex(pokemonId) {
        const selectedDex = gameDexes[selectedGameDex];

        if (!selectedDex || selectedDex.pokemonIds === null) {
          return true;
        }

        return selectedDex.pokemonIds.includes(pokemonId);
      }

      function getCompetitiveInfo(pokemonName) {
        return (
          competitiveData[pokemonName.toLowerCase()] || {
            tier: "LEGAL",
            legalClass: "legal",
          }
        );
      }

      function getStatValue(pokemon, statName) {
        return pokemon.stats.find((stat) => stat.stat.name === statName)?.base_stat || 0;
      }

      function getPokemonRole(pokemon) {
        const attack = getStatValue(pokemon, "attack");
        const specialAttack = getStatValue(pokemon, "special-attack");
        const defense = getStatValue(pokemon, "defense");
        const specialDefense = getStatValue(pokemon, "special-defense");
        const speed = getStatValue(pokemon, "speed");
        const hp = getStatValue(pokemon, "hp");

        const bulk = hp + defense + specialDefense;

        if (speed >= 100 && attack >= specialAttack && attack >= 90) {
          return "Fast Physical Sweeper";
        }

        if (speed >= 100 && specialAttack > attack && specialAttack >= 90) {
          return "Fast Special Sweeper";
        }

        if (attack >= specialAttack && attack >= 90) {
          return "Physical Attacker";
        }

        if (specialAttack > attack && specialAttack >= 90) {
          return "Special Attacker";
        }

        if (bulk >= 250) {
          return "Tank";
        }

        return "Balanced";
      }

      function getNatureRecommendations(pokemon) {
        const attack = getStatValue(pokemon, "attack");
        const specialAttack = getStatValue(pokemon, "special-attack");
        const speed = getStatValue(pokemon, "speed");
        const defense = getStatValue(pokemon, "defense");
        const specialDefense = getStatValue(pokemon, "special-defense");
        const hp = getStatValue(pokemon, "hp");

        if (speed >= 100 && attack >= specialAttack) {
          return ["Jolly", "Adamant"];
        }

        if (speed >= 100 && specialAttack > attack) {
          return ["Timid", "Modest"];
        }

        if (attack > specialAttack) {
          return ["Adamant", "Jolly"];
        }

        if (specialAttack > attack) {
          return ["Modest", "Timid"];
        }

        if (hp + defense + specialDefense >= 250) {
          return ["Bold", "Calm", "Impish", "Careful"];
        }

        return ["Neutral nature"];
      }

      function getNatureEffect(nature) {
        const natureEffects = {
          Adamant: "+Attack, -Special Attack",
          Jolly: "+Speed, -Special Attack",
          Modest: "+Special Attack, -Attack",
          Timid: "+Speed, -Attack",
          Bold: "+Defense, -Attack",
          Calm: "+Special Defense, -Attack",
          Impish: "+Defense, -Special Attack",
          Careful: "+Special Defense, -Special Attack",
          "Neutral nature": "No stat increase or decrease",
        };

        return natureEffects[nature] || "Nature effect unknown";
      }

      function formatAbilityName(abilityName) {
        return abilityName
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

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
                        pokemon.name.startsWith(value.toLowerCase()) &&
                        isPokemonInSelectedGameDex(pokemon.id)
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

                <div className="generation-filter">
                  <h2>Filter by Game Dex</h2>

                  <select
                    className="generation-select"
                    value={selectedGameDex}
                    onChange={(event) => {
                      setSelectedGameDex(event.target.value);
                      setSelectedTypes([]);
                      setTypePokemon([]);
                    }}
                  >
                    {Object.entries(gameDexes).map(([gameDexKey, gameDex]) => (
                      <option key={gameDexKey} value={gameDexKey}>
                        {gameDex.label}
                      </option>
                    ))}
                  </select>
                </div>

              <div className="type-browser">
                <h2>Browse by Type</h2>

                <div className="type-buttons">

                  <button
                    className={`type-button ${
                      selectedTypes.length === 0 && typePokemon.length > 0
                        ? "active-type"
                        : ""
                    }`}
                    onClick={showAllPokemonInSelectedDex}
                  >
                    all
                  </button>

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
                          src={
                            pokemon.sprite ||
                            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.url
                              .split("/")
                              .filter(Boolean)
                              .pop()}.png`
                          }
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
                <div className="team-header">
                  <h2>Your Team</h2>

                  {team.length > 0 && (
                    <button
                      className="clear-team-button"
                      onClick={clearTeam}
                    >
                      Clear Team
                    </button>
                  )}
                </div>

                <div className="team-tools">
                  <label className="badge-toggle">
                    <input
                      type="checkbox"
                      checked={showCompetitiveBadges}
                      onChange={() =>
                        setShowCompetitiveBadges(!showCompetitiveBadges)
                      }
                    />
                    Show competitive badges
                  </label>

                  <div className="export-import-tools">
                    <button
                      className="team-tool-button"
                      onClick={exportTeam}
                      disabled={team.length === 0}
                    >
                      Export Team
                    </button>

                    <button
                      className="team-tool-button"
                      onClick={importTeam}
                    >
                      Import Team
                    </button>
                  </div>

                  <textarea
                    className="team-import-box"
                    placeholder="Example: infernape, garchomp, starmie"
                    value={importText}
                    onChange={(event) => setImportText(event.target.value)}
                  />
                </div>

                    <div className="saved-team-tools">
                      <div className="team-name-group">
                        <label htmlFor="team-name-input">Name your team</label>

                        <input
                          id="team-name-input"
                          className="team-name-input"
                          type="text"
                          placeholder="Enter a team name..."
                          value={teamName}
                          onChange={(event) => setTeamName(event.target.value)}
                        />
                      </div>

                      <button
                        className="team-tool-button save-team-button"
                        onClick={saveNamedTeam}
                      >
                        Save Team
                      </button>
                    </div>

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

                        <span className="team-role-label">
                          {getPokemonRole(pokemon)}
                        </span>

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

                {savedTeams.length > 0 && (
                  <InfoDropdown title="Saved Teams">
                    <div className="saved-teams-list">

                      {savedTeams.map((savedTeam) => (
                        <div
                          key={savedTeam.id}
                          className="saved-team-card"
                        >
                          <div className="saved-team-info">
                            <strong>{savedTeam.name}</strong>

                            <div className="saved-team-sprites">
                              {savedTeam.pokemon.map((pokemon) => (
                                <img
                                  key={pokemon.id}
                                  src={pokemon.sprites.front_default}
                                  alt={pokemon.name}
                                  title={pokemon.name}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="saved-team-buttons">
                            <button
                              className="team-tool-button"
                              onClick={() => loadSavedTeam(savedTeam)}
                            >
                              Load
                            </button>

                            <button
                              className="delete-saved-team-button"
                              onClick={() => deleteSavedTeam(savedTeam.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </InfoDropdown>
                )}
              </div>

            {team.length > 0 && (
              <InfoDropdown title="Team Analysis" defaultOpen={true}>
                <div className="team-analysis">

                  <div className="weakness-score-card">
                    <h3>Weakness Overlap Score</h3>

                    <p className="weakness-score-number">
                      {weaknessOverlapScore}
                    </p>

                    <p className={`weakness-score-label ${weaknessOverlapLevel.toLowerCase().replace(" ", "-")}`}>
                      {weaknessOverlapLevel}
                    </p>
                  </div>

                  <div className="analysis-grid">
                    <div className="analysis-section">
                      <h3>Strong Against</h3>

                        <div className="analysis-badges">
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
                    </div>

                    <div className="analysis-section">
                      <h3>Weaknesses</h3>

                      <div className="analysis-badges">
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
                    </div>

                    <div className="analysis-section">
                      <h3>Resistances</h3>

                      <div className="analysis-badges">
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
                    </div>

                    <div className="analysis-section">
                      <h3>Immunities</h3>

                      <div className="analysis-badges">
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
                        {suggestedTeammates.length > 0 && (
                          <div className="suggested-teammates">
                            <h3>Suggested Teammates</h3>

                            <div className="suggested-teammate-grid">
                              {suggestedTeammates.map((pokemon) => (
                                <button
                                  key={pokemon.id}
                                  className="suggested-teammate-card"
                                  onClick={() => searchPokemon(pokemon.name)}
                                >
                                  <img
                                    src={pokemon.sprites.front_default}
                                    alt={pokemon.name}
                                  />

                                  <span>{pokemon.name}</span>

                                  <small>
                                    Covers: {pokemon.covers.join(", ")}
                                  </small>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        </div>
                      </InfoDropdown>
                    )}
            </div>

            {/* RIGHT PANEL */}
            <div className="right-panel">

              {pokemonData ? (
                <div className="pokemon-info">
                  <h2>
                    {pokemonData.name.toUpperCase()}
                  </h2>

                    {showCompetitiveBadges && competitiveInfo && (
                      <div
                        className={`competitive-badge ${competitiveInfo.legalClass}`}
                      >
                        {competitiveInfo.tier}
                      </div>
                    )}

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

                  <div className="role-nature-card">
                      <p className="role-label">
                        Role: <span>{pokemonRole}</span>
                      </p>

                      <div className="nature-section">
                        <p>Recommended Natures:</p>

                        <div className="nature-badges">
                          {natureRecommendations.map((nature) => (
                           <div
                              key={nature}
                              className="ability-tooltip-wrapper"
                            >
                              <span className="nature-badge">
                                {nature}
                              </span>

                              <div className="ability-tooltip">
                                {getNatureEffect(nature)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <InfoDropdown title="Abilities" defaultOpen={true}>
                      <div className="ability-list">
                        {pokemonData.abilities.map((abilityInfo) => (
                        <div
                          key={abilityInfo.ability.name}
                          className="ability-tooltip-wrapper"
                        >
                          <span
                            className={
                              abilityInfo.is_hidden
                                ? "ability-badge hidden-ability"
                                : "ability-badge"
                            }
                          >
                            {formatAbilityName(abilityInfo.ability.name)}
                            {abilityInfo.is_hidden}
                          </span>

                          <div className="ability-tooltip">
                            {abilityDescriptions[abilityInfo.ability.name] ||
                              "Loading ability..."}
                          </div>
                        </div>
                        ))}
                      </div>
                    </InfoDropdown>

                    <InfoDropdown title="Evolution Chain">
                      {evolutionLoading ? (
                        <p className="evolution-loading">Loading evolution chain...</p>
                      ) : evolutionChain.length > 0 ? (
                        <div className="evolution-list">
                          {evolutionChain.map((evolution, index) => (
                            <div
                              key={evolution.name}
                              className="evolution-item"
                            >
                              <button
                                className={`evolution-pokemon ${
                                  pokemonData.name === evolution.name ? "current-evolution" : ""
                                }`}
                                onClick={() => searchPokemon(evolution.name)}
                              >
                                <img
                                  src={evolution.sprite}
                                  alt={evolution.name}
                                />

                                <span>{evolution.name}</span>
                              </button>

                              {index < evolutionChain.length - 1 && (
                                <span className="evolution-arrow">→</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="evolution-loading">No evolution chain found.</p>
                      )}
                    </InfoDropdown>

                  <InfoDropdown title="Base Stats">
                    <div className="stats-container">
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
                  </InfoDropdown>

                  <InfoDropdown title="Analysis">
                    <div className="pokemon-analysis">
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
                  </InfoDropdown>
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