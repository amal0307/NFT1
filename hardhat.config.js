require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: "https://eth-sepolia.alchemyapi.io/v2/9cab5caee0f44c200c97", // Replace with your Alchemy API URL
      accounts: ["30b064a1be9570da5e86d1419e6517a8e69149336b068a587eed4c42422c9472"], // Replace with your actual private key
    },
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
