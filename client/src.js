let axios = require("axios");
let time_to_check = 5000;

let get_current_game_state = async (render_template) => {
  return async (gameId) => {
    let game_state = await axios.get(`/gameState/${gameId}`);
    render_template(game_state);
    do_check();
  };
};

let do_move = (_move_template) => {
  return async (move, gameId, playerId) => {
    let move_made = await axios.post(`/move/${gameId}/${playerId}`, move);
    // move_template(move_made);
    // render move
  };
};

let do_check = () => {
  setTimeout(time_to_check, get_current_game_state(render_current_state)(10));
};

let render_current_state = (current_game_state) => {
  // logic to render the game state
};

// {
//   player_turn: 1,
//   players: {
//     1: {},
//     2: {}
//   }
// }

class Commands {
  constructor(gameCollection) {
    this.gameCollection = gameCollection;
    this.item_functions = {
      potion: function (game, player, target) {
        // get pokemon target from player
        // apply potion to pokemon
        // save pokemon to game state
        return game;
      },
      active_pokemon: function () {},
    };
  }
  async use_item({ player, gameId, item, target, extra_stuff }) {
    let game = await this.gameCollection.get({ _id: gameId });
    let player = game.get(player);
    return await this.item_functions[item.type](game, player, target);
  }
  attack() {}
  draw_card() {}
  get_price() {}
  use_energy() {}
}

let data = {
  player: 1,
  gameId: 10,
  item: "potion",
  target: "bulbasaur",
};
let command = new Commands(gameCollection);
command.use_item(data);
