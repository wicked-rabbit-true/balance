require('dotenv').config(); // Load environment variables from .env file
const axios = require("axios");
const crypto = require("crypto");
const express = require('express');
const app = express();

const baseFutureUrl = "https://futures.mexc.com";
const endpoint_get_balance = "/api/v1/private/account/tiered_fee_rate";
const endpoint_estimated_balance = "https://www.mexc.com/api/platform/asset/api/asset/overview/convert/v2";

const PORT = process.env.PORT || 5000; // Use PORT from .env or default to 5000
const key = process.env.SECRET_KEY; // Access the secret key

function md5(value) {
  return crypto.createHash("md5").update(value, "utf8").digest("hex");
}

function mexcCrypto(key, obj) {
  const dateNow = String(Date.now());
  const g = md5(key + dateNow).substring(7);
  const s = JSON.stringify(obj);
  const sign = md5(dateNow + s + g);
  return { time: dateNow, sign: sign };
}

async function getWalletBalance() {
  const obj = {};

  const signature = mexcCrypto(key, obj);

  const queryString = `nonce=${signature.time}`;

  const headers = {
    "Content-Type": "application/json",
    "x-mxc-sign": signature.sign,
    "x-mxc-nonce": signature.time,
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    Authorization: key,
  };
  try {
    const response = await axios.get(
      `${baseFutureUrl}${endpoint_get_balance}?${queryString}`,
      {
        headers,
      }
    );
    if (response.data?.data?.walletBalance) {
        console.log("future", response.data.data)
      return response.data.data.walletBalance;
    } else {
      return 0;
    }
  } catch (error) {
    console.error(
      "Error fetching tiered fee rate:",
      error.response ? error.response.data : error.message
    );
    return 0;
  }
}

async function getEstimatedBalance() {

    // Define the request URL and other parameters
    const url = 'https://www.mexc.com/api/platform/asset/api/asset/overview/convert/v2';

    const headers = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': `u_id=${key};`,
        'Language': 'en-US',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'X-MXC-SIGN': '',  // Add signature if needed
        'X-MXC-NONCE': '', // Add nonce if needed
    };

    try {
        const response  = await axios.get(url, { headers });

        const usdtData = response.data.data.find(item => item.currency === 'USDT');
        console.log('Response:', usdtData.total);
        if (usdtData?.total) {
          return usdtData.total;
        } else {
          return 0;
        }
      } catch (error) {
        console.error(
          "Error fetching tiered fee rate:",
          error.response ? error.response.data : error.message
        );
        return 0;
      }
  }
  

  
app.get('/', async (req, res) => {
      const totalBalance = await getEstimatedBalance();
    const futureBalance = await getWalletBalance();
    res.send(`total is ${totalBalance} \n future is ${futureBalance}`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});