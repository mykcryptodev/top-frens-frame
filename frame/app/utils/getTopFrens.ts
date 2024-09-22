
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { abi } from "../abi/topfrens";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACT_ADDRESS } from ".";

const viemClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export const getTopFrens = async (userFid: number) => {
  const topFrenFids = (await viemClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getTopFrensFidsByFid",
    args: [BigInt(userFid)],
  }));

  if (!topFrenFids || topFrenFids.length === 0) return [];
  
  return (await neynarClient.fetchBulkUsers(topFrenFids.map(Number))).users;
};

export default getTopFrens;