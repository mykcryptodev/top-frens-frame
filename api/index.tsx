import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { neynar } from 'frog/hubs'
import { handle } from 'frog/vercel'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import dotenv from 'dotenv';
dotenv.config();

// Assuming you have an ABI for the TopFrens contract
import { abi } from '../abi/topfrens.js'

// Replace with your actual contract address and RPC URL
const CONTRACT_ADDRESS = '0x63b763765d25f3d25f3652303f2624b2c3ef3e5f' as const
// const RPC_URL = 'https://...'

const viemClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
})

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);


export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  hub: neynar({ apiKey: process.env.NEYNAR_API_KEY! }),
  title: 'Top Frens',
})

app.frame('/', (c) => {
  const { buttonValue, inputText, status } = c
  const fid = inputText || buttonValue

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(to right, #432889, #17101F)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
            display: 'flex',
          }}
        >
          {status === 'response'
            ? `Viewing Top Frens for FID: ${fid}`
            : 'Enter an FID to view Top Frens'}
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter FID..." />,
      <Button value="View">View Top Frens</Button>,
    ],
  })
})

app.frame('/top-frens', async (c) => {
  const fid = c.inputText

  if (!fid || isNaN(Number(fid))) {
    return c.res({
      image: (
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            Invalid FID. Please enter a valid number.
          </div>
        </div>
      ),
      intents: [<Button.Reset>Go Back</Button.Reset>],
    })
  }

  try {
    const topFrenFids = await viemClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'getTopFrensFidsByFid',
      args: [BigInt(fid)],
    }) as bigint[]

    console.log({ topFrenFids });

    return c.res({
      image: (
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            Top Frens for FID {fid}:
            {topFrenFids.map((frenFid, index) => (
              <div style={{ display: "flex "}} key={index}>FID: {frenFid.toString()}</div>
            ))}
          </div>
        </div>
      ),
      intents: [<Button.Reset>Search Another</Button.Reset>],
    })
  } catch (error) {
    console.error('Error fetching top frens:', error)
    return c.res({
      image: (
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            Error fetching top frens. Please try again.
          </div>
        </div>
      ),
      intents: [<Button.Reset>Try Again</Button.Reset>],
    })
  }
})

// New endpoint that takes FID from the URL
app.frame('/fid/:fid', async (c) => {
  const fid = c.req.param('fid')

  if (!fid || isNaN(Number(fid))) {
    return c.res({
      image: (
        <div style={{
          alignItems: 'center',
          background: 'linear-gradient(to right, #432889, #17101F)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}>
          <div style={{
            color: 'white',
            fontSize: 40,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
            display: 'flex',
          }}>
            Invalid FID. Please provide a valid number in the URL.
          </div>
        </div>
      ),
      intents: [
        <Button action="/">Go to Home</Button>
      ],
    })
  }

  try {
    const topFrenFids = await viemClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'getTopFrensFidsByFid',
      args: [BigInt(fid)],
    }) as bigint[]

    const userFrens = await client.fetchBulkUsers(topFrenFids.map(Number));

    return c.res({
      image: (
        <div style={{
          alignItems: 'center',
          background: 'linear-gradient(to right, #432889, #17101F)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          padding: '20px',
        }}>
          <div style={{
            color: 'white',
            fontSize: 32,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 60px',
            whiteSpace: 'pre-wrap',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            Top Frens for FID {fid}:
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '20px',
              maxWidth: '600px',
            }}>
              {userFrens.users.slice(0, 8).map((user, index) => (
                <div key={index} style={{ 
                  fontSize: 32, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  width: '280px',
                  justifyContent: 'flex-start',
                }}>
                  <img 
                    src={user.pfp_url} 
                    alt={`${user.username}'s profile`} 
                    style={{ 
                      width: '72px', 
                      height: '72px', 
                      borderRadius: '50%' 
                    }} 
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      intents: [
        <Button action="/">Search Another</Button>
      ],
    })
  } catch (error) {
    console.error('Error fetching top frens:', error)
    return c.res({
      image: (
        <div style={{
          alignItems: 'center',
          background: 'linear-gradient(to right, #432889, #17101F)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}>
          <div style={{
            color: 'white',
            fontSize: 40,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
            display: 'flex',
          }}>
            Error fetching top frens. Please try again.
          </div>
        </div>
      ),
      intents: [
        <Button action="/">Go to Home</Button>
      ],
    })
  }
})

const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
