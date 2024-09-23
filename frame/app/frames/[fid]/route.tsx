import { farcasterHubContext } from "frames.js/middleware";
import { createFrames, Button } from "frames.js/next";
import { neynarValidate } from "frames.js/middleware/neynar";
import getTopFrens from "../../utils/getTopFrens";
import resizeImage from "../../utils/resizeImage";
import getUser, { getUserByInput } from "../../utils/getUser";
import removeTopFren from "../../utils/removeTopFren";
import addTopFren from "../../utils/addTopFren";
import { createExampleURL } from "@/app/utils";

const frames = createFrames({
  basePath: "/frames/:fid",
  imagesRoute: "/",
  middleware: [
    farcasterHubContext({
      // remove if you aren't using @frames.js/debugger or you just don't want to use the debugger hub
      ...(process.env.NODE_ENV === "production"
        ? {}
        : {
            hubHttpUrl: "http://localhost:3010/hub",
          }),
    }),
    neynarValidate({
      API_KEY: process.env.NEYNAR_API_KEY!,
    }),
  ],
});

const handleRequest = frames(async (ctx) => {
  console.log(JSON.stringify(ctx));
  const action = ctx.searchParams.action;
  const inputText = ctx.message?.action.input?.text;
  const userFid = ctx.message?.action.interactor.fid;
  
  const routeFid = ctx.searchParams?.fid ? parseInt(ctx.searchParams.fid as string) : undefined;
  const targetFid = routeFid || userFid || 217248; // default to myk

  const user = await getUser(targetFid);
  const topFrens = await getTopFrens(user.fid);

  let error: string;

  if (userFid && action === "submit-remove") {
    if (!isNaN(Number(inputText))) {
      const userToRemoveIndex = Number(inputText) - 1;
      const userToRemove = topFrens[userToRemoveIndex];
      removeTopFren(userFid, userToRemove.fid);
      // remove that fren from the topFrens array
      topFrens.splice(userToRemoveIndex, 1);
    }
  }

  if (userFid && action === "submit-add" && inputText) {
    try {
      const userToAdd = await getUserByInput(inputText);
      if (userToAdd) {
        addTopFren(userFid, userToAdd.fid);
        // add that fren to the topFrens array
        topFrens.push(userToAdd);
      }
    } catch (e) {
      error = "User not found";
    }
  }

  const getTextInput = () => {
    if (userFid && (action === "add" || action === "submit-add")) {
      return "Username or basename.base.eth";
    }
    if (userFid && (action === "remove" || action === "submit-remove")) {
      return "Enter fren's number to remove";
    }
    return undefined;
  };

  const getButtons = () => {
    if (userFid && action === "choose") {
      return [
        <Button action="post" target={{ query: { action: "add" } }}>
          Add
        </Button>,
        <Button action="post" target={{ query: { action: "remove" } }}>
          Remove
        </Button>,
        <Button 
          action="link"
          target={`https://warpcast.com/~/compose?text=My%20top%208!%0A%0A%0Acopy%20paste%20this%20url%20into%20the%20custom%20frame%20url%20input%20if%20you%20want%20to%20add%20it%20to%20your%20basename%20profile%21%0A${encodeURIComponent(createExampleURL(`/frames?fid=${userFid}`))}&embeds[]=${encodeURIComponent(createExampleURL(`/frames?fid=${userFid}`))}`}
        >
          Share
        </Button>,
      ];
    }
    if (userFid && (action === "add" || action === "submit-add")) {
      return [
        <Button
          action="post"
          target={{
            query: {
              action: "choose",
            },
          }}
        >
          Go Back
        </Button>,
        <Button action="post" target={{ query: { action: "submit-add" } }}>
          Add
        </Button>,
      ];
    }
    if (userFid && (action === "remove" || action === "submit-remove")) {
      return [
        <Button
          action="post"
          target={{
            query: {
              action: "choose",
            },
          }}
        >
          Go Back
        </Button>,
        <Button
          action="post"
          target={{
            query: {
              action: "submit-remove",
            },
          }}
        >
          Remove
        </Button>,
      ];
    }
    return [
      <Button
        action="post"
        target={{
          query: {
            action: "choose",
          },
        }}
      >
        Choose My Top 8
      </Button>,
    ];
  };

  const getFrenName = (name: string, index: number) => {
    const truncateCount = (action === "remove" || action === "submit-remove") ? 6 : 10;
    const truncatedName =
      name.length > truncateCount
        ? name.slice(0, truncateCount - 3) + "..."
        : name;
    if (action === "remove" || action === "submit-remove") {
      return `${index + 1}: ${truncatedName}`;
    }
    return truncatedName;
  };

  const getImage = () => {
    if (error) {
      return (
        <div tw="flex">
          <div tw="flex flex-col p-10">
            <h1>Error</h1>
            <div tw="flex w-full">
              <div tw="mx-auto">{error}</div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div tw="flex w-full">
        <div tw="flex flex-col w-full">
          <div
            tw="flex bg-[#f9ca94] px-10 py-2 font-bold text-[#be7243] w-full"
            style={{ fontWeight: 700 }}
          >
            {user.username.charAt(0).toUpperCase() + user.username.slice(1)}'s
            Top 8 Fren Space
          </div>
          <div tw="flex w-full justify-around">
            {topFrens.slice(0, 4).map((fren, index) => (
              <div key={fren.fid} tw="flex flex-col justify-center w-64 h-64">
                <div tw="mx-auto text-[#23376d]">
                  {getFrenName(fren.username, topFrens.indexOf(fren))}
                </div>
                <img
                  src={resizeImage(fren.pfp_url, 48)}
                  tw="mx-auto border-[#23376d] border-4"
                  alt={fren.username}
                  width="180"
                  height="180"
                />
              </div>
            ))}
          </div>
          <div tw="flex w-full justify-around">
            {topFrens.slice(4, 8).map((fren) => (
              <div key={fren.fid} tw="flex flex-col justify-center w-64 h-64">
                <div tw="mx-auto text-[#23376d] flex">
                  {getFrenName(fren.username, topFrens.indexOf(fren))}
                </div>
                <img
                  src={resizeImage(fren.pfp_url, 48)}
                  tw="mx-auto border-[#23376d] border-4"
                  alt={fren.username}
                  width="180"
                  height="180"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return {
    image: getImage(),
    textInput: getTextInput(),
    buttons: getButtons(),
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
