export const isOtherServer = (username) =>
  !new RegExp(`(.*)(@${process.env.NEXT_PUBLIC_HANDLE}|^((?!@).)*$)`, "g").test(
    username
  );
