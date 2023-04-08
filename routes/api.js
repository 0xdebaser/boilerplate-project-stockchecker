"use strict";

const fetch = require("node-fetch");
const mongoose = require("mongoose");
const sha256 = require("js-sha256").sha256;

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const stockSchema = new mongoose.Schema({
  symbol: String,
  likes: {
    type: Array,
    default: [],
  },
});
const Stock = mongoose.model("Stock", stockSchema);

async function getStockPrice(ticker) {
  const response = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${ticker}/quote`
  );
  const data = await response.json();
  return data.latestPrice;
}

async function getLikes(ticker) {
  let stock = await Stock.findOne({ symbol: ticker });
  if (!stock) {
    const newStock = new Stock({ symbol: ticker, likes: [] });
    stock = await newStock.save();
  }
  return stock.likes.length;
}

async function addLike(ticker, ipAddress) {
  let stock = await Stock.findOne({ symbol: ticker });
  if (!stock) {
    const newStock = new Stock({ symbol: ticker, likes: [] });
    stock = await newStock.save();
  }
  const likes = stock.likes.slice();
  if (!likes.includes(ipAddress)) {
    console.log(`IP Address ${ipAddress} likes!`);
    likes.push(ipAddress);
    stock = await Stock.findOneAndUpdate({ symbol: ticker }, { likes });
  } else {
    console.log(`IP Address ${ipAddress} already likes!`);
  }
  return likes.length;
}

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    const { stock, like } = req.query;
    if (typeof stock === "string") {
      // Single stock handling
      const price = await getStockPrice(stock);
      let likes;
      if (like === "true") {
        const ipAddress = req.socket.remoteAddress;
        const hashedIpAddress = sha256(ipAddress);
        likes = await addLike(stock, hashedIpAddress);
      } else {
        likes = await getLikes(stock);
      }
      res.send(JSON.stringify({ stockData: { stock, price, likes } }));
    } else {
      // Two stock handling
      const price0 = await getStockPrice(stock[0]);
      let likes0;
      if (like === "true") {
        const ipAddress = req.socket.remoteAddress;
        const hashedIpAddress = sha256(ipAddress);
        likes0 = await addLike(stock[0], hashedIpAddress);
      } else {
        console.log("get likes");
        likes0 = await getLikes(stock[0]);
      }
      const price1 = await getStockPrice(stock[1]);
      let likes1;
      if (like === "true") {
        const ipAddress = req.socket.remoteAddress;
        const hashedIpAddress = sha256(ipAddress);
        likes1 = await addLike(stock[1], hashedIpAddress);
      } else {
        likes1 = await getLikes(stock[1]);
      }
      res.send(
        JSON.stringify({
          stockData: [
            {
              stock: stock[0],
              price: price0,
              rel_likes: likes0 - likes1,
            },
            {
              stock: stock[1],
              price: price1,
              rel_likes: likes1 - likes0,
            },
          ],
        })
      );
    }
  });
};
