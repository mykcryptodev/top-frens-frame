import { baseSepolia } from "viem/chains";
import { CONTRACT_ADDRESS } from ".";

export const removeTopFren = async (userFid: number, frenToRemoveFid: number) => {
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
        functionName: "removeTopFrenByFid",
        args: [
          userFid,
          frenToRemoveFid
        ],
      }),
    },
  );
};

export default removeTopFren;