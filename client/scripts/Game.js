function byId(itemId) {
  return $(`#${itemId}`);
}

function getMatchInfo(game) {
  const username = localStorage.getItem("username");
  const player = localStorage.getItem("player");
  const rival = player == "player1" ? "player2" : "player1";
  const isPlayerReady = player == "player1" ? game.ready1 : game.ready2;
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

function htmlToNode(htmlText) {
  const node = document.createElement("template");
  node.innerHTML = htmlText.trim();
  return node.content.firstChild;
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
let get_pokemon_card = (pokemon, handPos, config = {}) => {
  const { name, photo, pokemonInfo } = pokemon;
  const { currEnergy, currHp, maxHp } = pokemonInfo;
  const modeClickHandlers = {
    hand: () => {
      // Ask to put pokemon in bench
      let bodyInfo = document.createElement("div");
      bodyInfo.appendChild(
        document.createTextNode("Click the button to put pokemon to bench")
      );
      let benchButton = document.createElement("button");
      benchButton.className = "btn btn-primary";
      benchButton.setAttribute("data-dismiss", "modal");
      benchButton.innerHTML = "Put";
      benchButton.addEventListener("click", async (event) => {
        let resp = {};
        try {
          // TODO: Put hand position
          resp = await API.game.movePkmHandToBench(
            localStorage.getItem("game-id"),
            handPos
          );
          console.log(resp);
          alert("Pokemon moved");
        } catch (error) {
          alert("Espera a que sea tu turno");
          console.log(error);
        }
      });
      setModalInfo(bodyInfo, `Adding ${name} to bench`, benchButton);

      // Add modal attack data when card image is clicked
      //setModalInfo(pokemonAttacks, "Choose an attack");
    },
    bench: () => {
      // Ask to put pokemon as active
      let bodyInfo = document.createElement("div");
      bodyInfo.appendChild(
        document.createTextNode("Click the button to put pokemon as active")
      );
      let benchButton = document.createElement("button");
      benchButton.className = "btn btn-primary";
      benchButton.setAttribute("data-dismiss", "modal");
      benchButton.innerHTML = "Put";
      benchButton.addEventListener("click", async (event) => {
        let resp = {};
        try {
          // TODO: Put hand position
          resp = await API.game.movePkmBenchToActive(
            localStorage.getItem("game-id"),
            // This would really be a bench pos in this case
            handPos
          );
          console.log(resp);
          alert("Pokemon moved");
        } catch (error) {
          alert("Espera a que sea tu turno y no tengas pkm activo");
          console.log(error);
        }
      });
      setModalInfo(bodyInfo, `Adding ${name} as active`, benchButton);
    },
  };

  // Default mode is to prepare a hand card. There's also bench and active
  const mode =
    config.mode && modeClickHandlers.hasOwnProperty(config.mode)
      ? config.mode
      : "hand";

  let card = document.createElement("div");

  // Image
  let image = document.createElement("img");
  image.src = photo;
  image.style = "width: 10rem";
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

  image.addEventListener("click", (event) => modeClickHandlers[mode]());

  // Energy and HP
  let pokemonText = document.createElement("div");
  pokemonText.classList.add("card-tex");
  pokemonText.innerHTML = `Energy: ${currEnergy} - HP: ${currHp} - MaxHp: ${maxHp}`;

  card.appendChild(pokemonText);
  card.appendChild(image);
  return card;
};

const get_normal_card = (card, handPos, config = {}) => {
  const type = card.type.name;
  const getNode = (gameCard, image, cardBody) => {
    return htmlToNode(`<div class="card" data-toggle="modal" data-target="#exampleModal" style="width: 10rem;">
        <img class="card-img-top" src="${image}" alt="Card image cap">
        <div class="card-body">
          <h5 class="card-title">${gameCard.name}</h5>
          <p class="card-text">${gameCard.description}</p>
          <div>${cardBody}</div>
        </div>
      </div>`);
  };

  // Other than pokemon, there are just item and energy cards
  const nodeByType = {
    item: (card) => {
      let cardBody = "";
      card.itemInfo.effects.forEach((effect) => {
        cardBody += `${effect.boost} points of ${effect.attribute}<br/>`;
      });
      const cardNode = getNode(
        card,
        "../images/potion.png",
        `<p>${cardBody}</p>`
      );
      const gameId = localStorage.getItem("game-id");

      // When the item card is clicked display a modal with a button to use the card
      cardNode.addEventListener("click", (event) => {
        try {
          let bodyInfo = document.createElement("div");
          bodyInfo.appendChild(
            document.createTextNode(
              "Click the button to use item in active pokemon"
            )
          );
          let itemButton = document.createElement("button");
          itemButton.className = "btn btn-primary";
          itemButton.innerHTML = "USE";
          itemButton.setAttribute("data-dismiss", "modal");
          itemButton.addEventListener("click", async (event) => {
            try {
              // TODO: Put hand position
              let resp = await API.game.useItemInActivePkm(gameId, handPos);
              console.log(resp);
              alert("Item used");
            } catch (error) {
              alert("Wait for your turn and pick and active pokemon");
              console.log(error);
            }
          });
          setModalInfo(bodyInfo, `Use ${card.name} in active pkm`, itemButton);
        } catch (error) {
          console.log(error);
        }
      });
      return cardNode;
    },
    energy: (card) => {
      return getNode(card, "../images/potion.png", "");
    },
  };

  if (!nodeByType.hasOwnProperty(type)) {
    return;
  }

  const cardNode = nodeByType[type](card);
  return cardNode;
};

/* ---------------------------- Update front end ---------------------------- */

function getItemCard(item) {}

let addCardToHand = (templateFunct, card, handPos, config = {}) => {
  let mainPlayer = document.querySelector("#main-player");
  let hand = mainPlayer.querySelector("#Hand");
  let cardItem = templateFunct(card, handPos, (config = {}));
  hand.appendChild(cardItem);
};

let addCardToBench = (templateFunct, card, handPos, config = {}) => {
  let mainPlayer = document.querySelector("#main-player");
  let hand = mainPlayer.querySelector("#Bench");
  let cardItem = templateFunct(card, handPos, config);
  hand.appendChild(cardItem);
};

function updateFrontend(game) {
  const { player, rival } = getMatchInfo(game);
  let mainPlayer = document.querySelector("#main-player");
  const nodesToClean = [
    mainPlayer.querySelector("#Hand"),
    mainPlayer.querySelector("#Bench"),
  ];
  nodesToClean.forEach((node) => {
    while (node.firstChild) {
      node.lastChild.remove();
    }
  });

  // Put info of main player
  const playerInfo = game[player];
  // Render cards in hand
  let handPos = 0;
  playerInfo.hand.forEach((card) => {
    if (card.type.name == "pokemon") {
      addCardToHand(get_pokemon_card, card, handPos, { mode: "hand" });
    } else {
      addCardToHand(get_normal_card, card, handPos);
    }
    handPos++;
  });

  handPos = 0;
  playerInfo.bench.forEach((card) => {
    console.log(card);
    addCardToBench(get_pokemon_card, card, handPos, { mode: "bench" });
    handPos++;
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
    console.log(game);
    updateFrontend(game);
    setTimeout(refreshGame, 1500);
  }
  refreshGame();
});
