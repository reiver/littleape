export interface OrderedCollection extends Omit<Collection, "items"> {
  orderedItems: Activity[] | Link[];
}

export interface Collection extends ActivityObject {
  totalItems: number;
  current?: CollectionPage | Link;
  first?: CollectionPage | Link;
  last?: CollectionPage | Link;
  items: Activity | Activity[] | Link | Link[];
}

export interface CollectionPage extends Collection {
  partOf: ActivityObject | Link;
  next?: CollectionPage | Link;
  prev?: CollectionPage | Link;
}

export type Outbox = OrderedCollection;

export type Actor =
  | {
      type: "Application" | "Group" | "Organization" | "Person" | "Service";
      name: string;
    }
  | string;

export interface Activity extends Omit<ActivityObject, "type"> {
  type:
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
  actor: Actor | Actor[];
  object: ActivityObject;
  target: ActivityObject | Link;
  result: ActivityObject | Link;
  origin: ActivityObject | Link;
  instrument: ActivityObject | Link;
}

export type ActivityObject = {
  type:
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

export type Link =
  | {
      id: string;
      type: "Link" | "Mention";
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
