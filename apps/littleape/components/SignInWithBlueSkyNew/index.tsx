import AtIcon from "../../public/at-sign.svg";
import ServerIcon from "../../public/server.svg";
import LockIcon from "../../public/lock.svg";
import LinkIcon from "../../public/external-link.svg"
import BlueSkyIcon from "../../public/Bluesky.svg";
import { useState } from "react";
import { Button, Spinner, useToast } from "@chakra-ui/react";
import { BlueSkyApi } from "lib/blueSkyApi";
import { PocketBaseManager, SignInData, SignUpData2 } from "lib/pocketBaseManager";

const pbManager = PocketBaseManager.getInstance()

export const BlueSkyLoginButtonNew = ({ onLoginSuccess, existingAccountId = "" }: { onLoginSuccess: (user: any) => void, existingAccountId: string }) => {

    const toast = useToast();

    const [serviceProvider, setServiceProriver] = useState("Bsky.social")
    const [pass, setPass] = useState("")
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false);

    const createServiceUrl = async () => {
        if (serviceProvider && typeof serviceProvider === "string") {
            console.log("Service Provider:", serviceProvider);

            // Check if it starts with "http://" or "https://"
            const isValidHttp = serviceProvider.startsWith("http://") || serviceProvider.startsWith("https://");

            // If valid, return as is; otherwise, prepend "https://"
            const url = isValidHttp ? serviceProvider : `https://${serviceProvider}`;

            console.log("Formatted Service URL:", url);
            return url; // Return the formatted URL
        }

        // Return default
        return BlueSkyApi.blueSkyServiceUrl;
    };

    const handleLoginBlueSkyAccount = async () => {
        if (isLoading) {
            return
        }

        if (email == "" || pass == "") {
            toast({
                title: "Please input email/username and password",
                description: ``,
                status: "error",
                duration: 6000,
                isClosable: true,
            });
            return
        }

        setIsLoading(true)

        const url = await createServiceUrl()

        try {

            //initalize blue sky instance
            const blueSkyApi = BlueSkyApi.getInstance(url)

            const sessionResponse = await blueSkyApi.createSession(email, pass);//createSession(email, pass);
            console.log("Session Response:", sessionResponse);

            const sessionWithService = await blueSkyApi.getBlueSkySessionWithServiceUrl()
            console.log("sessionWithService: ", sessionWithService)

            if (sessionResponse.success == true) {

                const profile = await blueSkyApi.fetchProfile(sessionResponse.data.did) //fetchProfile(sessionResponse.data.did)
                console.log("Profile is: ", profile)

                const user = await getOrRegisterUserWithBlueSky(profile.data, sessionWithService, "")
                console.log("User after getOrRegisterUserWithBlueSky: ", user)

                const loggedInUser = await pbManager.signIn(new SignInData(`${user.email}`, "12345678"))

                onLoginSuccess(user)

            } else {
                if (sessionResponse.includes("Invalid")) {
                    BlueSkyApi.clearInstance()
                    return
                }
            }

        } catch (error) {
            console.error("Login Error:", error);
        }
    }

    return (
        <>
            {/* Form */}
            <div className="py-4">
                {/* Server Info Section */}
                <div className="flex items-center mb-4 border-2 border-black rounded-lg p-4">
                    <span className="flex items-center justify-center w-6 h-6 mr-2 bg-gray-100 rounded">
                        <ServerIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Bsky.Social"
                        value={serviceProvider}
                        onChange={(e) => setServiceProriver(e.target.value)}
                        className="w-full border-none outline-none bg-transparent"
                    />
                </div>

                {/* Username/Email Input */}
                <div className="flex items-center mb-4 border-2 border-black rounded-lg p-4">
                    <span className="flex items-center justify-center w-6 h-6 mr-2 bg-gray-100 rounded">
                        <AtIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Username or email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border-none outline-none bg-transparent"
                    />
                </div>

                {/* Password Input */}
                <div className="flex items-center border-2 border-black rounded-lg p-4 relative">
                    <span className="flex items-center justify-center w-6 h-6 mr-2 bg-gray-100 rounded">
                        <LockIcon />
                    </span>
                    <input
                        type="password"
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        placeholder="App password"
                        className="w-full border-none outline-none bg-transparent"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer">
                        <LinkIcon />
                    </button>
                </div>
            </div>

            {/* Submit Button */}
            <button
                className="mt-2 w-full h-12 border-2 border-black bg-[#FFCC00] text-[#1A1A1A] text-[12px] font-bold rounded-md flex items-center justify-center gap-2 py-2 hover:bg-[#FFCC00]"
                onClick={() => handleLoginBlueSkyAccount()}
            >
                {isLoading ? (
                    <>
                        <Spinner size="sm" color="#1A1A1A" />
                        Loading...
                    </>
                ) : (
                    <>
                        <BlueSkyIcon />
                        Login With Bluesky
                    </>
                )}
            </button>
        </>
    );
}


async function getOrRegisterUserWithBlueSky(profile: unknown, sessionWithService: any, existingAccountId: string) {

    if (existingAccountId != "") {
        console.log("existing account id: ", existingAccountId)
        console.log("Bsky Profile: ", profile)
        console.log("sessionWithService: ", sessionWithService)

        //fetch existing user
        const existingUser = await pbManager.fetchUserById(existingAccountId)
        let user; // Declare the variable outside the if-else block

        if (existingUser.fid === 0) {
            // User doesn't have Farcaster linked, so save all Bluesky data
            const updatedData = JSON.stringify({
                username: profile.handle,
                blueskyid: profile.did,
                name: profile.displayName,
                bio: profile.description,
            });
            user = await pbManager.updateUserProfileAndLinkBlueSky(existingAccountId, updatedData);
        } else {
            // User has Farcaster linked, save only required data
            const updatedData = JSON.stringify({
                blueskyid: profile.did,
            });
            user = await pbManager.updateUserProfileAndLinkBlueSky(existingAccountId, updatedData);
        }

        if (user != undefined) {
            // Parse the JSON string back into an object
            const sessObj = JSON.parse(sessionWithService);

            // Add a new element to the object
            sessObj.userid = user.id;

            // Convert the updated object back to a JSON string if needed
            const updatedSess = JSON.stringify(sessObj);

            //save user bsky session data
            const sessionSaved = await pbManager.saveBlueSkySessionInfo(updatedSess)
            console.log("New Session info Saved: ", sessionSaved)
        }

        return user
    }

    if (profile != null && profile != undefined) {

        //register new user
        const username = profile.handle;
        const did = profile.did;
        const displayName = profile.displayName;
        const bio = profile.description;

        console.log("user did: ", did)

        var user = await pbManager.getUserByBlueSkyId(did)
        console.log("User in PB: ", user)

        var savedSessionInfo = await pbManager.fetchBlueSkySessionByUserId(user.id)
        console.log("Saved Blue Sky Session in DB: ", savedSessionInfo)

        if (user.code == 404) {
            //user not found

            var signUpData = new SignUpData2({
                username: String(username),
                email: String(`${username}@littleape.com`),
                password: String("12345678"),
                blueskyid: did,
                name: String(displayName),
                bio: String(bio),
            });

            user = await pbManager.signUp2(signUpData);

            console.log("new user by BSKY: ", user)

            // Parse the JSON string back into an object
            const sessObj = JSON.parse(sessionWithService);

            // Add a new element to the object
            sessObj.userid = user.id;

            // Convert the updated object back to a JSON string if needed
            const updatedSess = JSON.stringify(sessObj);

            //save user bsky session data
            const sessionSaved = await pbManager.saveBlueSkySessionInfo(updatedSess)
            console.log("New Session info Saved: ", sessionSaved)

            return user;

        }

        // Parse the JSON string back into an object
        const sessObj = JSON.parse(sessionWithService);

        // Add a new element to the object
        sessObj.userid = user.id;

        // Convert the updated object back to a JSON string if needed
        const updatedSess = JSON.stringify(sessObj);

        //update session info
        const updatedSessionInfo = await pbManager.updateBlueSkySession(savedSessionInfo.id, updatedSess);
        console.log("Session info Updated: ", updatedSessionInfo)

        return user;
    }

}