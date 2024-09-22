/* eslint-disable react/jsx-key */
import getTopFrens from "@/app/utils/getTopFrens";
import { frames } from "../frames";
import { Button } from "frames.js/next";
import resizeImage from "@/app/utils/resizeImage";

export const POST = frames(async (ctx) => {
  const fid = ctx.searchParams.fid;
  const topFrens = await getTopFrens(fid ? Number(fid) : 217248);
  console.log({ topFrens });

  return {
    image: (
      <div tw="flex">
        <div tw="flex flex-col p-10">
          <h1>Top 8</h1>
          <div tw="flex gap-2 w-full">
            {topFrens.slice(0, 4).map((fren) => (
              <div key={fren.fid} tw="flex flex-col justify-center w-64 h-64">
                <div tw="truncate mx-auto overflow-ellipsis">
                  {fren.username}
                </div>
                <img
                  src={resizeImage(fren.pfp_url, 48)}
                  tw="mx-auto"
                  alt={fren.username}
                  width="128"
                  height="128"
                />
              </div>
            ))}
          </div>
          <div tw="flex gap-2 w-full">
            {topFrens.slice(4, 8).map((fren) => (
              <div key={fren.fid} tw="flex flex-col justify-center w-64 h-64">
                <div tw="truncate mx-auto overflow-ellipsis">
                  {fren.username}
                </div>
                <img
                  src={resizeImage(fren.pfp_url, 48)}
                  tw="mx-auto"
                  alt={fren.username}
                  width="128"
                  height="128"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    buttons: [
      <Button action="post" target="/">
        Go back
      </Button>,
      <Button action="post" target="/top-8?fid=217248">
        Go to 217248
      </Button>,
    ],
  };
});
