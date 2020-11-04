const usernameId = "username-input";
const passwordId = "password-input";
const btnLoginId = "login-button";
const formId = "form-login";

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
    } catch (error) {
      console.log(error);
      return;
    }
  });
});
