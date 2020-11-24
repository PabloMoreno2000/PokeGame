const btnReady = "button-ready";
const gameId = "game-id";
const playerUsername = "player-username";

function byId(itemId) {
  return $(`#${itemId}`);
}

function getMatchInfo(lobby) {
  const username = localStorage.getItem("username");
  const player = username == lobby.player1.name ? "player1" : "player2";
  const rival = player == "player1" ? "player2" : "player1";
  const isPlayerReady = player == "player1" ? lobby.ready1 : lobby.ready2;
  localStorage.setItem("player", player);
  return { username, player, rival, isPlayerReady };
}

function updateFrontend(lobby) {
  const { rival, isPlayerReady } = getMatchInfo(lobby);
  // Update button
  byId(btnReady).text(isPlayerReady ? "¡Listo!" : "Presiona para empezar");
  // Update waiting "Player" tag. Put an empty string if there's no other player
  byId(playerUsername).text(lobby[rival] ? lobby[rival].name : "");
  // Update lobbyId
  byId(gameId).text(lobby.roomId);
  console.log(lobby);
}

$(document).ready(async () => {
  const lobbyId = localStorage.getItem("lobby-id");
  byId(btnReady).click(async () => {
    await API.lobby.setReady(lobbyId);
  });

  longPolling = async () => {
    let resp = {};
    try {
      resp = await API.lobby.getState(lobbyId);
    } catch (error) {
      console.log(error);
    }
    return resp;
  };

  // Refresh lobby until both players are ready
  async function refreshGame() {
    const resp = await longPolling();
    if (!resp.data) {
      console.log("No data in lobby longpolling");
    } else {
      const lobby = resp.data;
      const { player } = getMatchInfo(lobby);
      // Player1 creates game and "informs" player2
      if (lobby.ready1 && lobby.ready2 && player == "player1") {
        // create the game
        let resp = {};
        try {
          resp = await API.game.startNewGame(
            lobby.player1._id,
            lobby.player2._id
          );
        } catch (error) {
          console.log(error);
        }
        const game = resp.data;
        try {
          await API.lobby.setCreatedGame(lobby.roomId, game.gameId);
          // Go to game screen
          localStorage.setItem("game-id", game.gameId);
          localStorage.setItem("player1", lobby.player1.name);
          localStorage.setItem("player2", lobby.player2.name);
          window.location.replace("../Game.html");
        } catch (error) {
          console.log(error);
        }
      }
      // Player2 waits for player1 to send the gameId
      else if (lobby.ready1 && lobby.ready2 && player == "player2") {
        if (lobby.createdGameId) {
          // Get game id and change screen
          localStorage.setItem("game-id", lobby.createdGameId);
          localStorage.setItem("player1", lobby.player1.name);
          localStorage.setItem("player2", lobby.player2.name);
          window.location.replace("../Game.html");
        } else {
          // If both are ready but no gameId, setCreatedGame for player1 is still going
          setTimeout(refreshGame, 300);
        }
      } else {
        updateFrontend(lobby);
        setTimeout(refreshGame, 1000);
      }
    }
  }
  refreshGame();
});
