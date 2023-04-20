const meli = require('mercadolibre');
require('dotenv').config();
const axios = require('axios');
const qs = require('querystring');


const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

const getAccessToken = async (code, redirectUri) => {
  const data = {
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: redirectUri,
  };
  
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  
  try {
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', qs.stringify(data), config);
    return response.data.access_token;
  } catch (error) {
    console.error(error);
  }
};

const getOrders = async (accessToken) => {
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  try {
    const response = await axios.get('https://api.mercadolibre.com/orders/search?seller=' + CLIENT_ID, config);
    return response.data.results;
  } catch (error) {
    console.error(error);
  }
};

// Exemplo de uso:
const code = 'seu_codigo_de_autorizacao';
const redirectUri = 'https://sua_url_de_redirecionamento.com';

getAccessToken(code, redirectUri)
  .then((accessToken) => {
    console.log(`Access token: ${accessToken}`);
    return getOrders(accessToken);
  })
  .then((orders) => {
    console.log(`Orders: ${JSON.stringify(orders)}`);
  });

const tokens = {
  access_token: null,
  expires: null,
};

const setTokens = (newTokens) => {
  const date = new Date();
  const time_threshold = 6; // o token do mercadolivre dura até 6 horas
  date.setHours(date.getHours() + time_threshold, 0, 0, 0);
  tokens.expires = date;
  tokens.access_token = newTokens.access_token;
};

const validateToken = (req, res, next) => {
  if (req.session.user) {
    if (!tokens.access_token || (new Date()) >= tokens.expires) {
      const redirect_uri = REDIRECT_URI + req.baseUrl + req.path;
      const { code } = req.query;
      const meliObject = new meli.Meli(CLIENT_ID, CLIENT_SECRET);
      if (code) {
        meliObject.authorize(code, redirect_uri, (error, response) => {
          if (error) {
            throw error;
          }
          setTokens(response);
          res.locals.access_token = tokens.access_token;
          res.redirect(redirect_uri);
        });
      } else {
        res.redirect(meliObject.getAuthURL(redirect_uri));
      }
    } else {
      res.locals.access_token = tokens.access_token;
      next();
    }
  } else {
    res.redirect('/');
  }
}

module.exports = {
  validateToken
};