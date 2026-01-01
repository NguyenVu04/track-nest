import { useMemo, useState } from "react";

export function useFollowers(followers: any[]) {
  const [selectedFollowerId, setSelectedFollowerId] = useState<string | null>(
    null
  );

  const selectedFollower = useMemo(
    () => followers.find((f) => f.id === selectedFollowerId) || null,
    [followers, selectedFollowerId]
  );

  return {
    selectedFollowerId,
    setSelectedFollowerId,
    selectedFollower,
  };
}
