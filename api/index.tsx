import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { createNeynar } from "frog/middlewares";
import { handle } from "frog/vercel";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { createSystem, colors } from "frog/ui";
import dotenv from "dotenv";
dotenv.config();

const { Image, Box, Heading, Text, VStack, HStack, vars } = createSystem({
  colors: {
    ...colors.light,
    myspaceOrangeBg: "#f9ca94",
    myspaceOrangeText: "#be7243",
    myspaceBlueText: "#548cc4",
  },
  fonts: {
    default: [
      {
        name: "Open Sans",
        source: "google",
        weight: 400,
      },
      {
        name: "Open Sans",
        source: "google",
        weight: 700,
      }
    ]
  }
});
const unknownImage =
  "https://api-private.atlassian.com/users/6b5c1609134a5887d7f3ab1b73557664/avatar";

// Assuming you have an ABI for the TopFrens contract
import { abi } from "../abi/topfrens.js";

// Replace with your actual contract address and RPC URL
const CONTRACT_ADDRESS = "0x3D272fb9699A3Dd8937ebdF8FeD1868ded931Bc2" as const;
// const RPC_URL = 'https://...'

const viemClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);
const neynar = createNeynar({ apiKey: process.env.NEYNAR_API_KEY! });

const resize = (url: string | undefined, size: number) => {
  if (!url) return null;
  let newUrl = url
    .replace("/original", `/anim=false,fit=contain,f=auto,w=${size}`)
    .replace(/w(_|\=)\d+/, `w$1${size}`);

  if (newUrl.includes("googleusercontent.com")) {
    newUrl = `${newUrl}=s${size}`;
  }

  if (newUrl.includes("w_256")) {
    newUrl = newUrl.replace("w_256", `w_${size}`);
  }
  console.log({ newUrl });
  return newUrl;
};

// New function to get and display top friends
async function getTopFriendsDisplay(fid: number, pageNumber: number) {
  const start = (pageNumber - 1) * 4;
  const end = pageNumber * 4;

  try {
    const topFrenFids = (await viemClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "getTopFrensFidsByFid",
      args: [BigInt(fid)],
    })) as bigint[];

    const usersFetch = await neynarClient.fetchBulkUsers([
      Number(fid),
      ...topFrenFids.map(Number),
    ]);
    const user = usersFetch.users[0];
    const userFrens = usersFetch.users.slice(1);

    return (
      <VStack paddingTop="8">
        <Box 
          paddingLeft="20"
          paddingTop={"10"}
          paddingBottom={"10"}
          backgroundColor={"myspaceOrangeBg"} 
          marginBottom={"10"}
        >
          <Text
            weight="700"
            color={"myspaceOrangeText"} 
          >
            {user.username.charAt(0).toUpperCase() + user.username.slice(1)}'s Friend Space
          </Text>
        </Box>
        <HStack justifyContent="space-between" width="100%" paddingLeft={"20"} paddingRight={"20"}>
          {userFrens.slice(start, end).map((user) => (
            <Box>
              <Text align="center" weight="700" color="blue900">
                {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
              </Text>
              <Box borderColor={"blue800"} borderWidth={"2"}>
                <Image
                  src={resize(user.pfp_url, 48) ?? unknownImage}
                  height={"96"}
                  width={"96"}
                />
              </Box>
            </Box>
          ))}
        </HStack>
      </VStack>
    );
  } catch (error) {
    console.error("Error fetching top frens:", error);
    throw error;
  }
}

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // Supply a Hub to enable frame verification.
  hub: neynar.hub({ apiKey: process.env.NEYNAR_API_KEY! }),
  title: "Top Frens",
  ui: { vars },
}).use(
  neynar.middleware({
    features: ["interactor", "cast"],
  })
);

app.frame("/", async (c) => {
  const myk = 217248;
  const topFriendsDisplay = await getTopFriendsDisplay(Number(myk), 1);

  return c.res({
    image: (topFriendsDisplay),
    intents: [
      <Button value="View" action="/my-top-frens">
        View My Top 8
      </Button>,
    ],
  });
});

// New endpoint that takes FID from the URL
app.frame("/fid/:fid", async (c) => {
  const fid = c.req.param("fid");

  if (!fid || isNaN(Number(fid))) {
    return c.res({
      image: (
        <Box
          grow
          alignVertical="center"
          backgroundColor="background"
          padding="32"
        >
          <VStack
            grow
            alignVertical="center"
            backgroundColor="background"
            padding="32"
          >
            <Text>Invalid FID. Please provide a valid number in the URL.</Text>
          </VStack>
        </Box>
      ),
      intents: [<Button action="/">Go to Home</Button>],
    });
  }

  try {
    const topFriendsDisplay = await getTopFriendsDisplay(Number(fid), 1);
    return c.res({
      image: topFriendsDisplay,
      intents: [
        <Button action="/">Search Another</Button>,
        <Button action="/fid/217248">View My Top 8</Button>,
      ],
    });
  } catch (error) {
    return c.res({
      image: (
        <Box
          grow
          alignVertical="center"
          backgroundColor="background"
          padding="32"
        >
          <VStack
            grow
            alignVertical="center"
            backgroundColor="background"
            padding="32"
          >
            <Text>Error fetching top frens. Please try again.</Text>
          </VStack>
        </Box>
      ),
      intents: [<Button action="/">Go to Home</Button>],
    });
  }
});

app.frame("my-top-frens", async (c) => {
  const userFid = c.var.interactor?.fid;

  if (!userFid) {
    return c.res({
      image: (
        <Box
          grow
          alignVertical="center"
          backgroundColor="background"
          padding="32"
        >
          <VStack
            grow
            alignVertical="center"
            backgroundColor="background"
            padding="32"
          >
            <Text>Invalid FID. Please provide a valid number in the URL.</Text>
          </VStack>
        </Box>
      ),
      intents: [<Button action="/">Go to Home</Button>],
    });
  }

  try {
    const topFriendsDisplay = await getTopFriendsDisplay(userFid, 1);
    return c.res({
      image: topFriendsDisplay,
      intents: [
        <Button action="/">Search Another</Button>,
        <Button action="/fid/217248">View My Top 8</Button>,
      ],
    });
  } catch (error) {
    return c.res({
      image: (
        <Box
          grow
          alignVertical="center"
          backgroundColor="background"
          padding="32"
        >
          <VStack
            grow
            alignVertical="center"
            backgroundColor="background"
            padding="32"
          >
            <Text>Error fetching top frens. Please try again.</Text>
          </VStack>
        </Box>
      ),
      intents: [<Button action="/">Try Again</Button>],
    });
  }
})

app.transaction('/addFren', (c) => {
  const { inputText } = c
  const fid = BigInt(inputText!)
  // Contract transaction response.
  return c.contract({
    abi,
    chainId: 'eip155:84532',
    functionName: 'addTopFrenByMsgSenderAndFid',
    args: [BigInt(fid)],
    to: CONTRACT_ADDRESS,
  })
})

const isProduction = import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
