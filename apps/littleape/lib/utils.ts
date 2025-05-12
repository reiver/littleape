import { BlueSkyApi } from "./blueSkyApi";
import logger from "./logger/logger";
import { PocketBaseManager } from "./pocketBaseManager";

const pbManager = PocketBaseManager.getInstance();

export const checkUserHasBlueSkyLinked = async (user: any) => {

    const bskySession = await pbManager.fetchBlueSkySessionByUserId(user.id)

    if (bskySession == undefined || bskySession == null) {
        return false
    }

    const oldAccessJWT = bskySession.accessJwt

    //create blueSKy Instance
    const bskyInstance = BlueSkyApi.getInstance(bskySession.service)

    if (bskyInstance != undefined && bskyInstance != null) {
        const resumedSession = await bskyInstance.resumeSession(bskySession)

        if (resumedSession == undefined || resumedSession == null) {
            return false
        }

        const newAccessJWT = resumedSession.accessJwt

        if (oldAccessJWT != newAccessJWT) {
            const updatedSession = JSON.stringify({
                accessJwt: newAccessJWT,
            })

            //update resumed session data
            const updated = await pbManager.updateBlueSkySession(bskySession.id, updatedSession)
            logger.log("Session Updated at DB")
            return true
        } else {
            logger.log("No need to updated the access token in DB")
        }
    }

    return true

}