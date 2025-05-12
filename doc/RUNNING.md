# RUNNING LittleApe

**LittleApe** is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

Preferred [Nodejs](https://nodejs.org/) version -> [16.17.0](https://nodejs.org/dist/v16.17.0).

## Initialization

1. Clone the project
2. Install all the dependencies using the following commands.

```bash
npm i
# or
yarn
```

## Development Environment

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Environment

```bash
npm run build
# or
yarn build
```

Then you need to start the Nextjs server to run the production server.

```bash
npm start
# or
yarn start
```

The project will be served on [http://localhost:3000](http://localhost:3000)

## Environment Variables

**LittleApe** needs a number of **environment variables** to get set:

```
NEXT_PUBLIC_API_BASE_URI=
NEXT_PUBLIC_HOST=
NEXT_PUBLIC_HANDLE=
NEXT_PUBLIC_THIRD_WEB_CLIENT_ID="REPLACE_ME"
NEXT_PUBLIC_ALCHAMEY_API_KEY=
NEXT_PUBLIC_IS_DEBUG_MODE="true"
NEXT_PUBLIC_LOGJAM_BASE_URL="https://logjam.example"
NEXT_PUBLIC_LITTLEAPE_BASE_URL="https://greatape.example"
NEXT_PUBLIC_LITTLEAPE_DOMAIN="greatape.example"
NEXT_PUBLIC_MVP_MODE="false"
NEXT_PUBLIC_FEDIVCERSE_MVP_MODE="true"
NEXT_PUBLIC_NEYNAR_CLIENT_ID="REPLACE_ME"
NEXT_PUBLIC_CLIENT_NAME="GreatApe"
NEXT_PUBLIC_GREATAPE_VERSION="0.0.1-alpha"
```

Replace the value of `NEXT_PUBLIC_THIRD_WEB_CLIENT_ID` with your thirdweb client-id.
(This is used for Farcaster integration.)

Replace the value of `NEXT_PUBLIC_LOGJAM_BASE_URL` with the base-URL of your LogJam server.

Replace the value of `NEXT_PUBLIC_LITTLEAPE_BASE_URL` with the base-URL to your server.

Replace the value of `NEXT_PUBLIC_LITTLEAPE_DOMAIN` with the Internet domain of your server.

Replace the value of `NEXT_PUBLIC_NEYNAR_CLIENT_ID` with your actual Neynar client-id.
(This is used for Farcaster integration.)
