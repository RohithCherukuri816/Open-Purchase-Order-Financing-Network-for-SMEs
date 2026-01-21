const hre = require("hardhat");

async function main() {
    const POFinancing = await hre.ethers.getContractFactory("POFinancing");
    const poFinancing = await POFinancing.deploy();

    await poFinancing.waitForDeployment();

    console.log(`POFinancing deployed to: ${await poFinancing.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
