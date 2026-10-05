if ($('#loginForm')) {

  $('#loginForm').onsubmit =
    async e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      const { error } =
        await client.auth.signInWithPassword({
          email: f.get('email'),
          password: f.get('password')
        });

      if (error) {

        $('#loginMsg').textContent =
          error.message;
      }
    };
}
