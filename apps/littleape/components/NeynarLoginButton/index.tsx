"use client";

import React from 'react';
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { useEffect } from "react";

export default function NeynarLoginButton() {
  const { user } = useNeynarContext();

  useEffect(() => {
    console.log("USER IS: ", user)
  }, [user])


  return (
    <>
      <NeynarAuthButton
        label="Login with Farcaster"
        icon={null}
        className="no-icon border border-black rounded-[6px] w-[400px] text-[12px] text-black"
      />

      {user && (
        <div className="mt-6 w-[700px] border border-black rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div>
              <h2 className="text-lg font-semibold">{user.display_name}</h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>

          <div className="text-sm text-gray-700 space-y-1">
            <p><span className="font-medium">FID:</span> {user.fid}</p>
            <p><span className="font-medium">Signer UUID:</span> {user.signer_uuid}</p>
            <p><span className="font-medium">Custody:</span> {user.custody_address}</p>
            <p><span className="font-medium">Followers:</span> {user.follower_count}</p>
            <p><span className="font-medium">Following:</span> {user.following_count}</p>
            <p><span className="font-medium">Power Badge:</span> {user.power_badge ? "Yes" : "No"}</p>
          </div>
        </div>
      )}

    </>

  );
}