
import { baseSepolia } from "viem/chains";
import { CONTRACT_ADDRESS } from ".";

export const addTopFren = async (userFid: number, frenToAddFid: number) => {
  void fetch(
    `${process.env.ENGINE_URL!}/contract/${baseSepolia.id}/${CONTRACT_ADDRESS}/write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ENGINE_ACCESS_TOKEN!}`,
        "x-backend-wallet-address": `${process.env.ENGINE_WALLET_ADDRESS!}`,
      },
      body: JSON.stringify({
        functionName: "addTopFrenByFid",
        args: [
          userFid,
          frenToAddFid
        ],
      }),
    },
  );
};

export default addTopFren;