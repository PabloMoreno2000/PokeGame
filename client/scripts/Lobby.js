const lobbyId = "lobby-number";
const btnReady = "button-ready";
function byId(itemId) {
  return $(`#${itemId}`);
}

function updateFrontend(lobby)
{
    
}

$(document).ready(async () => {
    const lobbyNumber = byId(lobbyId).val();
    byId(btnReady).click(async () => {
        await API.lobby.setReady(lobbyNumber);
    });

  longPolling = async () => {
    
    let resp = {}
    try {
        resp = await API.lobby.getState(lobbyNumber)
    } catch (error) {
        console.log(error)
    }
    return resp
  };

  function refreshGame (){
      const resp = await longPolling();
      //la promesa del gameUpdate
      if(!resp.data){
          // error
      }
      else{
          const lobby = resp.data;
          if(lobby.ready1 && lobby.ready2){
            // create the game
          }
          else {
            updateFrontend(lobby);
            setTimeout(refreshGame,5000);
          }
      }
  }
  refreshGame();
});
