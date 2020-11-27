const createGame = "create-game";
const joinGame = "join-game";
const lobbyInput = "lobby-id-input";

function byId(itemId) {
  return $(`#${itemId}`);
}

$(document).ready(async () => {
  async function joinLobby(lobbyId) {
    // Put player in lobby
    const resp = await API.lobby.joinLobby(lobbyId);
    // Save lobby id
    localStorage.setItem("lobby-id", lobbyId);
    console.log(resp);
    // Go to lobby window
    window.location.replace("../Lobby.html");
  }

  byId(createGame).click(async () => {
    // Create lobby
    const lobby = await API.lobby.createLobby();
    await joinLobby(lobby.data.roomId);
  });

  byId(joinGame).click(async () => {
    try {
      // Get lobby
      const lobbyId = byId(lobbyInput).val();
      await joinLobby(lobbyId);
    } catch (error) {
      alert("Lobby id not found");
    }
  });
});
