
import { abi } from "../abi/topfrens";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACT_ADDRESS } from ".";
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount(process.env.PRIVATE_KEY! as `0x${string}`);
const viemClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
});

export const removeTopFren = async (userFid: number, frenToRemoveFid: number) => {
  console.log("we are writing...")
  const hash = await viemClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "removeTopFrenByFid",
    args: [BigInt(userFid), BigInt(frenToRemoveFid)]
  });
  console.log("hash", hash);
};

export default removeTopFren;