export const typeChart = {
  normal: {
    weakTo: ["fighting"],
    resists: [],
    immuneTo: ["ghost"],
    strongAgainst: [],
  },

  fire: {
    weakTo: ["water", "ground", "rock"],
    resists: ["fire", "grass", "ice", "bug", "steel", "fairy"],
    immuneTo: [],
    strongAgainst: ["grass", "ice", "bug", "steel"],
  },

  water: {
    weakTo: ["electric", "grass"],
    resists: ["fire", "water", "ice", "steel"],
    immuneTo: [],
    strongAgainst: ["fire", "ground", "rock"],
  },

  electric: {
    weakTo: ["ground"],
    resists: ["electric", "flying", "steel"],
    immuneTo: [],
    strongAgainst: ["water", "flying"],
  },

  grass: {
    weakTo: ["fire", "ice", "poison", "flying", "bug"],
    resists: ["water", "electric", "grass", "ground"],
    immuneTo: [],
    strongAgainst: ["water", "ground", "rock"],
  },

  ice: {
    weakTo: ["fire", "fighting", "rock", "steel"],
    resists: ["ice"],
    immuneTo: [],
    strongAgainst: ["grass", "ground", "flying", "dragon"],
  },

  fighting: {
    weakTo: ["flying", "psychic", "fairy"],
    resists: ["bug", "rock", "dark"],
    immuneTo: [],
    strongAgainst: ["normal", "ice", "rock", "dark", "steel"],
  },

  poison: {
    weakTo: ["ground", "psychic"],
    resists: ["grass", "fighting", "poison", "bug", "fairy"],
    immuneTo: [],
    strongAgainst: ["grass", "fairy"],
  },

  ground: {
    weakTo: ["water", "grass", "ice"],
    resists: ["poison", "rock"],
    immuneTo: ["electric"],
    strongAgainst: ["fire", "electric", "poison", "rock", "steel"],
  },

  flying: {
    weakTo: ["electric", "ice", "rock"],
    resists: ["grass", "fighting", "bug"],
    immuneTo: ["ground"],
    strongAgainst: ["grass", "fighting", "bug"],
  },

  psychic: {
    weakTo: ["bug", "ghost", "dark"],
    resists: ["fighting", "psychic"],
    immuneTo: [],
    strongAgainst: ["fighting", "poison"],
  },

  bug: {
    weakTo: ["fire", "flying", "rock"],
    resists: ["grass", "fighting", "ground"],
    immuneTo: [],
    strongAgainst: ["grass", "psychic", "dark"],
  },

  rock: {
    weakTo: ["water", "grass", "fighting", "ground", "steel"],
    resists: ["normal", "fire", "poison", "flying"],
    immuneTo: [],
    strongAgainst: ["fire", "ice", "flying", "bug"],
  },

  ghost: {
    weakTo: ["ghost", "dark"],
    resists: ["poison", "bug"],
    immuneTo: ["normal", "fighting"],
    strongAgainst: ["psychic", "ghost"],
  },

  dragon: {
    weakTo: ["ice", "dragon", "fairy"],
    resists: ["fire", "water", "electric", "grass"],
    immuneTo: [],
    strongAgainst: ["dragon"],
  },

  dark: {
    weakTo: ["fighting", "bug", "fairy"],
    resists: ["ghost", "dark"],
    immuneTo: ["psychic"],
    strongAgainst: ["psychic", "ghost"],
  },

  steel: {
    weakTo: ["fire", "fighting", "ground"],
    resists: [
      "normal",
      "grass",
      "ice",
      "flying",
      "psychic",
      "bug",
      "rock",
      "dragon",
      "steel",
      "fairy",
    ],
    immuneTo: ["poison"],
    strongAgainst: ["ice", "rock", "fairy"],
  },

  fairy: {
    weakTo: ["poison", "steel"],
    resists: ["fighting", "bug", "dark"],
    immuneTo: ["dragon"],
    strongAgainst: ["fighting", "dragon", "dark"],
  },
};