function byId(itemId) {
  return $(`#${itemId}`);
}

function updateFrontend(game) {}

$(document).ready(async () => {
  const gameId = localStorage.getItem("game-id");

  // Refresh lobby until both players are ready
  async function refreshGame() {
    let resp = {};
    try {
      resp = await API.game.getGameState(gameId);
    } catch (error) {
      console.log(error);
    }
    const game = resp.data;
    updateFrontend(game);
    setTimeout(refreshGame, 5000);
  }
  refreshGame();
});
