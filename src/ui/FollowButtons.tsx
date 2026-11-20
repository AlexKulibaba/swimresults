import { swimmerKey, type Swimmer } from "../meet";
import { useFollows } from "./follows";

export function SwimmerFollowButtons({ swimmer }: { swimmer: Swimmer }) {
  const { follows, change } = useFollows();
  const key = swimmerKey(swimmer);
  const followed = follows.swimmers.includes(key);
  const isMe = follows.me === key;

  return (
    <div className="actions">
      {!isMe && (
        <button
          type="button"
          className={followed ? undefined : "primary"}
          onClick={() => change((store) => (followed ? store.unfollowSwimmer(key) : store.followSwimmer(key)))}
        >
          {followed ? "Nicht mehr folgen" : "Folgen"}
        </button>
      )}
      <button type="button" onClick={() => change((store) => store.setMe(isMe ? null : key))}>
        {isMe ? "Das bin nicht ich" : "Das bin ich"}
      </button>
    </div>
  );
}

export function ClubFollowButton({ clubName }: { clubName: string }) {
  const { follows, change } = useFollows();
  const followed = follows.clubs.includes(clubName);

  return (
    <div className="actions">
      <button
        type="button"
        className={followed ? undefined : "primary"}
        onClick={() => change((store) => (followed ? store.unfollowClub(clubName) : store.followClub(clubName)))}
      >
        {followed ? "Verein nicht mehr folgen" : "Verein folgen"}
      </button>
    </div>
  );
}
