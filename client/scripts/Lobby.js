const btnReady = "button-ready";
function byId(itemId) {
  return $(`#${itemId}`);
}

function updateFrontend(lobby) {}

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
    //la promesa del gameUpdate
    if (!resp.data) {
      // error
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
        setTimeout(refreshGame, 5000);
      }
    }
  }
  refreshGame();
});
