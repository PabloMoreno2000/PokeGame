const btnReady = "button-ready";
const gameId = "game-id";
const playerUsername = "player-username";

function byId(itemId) {
  return $(`#${itemId}`);
}

function updateFrontend(lobby) {
  const username = localStorage.getItem("username");
  const player = username == lobby.player1.name ? "player1" : "player2";
  const rival = player == "player1" ? "player2" : "player1";
  // Update button
  const isPlayerReady = player == "player1" ? lobby.ready1 : lobby.ready2;
  byId(btnReady).text(isPlayerReady ? "¡Listo!" : "Presiona para empezar");
  // Update waiting "Player" tag. Put an empty string if there's no other player
  byId(playerUsername).text(lobby[rival] ? lobby[rival].name : "");
  // Update lobbyId
  byId(gameId).text(lobby.roomId);
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
      if (lobby.ready1 && lobby.ready2) {
        // create the game
        let resp = {};
        try {
          resp = await API.game.startNewGame(lobby.player1, lobby.player2);
        } catch (error) {
          console.log(error);
        }
        const game = resp.data;
        // TODO: pass game id and go to game screen
      } else {
        updateFrontend(lobby);
        setTimeout(refreshGame, 1000);
      }
    }
  }
  refreshGame();
});
