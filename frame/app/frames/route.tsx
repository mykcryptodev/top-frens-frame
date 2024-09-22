import { farcasterHubContext } from "frames.js/middleware";
import { createFrames, Button } from "frames.js/next";
import { neynarValidate } from "frames.js/middleware/neynar";
import getTopFrens from "../utils/getTopFrens";
import resizeImage from "../utils/resizeImage";
import getUser, { getUserByInput } from "../utils/getUser";
import removeTopFren from "../utils/removeTopFren";
import addTopFren from "../utils/addTopFren";

const frames = createFrames({
  basePath: "/frames",
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
  console.log({
    ctx: ctx.message?.action.interactor,
    requesterFid: ctx.message?.requesterFid,
    action : ctx.searchParams.action,
    input: ctx.message?.action.input?.text,
  });
  const action = ctx.searchParams.action;
  const inputText = ctx.message?.action.input?.text;
  const userFid = ctx.message?.action.interactor.fid;
  const user = await getUser(userFid ?? 217248);
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
    if (userFid && action === "add") {
      return "Username or basename.base.eth";
    }
    if (userFid && action === "remove") {
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
        <Button action="post">Share</Button>,
      ];
    }
    if (userFid && action === "add") {
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
    if (userFid && action === "remove") {
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
    const truncateCount = action === "remove" ? 6 : 10;
    const truncatedName =
      name.length > truncateCount
        ? name.slice(0, truncateCount - 3) + "..."
        : name;
    if (action === "remove") {
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
            <div tw="flex gap-2 w-full">
              <div tw="truncate mx-auto">{error}</div>
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
            Fren Space
          </div>
          <div tw="flex gap-2 w-full justify-around">
            {topFrens.slice(0, 4).map((fren, index) => (
              <div key={fren.fid} tw="flex flex-col justify-center w-64 h-64">
                <div tw="truncate mx-auto text-[#23376d]">
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
          <div tw="flex gap-2 w-full justify-around">
            {topFrens.slice(4, 8).map((fren) => (
              <div key={fren.fid} tw="flex flex-col justify-center w-64 h-64">
                <div tw="truncate mx-auto text-[#23376d] flex">
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
