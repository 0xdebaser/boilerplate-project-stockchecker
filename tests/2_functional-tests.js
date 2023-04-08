const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  const baseUrl = "/api/stock-prices";
  const testStocks = ["JNJ", "UNH", "V"];
  let originalLikes, originalRelLikes;

  test("Viewing one stock: GET request to /api/stock-prices/", async () => {
    const res = await chai
      .request(server)
      .get(`${baseUrl}?stock=${testStocks[0]}`);
    const data = await JSON.parse(res.text);
    assert.equal(res.status, 200);
    assert.isObject(data);
    assert.hasAllKeys(data, "stockData");
    assert.hasAllKeys(data.stockData, ["stock", "price", "likes"]);
    //originalLikes = data.stockData.likes;
  });

  test("Viewing one stock and liking it: GET request to /api/stock-prices/", async () => {
    const res = await chai
      .request(server)
      .get(`${baseUrl}?stock=${testStocks[0]}&like=true`);
    const data = await JSON.parse(res.text);
    assert.isObject(data);
    assert.hasAllKeys(data, "stockData");
    assert.hasAllKeys(
      data.stockData,
      ["stock", "price", "likes"],
      "Response object is missing required key."
    );
    // assert.equal(
    //   data.stockData.likes,
    //   originalLikes + 1,
    //   "Likes did not update!"
    // );
  });

  test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", async () => {
    const res = await chai
      .request(server)
      .get(`${baseUrl}?stock=${testStocks[0]}&like=true`);
    const data = await JSON.parse(res.text);
    assert.isObject(data);
    assert.hasAllKeys(
      data,
      "stockData",
      "Response object is missing required key."
    );
    assert.hasAllKeys(
      data.stockData,
      ["stock", "price", "likes"],
      "Response object is missing required key."
    );
    // assert.equal(
    //   data.stockData.likes,
    //   originalLikes + 1,
    //   "Likes updated for dup IP address!"
    // );
  });

  test("Viewing two stocks: GET request to /api/stock-prices/", async () => {
    const res = await chai
      .request(server)
      .get(`${baseUrl}?stock=${testStocks[1]}&stock=${testStocks[2]}`);
    const data = await JSON.parse(res.text);
    assert.isObject(data);
    assert.isArray(data.stockData);
    assert.hasAllKeys(
      data.stockData[0],
      ["stock", "price", "rel_likes"],
      "Response object is missing required key."
    );
    assert.hasAllKeys(
      data.stockData[1],
      ["stock", "price", "rel_likes"],
      "Response object is missing required key."
    );
    originalRelLikes = [
      data.stockData[0].rel_likes,
      data.stockData[1].rel_likes,
    ];
  });

  test("Viewing two stocks and liking them: GET request to /api/stock-prices/", async () => {
    const res = await chai
      .request(server)
      .get(
        `${baseUrl}?stock=${testStocks[1]}&stock=${testStocks[2]}&like=true`
      );
    const data = await JSON.parse(res.text);
    console.log("data:", data);
    assert.isObject(data);
    assert.isArray(data.stockData);
    assert.hasAllKeys(
      data.stockData[0],
      ["stock", "price", "rel_likes"],
      "Response object is missing required key."
    );
    assert.hasAllKeys(
      data.stockData[1],
      ["stock", "price", "rel_likes"],
      "Response object is missing required key."
    );
    assert.equal(data.stockData[0].rel_likes, originalRelLikes[0]);
    assert.equal(data.stockData[1].rel_likes, originalRelLikes[1]);
  });
  after(function () {
    chai.request(server).get("/");
  });
});
