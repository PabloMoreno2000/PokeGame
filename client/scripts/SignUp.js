const usernameId = "username-input";
const emailId = "email-input";
const passwordId = "password-input";
const passwordConfId = "password-conf-input";
const btnSignupId = "signup-button";

function byId(itemId) {
  return $(`#${itemId}`);
}

$(document).ready(async () => {
  console.log("In ready doc");

  $(".form-horizontal").submit(function (evt) {
    evt.preventDefault();
  });

  byId(btnSignupId).click(async () => {
    console.log("In btnLogin function");
    const username = byId(usernameId).val();
    const email = byId(emailId).val();
    const password = byId(passwordId).val();
    const passwordConf = byId(passwordConfId).val();

    if (password != passwordConf) {
      alert("Las contraseñas no coinciden");
      return;
    }

    let res = {};
    try {
      res = await API.users.createUser(username, email, password);
      const token = res.data.token;
      localStorage.setItem("x-auth-token", token);
      localStorage.setItem("username", username);
      window.location.replace("../client/Home.html");
    } catch (error) {
      alert("Username/email already taken or invalid email");
      console.log(error);
      return;
    }
  });
});
