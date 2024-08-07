import { ActorType } from "./ActivityPub";

export type User = Partial<{
  id: number;
  api_key: string;
  avatar: string;
  banner: string;
  bio: string;
  name: string;
  email: string;
  github: string;
  publicKey: string;
  username: string;
  fid:number;
}>;

export type ActivityUser = {
  "@context": any;
  followers: string;
  following: string;
  id: string;
  type: ActorType;
  preferredUsername: string;
  inbox: string;
  outbox: string;
  playlists: string;
  name: string;
  url: string;
  summary: string;
  published: string;
  icon: {
    mediaType: string;
    type: "Image";
    url: string;
  };
  image: {
    mediaType: string;
    type: "Image";
    url: string;
  };
};
