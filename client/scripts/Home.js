const createGame = "create-game";
const joinGame = "join-game";

function byId(itemId) {
  return $(`#${itemId}`);
}

$(document).ready(async () => {
  byId(createGame).click(async () => {
    // Create lobby
    const lobby = await API.lobby.createLobby();
    console.log(lobby);
    // Put player in lobby
    await API.lobby.joinLobby(lobby.data.roomId);
    // TODO: Go to lobby window
  });
});
