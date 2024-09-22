
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { normalize } from "viem/ens";
import { CONTRACT_ADDRESS } from ".";
import { abi } from "../abi/topfrens";

const viemClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const baseViemClient = createPublicClient({
  chain: base,
  transport: http(),
});

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export const getUser = async (userFid: number) => {
  return (await neynarClient.fetchBulkUsers([userFid])).users[0];
};

export const getUserByInput = async (input: string) => {
  try {
    // if the input a number, assume it's a fid
    if (!isNaN(Number(input))) {
      return await getUser(Number(input));
    }
    if (input.includes(".base.eth")) {
      // it is a basename - let's get the address
      const address = await baseViemClient.getEnsAddress({ 
        name: normalize(input),
        universalResolverAddress: "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD"
      });
      console.log({ address, input });
      if (!address) {
        return null;
      }
      // use our contract to get the fid from the address
      const fid = (await viemClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "getFid",
        args: [address as `0x${string}`],
      }));
      return await getUser(Number(fid));
    }
    // otherwise it is a username
    const user = (await neynarClient.searchUser(input)).result.users[0];
    return user;
  } catch (e) {
    throw new Error("User not found");
  }
}

export default getUser;