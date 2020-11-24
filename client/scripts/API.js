function db(requestType, url, data, requiresAuth, headers) {
  url = "https://pok3game.herokuapp.com" + url;
  let request = null;
  if (requiresAuth) {
    headers["x-auth-token"] = localStorage.getItem("x-auth-token");
  }
  const config = {
    headers,
  };

  switch (requestType) {
    case "GET":
      request = axios.get(url, config);
      break;
    case "POST":
      request = axios.post(url, data, config);
      break;
    case "PUT":
      request = axios.put(url, data, config);
      break;
    case "DELETE":
      request = axios.delete(url, data, config);
      break;
    default:
      request = "Bad request type";
      break;
  }
  return request;
}

const API = {
  auth: {
    getAuthUser: () => db("GET", "/api/users/", null, true, {}),
    postAuthUser: (username, password) =>
      db("POST", "/api/auth/", { name: username, password }, false, {}),
  },
  users: {
    createUser: (name, email, password) =>
      db("POST", "/api/users/", { name, email, password }, false, {}),
  },
  game: {
    startNewGame: (player1, player2) =>
      db("POST", "/api/game/newGame", { player1, player2 }, false, {}),
    movePkmHandToBench: (gameId, handPosition) =>
      db(
        "PUT",
        "/api/game/pokemonHandToBench",
        { gameId, handPosition },
        true,
        {}
      ),
    movePkmBenchToActive: (gameId, benchPosition) =>
      db(
        "PUT",
        "/api/game/pokemonBenchToActive",
        { gameId, benchPosition },
        true,
        {}
      ),
    getGameState: (gameId) =>
      db("GET", `/api/game/gameState/${gameId}`, null, true, {}),
    useItemInActivePkm: (gameId, handItemPos) =>
      db(
        "PUT",
        "/api/game/useItemInActivePkm",
        { gameId, handItemPos },
        true,
        {}
      ),
    useEnergy: (gameId, inGameIdEnergy, inGameIdPkm) =>
      db(
        "PUT",
        "/api/game/useEnergy",
        { gameId, inGameIdEnergy, inGameIdPkm },
        true,
        {}
      ),
    endTurn: (gameId) => db("PUT", "/api/game/endTurn", { gameId }, true, {}),
    attack: (attackPos, gameId) =>
      db("PUT", "/api/game/attack", { attackPos, gameId }, true, {}),
  },
  lobby: {
    getState: (lobbyId) =>
      db("GET", `/api/lobby/getState/${lobbyId}`, null, false, {}),
    createLobby: () => db("POST", "/api/lobby/create", {}, false, {}),
    joinLobby: (lobbyId) =>
      db("PUT", `/api/lobby/join/${lobbyId}`, {}, true, {}),
    getAllLobies: () => db("GET", "/api/lobby/getAll", {}, false, {}),
    setReady: (lobbyId) =>
      db("PUT", `/api/lobby/ready/${lobbyId}`, null, true, {}),
    setCreatedGame: (lobbyId, gameId) =>
      db(
        "PUT",
        `/api/lobby/setCreatedGame/${lobbyId}/${gameId}`,
        null,
        true,
        {}
      ),
  },
};
