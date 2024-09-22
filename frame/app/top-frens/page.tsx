import { createExampleURL } from "../utils";
import type { Metadata } from "next";
import { fetchMetadata } from "frames.js/next";
import { Frame } from "../components/Frame";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Top 8",
    other: {
      ...(await fetchMetadata(createExampleURL("/top-frens/frames"))),
    },
  };
}

export default async function Home() {
  const metadata = await generateMetadata();

  return (
    <Frame
      metadata={metadata}
      url={createExampleURL("/top-frens/frames")}
    />
  );
}
