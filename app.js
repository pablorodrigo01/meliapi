app.get('/posts', validateToken, async (req, res) => {
  try {
    const meliObject = new MeliObject(res.locals.access_token);
    const user = await meliObject.get('/users/me');
    const items = (await meliObject.get(`/users/${user.id}/items/search`)).results || [];
    if (items.length) {
      const result = [];
      const promises = items.map(item_id => meliObject.get(`/items/${item_id}`));
      for await (item of promises) {
        result.push(item);
      }
      res.render('posts', { items: result });
    } else {
      res.status(404).send('no items were found :(');
    }
  } catch(err) {
    console.log('Something went wrong', err);
    res.status(500).send(`Error! ${err}`);
  }
});