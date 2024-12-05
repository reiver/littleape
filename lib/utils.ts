import { BlueSkyApi } from "./blueSkyApi"
import { PocketBaseManager } from "./pocketBaseManager";

const pbManager = PocketBaseManager.getInstance();

export const checkUserHasBlueSkyLinked = async (user: any) => {

    const bskySession = await pbManager.fetchBlueSkySessionByUserId(user.id)
    console.log("Blue Sky Session fetched: ", bskySession)

    //create blueSKy Instance
    const bskyInstance = BlueSkyApi.getInstance(bskySession.service)

    const resumedSession = await bskyInstance.resumeSession(bskySession)
    console.log("Resumed Bsky Session: ", resumedSession)
}