const gameId = "gameId";
function byId(itemId) {
  return $(`#${itemId}`);
}

function updateFrontend(game) {}

$(document).ready(async () => {
  const gameNumber = byId(gameId).val();

  // Refresh lobby until both players are ready
  async function refreshGame() {
    let resp = {};
    try {
      resp = await API.game.getGameState(gameNumber);
    } catch (error) {
      console.log(error);
    }
    const game = resp.data;
    updateFrontend(game);
    setTimeout(refreshGame, 5000);
  }
  refreshGame();
});
