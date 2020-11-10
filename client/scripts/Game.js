function byId(itemId) {
  return $(`#${itemId}`);
}

function getMatchInfo(game) {
  const username = localStorage.getItem("username");
  const player = username == game.player1.name ? "player1" : "player2";
  const rival = player == "player1" ? "player2" : "player1";
  const isPlayerReady = player == "player1" ? game.ready1 : game.ready2;
  localStorage.setItem("player", player);
  return { username, player, rival, isPlayerReady };
}

function setModalInfo(bodyNode, titleText, footerNode = null) {
  $("#modal-body").empty();
  $("#modal-title").empty();
  $("#modal-footer").empty();
  $("#modal-body").append(bodyNode);
  $("#modal-title").text(titleText);
  if (footerNode) {
    $("#modal-footer").append(footerNode);
  }
}

/*
  const pokemon = {
    name: "",
    photo: "",
    pokemonInfo: {
      attacks: [
        {
          damage: 30,
          energy: 1,
          name: "nameattack",
        }, // x2
      ],
      currEnergy: 0,
      currHp: 140,
      maxHp: 140,
    },
  };

  */
//name, weight, experience, height, types, img
let get_pokemon_card = (pokemon) => {
  /*
function displayOverlay(text) {
    $("<table id='overlay'><tbody><tr><td>" + text + "</td></tr></tbody></table>").css({
        "position": "fixed",
        "top": "0px",
        "left": "0px",
        "width": "100%",
        "height": "100%",
        "background-color": "rgba(0,0,0,.5)",
        "z-index": "10000",
        "vertical-align": "middle",
        "text-align": "center",
        "color": "#fff",
        "font-size": "40px",
        "font-weight": "bold",
        "cursor": "wait"
    }).appendTo("body");
}

function removeOverlay() {
    $("#overlay").remove();
}

*/
  const { name, photo, pokemonInfo } = pokemon;
  const { currEnergy, currHp, maxHp } = pokemonInfo;

  let card = document.createElement("div");

  // Image
  let image = document.createElement("img");
  image.src = photo;
  image.style = "width: 250px; height: 300px;";
  image.setAttribute("data-toggle", "modal");
  image.setAttribute("data-target", "#exampleModal");
  image.classList.add("card-img-top");

  // Attacks
  let pokemonAttacks = document.createElement("div");
  pokemonAttacks.classList.add("list-group-item");
  pokemonInfo.attacks.forEach((attack) => {
    let attkDiv = document.createElement("div");
    attkDiv.innerText = `${attack.name} - Damage: ${attack.damage} - Energy: ${attack.energy}`;

    let attackButton = document.createElement("button");
    attackButton.classList.add("attack-btn");
    attackButton.innerHTML = `${attack.name}`;

    attkDiv.appendChild(attackButton);
    pokemonAttacks.appendChild(attkDiv);
  });

  image.addEventListener("click", (event) => {
    // Ask to put pokemon in bench
    let bodyInfo = document.createElement("div");
    bodyInfo.appendChild(
      document.createTextNode("Click the button to put pokemon to bench")
    );
    let benchButton = document.createElement("button");
    benchButton.className = "btn btn-primary";
    benchButton.innerHTML = "PUT";
    benchButton.addEventListener("click", async (event) => {
      try {
        // TODO: Put hand position
        let resp = await API.game.movePkmHandToBench(
          localStorage.getItem("game-id")
        );
        console.log(resp);
        alert("Pokemon moved");
      } catch (error) {
        console.log(error);
      }
    });
    setModalInfo(bodyInfo, `Adding ${name} to bench`, benchButton);

    // Add modal attack data when card image is clicked
    //setModalInfo(pokemonAttacks, "Choose an attack");
  });

  // Energy and HP
  let pokemonText = document.createElement("div");
  pokemonText.classList.add("card-tex");
  pokemonText.innerHTML = `Energy: ${currEnergy} - HP: ${currHp} - MaxHp: ${maxHp}`;

  card.appendChild(pokemonText);
  card.appendChild(image);
  return card;
};

/* ---------------------------- Update front end ---------------------------- */

function getItemCard(item) {}

let addPokemonToHand = (templateFunct, pokeCard) => {
  let mainPlayer = document.querySelector("#main-player");
  let hand = mainPlayer.querySelector("#Hand");

  //delete last cards to update

  if (pokeCard.type.name == "pokemon") {
    let cardItem = templateFunct(pokeCard);
    hand.appendChild(cardItem);
  }
};

function updateFrontend(game) {
  const { player, rival } = getMatchInfo(game);
  let mainPlayer = document.querySelector("#main-player");
  let hand = mainPlayer.querySelector("#Hand");
  while (hand.firstChild) {
    hand.lastChild.remove();
  }
  // Put info of main player
  const playerInfo = game[player];
  // Render cards in hand
  playerInfo.hand.forEach((card) => {
    addPokemonToHand(get_pokemon_card, card);
  });
}

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
