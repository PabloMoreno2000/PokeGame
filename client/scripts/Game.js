function byId(itemId) {
  return $(`#${itemId}`);
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
  card.classList.add("card");

  // Image
  let image = document.createElement("img");
  image.src = photo;
  image.classList.add("card-img-top");

  // List separator
  let ulCard = document.createElement("div");
  ulCard.classList.add("list-group");
  ulCard.classList.add("list-group-flush");

  // Name
  let pokemonName = document.createElement("div");
  pokemonName.classList.add("list-group-item");
  let spanName = document.createElement("h5");
  spanName.innerText = name;
  pokemonName.appendChild(spanName);

  // Energy and HP
  let pokemonText = document.createElement("div");
  pokemonText.classList.add("card-tex");
  pokemonText.innerHTML = `Energy: ${currEnergy} - HP: ${currHp} - MaxHp: ${maxHp}`;

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

    /*
    Rawr x3 nuzzles how are you pounces on you you're so warm o3o notices you have a bulge o: someone's happy ;) nuzzles your necky wecky~ murr~ hehehe rubbies your bulgy wolgy you're so big :oooo rubbies more on your bulgy wolgy it doesn't stop growing ·///· kisses you and lickies your necky daddy likies (; nuzzles wuzzles I hope daddy really likes $:
    */
  });

  ulCard.appendChild(pokemonName);
  ulCard.appendChild(pokemonText);
  ulCard.appendChild(pokemonAttacks);
  card.appendChild(image);
  card.appendChild(ulCard);
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
  const player = localStorage.getItem("player");
  const rival = player == "player1" ? "player2" : "player1";
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
