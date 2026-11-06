export function isSingleEmailAddress(value) {
  if (typeof value !== "string" || value.length > 254) return false;
  const local = value.split("@")[0];
  return (
    local.length <= 64 &&
    !/(^\.|\.$|\.\.)/.test(local) &&
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
      value
    )
  );
}
