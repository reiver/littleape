export interface OrderedCollection extends Omit<Collection, "items"> {
  orderedItems: Activity[] | Link[];
}

export interface Collection extends ActivityObject<unknown> {
  totalItems: number;
  current?: CollectionPage | Link;
  first?: CollectionPage | Link;
  last?: CollectionPage | Link;
  items: Activity | Activity[] | Link | Link[];
}

export interface CollectionPage extends Collection {
  partOf: ActivityObject<unknown> | Link;
  next?: CollectionPage | Link;
  prev?: CollectionPage | Link;
}

export type Outbox = OrderedCollection;

export type ActorType =
  | "Application"
  | "Group"
  | "Organization"
  | "Person"
  | "Service";

export type Actor =
  | {
      type: ActorType;
      name: string;
    }
  | string;

export type ActivityTypes =
  | "Accept"
  | "TentativeAccept"
  | "Add"
  | "Arrive"
  | "Create"
  | "Delete"
  | "Follow"
  | "Ignore"
  | "Join"
  | "Leave"
  | "Like"
  | "Offer"
  | "Invite"
  | "Reject"
  | "TentativeReject"
  | "Remove"
  | "Undo"
  | "Update"
  | "View"
  | "Listen"
  | "Read"
  | "Move"
  | "Travel"
  | "Announce"
  | "Block"
  | "Flag"
  | "Dislike"
  | "Question";
export interface Activity<T = ActivityTypes>
  extends Omit<ActivityObject<ActivityObjectTypes>, "type"> {
  type: T;
  actor: Actor | Actor[];
  object: ActivityObject<ActivityObjectTypes>;
  target: ActivityObject<ActivityObjectTypes> | Link;
  result: ActivityObject<ActivityObjectTypes> | Link;
  origin: ActivityObject<ActivityObjectTypes> | Link;
  instrument: ActivityObject<ActivityObjectTypes> | Link;
}

export type ActivityObjectTypes =
  | "Article"
  | "Audio"
  | "Document"
  | "Event"
  | "Image"
  | "Note"
  | "Page"
  | "Place"
  | "Profile"
  | "Relationship"
  | "Tombstone"
  | "Video";

export type ActivityObject<
  T extends ActivityObjectTypes | unknown = ActivityObjectTypes
> = {
  type: T;
  id: string;
  attachment: ActivityObject | Link;
  attributedTo: ActivityObject | Link;
  audience: ActivityObject | Link;
  content: string;
  context: ActivityObject | Link;
  name: string;
  endTime: string;
  generator: ActivityObject | Link;
  icon: ActivityObject | Link;
  image: ActivityObject;
  inReplyTo: ActivityObject | Link;
  location: ActivityObject | Link;
  preview: ActivityObject | Link;
  published: string;
  replies: Collection;
  startTime: string;
  summary: string;
  tag: ActivityObject | Link;
  updated: string;
  url: string | Link[];
  to: ActivityObject | Link;
  bto: ActivityObject | Link;
  cc: ActivityObject | Link;
  bcc: ActivityObject | Link;
  mediaType: string;
  duration: string;
};

export type LinkTypes = "Link" | "Mention";
export type Link<T extends LinkTypes = LinkTypes> =
  | {
      id: string;
      type: T;
      href: string;
      hreflang: string;
      mediaType: string;
      name: string;
      rel: string[];
      height: number;
      width: number;
      preview: ActivityObject | Link;
    }
  | string;
