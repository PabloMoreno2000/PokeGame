const createGame = "create-game";
const joinGame = "join-game";

function byId(itemId) {
  return $(`#${itemId}`);
}

$(document).ready(async () => {
  byId(createGame).click(async () => {
    // Create lobby
    const lobby = await API.lobby.createLobby();
    // Put player in lobby
    const resp = await API.lobby.joinLobby(lobby.data.roomId);
    // Save lobby id
    localStorage.setItem("lobby-id", lobby.data.roomId);
    console.log(resp);
    // TODO: Go to lobby window
    window.location.replace("../Lobby.html");
  });
});
