const usernameId = "username-input";
const passwordId = "password-input";
const btnLoginId = "login-button";

function byId(itemId) {
  return $(`#${itemId}`);
}

$(document).ready(async () => {
  console.log("In ready doc");

  byId(btnLoginId).click(async () => {
    console.log("In btnLogin function");
    const username = byId(usernameId).val();
    const password = byId(passwordId).val();
    let res = {};
    try {
      res = await API.auth.postAuthUser(username, password);
      const token = res.data.token;
      localStorage.setItem("x-auth-token", token);
      localStorage.setItem("username", username);
      window.location.replace("../Home.html");
    } catch (error) {
      alert("Credentials not found");
      console.log(error);
      return;
    }
  });
});
